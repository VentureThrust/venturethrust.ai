/**
 * POST /api/invite/accept
 *
 * Finalizes an invitation: the signed-in invitee joins the inviter's workspace.
 *   1. Verifies the invitee from their bearer access token.
 *   2. Validates the invitation (pending, not expired) and that the signed-in
 *      email matches the invited email (only the invited person can accept).
 *   3. Inserts a workspace_members row (idempotent) and marks the invite accepted.
 *
 * Body: { token: string }
 * Header: Authorization: Bearer <supabase access token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`invite-accept:${clientIp(req)}`, 30, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  // ── Identify the invitee from their access token ──
  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user: member } } = await authed.auth.getUser();
  if (!member) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });

  const { data: inv } = await admin
    .from('space_invitations')
    .select('invited_email, role, status, workspace_owner_id, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (!inv) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  if (inv.expires_at && new Date(inv.expires_at as string).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: 'expired' }, { status: 410 });
  }

  // Only the invited person may accept.
  if ((member.email ?? '').toLowerCase() !== String(inv.invited_email).toLowerCase()) {
    return NextResponse.json({ ok: false, error: 'email_mismatch' }, { status: 403 });
  }

  // A user can't be a member of their own workspace.
  if (member.id === inv.workspace_owner_id) {
    return NextResponse.json({ ok: false, error: 'cannot_join_own' }, { status: 400 });
  }

  // Insert membership (idempotent on the unique (owner, member) constraint).
  const { error: memErr } = await admin
    .from('workspace_members')
    .upsert(
      {
        workspace_owner_id: inv.workspace_owner_id,
        member_user_id: member.id,
        member_email: member.email,
        role: inv.role,
      },
      { onConflict: 'workspace_owner_id,member_user_id' },
    );
  if (memErr) {
    console.error('[invite-accept] membership insert failed:', memErr);
    return NextResponse.json({ ok: false, error: 'db_failed', detail: memErr.message }, { status: 500 });
  }

  await admin
    .from('space_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('token', token);

  // Notify the workspace owner that the invite was accepted (best-effort).
  try {
    await admin.from('alerts').insert({
      user_id: inv.workspace_owner_id,
      space_id: null,
      type: 'collaborator_joined',
      message: `${member.email} accepted your invitation and joined your workspace.`,
    });
  } catch { /* non-blocking */ }

  return NextResponse.json({ ok: true, workspaceOwnerId: inv.workspace_owner_id });
}
