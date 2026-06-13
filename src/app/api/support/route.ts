/**
 * POST /api/support
 *
 * Files a support request from a signed-in user. Emails the team (Zoho SMTP, the
 * same transport as Q&A / pilot signups) and best-effort logs to
 * public.support_tickets. Email is the source of truth, so a request is never
 * lost even before the table is created.
 *
 * Auth: Authorization: Bearer <supabase access token>. The sender's identity
 * (email) is taken from the token, never trusted from the body.
 * Body: { subject?: string, category?: string, message: string }
 * Returns: { ok }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    : null;

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`support:${clientIp(req)}`, 8, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  // Identify the sender from their token (never trust the body for identity).
  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let subject = '';
  let category = 'general';
  let message = '';
  try {
    const body = await req.json();
    subject = String(body.subject ?? '').trim().slice(0, 160);
    category = String(body.category ?? 'general').trim().slice(0, 40);
    message = String(body.message ?? '').trim().slice(0, 4000);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ ok: false, error: 'message_too_short' }, { status: 400 });
  }

  const email = user.email ?? '';

  // Best-effort log (non-blocking; a no-op if the table is not created yet).
  if (admin) {
    const { error } = await admin.from('support_tickets').insert({
      user_id: user.id,
      email: email || null,
      subject: subject || null,
      category,
      message,
      status: 'open',
    });
    if (error) console.warn('[support] DB insert skipped/failed (non-blocking):', error.message);
  }

  try {
    await sendSupportEmail({ email, subject, category, message });
  } catch (err) {
    console.warn('[support] email failed (non-blocking):', err);
  }

  return NextResponse.json({ ok: true });
}

async function sendSupportEmail(opts: {
  email: string;
  subject: string;
  category: string;
  message: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[support] SMTP not configured - skipping email.');
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
  const notifyTo = process.env.SUPPORT_NOTIFY_EMAIL || 'support@venturethrust.com';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  await transporter.sendMail({
    from: fromAddr,
    to: notifyTo,
    replyTo: opts.email || undefined,
    subject: `Support request: ${opts.subject || opts.category} (${opts.email || 'unknown'})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-weight:600;font-size:20px;margin:0 0 12px">New support request</h2>
        <table style="border-collapse:collapse;font-size:14px;line-height:1.6">
          <tr><td style="color:#6b6b8a;padding:2px 12px 2px 0">From</td><td><strong>${esc(opts.email || '-')}</strong></td></tr>
          <tr><td style="color:#6b6b8a;padding:2px 12px 2px 0">Category</td><td>${esc(opts.category)}</td></tr>
          ${opts.subject ? `<tr><td style="color:#6b6b8a;padding:2px 12px 2px 0">Subject</td><td>${esc(opts.subject)}</td></tr>` : ''}
        </table>
        <p style="color:#6b6b8a;margin:14px 0 4px">Message</p>
        <blockquote style="margin:0;padding:12px 16px;background:#f4f4f7;border-left:3px solid #6366f1;border-radius:6px;line-height:1.6">${esc(opts.message)}</blockquote>
        <p style="color:#9a9ab0;font-size:12px;margin-top:20px">Reply directly to this email to reach the user.</p>
      </div>`,
  });
}
