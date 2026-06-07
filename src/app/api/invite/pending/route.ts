/**
 * GET /api/invite/pending
 *
 * Returns the most recent PENDING invitation token for the signed-in user's
 * email (or null). Used by the InviteRedirectCatcher so that when a magic link
 * lands the user on the homepage (because the deep redirect URL wasn't
 * allow-listed in Supabase), we can still route them to their accept page.
 *
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

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(`invite-pending:${clientIp(req)}`, 60, 60_000);
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
  if (!user?.email) return NextResponse.json({ ok: true, token: null, isMember: false });

  const { data: pending } = await admin
    .from('space_invitations')
    .select('token')
    .eq('invited_email', user.email.toLowerCase())
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Already a member of a workspace? (lets the catcher route a re-clicked,
  // consumed magic link straight to the shared workspace instead of stranding
  // them on the homepage / a login page.)
  const { data: member } = await admin
    .from('workspace_members')
    .select('id')
    .eq('member_user_id', user.id)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, token: pending?.token ?? null, isMember: !!member });
}
