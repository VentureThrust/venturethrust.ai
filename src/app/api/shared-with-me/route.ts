/**
 * GET /api/shared-with-me
 *
 * Returns the data rooms shared with the signed-in user. Runs with the service
 * role because, by design, a user CANNOT read another owner's spaces /
 * viewer_sessions / access logs through the anon client (RLS), which is why the
 * old client-side version always came back empty.
 *
 * A space counts as "shared with me" if any of these reference my email/id:
 *   1. viewer_sessions.visitor_email  (I opened a shared link and entered my email)
 *   2. share_link_access_logs.email   (logged access via a share link)
 *   3. alerts(type 'space_shared')    (an owner explicitly invited me)
 * Spaces I own myself are excluded.
 *
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok: true, spaces: SharedSpace[] }
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

  // Accumulate visit info (last access + count) per space.
  const visit = new Map<string, { last: string; count: number }>();
  const bump = (sid: string, ts: string, n = 1) => {
    if (!sid) return;
    const e = visit.get(sid);
    if (e) {
      e.count += n;
      if (ts && new Date(ts) > new Date(e.last)) e.last = ts;
    } else {
      visit.set(sid, { last: ts || new Date().toISOString(), count: n });
    }
  };

  // Explicit invites, keyed by space.
  const invited = new Map<
    string,
    { unopened: boolean; alertId: string; token?: string; ownerEmail?: string | null; at: string }
  >();

  const spaceIds = new Set<string>();

  // 1) viewer_sessions by visitor_email
  if (email) {
    try {
      const { data } = await admin
        .from('viewer_sessions')
        .select('space_id, started_at, last_heartbeat')
        .eq('visitor_email', email);
      for (const r of data ?? []) {
        const sid = r.space_id as string;
        const ts = (r.last_heartbeat as string) || (r.started_at as string) || '';
        spaceIds.add(sid);
        bump(sid, ts);
      }
    } catch { /* table missing - skip */ }
  }

  // 2) share_link_access_logs by email -> share_links -> space_id
  if (email) {
    try {
      const { data: logs } = await admin
        .from('share_link_access_logs')
        .select('share_link_id, created_at')
        .eq('email', email)
        .order('created_at', { ascending: false });
      const linkIds = [...new Set((logs ?? []).map((l) => l.share_link_id as string).filter(Boolean))];
      if (linkIds.length) {
        const { data: links } = await admin.from('share_links').select('id, space_id').in('id', linkIds);
        const l2s = new Map<string, string>();
        (links ?? []).forEach((l) => l2s.set(l.id as string, l.space_id as string));
        for (const log of logs ?? []) {
          const sid = l2s.get(log.share_link_id as string);
          if (!sid) continue;
          spaceIds.add(sid);
          bump(sid, log.created_at as string);
        }
      }
    } catch { /* table missing - skip */ }
  }

  // 3) explicit invites (alerts of type 'space_shared')
  try {
    const { data: al } = await admin
      .from('alerts')
      .select('id, space_id, read_at, created_at, metadata')
      .eq('user_id', userId)
      .eq('type', 'space_shared')
      .order('created_at', { ascending: false });
    for (const a of al ?? []) {
      const sid = a.space_id as string;
      if (!sid) continue;
      spaceIds.add(sid);
      if (!invited.has(sid)) {
        const md = (a.metadata as Record<string, unknown> | null) ?? {};
        invited.set(sid, {
          unopened: !a.read_at,
          alertId: a.id as string,
          token: typeof md.token === 'string' && md.token ? (md.token as string) : undefined,
          ownerEmail: typeof md.owner_email === 'string' ? (md.owner_email as string) : null,
          at: a.created_at as string,
        });
      }
      // Seed a last-accessed baseline (count 0) so invited-but-never-opened
      // spaces still sort sensibly.
      bump(sid, a.created_at as string, 0);
    }
  } catch { /* table missing - skip */ }

  if (spaceIds.size === 0) return NextResponse.json({ ok: true, spaces: [] });

  // Fetch the spaces, excluding any the user owns themselves.
  const { data: spaceRows } = await admin
    .from('spaces')
    .select('id, name, title, description, cover_image, created_by')
    .in('id', Array.from(spaceIds));
  const rows = (spaceRows ?? []).filter((s) => (s.created_by as string) !== userId);
  if (rows.length === 0) return NextResponse.json({ ok: true, spaces: [] });

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
    .in('space_id', rows.map((s) => s.id as string))
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  (links ?? []).forEach((l) => {
    if (!tokenMap.has(l.space_id as string)) tokenMap.set(l.space_id as string, l.token as string);
  });

  const spaces = rows.map((s) => {
    const sid = s.id as string;
    const inv = invited.get(sid);
    const info = visit.get(sid) ?? { last: inv?.at ?? new Date().toISOString(), count: 0 };
    return {
      spaceId: sid,
      spaceName: (s.name as string) || (s.title as string) || 'Untitled Space',
      description: (s.description as string) ?? null,
      coverImage: (s.cover_image as string) ?? null,
      ownerEmail: ownerEmail.get(s.created_by as string) ?? inv?.ownerEmail ?? null,
      shareToken: tokenMap.get(sid) ?? inv?.token ?? null,
      lastAccessedAt: info.last,
      visitCount: info.count,
      invited: !!inv,
      unopened: inv?.unopened ?? false,
      alertId: inv?.alertId ?? null,
    };
  });
  spaces.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());

  return NextResponse.json({ ok: true, spaces });
}
