/**
 * recordExpiredAttempt - called when someone tries to open a link whose owner's
 * plan has expired. Two best-effort side effects (never throws):
 *
 *   1. Stores the attempt (only when we know the visitor's email) so the owner
 *      can see WHO tried once they renew. Deduped per owner+email+space.
 *   2. Emails the owner (throttled to once per 6h) nudging a renewal, teasing
 *      that upgrading reveals who tried. The visitor's address is never put in
 *      the email - it's only shown in-app after the owner has an active plan.
 *
 * Storage needs the table (see sql/expired_link_attempts.sql); if it's missing
 * the insert is a no-op. The email needs SMTP configured.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { consumeRateLimit } from './rate-limit';

/**
 * Deduped insert of one attempt row (per owner+email+space, 30 min window).
 * No-op without an owner or visitor email, or if the table doesn't exist yet.
 */
export async function storeExpiredAttempt(
  admin: SupabaseClient,
  opts: { ownerId: string | null; spaceId?: string | null; visitorEmail?: string | null },
): Promise<void> {
  const ownerId = opts.ownerId;
  const visitorEmail = (opts.visitorEmail ?? '').trim().toLowerCase() || null;
  if (!ownerId || !visitorEmail) return;
  const spaceId = opts.spaceId ?? null;
  const recGate = consumeRateLimit(
    `exp-attempt-rec:${ownerId}:${visitorEmail}:${spaceId ?? 'none'}`,
    1,
    30 * 60_000,
  );
  if (!recGate.ok) return;
  try {
    await admin.from('expired_link_attempts').insert({
      owner_id: ownerId,
      space_id: spaceId,
      visitor_email: visitorEmail,
    });
  } catch {
    /* table may not exist yet - ignore */
  }
}

export async function recordExpiredAttempt(
  admin: SupabaseClient,
  opts: { ownerId: string | null; spaceId?: string | null; visitorEmail?: string | null },
): Promise<void> {
  const ownerId = opts.ownerId;
  if (!ownerId) return;

  // 1) Store the attempt (when we know who it was).
  await storeExpiredAttempt(admin, opts);

  // 2) Throttled owner notification: at most once per 6h per owner.
  const mailGate = consumeRateLimit(`exp-attempt-mail:${ownerId}`, 1, 6 * 60 * 60_000);
  if (!mailGate.ok) return;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) return;

  try {
    const { data: u } = await admin.auth.admin.getUserById(ownerId);
    const to = u?.user?.email;
    if (!to) return;

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });
    const fromAddr = process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`;
    const appUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '') || 'https://www.venturethrust.com';

    const html = `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0d0d1a; line-height: 1.55;">
        <h1 style="font-size: 20px; margin: 0 0 8px 0;">Someone just tried to open your space</h1>
        <p style="margin: 0 0 16px 0; color: #555;">A visitor tried to open one of your shared links, but your plan has expired, so the link is inactive and they could not get in.</p>
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; color: #9a3412; font-size: 14px;">
          Upgrade your plan to reactivate your links so visitors can open your documents again.
        </div>
        <p style="margin: 0 0 20px 0; color: #555; font-weight: 600;">Upgrade to see exactly who tried to visit your link.</p>
        <a href="${appUrl}/dashboard/billing" style="display: inline-block; background: #4285F4; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-size: 15px; font-weight: 600;">Reactivate my plan</a>
        <p style="margin: 24px 0 0 0; color: #aaa; font-size: 11px;">© ${new Date().getFullYear()} VentureThrust. Secure data rooms for closing deals.</p>
      </div>
    `;
    const text = [
      'Someone just tried to open your space',
      '',
      'A visitor tried to open one of your shared links, but your plan has expired, so the link is inactive and they could not get in.',
      '',
      'Upgrade your plan to reactivate your links so visitors can open your documents again.',
      'Upgrade to see exactly who tried to visit your link.',
      '',
      `Reactivate your plan: ${appUrl}/dashboard/billing`,
      '',
      `© ${new Date().getFullYear()} VentureThrust`,
    ].join('\n');

    await transporter.sendMail({
      from: fromAddr,
      to,
      subject: 'Someone tried to open your space',
      text,
      html,
    });
  } catch (e) {
    console.error('[expired-attempts] notify failed:', e instanceof Error ? e.message : e);
  }
}
