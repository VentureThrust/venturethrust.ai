/**
 * POST /api/deal-watch/event
 *
 * Called (fire-and-forget) by the app after a FOUNDER uploads or updates a
 * file. If nobody watches this founder with a manager assigned, it is a no-op.
 * Otherwise it records an update event and notifies the account manager.
 * The investor is NEVER notified directly; the manager decides what matters.
 *
 * Body: { spaceId?, fileId?, fileName, eventType: 'file_added'|'file_updated'|'file_deleted' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { dwAdmin, dwCaller, dwManagerId, dwNotifyManager } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

const EVENT_TYPES = new Set(['file_added', 'file_updated', 'file_deleted']);

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-event:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const spaceId = typeof body.spaceId === 'string' ? body.spaceId : null;
  const fileId = typeof body.fileId === 'string' ? body.fileId : null;
  const fileName = typeof body.fileName === 'string' ? body.fileName.slice(0, 300) : 'a file';
  const eventType = typeof body.eventType === 'string' && EVENT_TYPES.has(body.eventType)
    ? body.eventType
    : null;
  if (!eventType) return NextResponse.json({ error: 'BAD_EVENT' }, { status: 400 });

  // Watched? Only founders someone is watching (with a manager assigned)
  // produce events - everyone else is a silent no-op.
  const { data: watchRows } = await dwAdmin
    .from('dw_watchlist')
    .select('id, startup_name, manager_id')
    .eq('founder_id', caller.id)
    .not('manager_id', 'is', null)
    .limit(1);

  if (!watchRows || watchRows.length === 0) {
    return NextResponse.json({ ok: true, watched: false });
  }

  const startup = (watchRows[0].startup_name as string) || caller.email;

  const { error } = await dwAdmin.from('dw_update_events').insert({
    founder_id: caller.id,
    space_id: spaceId,
    file_id: fileId,
    file_name: fileName,
    event_type: eventType,
  });
  if (error) console.error('[deal-watch/event] insert failed:', error);

  const verb =
    eventType === 'file_added' ? 'uploaded a new file' :
    eventType === 'file_updated' ? 'updated a file' : 'removed a file';

  await dwNotifyManager({
    managerId: await dwManagerId(),
    alertType: 'dw_update',
    subject: `Deal Watch: ${startup} ${verb}`,
    message: `${startup} ${verb}: "${fileName}". Open Deal Watch to review it.`,
  });

  return NextResponse.json({ ok: true, watched: true });
}
