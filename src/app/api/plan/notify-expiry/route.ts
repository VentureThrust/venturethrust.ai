/**
 * POST /api/plan/notify-expiry
 *
 * Best-effort: called when a signed-in owner lands on /choose-role with a lapsed
 * plan. Emails the owner once per expiry that their subscription has ended and
 * that any links they shared are now paused for recipients.
 *
 * Dedupe uses profiles.plan_expiry_notified_for (the expiry we last emailed
 * about), so revisiting /choose-role doesn't resend. Enable by running:
 *   alter table profiles add column if not exists plan_expiry_notified_for text;
 * Until that column exists this route is a safe no-op (no email is sent).
 *
 * Auth: the caller's Supabase access token (Bearer). We only act on their row.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isPlanActive } from '@/lib/plan';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  // Identify the caller from their token (never trust the body for identity).
  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Read plan + expiry + last-notified marker. If the marker column doesn't
  // exist yet, this select errors and we no-op (feature stays off until the SQL
  // is run).
  const { data: prof, error } = await admin
    .from('profiles')
    .select('plan, plan_expires_at, plan_expiry_notified_for')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !prof) return NextResponse.json({ ok: true, sent: false });

  const p = prof as {
    plan?: string | null;
    plan_expires_at?: string | null;
    plan_expiry_notified_for?: string | null;
  };

  // Only email if there IS a plan and it has actually lapsed.
  if (!p.plan || isPlanActive(p.plan, p.plan_expires_at ?? null)) {
    return NextResponse.json({ ok: true, sent: false });
  }

  const marker = p.plan_expires_at ?? 'unknown';
  if (p.plan_expiry_notified_for === marker) {
    return NextResponse.json({ ok: true, sent: false }); // already emailed for this expiry
  }

  // Mark first so we never double-send, even if the email is slow.
  await admin.from('profiles').update({ plan_expiry_notified_for: marker }).eq('id', user.id);

  const email = user.email;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!email || !smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ ok: true, sent: false });
  }

  try {
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
        <h1 style="font-size: 20px; margin: 0 0 8px 0;">Your VentureThrust plan has expired</h1>
        <p style="margin: 0 0 16px 0; color: #555;">Hi there, your subscription has ended, so your account is now paused.</p>
        <div style="background: #fff4f4; border: 1px solid #f6caca; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; color: #7a1f1f; font-size: 14px;">
          Any links you have shared are now inactive. Anyone you sent them to will not be able to open your documents until you renew.
        </div>
        <p style="margin: 0 0 20px 0; color: #555;">Renew your plan to restore access for you and everyone you have shared with.</p>
        <a href="${appUrl}/dashboard/billing" style="display: inline-block; background: #4285F4; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-size: 15px; font-weight: 600;">Renew my plan</a>
        <p style="margin: 24px 0 0 0; color: #aaa; font-size: 11px;">© ${new Date().getFullYear()} VentureThrust. Secure data rooms for closing deals.</p>
      </div>
    `;
    const text = [
      'Your VentureThrust plan has expired',
      '',
      'Hi there, your subscription has ended, so your account is now paused.',
      '',
      'Any links you have shared are now inactive. Anyone you sent them to will not be able to open your documents until you renew.',
      '',
      `Renew your plan to restore access: ${appUrl}/dashboard/billing`,
      '',
      `© ${new Date().getFullYear()} VentureThrust`,
    ].join('\n');

    await transporter.sendMail({
      from: fromAddr,
      to: email,
      subject: 'Your VentureThrust plan has expired',
      text,
      html,
    });
    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    console.error('[plan/notify-expiry] send failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: true, sent: false });
  }
}
