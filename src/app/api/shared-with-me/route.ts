/**
 * GET /api/shared-with-me
 *
 * Returns everything explicitly shared with the signed-in user:
 *
 *   1. INVITES - data rooms shared via the Invite button ('space_shared'
 *      alerts). Inviting one room shares exactly that room.
 *   2. SENT BY EMAIL - per-recipient send-by-email links (share_links rows
 *      whose recipient_email matches this user's email): spaces AND single
 *      deck files. Their opened/not-opened state comes from the link's own
 *      opened_at, which the /shared open tracking maintains.
 *
 * Both kinds are returned in ONE `spaces` array with a common shape; the page
 * groups them by `unopened`. We still do NOT list rooms the user merely
 * opened via some public link - only explicit shares.
 *
 * Runs with the service role because, by design, a user cannot read another
 * owner's spaces through the anon client (RLS).
 *
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok: true, spaces: SharedItem[] }
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
  const rate = consumeRateLimit(`shared-with-me:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const email = (user.email ?? '').toLowerCase();
  const userId = user.id;

  // ── 1. Explicit invites (alerts space_shared) ───────────────────────────
  type Inv = { unopened: boolean; alertId: string; at: string };
  const invited = new Map<string, Inv>();
  try {
    const { data: al } = await admin
      .from('alerts')
      .select('id, space_id, read_at, created_at')
      .eq('user_id', userId)
      .eq('type', 'space_shared')
      .order('created_at', { ascending: false });
    for (const a of al ?? []) {
      const sid = a.space_id as string;
      if (!sid || invited.has(sid)) continue; // newest row per space wins
      invited.set(sid, {
        unopened: !a.read_at,
        alertId: a.id as string,
        at: a.created_at as string,
      });
    }
  } catch { /* alerts table issue - treat as none */ }

  const spaceIds = Array.from(invited.keys());
  const spaces: Array<Record<string, unknown>> = [];

  if (spaceIds.length > 0) {
    // Fetch the invited spaces, excluding any the user happens to own.
    const { data: spaceRows } = await admin
      .from('spaces')
      .select('id, name, title, description, cover_image, created_by')
      .in('id', spaceIds);
    const rows = (spaceRows ?? []).filter((s) => (s.created_by as string) !== userId);

    // Owner emails.
    const ownerIds = [...new Set(rows.map((s) => s.created_by as string).filter(Boolean))];
    const ownerEmail = new Map<string, string>();
    if (ownerIds.length) {
      const { data: profs } = await admin.from('profiles').select('id, email').in('id', ownerIds);
      (profs ?? []).forEach((p) => { if (p.email) ownerEmail.set(p.id as string, p.email as string); });
    }

    // Most recent active token per space (to open through the gated /shared route).
    const tokenMap = new Map<string, string>();
    const { data: links } = await admin
      .from('share_links')
      .select('space_id, token, created_at')
      .in('space_id', spaceIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    (links ?? []).forEach((l) => {
      if (!tokenMap.has(l.space_id as string)) tokenMap.set(l.space_id as string, l.token as string);
    });

    // Enrich with the user's own visit info (display only).
    const visit = new Map<string, { last: string; count: number }>();
    if (email) {
      try {
        const { data: vs } = await admin
          .from('viewer_sessions')
          .select('space_id, started_at, last_heartbeat')
          .eq('visitor_email', email)
          .in('space_id', spaceIds);
        for (const r of vs ?? []) {
          const sid = r.space_id as string;
          const ts = (r.last_heartbeat as string) || (r.started_at as string) || '';
          const e = visit.get(sid);
          if (e) { e.count += 1; if (ts && new Date(ts) > new Date(e.last)) e.last = ts; }
          else visit.set(sid, { last: ts || new Date().toISOString(), count: 1 });
        }
      } catch { /* analytics table issue - skip enrichment */ }
    }

    for (const s of rows) {
      const sid = s.id as string;
      const inv = invited.get(sid)!;
      const v = visit.get(sid);
      spaces.push({
        spaceId: sid,
        spaceName: (s.name as string) || (s.title as string) || 'Untitled Space',
        description: (s.description as string) ?? null,
        coverImage: (s.cover_image as string) ?? null,
        ownerEmail: ownerEmail.get(s.created_by as string) ?? null,
        shareToken: tokenMap.get(sid) ?? null,
        lastAccessedAt: v?.last ?? inv.at,
        visitCount: v?.count ?? 0,
        invited: true,
        unopened: inv.unopened,
        alertId: inv.alertId,
        kind: 'space',
      });
    }
  }

  // ── 2. Send-by-email links addressed to this user ───────────────────────
  // Wrapped defensively: pre-migration DBs without recipient_email simply
  // contribute nothing (the invites above still work).
  if (email) {
    try {
      const { data: recips } = await admin
        .from('share_links')
        .select('id, token, space_id, file_id, created_by, created_at, opened_at, recipient_email, is_active')
        .ilike('recipient_email', email)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Skip my own sends and anything already listed via an invite; keep the
      // newest link per (sender, target).
      const seen = new Set<string>();
      const picked: Array<Record<string, unknown>> = [];
      for (const r of recips ?? []) {
        if ((r.created_by as string) === userId) continue;
        if (!r.file_id && r.space_id && invited.has(r.space_id as string)) continue;
        const key = `${r.created_by}:${r.space_id ?? ''}:${r.file_id ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        picked.push(r as Record<string, unknown>);
      }

      if (picked.length > 0) {
        const sSpaceIds = [...new Set(picked.filter((r) => !r.file_id && r.space_id).map((r) => r.space_id as string))];
        const sFileIds = [...new Set(picked.filter((r) => r.file_id).map((r) => r.file_id as string))];
        const senderIds = [...new Set(picked.map((r) => r.created_by as string).filter(Boolean))];

        const spaceMeta = new Map<string, { name: string; description: string | null; cover: string | null }>();
        if (sSpaceIds.length) {
          const { data } = await admin
            .from('spaces')
            .select('id, name, title, description, cover_image')
            .in('id', sSpaceIds);
          (data ?? []).forEach((s) => spaceMeta.set(s.id as string, {
            name: (s.name as string) || (s.title as string) || 'Untitled Space',
            description: (s.description as string) ?? null,
            cover: (s.cover_image as string) ?? null,
          }));
        }
        const fileMeta = new Map<string, string>();
        if (sFileIds.length) {
          const { data } = await admin.from('files').select('id, name').in('id', sFileIds);
          (data ?? []).forEach((f) => fileMeta.set(f.id as string, (f.name as string) || 'Document'));
        }
        const senderEmail = new Map<string, string>();
        if (senderIds.length) {
          const { data } = await admin.from('profiles').select('id, email').in('id', senderIds);
          (data ?? []).forEach((p) => { if (p.email) senderEmail.set(p.id as string, p.email as string); });
        }

        for (const r of picked) {
          const isFile = !!r.file_id;
          const meta = isFile ? null : spaceMeta.get(r.space_id as string);
          const name = isFile
            ? (fileMeta.get(r.file_id as string) ?? 'Document')
            : (meta?.name ?? 'Untitled Space');
          spaces.push({
            spaceId: `sent_${r.id as string}`,
            spaceName: name,
            description: isFile ? null : (meta?.description ?? null),
            coverImage: isFile ? null : (meta?.cover ?? null),
            ownerEmail: senderEmail.get(r.created_by as string) ?? null,
            shareToken: r.token as string,
            lastAccessedAt: (r.opened_at as string) || (r.created_at as string),
            visitCount: 0,
            invited: false,
            unopened: !r.opened_at,
            alertId: null,
            kind: isFile ? 'file' : 'space',
          });
        }
      }
    } catch { /* recipient columns missing - invites still returned */ }
  }

  spaces.sort((a, b) =>
    new Date(b.lastAccessedAt as string).getTime() - new Date(a.lastAccessedAt as string).getTime());

  return NextResponse.json({ ok: true, spaces });
}
