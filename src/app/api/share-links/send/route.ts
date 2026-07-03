/**
 * POST /api/share-links/send
 *
 * Emails per-recipient "send by email" links (deck files AND spaces). The
 * recipient rows have already been created client-side in share_links
 * (recipient_email set, email gate OFF). This route ONLY sends the emails,
 * taking the destination address from the stored row (never from the request
 * body) so it cannot be used to spam arbitrary addresses.
 *
 * Body: { linkIds: string[] }   (up to 10 per send)
 *
 * The email preserves the FOUNDER's workflow: their name in the sender
 * ("Name via VentureThrust", with Reply-To set to their real address, since
 * DMARC forbids literally sending as another domain), their exact subject
 * line, and a body that is nothing but their message and their link. No
 * VentureThrust template.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Bare mailbox address out of SMTP_FROM ("Name <a@b.c>" or "a@b.c"). */
function bareAddress(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1] : from;
}

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
    ? body.linkIds.filter((x): x is string => typeof x === 'string').slice(0, 10)
    : [];
  if (linkIds.length === 0) {
    return NextResponse.json({ error: 'NO_LINKS' }, { status: 400 });
  }

  // sent_subject is a newer column - fall back without it if missing.
  let rows: Array<Record<string, unknown>> = [];
  const first = await supabase
    .from('share_links')
    .select('id, token, recipient_email, sent_message, sent_subject, file_id, space_id, created_by, is_active')
    .in('id', linkIds);
  if (first.error) {
    const second = await supabase
      .from('share_links')
      .select('id, token, recipient_email, sent_message, file_id, space_id, created_by, is_active')
      .in('id', linkIds);
    rows = (second.data ?? []) as Array<Record<string, unknown>>;
  } else {
    rows = (first.data ?? []) as Array<Record<string, unknown>>;
  }

  const links = (rows ?? []).filter(
    (r) => r.recipient_email && r.is_active !== false && (r.file_id || r.space_id)
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
    pool: true,
    maxConnections: 3,
  });
  const fromMailbox = bareAddress(process.env.SMTP_FROM ?? smtpUser);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  // ── Resolve the SENDER (founder) identity once per distinct sender ───────
  // The investor should see the founder, not VentureThrust: display name in
  // From, and Reply-To pointing at the founder's real address.
  const senderCache = new Map<string, { name: string; email: string | null }>();
  const senderInfo = async (id: string | null) => {
    if (!id) return { name: 'A founder', email: null };
    if (senderCache.has(id)) return senderCache.get(id)!;
    let email: string | null = null;
    let name = '';
    const { data: prof } = await supabase.from('profiles').select('email').eq('id', id).maybeSingle();
    email = (prof?.email as string) ?? null;
    try {
      const { data: au } = await supabase.auth.admin.getUserById(id);
      const meta = (au?.user?.user_metadata ?? {}) as { full_name?: string };
      if (typeof meta.full_name === 'string' && meta.full_name.trim()) name = meta.full_name.trim();
    } catch { /* fall back to email prefix */ }
    if (!name) name = email ? email.split('@')[0] : 'A founder';
    const info = { name, email };
    senderCache.set(id, info);
    return info;
  };

  const fileNameCache = new Map<string, string>();
  const spaceNameCache = new Map<string, string>();
  const fileName = async (id: string) => {
    if (fileNameCache.has(id)) return fileNameCache.get(id)!;
    const { data } = await supabase.from('files').select('name').eq('id', id).maybeSingle();
    const n = (data?.name as string) || 'a document';
    fileNameCache.set(id, n);
    return n;
  };
  const spaceName = async (id: string) => {
    if (spaceNameCache.has(id)) return spaceNameCache.get(id)!;
    const { data } = await supabase.from('spaces').select('name, title').eq('id', id).maybeSingle();
    const n = (data?.name as string) || (data?.title as string) || 'a data room';
    spaceNameCache.set(id, n);
    return n;
  };

  let sent = 0;
  let failed = 0;
  const sentIds: string[] = [];

  const sendOne = async (link: Record<string, unknown>) => {
    try {
      const isFile = !!link.file_id;
      const displayName = isFile
        ? await fileName(link.file_id as string)
        : await spaceName(link.space_id as string);
      const sender = await senderInfo(link.created_by as string | null);
      const url = `${appUrl}/shared/${link.token}`;
      const msg = (link.sent_message as string | null) || '';
      const subject =
        ((link.sent_subject as string | null) || '').trim() ||
        `${sender.name} shared "${displayName}" with you`;

      // Body = the founder's own words + their link. Nothing else.
      const bodyHtml = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;font-size:14px;line-height:1.6">
          ${msg ? `<p style="white-space:pre-line;margin:0 0 16px">${esc(msg)}</p>` : ''}
          <p style="margin:0"><a href="${url}">${esc(displayName)}</a></p>
        </div>`;

      await transporter.sendMail({
        from: { name: `${sender.name} via VentureThrust`, address: fromMailbox },
        to: link.recipient_email as string,
        replyTo: sender.email || undefined,
        subject,
        html: bodyHtml,
        text: `${msg ? msg + '\n\n' : ''}${displayName}: ${url}`,
      });
      sent++;
      sentIds.push(link.id as string);
    } catch (e) {
      console.warn('[share-links/send] send failed:', e);
      failed++;
    }
  };

  for (let i = 0; i < links.length; i += 5) {
    await Promise.all(links.slice(i, i + 5).map(sendOne));
  }

  if (sentIds.length) {
    await supabase
      .from('share_links')
      .update({ sent_at: new Date().toISOString() })
      .in('id', sentIds);
  }

  return NextResponse.json({ ok: true, sent, failed });
}
