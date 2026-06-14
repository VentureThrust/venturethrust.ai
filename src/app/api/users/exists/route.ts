/**
 * POST /api/users/exists
 *
 * Live check used by the invite dialogs: does this email belong to an existing
 * VentureThrust user? Signed-in only (so it can't be used for anonymous email
 * enumeration) and rate-limited.
 *
 * Body: { email: string }
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok: true, exists: boolean, isSelf: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { resolveUserByEmail } from '@/lib/resolve-user';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`users-exists:${clientIp(req)}`, 40, 60_000);
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

  let email = '';
  try {
    const body = await req.json();
    email = String(body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const found = await resolveUserByEmail(email);
  return NextResponse.json({ ok: true, exists: !!found, isSelf: !!found && found.id === user.id });
}
