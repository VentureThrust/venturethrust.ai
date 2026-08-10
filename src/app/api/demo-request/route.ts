/**
 * POST /api/demo-request
 *
 * "Book a demo" from the shared document viewer. Stores the request and emails
 * it on. Anonymous by design: the person filling this in has just read a
 * report and has no account, so there is nothing to authenticate against.
 *
 * Rate limited per IP because it is an open endpoint on a public page. The
 * mail send runs in after() so the visitor sees a confirmation immediately
 * rather than waiting on an SMTP handshake.
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const NOTIFY_TO = process.env.DEMO_REQUEST_NOTIFY_EMAIL || 'omprakashborkar611@gmail.com';

/** Deliberately loose: rejecting an unusual but valid address loses a lead. */
function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function clip(v: unknown, max: number): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  // Five a minute is generous for a human and useless for a script.
  const rl = consumeRateLimit(`demo-request:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'TOO_MANY' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const name = clip(body.name, 120);
  const email = (clip(body.email, 200) ?? '').toLowerCase();
  if (!name || !email || !looksLikeEmail(email)) {
    return NextResponse.json({ error: 'NAME_AND_EMAIL_REQUIRED' }, { status: 400 });
  }

  const row = {
    name,
    email,
    firm: clip(body.firm, 160),
    role: clip(body.role, 120),
    phone: clip(body.phone, 40),
    message: clip(body.message, 2000),
    share_link_id: clip(body.shareLinkId, 64),
    file_id: clip(body.fileId, 64),
    document_name: clip(body.documentName, 300),
    source_url: clip(body.sourceUrl, 500),
    country: req.headers.get('x-vercel-ip-country'),
    city: (() => {
      const c = req.headers.get('x-vercel-ip-city');
      return c ? decodeURIComponent(c) : null;
    })(),
    user_agent: (req.headers.get('user-agent') ?? '').slice(0, 400) || null,
    ip,
  };

  const { error } = await admin.from('demo_requests').insert(row);
  if (error) {
    // The table may not exist yet. Never lose the lead over that: log it loudly
    // and still send the email, which is the part that reaches a human.
    console.error('[demo-request] insert failed:', error.message);
  }

  after(async () => {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (!smtpHost || !smtpUser || !smtpPass) return;

      const when = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const rows: Array<[string, string]> = [
        ['Name', row.name],
        ['Email', row.email],
        ...(row.firm ? ([['Firm', row.firm]] as Array<[string, string]>) : []),
        ...(row.role ? ([['Role', row.role]] as Array<[string, string]>) : []),
        ...(row.phone ? ([['Phone', row.phone]] as Array<[string, string]>) : []),
        ['Was reading', row.document_name ?? 'a shared document'],
        ['Location', [row.city, row.country].filter(Boolean).join(', ') || 'Not available'],
        ['Requested at', `${when} IST`],
      ];

      const html = `
        <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f1729; line-height: 1.55;">
          <p style="margin: 0 0 4px 0; font-size: 11px; letter-spacing: 1px; color: #8b1e2d; font-weight: 700;">VENTURETHRUST</p>
          <h1 style="font-size: 20px; margin: 0 0 14px 0; color: #0d1b3e;">Someone asked for a demo</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${rows.map(([k, v]) => `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 130px; border-bottom: 1px solid #eef0f4;">${k}</td>
                <td style="padding: 8px 0; color: #0f1729; font-weight: 600; border-bottom: 1px solid #eef0f4;">${v}</td>
              </tr>`).join('')}
          </table>
          ${row.message ? `<p style="margin: 16px 0 0 0; padding: 12px 14px; background: #f7f8fa; border-radius: 8px; font-size: 14px;"><b>Their message:</b><br>${row.message.replace(/</g, '&lt;')}</p>` : ''}
          <a href="mailto:${row.email}?subject=${encodeURIComponent('Deal Watch demo')}" style="display: inline-block; margin-top: 18px; background: #0d1b3e; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">Reply to ${row.name}</a>
        </div>`;

      const text = ['Someone asked for a demo', '', ...rows.map(([k, v]) => `${k}: ${v}`),
        row.message ? `\nMessage: ${row.message}` : ''].join('\n');

      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`,
        to: NOTIFY_TO,
        // Replying to the alert reaches the person who asked, not us.
        replyTo: `${row.name} <${row.email}>`,
        subject: `Demo request: ${row.name}${row.firm ? ` (${row.firm})` : ''}`,
        text,
        html,
      });
    } catch (e) {
      console.error('[demo-request] notify failed:', e instanceof Error ? e.message : e);
    }
  });

  return NextResponse.json({ ok: true });
}
