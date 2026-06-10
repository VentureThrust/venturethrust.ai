/**
 * /api/notify-question-answer - sends an email to the question asker when the
 * space owner replies. Uses nodemailer with SMTP credentials from env vars.
 *
 * Environment variables required (add to your .env.local):
 *   SMTP_HOST=smtp.example.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true          // 'true' for 465, 'false' for 587
 *   SMTP_USER=username
 *   SMTP_PASS=password
 *   SMTP_FROM="VentureThrust <noreply@yourdomain.com>"
 *
 * If SMTP is not configured, the route returns 200 with a warning - emails are
 * skipped silently so the in-app notification still works. This lets you ship
 * the Q&A flow without setting up email infrastructure first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

// Input length caps prevent abuse where an attacker sends gigantic strings
// that would bloat outbound emails or get the sender flagged as spam.
const MAX_QUESTION_LEN = 2000;
const MAX_ANSWER_LEN = 8000;
const MAX_NAME_LEN = 120;
const MAX_EMAIL_LEN = 320; // RFC max email length

export async function POST(request: NextRequest) {
  // ── Rate limit: 10 emails per IP per minute, 30 per hour ────────────
  // Prevents using the endpoint to spam arbitrary inboxes if an attacker
  // ever finds a way to call it without owner auth (defense-in-depth).
  const ip = clientIp(request);
  const burst = consumeRateLimit(`notify:burst:${ip}`, 10, 60_000);
  if (!burst.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(burst.retryAfterSec) },
    });
  }
  const hourly = consumeRateLimit(`notify:hourly:${ip}`, 30, 60 * 60_000);
  if (!hourly.ok) {
    return new NextResponse('Too many requests this hour', {
      status: 429,
      headers: { 'Retry-After': String(hourly.retryAfterSec) },
    });
  }

  let body: {
    toEmail?: string;
    toName?: string | null;
    question?: string;
    /** No longer included in the email body - passed only so we can confirm
     *  the answer exists before sending. */
    answer?: string;
    spaceId?: string;
    /** Required: the question's UUID so the email button can deep-link to
     *  /answer/[questionId] where the reader logs in to view the answer. */
    questionId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { toEmail, toName, question, answer, questionId } = body;
  if (!toEmail || !question || !answer || !questionId) {
    return NextResponse.json(
      { error: 'toEmail, question, answer, and questionId are required' },
      { status: 400 }
    );
  }

  // Strict input validation - defense against payload abuse, header injection,
  // and email-template breakage from malformed user input.
  if (typeof toEmail !== 'string' || !toEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (toEmail.length > MAX_EMAIL_LEN) {
    return NextResponse.json({ error: 'Email too long' }, { status: 400 });
  }
  if (typeof question !== 'string' || question.length > MAX_QUESTION_LEN) {
    return NextResponse.json({ error: 'Question is too long' }, { status: 400 });
  }
  if (typeof answer !== 'string' || answer.length > MAX_ANSWER_LEN) {
    return NextResponse.json({ error: 'Answer is too long' }, { status: 400 });
  }
  if (toName && (typeof toName !== 'string' || toName.length > MAX_NAME_LEN)) {
    return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
  }
  // Reject header-injection attempts via CR/LF in email/name fields
  if (/[\r\n]/.test(toEmail) || (typeof toName === 'string' && /[\r\n]/.test(toName))) {
    return NextResponse.json({ error: 'Invalid characters in email/name' }, { status: 400 });
  }
  // questionId must look like a UUID - prevents path injection on the deep link
  if (typeof questionId !== 'string' || !/^[0-9a-f-]{32,36}$/i.test(questionId)) {
    return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
  }

  // Gracefully degrade if SMTP isn't configured - in-app notifications still work
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({
      sent: false,
      reason:
        'SMTP not configured - set SMTP_HOST/SMTP_USER/SMTP_PASS env vars to enable email replies.',
    });
  }

  try {
    // Dynamic import keeps nodemailer out of the client bundle entirely
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });

    const greetingName = toName?.trim() ? toName.trim() : toEmail.split('@')[0];
    const fromAddr = process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`;

    // Truncated question for the subject line
    const shortQ =
      question.length > 60 ? question.slice(0, 57).trimEnd() + '…' : question;

    // Deep-link to the gated answer page. PUBLIC_APP_URL lets you point at
    // production (https://venturethrust.com); falls back to localhost for dev.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.PUBLIC_APP_URL ||
      'http://localhost:3000';
    const answerUrl = `${appUrl}/answer/${encodeURIComponent(questionId)}`;

    // ⚠️ The answer itself is intentionally NOT included in the email body.
    // Recipients must click the CTA button, sign in / sign up, and view it
    // on the platform. This keeps sensitive answers behind authentication
    // and brings new users into the product.
    const html = `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0d0d1a; line-height: 1.55;">
        <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px;">
          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1e40af); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 700;">V</div>
          <strong style="font-size: 18px;">VentureThrust</strong>
        </div>

        <h1 style="font-size: 22px; margin: 0 0 8px 0; letter-spacing: -0.01em;">Hi ${escapeHtml(greetingName)},</h1>
        <p style="margin: 0 0 24px 0; color: #555;">Your question has been answered.</p>

        <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 6px;">Your question</div>
          <div style="white-space: pre-line; font-size: 14px;">${escapeHtml(question)}</div>
        </div>

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${escapeHtml(answerUrl)}"
             style="display: inline-block; background: #1a1a2e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: -0.005em;">
            Click to view the answer →
          </a>
          <div style="font-size: 12px; color: #888; margin-top: 12px;">
            You&rsquo;ll be asked to sign in or create an account first.
          </div>
        </div>

        <div style="border-top: 1px solid #ececec; padding-top: 16px; font-size: 12px; color: #888;">
          For your security, the answer is only visible after you sign in with this email address (<span style="font-family: monospace; color: #555;">${escapeHtml(toEmail)}</span>). If you have any trouble, reply to this email.
        </div>

        <p style="margin: 24px 0 0 0; color: #aaa; font-size: 11px;">© ${new Date().getFullYear()} VentureThrust - secure data rooms for founders and investors.</p>
      </div>
    `;

    const text = [
      `Hi ${greetingName},`,
      '',
      'Your question has been answered.',
      '',
      `Your question: ${question}`,
      '',
      `Click to view the answer (you'll be asked to sign in or create an account first):`,
      answerUrl,
      '',
      `For your security, the answer is only visible after you sign in with this email address (${toEmail}).`,
      '',
      `© ${new Date().getFullYear()} VentureThrust`,
    ].join('\n');

    await transporter.sendMail({
      from: fromAddr,
      to: toEmail,
      subject: `Re: ${shortQ}`,
      text,
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[notify-question-answer] send failed:', message);
    return NextResponse.json({ sent: false, error: message }, { status: 500 });
  }
}

// Minimal HTML escape so user input can't break the template
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
