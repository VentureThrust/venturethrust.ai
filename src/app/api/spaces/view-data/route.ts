/**
 * POST /api/spaces/view-data
 *
 * Server-side data loader for the shared space viewer (/spaces/[id]/view).
 *
 * WHY: the viewer used to read spaces/folders/files with the browser client,
 * which meant Row Level Security decided who sees what. RLS only knows
 * owners and team members, so a LOGGED-IN investor opening a room that was
 * explicitly shared with them was filtered out and saw "Space not found",
 * while the founder (owner) and anonymous visitors saw it fine. This route
 * runs with the service role and applies the sharing rules itself.
 *
 * Access is granted when ANY of these holds:
 *   1. `token` is an active share link for this space (the /shared gates
 *      flow passes it along after the visitor clears the gates).
 *   2. The caller is the owner or a workspace/space member (checked by
 *      reading the space with the caller's own credentials under RLS).
 *   3. The caller was explicitly invited (a 'space_shared' alert exists).
 *   4. A send-by-email link addressed to the caller's email exists.
 *   5. The caller has this space on their Deal Watch watchlist.
 *
 * Body: { spaceId, token?, fileId? }
 *   - without fileId: returns { space, folders, files, coverUrl, logoUrl }
 *   - with fileId:    returns { signedUrl } for that file (same access check;
 *                     the file must belong to the space)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function resolveStorageUrl(raw: string | null, bucket: string): Promise<string | null> {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  const pub = admin.storage.from(bucket).getPublicUrl(raw);
  if (pub.data?.publicUrl) return pub.data.publicUrl;
  const { data: signed } = await admin.storage.from(bucket).createSignedUrl(raw, 86400);
  return signed?.signedUrl ?? null;
}

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`view-data:${clientIp(req)}`, 120, 60_000);
  if (!rate.ok) return new NextResponse('Too many requests', { status: 429 });

  let body: { spaceId?: string; token?: string; fileId?: string; countView?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 }); }
  const spaceId = (body.spaceId ?? '').trim();
  const token = (body.token ?? '').trim();
  const fileId = (body.fileId ?? '').trim();
  if (!spaceId) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  // ── Access check ─────────────────────────────────────────────────────────
  let allowed = false;

  // 1. Active share link token for this space.
  if (token) {
    const { data: link } = await admin
      .from('share_links')
      .select('id, space_id, is_active')
      .eq('token', token)
      .maybeSingle();
    if (link && link.is_active && link.space_id === spaceId) allowed = true;
  }

  // 2-5. Logged-in callers: owner/member, invited, addressed, or watching.
  const authHeader = req.headers.get('authorization') ?? '';
  if (!allowed && authHeader.toLowerCase().startsWith('bearer ')) {
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await authed.auth.getUser();
    if (user) {
      // Owner or team/space member: their own RLS lets them read the row.
      const { data: own } = await authed.from('spaces').select('id').eq('id', spaceId).maybeSingle();
      if (own) allowed = true;

      if (!allowed) {
        const email = (user.email ?? '').toLowerCase();
        const [inv, sent, watch, asked] = await Promise.all([
          admin.from('alerts').select('id').eq('user_id', user.id)
            .eq('type', 'space_shared').eq('space_id', spaceId).limit(1).maybeSingle(),
          email
            ? admin.from('share_links').select('id').eq('space_id', spaceId)
                .eq('is_active', true).ilike('recipient_email', email).limit(1).maybeSingle()
            : Promise.resolve({ data: null }),
          admin.from('dw_watchlist').select('id').eq('investor_id', user.id)
            .eq('space_id', spaceId).limit(1).maybeSingle(),
          // Asked a question here (the answer email's "Return to space" path).
          email
            ? admin.from('space_questions').select('id').eq('space_id', spaceId)
                .ilike('visitor_email', email).limit(1).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (inv.data || sent.data || watch.data || asked.data) allowed = true;
      }
    }
  }

  if (!allowed) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  // ── Single file: return a signed URL ─────────────────────────────────────
  if (fileId) {
    const { data: file } = await admin
      .from('files')
      .select('id, space_id, storage_path, views')
      .eq('id', fileId)
      .maybeSingle();
    if (!file || file.space_id !== spaceId || !file.storage_path) {
      return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
    }
    const { data: signed } = await admin.storage
      .from('vdr-files')
      .createSignedUrl(file.storage_path as string, 3600);
    if (!signed?.signedUrl) return NextResponse.json({ error: 'SIGN_FAILED' }, { status: 500 });
    // View counter, best-effort (visitors cannot bump it under RLS; the
    // owner's preview passes countView: false).
    if (body.countView) {
      try {
        await admin.from('files')
          .update({ views: (Number(file.views) || 0) + 1 })
          .eq('id', fileId);
      } catch { /* counter only */ }
    }
    return NextResponse.json({ signedUrl: signed.signedUrl });
  }

  // ── Full bundle ───────────────────────────────────────────────────────────
  const { data: space, error: spaceErr } = await admin
    .from('spaces')
    .select('id, title, name, description, cover_image, logo, watermark_text, expires_at')
    .eq('id', spaceId)
    .maybeSingle();
  if (spaceErr || !space) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const [foldersRes, filesRes, coverUrl, logoUrl] = await Promise.all([
    admin.from('folders').select('*').eq('space_id', spaceId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    admin.from('files').select('*').eq('space_id', spaceId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    resolveStorageUrl(space.cover_image as string | null, 'space-covers'),
    resolveStorageUrl(space.logo as string | null, 'space-logos'),
  ]);

  // Visitor questions toggle, best-effort: on pre-migration databases the
  // column does not exist and questions stay ON (the historic behaviour).
  let questionsEnabled = true;
  try {
    const { data: qrow, error: qerr } = await admin
      .from('spaces')
      .select('questions_enabled')
      .eq('id', spaceId)
      .maybeSingle();
    if (!qerr && (qrow as { questions_enabled?: boolean } | null)?.questions_enabled === false) {
      questionsEnabled = false;
    }
  } catch { /* default on */ }

  return NextResponse.json({
    space,
    folders: foldersRes.data ?? [],
    files: filesRes.data ?? [],
    coverUrl,
    logoUrl,
    questionsEnabled,
  });
}
