/**
 * notifyLinkOpen - "someone just opened your link" email.
 *
 * Fires when a share link carrying `notify_email` passes all its gates. The
 * point is links with NO email gate: a deck or a report sent cold, where the
 * visitor is never asked who they are, so the open itself is the only signal
 * the owner gets.
 *
 * Best effort in every direction. It never throws, never blocks the open, and
 * a missing column or missing SMTP config simply means no mail.
 *
 * Throttled to one mail per link per visitor IP per 30 minutes, because a
 * reader who refreshes or reopens the tab is the same visit, not a new one.
 */

import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from './rate-limit';

/** Vercel geo headers, when the request came through the edge. */
function whereFrom(req: NextRequest): string {
  const city = req.headers.get('x-vercel-ip-city');
  const country = req.headers.get('x-vercel-ip-country');
  const parts = [city ? decodeURIComponent(city) : null, country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not available';
}

/**
 * Fallback for links that should alert someone before share_links.notify_email
 * exists in the database. The column is the real mechanism; this keeps the
 * outbound sales links working without waiting on a migration.
 */
const NOTIFY_BY_TOKEN: Record<string, string> = {
  // Sample briefs used in investor outreach, one per sector.
  nomi: 'omprakashborkar611@gmail.com',
  nuzzle: 'omprakashborkar611@gmail.com',
  yantra: 'omprakashborkar611@gmail.com',
  // Personalised copies, one per named prospect.
  ivycap: 'omprakashborkar611@gmail.com',
  ayu: 'omprakashborkar611@gmail.com',
};

export async function notifyLinkOpen(
  admin: SupabaseClient,
  opts: {
    req: NextRequest;
    link: Record<string, unknown>;
    /** Only known when the link had an email gate or a named recipient. */
    visitorEmail?: string | null;
    documentName?: string | null;
  },
): Promise<void> {
  const named = String(opts.link.link_name ?? '').trim().toLowerCase();
  const to = String(opts.link.notify_email ?? '').trim() || NOTIFY_BY_TOKEN[named] || '';
  if (!to) return;

  const linkId = String(opts.link.id ?? '');
  const ip = clientIp(opts.req);
  // Same reader, same half hour, one mail. Keyed on the link too, so opens of
  // two different links from one office still both come through.
  if (!consumeRateLimit(`link-open-notify:${linkId}:${ip}`, 1, 30 * 60_000).ok) return;

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) return;

    const docName = (opts.documentName ?? String(opts.link.link_name ?? '') ?? '').trim()
      || 'your document';
    const when = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const openNo = (Number(opts.link.open_count) || 0) + 1;
    const who = (opts.visitorEmail ?? '').trim();

    // A notification, not a report. Four facts a person acts on, nothing that
    // needs interpreting.
    const rows: Array<[string, string]> = [
      ['Document', docName],
      ['Opened at', `${when} IST`],
      ['Location', whereFrom(opts.req)],
      ['Open number', String(openNo)],
    ];
    if (who) rows.splice(1, 0, ['Visitor', who]);

    const appUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '') || 'https://www.venturethrust.com';

    const html = `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f1729; line-height: 1.55;">
        <p style="margin: 0 0 4px 0; font-size: 11px; letter-spacing: 1px; color: #8b1e2d; font-weight: 700;">VENTURETHRUST</p>
        <h1 style="font-size: 20px; margin: 0 0 14px 0; color: #0d1b3e;">Someone just opened your link</h1>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 130px; border-bottom: 1px solid #eef0f4;">${k}</td>
              <td style="padding: 8px 0; color: #0f1729; font-weight: 600; border-bottom: 1px solid #eef0f4;">${v}</td>
            </tr>`).join('')}
        </table>
        <p style="margin: 18px 0 0 0; color: #6b7280; font-size: 13px;">
          ${who ? '' : 'This link has no email gate, so the visitor was never asked who they are.'}
        </p>
        <a href="${appUrl}/dashboard" style="display: inline-block; margin-top: 18px; background: #0d1b3e; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">Open dashboard</a>
        <p style="margin: 24px 0 0 0; color: #aaa; font-size: 11px;">&copy; ${new Date().getFullYear()} VentureThrust</p>
      </div>`;

    const text = ['Someone just opened your link', '',
      ...rows.map(([k, v]) => `${k}: ${v}`), '',
      `${appUrl}/dashboard`].join('\n');

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`,
      to,
      subject: `Opened: ${docName}`,
      text,
      html,
    });
  } catch (e) {
    console.error('[link-open-notify] failed:', e instanceof Error ? e.message : e);
  }
}
