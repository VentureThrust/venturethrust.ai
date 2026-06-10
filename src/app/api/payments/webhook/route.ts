/**
 * POST /api/payments/webhook
 *
 * Cashfree payment webhook (the reliable confirmation in production: a charge
 * can succeed even if the buyer closes the tab before the return redirect).
 * Verifies the signature, then activates the plan on PAYMENT_SUCCESS.
 *
 * Configure in Cashfree Dashboard -> Developers -> Webhooks:
 *   URL: https://venturethrust.com/api/payments/webhook
 * The signature is verified with your Cashfree secret key (already in env).
 *
 * Always returns 200 once the signature is valid, so Cashfree does not retry
 * forever on a transient downstream hiccup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { planCycleMs } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-webhook-signature') ?? '';
  const timestamp = req.headers.get('x-webhook-timestamp') ?? '';
  const secret = process.env.CASHFREE_SECRET_KEY ?? '';

  if (!secret) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 });
  }

  // Cashfree signs webhooks as base64( HMAC-SHA256( timestamp + rawBody, secret ) ).
  const expected = crypto.createHmac('sha256', secret).update(timestamp + raw).digest('base64');
  if (!signature || signature !== expected) {
    return NextResponse.json({ ok: false, error: 'bad_signature' }, { status: 401 });
  }

  let event: Record<string, unknown> & {
    data?: { order?: { order_id?: string }; payment?: { payment_status?: string } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const orderId = event?.data?.order?.order_id;
  const payStatus = event?.data?.payment?.payment_status;

  if (orderId && payStatus === 'SUCCESS') {
    const { data: pay } = await admin
      .from('payments')
      .select('*')
      .eq('cf_order_id', orderId)
      .maybeSingle();
    if (pay && pay.status !== 'PAID') {
      const expires = new Date(Date.now() + planCycleMs(pay.plan_id as string)).toISOString();
      await admin.from('payments').update({ status: 'PAID', updated_at: new Date().toISOString() }).eq('id', pay.id);
      await admin
        .from('profiles')
        .update({ plan: pay.plan_key, plan_status: 'active', plan_expires_at: expires })
        .eq('id', pay.user_id);
    }
  }

  return NextResponse.json({ ok: true });
}
