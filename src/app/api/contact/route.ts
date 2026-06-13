/**
 * /api/contact - the public "Contact us / Contact sales" form.
 *
 * Emails the VentureThrust inbox with the visitor's message (reply-to set to
 * the visitor) using the same nodemailer/SMTP setup as the rest of the app.
 * Degrades gracefully: if SMTP isn't configured it returns { sent:false } so
 * the page can ask the visitor to email directly instead of failing silently.
 *
 * Env vars (same as /api/notify-question-answer):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

const CONTACT_TO = 'omprakash@venturethrust.com';
const MAX = { name: 120, email: 320, company: 160, phone: 40, message: 5000 };
const TOPICS = new Set(['sales', 'support', 'general']);
const TOPIC_LABEL: Record<string, string> = {
  sales: 'Sales',
  support: 'Support',
  general: 'General',
};

export async function POST(request: NextRequest) {
  // Rate limit: 5 submissions per IP per minute, 20 per hour.
  const ip = clientIp(request);
  const burst = consumeRateLimit(`contact:burst:${ip}`, 5, 60_000);
  if (!burst.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(burst.retryAfterSec) },
    });
  }
  const hourly = consumeRateLimit(`contact:hourly:${ip}`, 20, 60 * 60_000);
  if (!hourly.ok) {
    return new NextResponse('Too many requests this hour', {
      status: 429,
      headers: { 'Retry-After': String(hourly.retryAfterSec) },
    });
  }

  let body: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    topic?: string;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const company = (body.company ?? '').trim();
  const phone = (body.phone ?? '').trim();
  const message = (body.message ?? '').trim();
  const topic = (body.topic ?? 'general').trim();

  // Validation: required fields, lengths, email shape, header-injection guard.
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }
  if (name.length > MAX.name) {
    return NextResponse.json({ error: 'Name is too long.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > MAX.email) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (company.length > MAX.company) {
    return NextResponse.json({ error: 'Company name is too long.' }, { status: 400 });
  }
  if (phone.length > MAX.phone) {
    return NextResponse.json({ error: 'Phone number is too long.' }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: 'Please add a little more detail.' }, { status: 400 });
  }
  if (message.length > MAX.message) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
  }
  if (!TOPICS.has(topic)) {
    return NextResponse.json({ error: 'Invalid topic.' }, { status: 400 });
  }
  if (
    /[\r\n]/.test(name) ||
    /[\r\n]/.test(email) ||
    /[\r\n]/.test(company) ||
    /[\r\n]/.test(phone)
  ) {
    return NextResponse.json({ error: 'Invalid characters in your details.' }, { status: 400 });
  }

  // Gracefully degrade if SMTP isn't configured.
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({
      sent: false,
      reason: 'SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS to enable the form.',
    });
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
    const label = TOPIC_LABEL[topic];
    const rows: [string, string][] = [
      ['Name', name],
      ['Email', email],
      ['Company', company || 'Not provided'],
      ['Phone', phone || 'Not provided'],
      ['Topic', label],
    ];

    const html = `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0d0d1a; line-height: 1.55;">
        <h1 style="font-size: 20px; margin: 0 0 4px 0;">New ${escapeHtml(label)} enquiry</h1>
        <p style="margin: 0 0 20px 0; color: #666;">Submitted via the VentureThrust contact page.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding: 6px 12px 6px 0; color: #888; vertical-align: top; white-space: nowrap;">${escapeHtml(
                  k,
                )}</td><td style="padding: 6px 0; color: #111;">${escapeHtml(v)}</td></tr>`,
            )
            .join('')}
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f5f5f7; border-radius: 12px; white-space: pre-line; font-size: 14px;">${escapeHtml(
          message,
        )}</div>
        <p style="margin-top: 20px; font-size: 12px; color: #aaa;">Reply directly to this email to respond to ${escapeHtml(
          name,
        )}.</p>
      </div>
    `;

    const text = [
      `New ${label} enquiry (VentureThrust contact page)`,
      '',
      ...rows.map(([k, v]) => `${k}: ${v}`),
      '',
      'Message:',
      message,
    ].join('\n');

    await transporter.sendMail({
      from: fromAddr,
      to: CONTACT_TO,
      replyTo: email,
      subject: `[${label}] New enquiry from ${name}`,
      text,
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[contact] send failed:', m);
    return NextResponse.json({ sent: false, error: m }, { status: 500 });
  }
}

// Minimal HTML escape so visitor input can't break the email template.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
