/**
 * POST /api/workspace-login
 *
 * Lets an INVITEE log into a shared workspace using the **workspace owner's
 * password** (the password of the account that invited them). The owner's
 * password is effectively the shared key to the workspace.
 *
 * Flow:
 *   1. Find the invitee account by email.
 *   2. Find which workspace owner(s) they were invited to.
 *   3. Verify the submitted password against each owner's account (the owner's
 *      password is the shared key). Use the first that matches.
 *   4. Mint a passwordless session for the INVITEE (their own identity) via an
 *      admin magic-link token_hash - so they enter as themselves, no email.
 *
 * Body: { email: string, password: string }
 * Returns:
 *   { ok: true,  tokenHash, ownerId }                      → client verifyOtp(token_hash)
 *   { ok: false, reason: 'wrong_password' | 'not_invitee'
 *                       | 'no_user' | 'bad_request'
 *                       | 'rate_limited' | 'server' }
 *
 * No bearer needed - the caller has no session yet (they're logging in).
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
  // Brute-force guard - this checks a workspace owner's password.
  const rate = consumeRateLimit(`wslogin:${clientIp(req)}`, 10, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  try {
    let email = '';
    let password = '';
    try {
      const body = await req.json();
      email = String(body.email ?? '').trim().toLowerCase();
      password = String(body.password ?? '');
    } catch {
      return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
    }

    // 1) Find the invitee account.
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
    const invitee = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!invitee) return NextResponse.json({ ok: false, reason: 'no_user' });

    // 2) Which workspace(s) was this email invited to?
    const { data: memberships } = await admin
      .from('workspace_members')
      .select('workspace_owner_id')
      .eq('member_user_id', invitee.id);
    const ownerIds = Array.from(
      new Set((memberships ?? [])
        .map((m) => m.workspace_owner_id as string)
        .filter((id) => id && id !== invitee.id)),
    );
    if (ownerIds.length === 0) {
      return NextResponse.json({ ok: false, reason: 'not_invitee' });
    }

    // 3) Verify the entered password against each owner's account. The owner's
    //    password is the shared workspace key. Use the first that matches.
    //    persistSession:false so the throwaway session is never stored; we never
    //    call signOut (a global signOut would revoke the owner's real sessions).
    const verifier = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    let matchedOwnerId: string | null = null;
    for (const ownerId of ownerIds) {
      const { data: ownerData } = await admin.auth.admin.getUserById(ownerId);
      const ownerEmail = ownerData?.user?.email;
      if (!ownerEmail) continue;
      const { data: signIn } = await verifier.auth.signInWithPassword({ email: ownerEmail, password });
      if (signIn?.session) {
        matchedOwnerId = ownerId;
        break;
      }
    }
    if (!matchedOwnerId) {
      return NextResponse.json({ ok: false, reason: 'wrong_password' });
    }

    // 4) Mint a passwordless session for the INVITEE (their own identity). The
    //    token_hash is exchanged client-side via verifyOtp - no email at all.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tokenHash, ownerId: matchedOwnerId });
  } catch (err) {
    console.error('[workspace-login] unhandled error:', err);
    return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
  }
}
