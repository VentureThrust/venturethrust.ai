/**
 * GET /api/deal-watch/stats
 *
 * The counters behind the investor dashboard's silence receipt.
 *
 * dw_update_events is RLS scoped to the founder who owns the space, so an
 * investor can never read it directly and the count always came back 0. This
 * route counts with the service role, restricted to the spaces on that
 * investor's own watchlist, so the number is real and still theirs alone.
 *
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok: true, updatesReviewed, reportsSent, reportsUnread }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(`dw-stats:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, {
      status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let updatesReviewed = 0;
  try {
    const { data: watch } = await admin
      .from('dw_watchlist')
      .select('space_id')
      .eq('investor_id', user.id);
    const spaceIds = [...new Set((watch ?? [])
      .map((w) => w.space_id as string | null)
      .filter((s): s is string => !!s))];
    if (spaceIds.length) {
      const { count } = await admin
        .from('dw_update_events')
        .select('id', { count: 'exact', head: true })
        .in('space_id', spaceIds);
      updatesReviewed = count ?? 0;
    }
  } catch { /* counter only */ }

  let reportsSent = 0;
  let reportsUnread = 0;
  try {
    const { count: sent } = await admin
      .from('dw_reports')
      .select('id', { count: 'exact', head: true })
      .eq('investor_id', user.id);
    reportsSent = sent ?? 0;
    const { count: unread } = await admin
      .from('dw_reports')
      .select('id', { count: 'exact', head: true })
      .eq('investor_id', user.id)
      .is('opened_at', null);
    reportsUnread = unread ?? 0;
  } catch { /* table not migrated yet */ }

  return NextResponse.json({ ok: true, updatesReviewed, reportsSent, reportsUnread });
}
