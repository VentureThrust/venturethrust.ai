/**
 * GET /api/workspaces
 *
 * Lists the workspaces the signed-in user can switch between:
 *   - their own ("My Workspace")
 *   - every workspace they've been invited to & joined (labelled by owner email)
 *
 * Returns: { ok, workspaces: [{ ownerId, label, email, isOwn }] }
 * Header: Authorization: Bearer <supabase access token>
 *
 * Service-role so we can resolve the owner emails for labels even when the
 * member has no RLS read access to other users' profiles.
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
  const rate = consumeRateLimit(`workspaces:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // Workspaces this user has joined.
  const { data: memberships } = await admin
    .from('workspace_members')
    .select('workspace_owner_id')
    .eq('member_user_id', user.id);

  const ownerIds = Array.from(
    new Set((memberships ?? []).map((m) => m.workspace_owner_id as string).filter((id) => id && id !== user.id)),
  );

  // Does the user own a real workspace of their own (a non-sentinel space)?
  const { data: ownSpace } = await admin
    .from('spaces')
    .select('id')
    .eq('created_by', user.id)
    .neq('title', 'CONTENT_LIBRARY')
    .limit(1)
    .maybeSingle();
  const ownsReal = !!ownSpace;
  const hasOwnAccount =
    (user.user_metadata as Record<string, unknown> | undefined)?.has_own_account === true;

  // A "pure invitee" (joined via invite, owns nothing of their own, hasn't
  // claimed their own account) only ever sees the shared workspace(s) - no
  // personal "My Workspace".
  const pureInvitee = ownerIds.length > 0 && !ownsReal && !hasOwnAccount;

  const workspaces: { ownerId: string; label: string; email: string | null; isOwn: boolean }[] = [];
  if (!pureInvitee) {
    workspaces.push({ ownerId: user.id, label: 'My Workspace', email: user.email ?? null, isOwn: true });
  }

  if (ownerIds.length > 0) {
    const { data: profs } = await admin.from('profiles').select('id, email').in('id', ownerIds);
    const emailById = new Map((profs ?? []).map((p) => [p.id as string, (p.email as string) ?? null]));
    for (const id of ownerIds) {
      const email = emailById.get(id) ?? null;
      workspaces.push({
        ownerId: id,
        label: email ? `${email}'s workspace` : 'Shared workspace',
        email,
        isOwn: false,
      });
    }
  }

  return NextResponse.json({ ok: true, workspaces });
}
