/**
 * POST /api/spaces/delete
 *
 * The ONE reliable delete path for spaces and space/library items.
 *
 * Why a service-role route: client-side deletes were failing silently -
 * foreign keys (share_links.file_id, files.space_id, ...) rejected the
 * delete, the error was ignored, the UI removed the row from memory, and a
 * refresh brought everything back. Here we verify ownership, remove every
 * dependent row in FK-safe order, delete the target, and VERIFY the row is
 * actually gone before reporting success. Storage objects are removed
 * best-effort. Every successful delete writes an audit_logs row.
 *
 * Body (exactly one):
 *   { spaceId: string }                 - delete a whole space
 *   { itemId: string, spaceId?: string} - delete a file / folder / section
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Delete rows matching col=val on a table; tolerate missing tables/columns. */
async function purge(table: string, col: string, val: string | string[]) {
  try {
    const q = admin.from(table).delete();
    const { error } = Array.isArray(val)
      ? await q.in(col, val)
      : await q.eq(col, val);
    if (error && !/does not exist|relation|column/i.test(error.message ?? '')) {
      console.warn(`[delete] purge ${table}.${col} failed:`, error.message);
    }
  } catch (e) {
    console.warn(`[delete] purge ${table} threw:`, e);
  }
}

async function removeStorage(paths: string[]) {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  for (const bucket of ['vdr-files', 'documents']) {
    try {
      await admin.storage.from(bucket).remove(clean);
    } catch { /* best-effort */ }
  }
}

async function writeAudit(row: {
  user_id: string;
  space_id: string | null;
  actor_email: string | null;
  action: string;
  resource_name: string | null;
}) {
  try {
    await admin.from('audit_logs').insert(row);
  } catch { /* audit table optional */ }
}

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`space-delete:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  // Identify the caller from the bearer token.
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const caller = userData.user;

  let body: { spaceId?: unknown; itemId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const spaceId = typeof body.spaceId === 'string' ? body.spaceId : null;
  const itemId = typeof body.itemId === 'string' ? body.itemId : null;

  // Ownership helper: the caller (or their workspace) must own the space.
  const ownsSpace = async (sid: string): Promise<boolean> => {
    const { data } = await admin.from('spaces').select('created_by').eq('id', sid).maybeSingle();
    if (!data) return false;
    const owner = data.created_by as string;
    if (owner === caller.id) return true;
    const { data: member } = await admin
      .from('workspace_members')
      .select('member_user_id')
      .eq('workspace_owner_id', owner)
      .eq('member_user_id', caller.id)
      .maybeSingle();
    return !!member;
  };

  // ── ITEM DELETE (file / folder / section) ────────────────────────────────
  if (itemId) {
    // 1) Folder?
    const { data: folder } = await admin
      .from('folders')
      .select('id, name, user_id, space_id')
      .eq('id', itemId)
      .maybeSingle();
    if (folder) {
      const owner = folder.user_id as string | null;
      const fSpace = (folder.space_id as string | null) ?? spaceId;
      const allowed = owner === caller.id || (fSpace ? await ownsSpace(fSpace) : false);
      if (!allowed) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

      // Gather this folder + all descendants (parent_id chains).
      const folderIds = [itemId];
      for (let depth = 0; depth < 20; depth++) {
        const { data: kids } = await admin
          .from('folders')
          .select('id')
          .in('parent_id', folderIds);
        const fresh = (kids ?? []).map((k) => k.id as string).filter((id) => !folderIds.includes(id));
        if (fresh.length === 0) break;
        folderIds.push(...fresh);
      }
      // Files inside those folders: clear dependents, storage, then rows.
      const { data: files } = await admin
        .from('files')
        .select('id, storage_path')
        .in('folder_id', folderIds);
      const fileIds = (files ?? []).map((f) => f.id as string);
      if (fileIds.length) {
        // Access logs reference share_links - clear them before the links.
        const { data: fl } = await admin.from('share_links').select('id').in('file_id', fileIds);
        const flIds = (fl ?? []).map((l) => l.id as string);
        if (flIds.length) await purge('share_link_access_logs', 'share_link_id', flIds);
        await purge('share_link_access_logs', 'file_id', fileIds);
        await purge('share_links', 'file_id', fileIds);
        await purge('file_permissions', 'file_id', fileIds);
        await purge('file_page_views', 'file_id', fileIds);
        await purge('file_playback_events', 'file_id', fileIds);
        await removeStorage((files ?? []).map((f) => (f.storage_path as string) ?? ''));
        await purge('files', 'id', fileIds);
      }
      const { data: gone, error } = await admin.from('folders').delete().in('id', folderIds).select('id');
      if (error || !gone || gone.length === 0) {
        return NextResponse.json({ ok: false, error: error?.message ?? 'folder_not_deleted' }, { status: 500 });
      }
      await writeAudit({
        user_id: owner ?? caller.id,
        space_id: fSpace ?? null,
        actor_email: caller.email ?? null,
        action: 'folder_deleted',
        resource_name: (folder.name as string) ?? 'Folder',
      });
      return NextResponse.json({ ok: true, kind: 'folder' });
    }

    // 2) Section header?
    const { data: section } = await admin
      .from('space_sections')
      .select('id, name, user_id, space_id')
      .eq('id', itemId)
      .maybeSingle();
    if (section) {
      const sSpace = (section.space_id as string | null) ?? spaceId;
      const allowed = (section.user_id as string) === caller.id || (sSpace ? await ownsSpace(sSpace) : false);
      if (!allowed) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
      const { data: gone, error } = await admin.from('space_sections').delete().eq('id', itemId).select('id');
      if (error || !gone || gone.length === 0) {
        return NextResponse.json({ ok: false, error: error?.message ?? 'section_not_deleted' }, { status: 500 });
      }
      return NextResponse.json({ ok: true, kind: 'section' });
    }

    // 3) File.
    const { data: file } = await admin
      .from('files')
      .select('id, name, user_id, space_id, storage_path')
      .eq('id', itemId)
      .maybeSingle();
    if (!file) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    const fSpace = (file.space_id as string | null) ?? spaceId;
    const allowed = (file.user_id as string) === caller.id || (fSpace ? await ownsSpace(fSpace) : false);
    if (!allowed) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

    // Access logs reference share_links - clear them before the links.
    {
      const { data: fl } = await admin.from('share_links').select('id').eq('file_id', itemId);
      const flIds = (fl ?? []).map((l) => l.id as string);
      if (flIds.length) await purge('share_link_access_logs', 'share_link_id', flIds);
    }
    await purge('share_link_access_logs', 'file_id', itemId);
    await purge('share_links', 'file_id', itemId);
    await purge('file_permissions', 'file_id', itemId);
    await purge('file_page_views', 'file_id', itemId);
    await purge('file_playback_events', 'file_id', itemId);
    if (file.storage_path) await removeStorage([file.storage_path as string]);
    const { data: gone, error } = await admin.from('files').delete().eq('id', itemId).select('id');
    if (error || !gone || gone.length === 0) {
      return NextResponse.json({ ok: false, error: error?.message ?? 'file_not_deleted' }, { status: 500 });
    }
    await writeAudit({
      user_id: (file.user_id as string) ?? caller.id,
      space_id: fSpace ?? null,
      actor_email: caller.email ?? null,
      action: 'file_deleted',
      resource_name: (file.name as string) ?? 'File',
    });
    return NextResponse.json({ ok: true, kind: 'file' });
  }

  // ── WHOLE-SPACE DELETE ────────────────────────────────────────────────────
  if (!spaceId) return NextResponse.json({ ok: false, error: 'target_required' }, { status: 400 });
  const { data: space } = await admin
    .from('spaces')
    .select('id, name, title, created_by')
    .eq('id', spaceId)
    .maybeSingle();
  if (!space) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  if (!(await ownsSpace(spaceId))) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // Storage first (needs the rows to still exist).
  const { data: files } = await admin.from('files').select('id, storage_path').eq('space_id', spaceId);
  const fileIds = (files ?? []).map((f) => f.id as string);
  await removeStorage((files ?? []).map((f) => (f.storage_path as string) ?? ''));

  // Access logs reference share_links; collect every link id for this space
  // (space-level links + per-file links) and clear the logs FIRST.
  {
    const { data: spaceLinks } = await admin.from('share_links').select('id').eq('space_id', spaceId);
    let linkIds = (spaceLinks ?? []).map((l) => l.id as string);
    if (fileIds.length) {
      const { data: fileLinks } = await admin.from('share_links').select('id').in('file_id', fileIds);
      linkIds = linkIds.concat((fileLinks ?? []).map((l) => l.id as string));
    }
    if (linkIds.length) await purge('share_link_access_logs', 'share_link_id', linkIds);
  }
  if (fileIds.length) await purge('share_link_access_logs', 'file_id', fileIds);

  // Upload-tracking rows reference file_requests; clear them before the requests.
  {
    const { data: reqs } = await admin.from('file_requests').select('id').eq('space_id', spaceId);
    const reqIds = (reqs ?? []).map((r) => r.id as string);
    if (reqIds.length) {
      await purge('file_request_uploads', 'request_id', reqIds);
      await purge('file_request_uploads', 'file_request_id', reqIds);
    }
  }

  // Dependents in FK-safe order. Each purge tolerates missing tables.
  if (fileIds.length) {
    await purge('share_links', 'file_id', fileIds);
    await purge('file_permissions', 'file_id', fileIds);
    await purge('file_page_views', 'file_id', fileIds);
    await purge('file_playback_events', 'file_id', fileIds);
  }
  for (const [table, col] of [
    ['file_page_views', 'space_id'],
    ['file_playback_events', 'space_id'],
    ['viewer_sessions', 'space_id'],
    ['space_analytics', 'space_id'],
    ['space_questions', 'space_id'],
    ['questions', 'space_id'],
    ['space_nodes', 'space_id'],
    ['space_sections', 'space_id'],
    ['file_permissions', 'space_id'],
    ['share_links', 'space_id'],
    ['file_requests', 'space_id'],
    ['files', 'space_id'],
    ['folders', 'space_id'],
    ['space_members', 'space_id'],
    ['dw_watchlist', 'space_id'],
    ['dw_update_events', 'space_id'],
    ['alerts', 'space_id'],
    ['expired_link_attempts', 'space_id'],
  ] as const) {
    await purge(table, col, spaceId);
  }

  const { data: gone, error } = await admin.from('spaces').delete().eq('id', spaceId).select('id');
  if (error || !gone || gone.length === 0) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'space_not_deleted' }, { status: 500 });
  }

  await writeAudit({
    user_id: (space.created_by as string) ?? caller.id,
    space_id: null, // the space is gone; keep it as a workspace-level event
    actor_email: caller.email ?? null,
    action: 'space_deleted',
    resource_name: ((space.name as string) || (space.title as string)) ?? 'Space',
  });

  return NextResponse.json({ ok: true, kind: 'space' });
}
