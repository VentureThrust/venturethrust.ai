/**
 * POST /api/deal-watch/unwatch
 *
 * Investor removes a startup from their watchlist. Investor-plan only, and
 * only ever their own row: the delete is scoped to the caller's investor_id,
 * so one investor can never unwatch another's startup.
 *
 * Body: { id: string }   the dw_watchlist row id
 * Returns: { ok: true, removed: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { dwAdmin, dwCaller, dwIsInvestor } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-unwatch:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (!(await dwIsInvestor(caller.id))) {
    return NextResponse.json({ error: 'INVESTOR_PLAN_REQUIRED' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : null;
  if (!id) return NextResponse.json({ error: 'ID_REQUIRED' }, { status: 400 });

  // Scoped to this investor. A row belonging to anyone else simply does not
  // match, so the response is the same either way and nothing leaks.
  const { error } = await dwAdmin
    .from('dw_watchlist')
    .delete()
    .eq('id', id)
    .eq('investor_id', caller.id);

  if (error) {
    return NextResponse.json({ error: 'DELETE_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, removed: true });
}
