/**
 * POST /api/share-links/contact-owner
 *
 * Visitor-facing actions for an INACTIVE share link (disabled, date-expired, or
 * the owner's plan lapsed). We never tell the visitor the reason. Actions:
 *   - 'visit'      : record the visitor's email (tracking) + throttled nudge.
 *   - 'reactivate' : email the owner that this visitor wants the link back.
 *   - 'message'    : email the owner a message from the visitor.
 *
 * Resolves the owner via the link's space (service role, works even when the
 * link is disabled). Always returns ok:true on valid input, even if the owner
 * email can't be sent, so the visitor never sees infrastructure errors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { getSpaceOwner } from '@/lib/owner-plan';
import { recordExpiredAttempt, storeExpiredAttempt } from '@/lib/expired-attempts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const ACTIONS = new Set(['visit', 'reactivate', 'message']);
const MAX = { name: 120, email: 320, message: 5000 };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`contact-owner:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  let body: { token?: string; action?: string; email?: string; name?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const token = String(body.token ?? '').trim();
  const action = String(body.action ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!token || !ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > MAX.email) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  if (name.length > MAX.name || /[\r\n]/.test(name) || /[\r\n]/.test(email)) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  if (action === 'message' && (message.length < 1 || message.length > MAX.message)) {
    return NextResponse.json({ ok: false, error: 'bad_message' }, { status: 400 });
  }

  const { data: link } = await admin
    .from('share_links')
    .select('id, space_id')
    .eq('token', token)
    .maybeSingle();
  if (!link) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  const spaceId = (link as { space_id?: string | null }).space_id ?? null;
  const ownerId = await getSpaceOwner(admin, spaceId);

  // 'visit': just track (store + throttled generic nudge).
  if (action === 'visit') {
    await recordExpiredAttempt(admin, { ownerId, spaceId, visitorEmail: email });
    return NextResponse.json({ ok: true });
  }

  // reactivate / message: store the lead, then email the owner immediately.
  await storeExpiredAttempt(admin, { ownerId, spaceId, visitorEmail: email });

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!ownerId || !smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ ok: true, sent: false });
  }

  let to: string | undefined;
  try {
    const { data: u } = await admin.auth.admin.getUserById(ownerId);
    to = u?.user?.email ?? undefined;
  } catch {
    /* ignore */
  }
  if (!to) return NextResponse.json({ ok: true, sent: false });

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

    let subject: string;
    let html: string;
    let text: string;
    if (action === 'reactivate') {
      subject = 'A visitor is asking you to reactivate your link';
      html = `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:560px; margin:0 auto; padding:24px; color:#0d0d1a; line-height:1.55;">
        <h1 style="font-size:20px; margin:0 0 8px;">Someone wants access to your link</h1>
        <p style="margin:0 0 16px; color:#555;"><strong>${esc(email)}</strong> tried to open one of your shared links, but it is currently inactive. They are asking you to reactivate it.</p>
        <a href="${appUrl}/dashboard/billing" style="display:inline-block; background:#4285F4; color:#fff; text-decoration:none; padding:12px 22px; border-radius:10px; font-size:15px; font-weight:600;">Reactivate my link</a>
        <p style="margin:16px 0 0; color:#888; font-size:13px;">Reply to this email to reach ${esc(email)} directly.</p>
      </div>`;
      text = `Someone wants access to your link\n\n${email} tried to open one of your shared links, but it is currently inactive. They are asking you to reactivate it.\n\nReactivate: ${appUrl}/dashboard/billing\n\nReply to this email to reach them.`;
    } else {
      subject = 'New message about your shared link';
      html = `<div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:560px; margin:0 auto; padding:24px; color:#0d0d1a; line-height:1.55;">
        <h1 style="font-size:20px; margin:0 0 8px;">New message about your shared link</h1>
        <p style="margin:0 0 4px; color:#888; font-size:13px;">From ${esc(name || 'a visitor')} (${esc(email)})</p>
        <div style="margin:12px 0; padding:16px; background:#f5f5f7; border-radius:12px; white-space:pre-line; font-size:14px;">${esc(message)}</div>
        <a href="${appUrl}/dashboard/billing" style="display:inline-block; background:#4285F4; color:#fff; text-decoration:none; padding:12px 22px; border-radius:10px; font-size:15px; font-weight:600;">Reactivate my link</a>
        <p style="margin:16px 0 0; color:#888; font-size:13px;">Reply to this email to respond to ${esc(email)}.</p>
      </div>`;
      text = `New message about your shared link\n\nFrom ${name || 'a visitor'} (${email}):\n\n${message}\n\nReactivate: ${appUrl}/dashboard/billing\n\nReply to this email to respond.`;
    }

    await transporter.sendMail({ from: fromAddr, to, replyTo: email, subject, text, html });
    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    console.error('[contact-owner] send failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: true, sent: false });
  }
}
