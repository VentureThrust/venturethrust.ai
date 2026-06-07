/**
 * POST /api/workspace-code/verify
 *
 * Verifies the 6-digit login code emailed by POST /api/workspace-code and, if
 * correct, returns the paired admin magic-link `tokenHash`. The client then
 * establishes the session with:
 *   supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
 *
 * Body: { email: string, code: string }
 * Returns:
 *   { ok: true, tokenHash, ownerId }
 *   { ok: false, reason: 'none' | 'expired' | 'locked' | 'mismatch'
 *                       | 'bad_request' | 'rate_limited' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { takeLoginCode } from '@/lib/login-codes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`wscode-verify:${clientIp(req)}`, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  let email = '';
  let code = '';
  try {
    const body = await req.json();
    email = String(body.email ?? '').trim().toLowerCase();
    code = String(body.code ?? '').trim();
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
  }
  if (!email || !code) {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
  }

  const result = takeLoginCode(email, code);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason });
  }
  return NextResponse.json({ ok: true, tokenHash: result.tokenHash, ownerId: result.ownerId });
}
