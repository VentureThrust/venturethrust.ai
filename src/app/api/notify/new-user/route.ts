/**
 * POST /api/notify/new-user
 *
 * Fire-and-forget. Called by the app the first time an authenticated session
 * loads. If this account has not been announced yet, email the owner that a
 * new user signed up, then flag the profile so it never fires again.
 *
 * Catches EVERY signup path (email + password, Google, invite link) because it
 * keys off the session, not the signup form. The flag lives on
 * profiles.signup_notified (sql/admin_signup_notify.sql).
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { dwAdmin, dwCaller, notifyAdmin } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`notify-new-user:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // Read the flag first. If the column is missing (migration not run yet) we
  // stay silent rather than emailing on every page load.
  const { data: profile, error: readErr } = await dwAdmin
    .from('profiles')
    .select('signup_notified, plan, is_investor')
    .eq('id', caller.id)
    .maybeSingle();

  if (readErr) {
    console.warn('[notify/new-user] signup_notified missing; run sql/admin_signup_notify.sql');
    return NextResponse.json({ ok: true, notified: false });
  }
  if ((profile as { signup_notified?: boolean } | null)?.signup_notified === true) {
    return NextResponse.json({ ok: true, notified: false });
  }

  // Claim the notification BEFORE sending, so two tabs opening at once cannot
  // produce two emails.
  const { error: claimErr } = await dwAdmin
    .from('profiles')
    .update({ signup_notified: true })
    .eq('id', caller.id)
    .eq('signup_notified', false);
  if (claimErr) {
    console.warn('[notify/new-user] claim failed:', claimErr);
    return NextResponse.json({ ok: true, notified: false });
  }

  // Anything we know about them at this moment, so the email is actionable.
  let name = '';
  let provider = '';
  let createdAt = '';
  try {
    const { data } = await dwAdmin.auth.admin.getUserById(caller.id);
    const u = data?.user;
    const meta = (u?.user_metadata ?? {}) as { full_name?: string; name?: string };
    name = (meta.full_name || meta.name || '').trim();
    provider = (u?.app_metadata as { provider?: string } | undefined)?.provider ?? '';
    createdAt = u?.created_at ?? '';
  } catch {
    /* email is still worth sending without these */
  }

  const plan = (profile as { plan?: string | null } | null)?.plan ?? null;
  const isInvestor = (profile as { is_investor?: boolean } | null)?.is_investor === true;
  const when = createdAt
    ? new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  await notifyAdmin({
    subject: `New signup: ${caller.email}`,
    lines: [
      `${name ? `${name} (${caller.email})` : caller.email} just created an account.`,
      `Signed up with: ${provider === 'google' ? 'Google' : provider || 'email'}`,
      `Time: ${when} IST`,
      `Plan: ${plan ?? 'none yet'}${isInvestor ? ' · Investor plan active' : ''}`,
      'Reach out while they are still on the site.',
    ],
  });

  return NextResponse.json({ ok: true, notified: true });
}
