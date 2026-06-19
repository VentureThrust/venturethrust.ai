/**
 * POST /api/paddle/webhook
 *
 * Paddle (Billing) notification webhook - the authoritative confirmation that a
 * subscription was paid, renewed, or cancelled. Verifies the `Paddle-Signature`
 * header with PADDLE_WEBHOOK_SECRET, then activates (or downgrades) the plan,
 * mirroring the old Cashfree flow: a `payments` row with status PAID drives the
 * tier (via resolveUserTierId), and `profiles` gets plan + plan_status +
 * plan_expires_at.
 *
 * Register in Paddle Dashboard -> Developer Tools -> Notifications:
 *   URL:    https://www.venturethrust.com/api/paddle/webhook
 *   Events: transaction.completed, subscription.created, subscription.updated,
 *           subscription.activated, subscription.canceled, subscription.paused
 *
 * We pass the Supabase user id as customData.user_id at checkout, so every event
 * can be tied back to the right account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { TIER_BY_PADDLE_PRICE } from '@/lib/paddle';
import { tierById } from '@/lib/plan-catalogue';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const PLAN_KEY = 'vdr_only';
const DEFAULT_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

/** Verify Paddle's `Paddle-Signature: ts=...;h1=...` header (HMAC-SHA256). */
function verifySignature(raw: string, header: string, secret: string): boolean {
  const parts: Record<string, string> = {};
  for (const kv of header.split(';')) {
    const idx = kv.indexOf('=');
    if (idx > 0) parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  }
  const ts = parts['ts'];
  const h1 = parts['h1'];
  if (!ts || !h1) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${ts}:${raw}`).digest('hex');
  const a = Buffer.from(h1);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type PaddleItem = { price?: { id?: string } };
type PaddleData = {
  id?: string;
  status?: string;
  custom_data?: { user_id?: string } | null;
  items?: PaddleItem[];
  billing_period?: { ends_at?: string } | null;
  current_billing_period?: { ends_at?: string } | null;
};

function tierFromItems(items: PaddleItem[] | undefined): string | null {
  const priceId = items?.[0]?.price?.id;
  return priceId ? (TIER_BY_PADDLE_PRICE[priceId] ?? null) : null;
}

function isoOrDefault(ends?: string): string {
  return ends ? new Date(ends).toISOString() : new Date(Date.now() + DEFAULT_CYCLE_MS).toISOString();
}

async function activate(userId: string, expiresIso: string) {
  await admin
    .from('profiles')
    .update({ plan: PLAN_KEY, plan_status: 'active', plan_expires_at: expiresIso })
    .eq('id', userId);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('paddle-signature') ?? '';
  // Accept events signed by EITHER the production or the sandbox webhook secret,
  // so the same endpoint verifies both (sandbox is used for the test purchase).
  const secrets = [process.env.PADDLE_WEBHOOK_SECRET, process.env.PADDLE_WEBHOOK_SECRET_SANDBOX].filter(
    (s): s is string => !!s,
  );

  if (secrets.length === 0) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 });
  }
  if (!secrets.some((s) => verifySignature(raw, signature, s))) {
    return NextResponse.json({ ok: false, error: 'bad_signature' }, { status: 401 });
  }

  let event: { event_type?: string; data?: PaddleData };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const type = event.event_type ?? '';
  const data = event.data ?? {};
  const userId = data.custom_data?.user_id ?? '';

  try {
    if (type === 'transaction.completed') {
      const tier = tierFromItems(data.items);
      if (userId && tier) {
        const txnId = data.id ?? `paddle_${Date.now()}`;
        const expires = isoOrDefault(data.billing_period?.ends_at);
        const amount = tierById(tier)?.price ?? 0;

        // Idempotent: one payments row per Paddle transaction id.
        const { data: existing } = await admin
          .from('payments')
          .select('id, status')
          .eq('cf_order_id', txnId)
          .maybeSingle();
        if (!existing) {
          await admin.from('payments').insert({
            user_id: userId,
            plan_id: tier,
            plan_key: PLAN_KEY,
            amount,
            currency: 'USD',
            cf_order_id: txnId,
            status: 'PAID',
          });
        } else if ((existing as { status?: string }).status !== 'PAID') {
          await admin
            .from('payments')
            .update({ status: 'PAID', updated_at: new Date().toISOString() })
            .eq('id', (existing as { id: string }).id);
        }
        await activate(userId, expires);
      }
    } else if (
      type === 'subscription.created' ||
      type === 'subscription.updated' ||
      type === 'subscription.activated'
    ) {
      const tier = tierFromItems(data.items);
      const status = data.status ?? '';
      if (userId && tier && (status === 'active' || status === 'trialing')) {
        await activate(userId, isoOrDefault(data.current_billing_period?.ends_at));
      }
    } else if (type === 'subscription.canceled' || type === 'subscription.paused') {
      // Keep access until the paid period ends (isPlanActive checks the expiry);
      // just flag the status so the UI can show "canceled".
      if (userId) {
        await admin.from('profiles').update({ plan_status: 'canceled' }).eq('id', userId);
      }
    }
  } catch (err) {
    console.error('[paddle/webhook]', err);
  }

  // Always 200 once the signature is valid, so Paddle does not retry forever.
  return NextResponse.json({ ok: true });
}
