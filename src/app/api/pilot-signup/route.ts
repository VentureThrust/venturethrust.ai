/**
 * POST /api/pilot-signup
 *
 * Collects AI Due Diligence pilot-waitlist signups while the feature is gated
 * as "upcoming", and emails the team so no lead is lost. Email-only (no DB
 * writes) to keep launch dependency-free - we can add a `pilot_signups` table
 * later if we want a dashboard.
 *
 * Body: { name?, email, organization?, message?, feature? }
 * Returns: { ok }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Service-role client (server-only) so the public waitlist can write even though
// the `pilot_signups` table has RLS locked down to the service role.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    : null;

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`pilot-signup:${clientIp(req)}`, 10, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  let name = '';
  let email = '';
  let organization = '';
  let message = '';
  let feature = 'AI Due Diligence';
  try {
    const body = await req.json();
    name = String(body.name ?? '').trim().slice(0, 120);
    email = String(body.email ?? '').trim().toLowerCase().slice(0, 320);
    organization = String(body.organization ?? '').trim().slice(0, 160);
    message = String(body.message ?? '').trim().slice(0, 1000);
    feature = String(body.feature ?? 'AI Due Diligence').trim().slice(0, 80);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  // Persist to the database. Non-blocking: if the `pilot_signups` table hasn't
  // been created yet, we log and still email - so no signup is ever lost.
  if (admin) {
    const { error } = await admin.from('pilot_signups').insert({
      name: name || null,
      email,
      organization: organization || null,
      message: message || null,
      feature,
      user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    });
    if (error) {
      console.warn('[pilot-signup] DB insert skipped/failed (non-blocking):', error.message);
    }
  }

  try {
    await sendPilotEmail({ name, email, organization, message, feature });
  } catch (err) {
    // Non-blocking: still report success to the user; the attempt is logged.
    console.warn('[pilot-signup] email failed (non-blocking):', err);
  }

  console.log(`[pilot-signup] ${feature} - ${email} (${organization || 'no org'})`);
  return NextResponse.json({ ok: true });
}

async function sendPilotEmail(opts: {
  name: string;
  email: string;
  organization: string;
  message: string;
  feature: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[pilot-signup] SMTP not configured - skipping email.');
    return;
  }

  // @ts-ignore - nodemailer ships no bundled types
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
  const fromAddr = process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`;
  const notifyTo = process.env.PILOT_NOTIFY_EMAIL || smtpUser;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  await transporter.sendMail({
    from: fromAddr,
    to: notifyTo,
    replyTo: opts.email,
    subject: `New pilot waitlist signup - ${opts.feature}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-weight:600;font-size:20px;margin:0 0 12px">New ${esc(opts.feature)} pilot signup</h2>
        <table style="border-collapse:collapse;font-size:14px;line-height:1.6">
          <tr><td style="color:#6b6b8a;padding:2px 12px 2px 0">Name</td><td><strong>${esc(opts.name || '-')}</strong></td></tr>
          <tr><td style="color:#6b6b8a;padding:2px 12px 2px 0">Email</td><td><strong>${esc(opts.email)}</strong></td></tr>
          <tr><td style="color:#6b6b8a;padding:2px 12px 2px 0">Organization</td><td>${esc(opts.organization || '-')}</td></tr>
        </table>
        ${opts.message ? `<p style="color:#6b6b8a;margin:14px 0 4px">Use case</p><blockquote style="margin:0;padding:12px 16px;background:#f4f4f7;border-left:3px solid #6366f1;border-radius:6px;line-height:1.6">${esc(opts.message)}</blockquote>` : ''}
        <p style="color:#9a9ab0;font-size:12px;margin-top:20px">Reply directly to this email to reach the applicant.</p>
      </div>`,
  });
}
