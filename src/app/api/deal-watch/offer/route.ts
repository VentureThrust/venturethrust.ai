/**
 * POST /api/deal-watch/offer  (manager only)
 *
 * Creates a custom investor offer (enterprise-style quote): seats plus an
 * optional discount. Prices are computed server-side from the standard
 * Investor plan ($149 / Rs 12,499 per seat per month). Any previous open
 * offer for the same email is expired so the investor only ever sees one.
 *
 * Body: { email, seats?, discountPct?, paddleDiscountCode?, note? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import { dwAdmin, dwCaller } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

const SEAT_USD = 149;
const SEAT_INR = 12499;

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-offer:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (caller.email !== DW_MANAGER_EMAIL) {
    return NextResponse.json({ error: 'NOT_MANAGER' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 400 });
  }
  const seats = Math.min(Math.max(Math.round(Number(body.seats) || 1), 1), 20);
  const discountPct = Math.min(Math.max(Number(body.discountPct) || 0, 0), 90);
  const paddleDiscountCode =
    typeof body.paddleDiscountCode === 'string' ? body.paddleDiscountCode.trim() || null : null;
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : null;

  const factor = 1 - discountPct / 100;
  const priceUsd = Math.round(SEAT_USD * seats * factor);
  const priceInr = Math.round(SEAT_INR * seats * factor);

  // One live offer per investor: expire any previous open ones.
  await dwAdmin
    .from('dw_offers')
    .update({ status: 'expired' })
    .ilike('investor_email', email)
    .eq('status', 'open');

  const { data, error } = await dwAdmin
    .from('dw_offers')
    .insert({
      investor_email: email,
      seats,
      discount_pct: discountPct,
      price_usd: priceUsd,
      price_inr: priceInr,
      paddle_discount_code: paddleDiscountCode,
      note,
      status: 'open',
    })
    .select('id')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'INSERT_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, email, seats, discountPct, priceUsd, priceInr });
}
