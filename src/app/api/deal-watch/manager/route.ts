/**
 * GET /api/deal-watch/manager
 *
 * The account manager's feed: assignments (which investor assigned which
 * startup) and the founder update events. Only the account manager can call
 * this (email match, verified server-side).
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import { dwAdmin, dwCaller } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rl = consumeRateLimit(`dw-manager:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (caller.email !== DW_MANAGER_EMAIL) {
    return NextResponse.json({ error: 'NOT_MANAGER' }, { status: 403 });
  }

  const [{ data: watchRows }, { data: eventRows }] = await Promise.all([
    dwAdmin
      .from('dw_watchlist')
      .select('id, investor_id, founder_id, space_id, file_id, startup_name, manager_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    dwAdmin
      .from('dw_update_events')
      .select('id, founder_id, space_id, file_id, file_name, event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Resolve emails for investors + founders in one query.
  const ids = new Set<string>();
  for (const r of watchRows ?? []) {
    if (r.investor_id) ids.add(r.investor_id as string);
    if (r.founder_id) ids.add(r.founder_id as string);
  }
  for (const r of eventRows ?? []) {
    if (r.founder_id) ids.add(r.founder_id as string);
  }
  const emailById = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profiles } = await dwAdmin
      .from('profiles')
      .select('id, email')
      .in('id', Array.from(ids));
    for (const p of profiles ?? []) emailById.set(p.id as string, (p.email as string) ?? '');
  }

  // startup name lookup for events (matched by founder).
  const startupByFounder = new Map<string, string>();
  for (const r of watchRows ?? []) {
    if (r.founder_id && r.startup_name && !startupByFounder.has(r.founder_id as string)) {
      startupByFounder.set(r.founder_id as string, r.startup_name as string);
    }
  }

  return NextResponse.json({
    assignments: (watchRows ?? []).map((r) => ({
      id: r.id,
      startupName: r.startup_name ?? emailById.get(r.founder_id as string) ?? 'Unknown startup',
      investorEmail: emailById.get(r.investor_id as string) ?? 'Unknown investor',
      founderEmail: emailById.get(r.founder_id as string) ?? '',
      assigned: !!r.manager_id,
      spaceId: r.space_id,
      fileId: r.file_id,
      createdAt: r.created_at,
    })),
    events: (eventRows ?? []).map((r) => ({
      id: r.id,
      startupName: startupByFounder.get(r.founder_id as string)
        ?? emailById.get(r.founder_id as string)
        ?? 'Unknown startup',
      founderEmail: emailById.get(r.founder_id as string) ?? '',
      fileId: r.file_id,
      fileName: r.file_name,
      eventType: r.event_type,
      createdAt: r.created_at,
    })),
  });
}
