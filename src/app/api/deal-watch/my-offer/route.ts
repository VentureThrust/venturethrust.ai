/**
 * GET /api/deal-watch/my-offer
 *
 * Returns the caller's open custom offer (if any), matched by their login
 * email via the service role. This bypasses RLS entirely, so the "Made for
 * you" card can never disappear because of an email-function mismatch in
 * the database policies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { dwAdmin, dwCaller } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rl = consumeRateLimit(`dw-my-offer:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { data, error } = await dwAdmin
    .from('dw_offers')
    .select('id, seats, discount_pct, price_usd, price_inr, paddle_discount_code')
    .ilike('investor_email', caller.email)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ offer: null });
  return NextResponse.json({ offer: data ?? null });
}
