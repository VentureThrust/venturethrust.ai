/**
 * POST /api/payments/create-order
 *
 * Creates a Cashfree order for a paid plan and returns a payment_session_id the
 * client hands to the Cashfree checkout SDK. The plan AMOUNT is looked up
 * server-side (PAID_PLANS), so the client cannot tamper with what is charged.
 *
 * Auth: Authorization: Bearer <supabase access token>
 * Body: { planId: string, phone: string }  (phone is required by Cashfree)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { CASHFREE_BASE, cashfreeHeaders, PAID_PLANS } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`pay-create:${clientIp(req)}`, 20, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  try {
    // ── Identify the buyer from their access token ──
    const authHeader = req.headers.get('authorization') ?? '';
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    let body: { planId?: unknown; phone?: unknown; returnPath?: unknown; offerId?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
    }

    // Either a standard plan (amount from PAID_PLANS) or a custom investor
    // offer (amount from dw_offers, validated against the buyer's email so a
    // quote can never be paid by someone it wasn't made for).
    const offerId = typeof body.offerId === 'string' ? body.offerId : '';
    let planId = typeof body.planId === 'string' ? body.planId : '';
    let amountInr: number;
    let planKey: string;
    let planName: string;
    if (offerId) {
      const { data: offer } = await admin.from('dw_offers').select('*').eq('id', offerId).maybeSingle();
      const offerEmail = String(offer?.investor_email ?? '').toLowerCase();
      if (!offer || offer.status !== 'open' || offerEmail !== (user.email ?? '').toLowerCase()) {
        return NextResponse.json({ ok: false, error: 'invalid_plan' }, { status: 400 });
      }
      const seats = Number(offer.seats) || 1;
      amountInr = Math.round(Number(offer.price_inr));
      planKey = 'vdr_only';
      planName = `Investor (${seats} ${seats > 1 ? 'seats' : 'seat'})`;
      // Prefix keeps the investor auto-activation (startsWith 'vdr-investor').
      planId = `vdr-investor-offer-${seats}`;
    } else {
      const plan = PAID_PLANS[planId];
      if (!plan) return NextResponse.json({ ok: false, error: 'invalid_plan' }, { status: 400 });
      amountInr = plan.amount;
      planKey = plan.planKey;
      planName = plan.name;
    }

    // Cashfree requires a 10-digit Indian phone number on the order.
    const phone = (typeof body.phone === 'string' ? body.phone : '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 });
    }

    const orderId = `vt_${user.id.replace(/-/g, '').slice(0, 12)}_${Date.now()}`;
    // Cashfree (production) only accepts an https return URL. An http or
    // localhost URL makes order creation fail with HTTP 400, which surfaces here
    // as a 502. Prefer the configured public URL; if that is not https, upgrade
    // the request origin to https so local dev (http://localhost) still creates
    // a valid order.
    const envBase = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '');
    const rawOrigin = req.headers.get('origin') || new URL(req.url).origin;
    const base = envBase.startsWith('https://')
      ? envBase
      : rawOrigin.replace(/^http:\/\//, 'https://');
    // Where Cashfree returns the buyer after checkout. The caller may pass a
    // safe relative path (e.g. /dashboard/billing for an in-app upgrade);
    // anything unsafe falls back to the plan page.
    const rp = typeof body.returnPath === 'string' ? body.returnPath : '';
    const returnPath =
      rp.startsWith('/') && !rp.startsWith('//') && !rp.includes('..') ? rp.slice(0, 200) : '/choose-role';
    const sep = returnPath.includes('?') ? '&' : '?';
    // Cashfree substitutes {order_id} in the return URL after checkout.
    const returnUrl = `${base}${returnPath}${sep}order_id={order_id}`;

    const cfRes = await fetch(`${CASHFREE_BASE}/orders`, {
      method: 'POST',
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amountInr,
        order_currency: 'INR',
        customer_details: {
          customer_id: user.id,
          customer_email: user.email ?? `${user.id}@venturethrust.com`,
          customer_phone: phone,
        },
        order_meta: { return_url: returnUrl },
        order_note: `VentureThrust ${planName} plan`,
      }),
    });

    const cf = await cfRes.json().catch(() => ({}));
    if (!cfRes.ok || !cf?.payment_session_id) {
      console.warn('[payments/create-order] cashfree error', cfRes.status, JSON.stringify(cf));
      return NextResponse.json(
        {
          ok: false,
          error: 'cashfree_error',
          cfStatus: cfRes.status,
          detail: cf?.message ?? cf?.error_description ?? cf?.type ?? null,
          cf,
        },
        { status: 502 },
      );
    }

    // Record a pending payment row (service role bypasses RLS).
    const { error: insErr } = await admin.from('payments').insert({
      user_id: user.id,
      plan_id: planId,
      plan_key: planKey,
      amount: amountInr,
      currency: 'INR',
      cf_order_id: cf.order_id ?? orderId,
      status: 'PENDING',
    });
    if (insErr) console.warn('[payments/create-order] payments insert failed:', insErr.message);

    return NextResponse.json({
      ok: true,
      paymentSessionId: cf.payment_session_id,
      orderId: cf.order_id ?? orderId,
      mode: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
    });
  } catch (err) {
    console.error('[payments/create-order]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
