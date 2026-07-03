/**
 * POST /api/deal-watch/watch
 *
 * Investor adds a startup (space or single deck file) to their watchlist,
 * optionally assigning it to their account manager. Investor-plan only.
 *
 * Body: {
 *   spaceId?: string,          // watching a shared space
 *   fileId?: string,           // watching a single shared deck
 *   startupName?: string,
 *   assign?: boolean,          // assign to account manager now
 *   autoAssignRemember?: boolean // persist "always assign, don't ask again"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { dwAdmin, dwCaller, dwIsInvestor, dwManagerId, dwNotifyManager } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-watch:${clientIp(req)}`, 30, 60_000);
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

  const spaceId = typeof body.spaceId === 'string' ? body.spaceId : null;
  const fileId = typeof body.fileId === 'string' ? body.fileId : null;
  const startupName = typeof body.startupName === 'string' ? body.startupName.slice(0, 200) : null;
  const assign = body.assign === true;
  const autoAssignRemember =
    typeof body.autoAssignRemember === 'boolean' ? body.autoAssignRemember : null;

  if (!spaceId && !fileId) {
    return NextResponse.json({ error: 'TARGET_REQUIRED' }, { status: 400 });
  }

  // Resolve the founder who owns the watched space/file.
  let founderId: string | null = null;
  if (spaceId) {
    const { data } = await dwAdmin.from('spaces').select('created_by').eq('id', spaceId).maybeSingle();
    founderId = (data?.created_by as string) ?? null;
  } else if (fileId) {
    const { data } = await dwAdmin.from('files').select('user_id').eq('id', fileId).maybeSingle();
    founderId = (data?.user_id as string) ?? null;
  }

  const managerId = assign ? await dwManagerId() : null;

  // Upsert by (investor, target): keep one row per watched startup.
  let match = dwAdmin.from('dw_watchlist').select('id, manager_id').eq('investor_id', caller.id);
  match = spaceId ? match.eq('space_id', spaceId) : match.eq('file_id', fileId!);
  const { data: existing } = await match.maybeSingle();

  if (existing) {
    if (assign && !existing.manager_id) {
      await dwAdmin.from('dw_watchlist').update({ manager_id: managerId }).eq('id', existing.id);
    }
  } else {
    const { error } = await dwAdmin.from('dw_watchlist').insert({
      investor_id: caller.id,
      founder_id: founderId,
      space_id: spaceId,
      file_id: fileId,
      startup_name: startupName,
      manager_id: managerId,
    });
    if (error) {
      console.error('[deal-watch/watch] insert failed:', error);
      return NextResponse.json({ error: 'INSERT_FAILED' }, { status: 500 });
    }
  }

  if (autoAssignRemember !== null) {
    await dwAdmin.from('profiles').update({ dw_auto_assign: autoAssignRemember }).eq('id', caller.id);
  }

  if (assign) {
    await dwNotifyManager({
      managerId: await dwManagerId(),
      alertType: 'dw_assigned',
      subject: `Deal Watch: ${caller.email} assigned you ${startupName ?? 'a startup'}`,
      message: `Investor ${caller.email} assigned "${startupName ?? 'a startup'}" to you on Deal Watch. You will be notified when the founder updates their documents.`,
    });
  }

  return NextResponse.json({ ok: true, assigned: assign });
}
