/**
 * GET /api/track/sessions?spaceId=...
 *
 * Returns all viewer sessions for a space, for the analytics page. Uses the
 * service role (so the owner sees ANONYMOUS visitors' sessions regardless of
 * the read RLS policy), but first verifies - from the caller's bearer token -
 * that they actually own the space or are a member of its workspace.
 *
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok, sessions: [{ visitor_email, started_at, last_heartbeat, ended_at }] }
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
  const rate = consumeRateLimit(`track-sessions:${clientIp(req)}`, 120, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  const spaceId = req.nextUrl.searchParams.get('spaceId');
  if (!spaceId) return NextResponse.json({ ok: false, error: 'missing_space' }, { status: 400 });

  // Identify the caller.
  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // Must own the space, or be a member of its workspace.
  const { data: space } = await admin.from('spaces').select('created_by').eq('id', spaceId).maybeSingle();
  if (!space) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  let allowed = String(space.created_by) === user.id;
  if (!allowed) {
    const { data: m } = await admin
      .from('workspace_members')
      .select('id')
      .eq('workspace_owner_id', space.created_by)
      .eq('member_user_id', user.id)
      .limit(1)
      .maybeSingle();
    allowed = !!m;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const { data: sessions, error } = await admin
    .from('viewer_sessions')
    .select('visitor_email, started_at, last_heartbeat, ended_at')
    .eq('space_id', spaceId);
  if (error) {
    console.error('[track-sessions] read failed:', error.message);
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sessions: sessions ?? [] });
}
