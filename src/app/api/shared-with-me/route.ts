/**
 * GET /api/shared-with-me
 *
 * Returns the data rooms an owner has EXPLICITLY shared with the signed-in user
 * via the Invite button. The list is driven only by 'space_shared' alerts, so
 * inviting one room shares exactly that one room and nothing else. (We do NOT
 * list every room the user happened to open via a link - that made the page
 * look like a whole account was shared.)
 *
 * Runs with the service role because, by design, a user cannot read another
 * owner's spaces through the anon client (RLS).
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

  // The ONLY source of "shared with me": explicit invites (alerts space_shared).
  type Inv = { unopened: boolean; alertId: string; at: string };
  const invited = new Map<string, Inv>();
  try {
    // Select ONLY columns that definitely exist. Selecting a `metadata` column
    // that some installs do not have makes the whole query error and return
    // nothing - which made Shared with me look empty even though the invite
    // alert existed and showed in the bell. The token + owner email are
    // resolved below from share_links / profiles, so metadata is not needed.
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
  if (spaceIds.length === 0) return NextResponse.json({ ok: true, spaces: [] });

  // Fetch the invited spaces, excluding any the user happens to own.
  const { data: spaceRows } = await admin
    .from('spaces')
    .select('id, name, title, description, cover_image, created_by')
    .in('id', spaceIds);
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
    .in('space_id', spaceIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  (links ?? []).forEach((l) => {
    if (!tokenMap.has(l.space_id as string)) tokenMap.set(l.space_id as string, l.token as string);
  });

  // Enrich with the user's own visit info for these invited spaces only (for
  // display - it never adds spaces to the list).
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

  const spaces = rows.map((s) => {
    const sid = s.id as string;
    const inv = invited.get(sid)!;
    const v = visit.get(sid);
    return {
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
    };
  });
  spaces.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());

  return NextResponse.json({ ok: true, spaces });
}
