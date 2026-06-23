/**
 * POST /api/share-links/send
 *
 * Emails per-recipient "send by email" deck links. The recipient rows have
 * already been created client-side in share_links (recipient_email set, email
 * gate OFF). This route ONLY sends the emails, taking the destination address
 * from the stored row (never from the request body) so it cannot be used to
 * spam arbitrary addresses.
 *
 * Body: { linkIds: string[] }
 *
 * Reuses the same nodemailer / Zoho SMTP setup as the contact + agreements
 * routes (env: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
 * SMTP_FROM). If SMTP is not configured the links still exist; we just report
 * that nothing was emailed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`share-send:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  let body: { linkIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const linkIds = Array.isArray(body.linkIds)
    ? body.linkIds.filter((x): x is string => typeof x === 'string').slice(0, 100)
    : [];
  if (linkIds.length === 0) {
    return NextResponse.json({ error: 'NO_LINKS' }, { status: 400 });
  }

  const { data: rows } = await supabase
    .from('share_links')
    .select('id, token, recipient_email, sent_message, file_id, created_by, is_active')
    .in('id', linkIds);

  const links = (rows ?? []).filter(
    (r) => r.recipient_email && r.is_active !== false && r.file_id
  );
  if (links.length === 0) {
    return NextResponse.json({ error: 'NO_VALID_LINKS' }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ error: 'EMAIL_NOT_CONFIGURED' }, { status: 503 });
  }

  // @ts-ignore - nodemailer ships no bundled types; build tolerates this
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
  const fromAddr = process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  // Resolve file name + owner email once per distinct id (small caches).
  const fileNameCache = new Map<string, string>();
  const ownerEmailCache = new Map<string, string | null>();
  const fileName = async (id: string) => {
    if (fileNameCache.has(id)) return fileNameCache.get(id)!;
    const { data } = await supabase.from('files').select('name').eq('id', id).maybeSingle();
    const n = (data?.name as string) || 'a document';
    fileNameCache.set(id, n);
    return n;
  };
  const ownerEmail = async (id: string | null) => {
    if (!id) return null;
    if (ownerEmailCache.has(id)) return ownerEmailCache.get(id)!;
    const { data } = await supabase.from('profiles').select('email').eq('id', id).maybeSingle();
    const e = (data?.email as string) ?? null;
    ownerEmailCache.set(id, e);
    return e;
  };

  let sent = 0;
  let failed = 0;
  const sentIds: string[] = [];

  for (const link of links) {
    try {
      const fname = await fileName(link.file_id as string);
      const replyTo = await ownerEmail(link.created_by as string | null);
      const url = `${appUrl}/shared/${link.token}`;
      const msg = (link.sent_message as string | null) || '';
      const msgHtml = msg ? `<p style="white-space:pre-line">${esc(msg)}</p>` : '';

      await transporter.sendMail({
        from: fromAddr,
        to: link.recipient_email as string,
        replyTo: replyTo || undefined,
        subject: `A document was shared with you: ${fname}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
            <h2 style="font-weight:600">You have a document to view</h2>
            ${msgHtml}
            <p style="margin:28px 0">
              <a href="${url}" style="background:#4285F4;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">View ${esc(fname)}</a>
            </p>
            <p style="color:#6b6b8a;font-size:13px">Or open this link: <a href="${url}">${url}</a></p>
            <p style="color:#6b6b8a;font-size:12px;margin-top:24px">Sent securely via VentureThrust.</p>
          </div>`,
      });
      sent++;
      sentIds.push(link.id as string);
    } catch (e) {
      console.warn('[share-links/send] send failed:', e);
      failed++;
    }
  }

  if (sentIds.length) {
    await supabase
      .from('share_links')
      .update({ sent_at: new Date().toISOString() })
      .in('id', sentIds);
  }

  return NextResponse.json({ ok: true, sent, failed });
}
