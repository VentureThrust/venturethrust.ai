/**
 * POST /api/deal-watch/activate
 *
 * The account manager activates an investor account in one click (no SQL).
 * Sets profiles.is_investor = true and grants an active plan window so the
 * PlanGate lets them in. Re-running extends the window (e.g. after each
 * monthly payment).
 *
 * Manager only (email match, verified server-side).
 * Body: { email: string, days?: number }   (default 30, max 365)
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import { dwAdmin, dwCaller } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-activate:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (caller.email !== DW_MANAGER_EMAIL) {
    return NextResponse.json({ error: 'NOT_MANAGER' }, { status: 403 });
  }

  let body: { email?: unknown; days?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const days = Math.min(Math.max(Number(body.days) || 30, 1), 365);
  if (!email) return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 400 });

  const { data: profile } = await dwAdmin
    .from('profiles')
    .select('id, email')
    .ilike('email', email)
    .maybeSingle();
  if (!profile) {
    // No account yet - the investor must sign up first, then activate.
    return NextResponse.json({ ok: false, error: 'NO_ACCOUNT' }, { status: 404 });
  }

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await dwAdmin
    .from('profiles')
    .update({
      is_investor: true,
      plan: 'vdr_only',
      plan_status: 'active',
      plan_expires_at: expires,
    })
    .eq('id', profile.id as string);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: profile.email, expiresAt: expires, days });
}
