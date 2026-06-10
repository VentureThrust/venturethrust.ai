/**
 * POST /api/support/escalate
 *
 * Hands a chat off to a human. Creates a support_conversations row, seeds it
 * with the chat transcript plus a short issue summary, marks it awaiting_human,
 * and notifies the owner (in-app alert per admin + a Zoho email). Returns the
 * conversation id so the widget can switch to live mode.
 *
 * Auth: Authorization: Bearer <supabase access token>.
 * Body: { summary?: string, transcript?: { role: 'user' | 'assistant'; content: string }[] }
 * Returns: { ok: true, conversationId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type InMsg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`support-escalate:${clientIp(req)}`, 6, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let payload: { summary?: unknown; transcript?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const summary = (typeof payload.summary === 'string' ? payload.summary : '').trim().slice(0, 500);
  const rawT = Array.isArray(payload.transcript) ? payload.transcript.slice(-30) : [];
  const transcript: InMsg[] = [];
  for (const m of rawT) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      transcript.push({ role, content: content.slice(0, 4000) });
    }
  }

  const email = user.email ?? '';
  const lastUser = transcript.filter((m) => m.role === 'user').slice(-1)[0]?.content?.slice(0, 200);
  const firstLine = summary || lastUser || 'Support request';

  const { data: conv, error: convErr } = await admin
    .from('support_conversations')
    .insert({ user_id: user.id, user_email: email || null, status: 'awaiting_human', summary: firstLine })
    .select('id')
    .single();
  if (convErr || !conv) {
    console.warn('[support/escalate] conversation insert failed:', convErr?.message);
    return NextResponse.json({ ok: false, error: 'not_ready' }, { status: 500 });
  }
  const conversationId = conv.id as string;

  // Seed the conversation with the issue summary + the AI transcript.
  const rows: Record<string, unknown>[] = [];
  if (summary) rows.push({ conversation_id: conversationId, sender: 'system', body: `Issue summary: ${summary}` });
  for (const m of transcript) {
    rows.push({ conversation_id: conversationId, sender: m.role === 'assistant' ? 'ai' : 'user', body: m.content });
  }
  if (rows.length) {
    const { error: msgErr } = await admin.from('support_messages').insert(rows);
    if (msgErr) console.warn('[support/escalate] transcript insert failed:', msgErr.message);
  }

  // Notify the owner(s): in-app bell alert + email.
  try {
    const { data: admins } = await admin.from('profiles').select('id').eq('is_admin', true);
    const alertRows = (admins ?? []).map((a) => ({
      user_id: (a as { id: string }).id,
      type: 'support_chat',
      message: `New support chat from ${email || 'a user'}: ${firstLine}`,
    }));
    if (alertRows.length) await admin.from('alerts').insert(alertRows);
  } catch (e) {
    console.warn('[support/escalate] alert insert skipped:', e);
  }

  try {
    await notifyOwnerEmail({ email, summary: firstLine });
  } catch (e) {
    console.warn('[support/escalate] email failed:', e);
  }

  return NextResponse.json({ ok: true, conversationId });
}

async function notifyOwnerEmail(opts: { email: string; summary: string }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) return;

  // @ts-ignore - nodemailer ships no bundled types
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
  const fromAddr = process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`;
  const notifyTo = process.env.SUPPORT_NOTIFY_EMAIL || smtpUser;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '') || 'https://www.venturethrust.com';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  await transporter.sendMail({
    from: fromAddr,
    to: notifyTo,
    replyTo: opts.email || undefined,
    subject: `Live support chat waiting: ${opts.summary}`.slice(0, 120),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-size:20px;margin:0 0 12px">A user wants to talk to you</h2>
        <p style="font-size:14px">From <strong>${esc(opts.email || 'a user')}</strong></p>
        <blockquote style="margin:10px 0;padding:12px 16px;background:#f4f4f7;border-left:3px solid #6366f1;border-radius:6px;line-height:1.6">${esc(opts.summary)}</blockquote>
        <p style="font-size:14px"><a href="${appUrl}/dashboard/support">Open the Support Inbox</a> to reply live.</p>
      </div>`,
  });
}
