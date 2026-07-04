/**
 * POST /api/payments/verify
 *
 * Called when the buyer returns from Cashfree checkout. Re-checks the order
 * status straight from Cashfree (never trusts the client) and, if PAID,
 * activates the plan: profiles.plan + plan_status='active' + plan_expires_at.
 * Idempotent, so calling it twice is harmless.
 *
 * Auth: Authorization: Bearer <supabase access token>
 * Body: { orderId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { CASHFREE_BASE, cashfreeHeaders, planCycleMs, PAID_PLANS } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`pay-verify:${clientIp(req)}`, 40, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    let body: { orderId?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
    }
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    if (!orderId) return NextResponse.json({ ok: false, error: 'missing_order' }, { status: 400 });

    // Ask Cashfree for the authoritative status.
    const cfRes = await fetch(`${CASHFREE_BASE}/orders/${encodeURIComponent(orderId)}`, {
      headers: cashfreeHeaders(),
    });
    const cf = await cfRes.json().catch(() => ({}));
    const status: string = cf?.order_status ?? 'UNKNOWN';

    // The payment row must exist AND belong to this user.
    const { data: pay } = await admin
      .from('payments')
      .select('*')
      .eq('cf_order_id', orderId)
      .maybeSingle();
    if (!pay || pay.user_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    if (status === 'PAID') {
      let expiresAt: string | null = null;
      if (pay.status !== 'PAID') {
        expiresAt = new Date(Date.now() + planCycleMs(pay.plan_id as string)).toISOString();
        await admin.from('payments').update({ status: 'PAID', updated_at: new Date().toISOString() }).eq('id', pay.id);
        await admin
          .from('profiles')
          .update({ plan: pay.plan_key, plan_status: 'active', plan_expires_at: expiresAt })
          .eq('id', user.id);
        // Investor plan: switch on the investor toolkit too. Best-effort so a
        // missing column can never block plan activation.
        if (String(pay.plan_id ?? '').startsWith('vdr-investor')) {
          const { error: invErr } = await admin.from('profiles').update({ is_investor: true }).eq('id', user.id);
          if (invErr) console.warn('[payments/verify] is_investor update failed:', invErr.message);
        }
      } else {
        // Idempotent re-check (already activated): return the stored expiry.
        const { data: prof } = await admin
          .from('profiles')
          .select('plan_expires_at')
          .eq('id', user.id)
          .maybeSingle();
        expiresAt = (prof?.plan_expires_at as string | null) ?? null;
      }
      const planName = PAID_PLANS[pay.plan_id as string]?.name ?? 'VentureThrust';
      return NextResponse.json({ ok: true, status: 'PAID', plan: pay.plan_key, planName, expiresAt });
    }

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error('[payments/verify]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
