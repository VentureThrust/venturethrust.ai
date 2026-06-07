/**
 * GET /api/invite/info?token=...
 *
 * Public lookup of an invitation by its token, for the accept page to render
 * "X invited you to join their workspace". Returns only non-sensitive fields.
 * Service-role because the invitee is not the workspace owner (RLS on
 * space_invitations only lets the owner read).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(`invite-info:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });

  const { data: inv } = await admin
    .from('space_invitations')
    .select('invited_email, role, status, workspace_owner_id, invited_by_email, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!inv) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const expired = inv.expires_at ? new Date(inv.expires_at as string).getTime() < Date.now() : false;

  // Owner display name (best-effort, from profiles).
  let ownerName = (inv.invited_by_email as string) ?? 'A VentureThrust user';
  const { data: prof } = await admin
    .from('profiles')
    .select('email')
    .eq('id', inv.workspace_owner_id)
    .maybeSingle();
  if (prof?.email) ownerName = prof.email as string;

  return NextResponse.json({
    ok: true,
    invitation: {
      invitedEmail: inv.invited_email,
      role: inv.role,
      status: inv.status,
      ownerName,
      ownerId: inv.workspace_owner_id,
      expired,
    },
  });
}
