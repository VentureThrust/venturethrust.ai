/**
 * POST /api/invite-founder
 *
 * An investor (logged in) requests a founder to share their data room.
 *   - If the founder's email HAS a VentureThrust account → create an in-app
 *     alert (notification bell) AND email them.
 *   - If not → just email them (an invitation to share / sign up).
 *
 * Body: { email: string, message?: string }
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok, hasAccount }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`invite-founder:${clientIp(req)}`, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user: inviter } } = await authed.auth.getUser();
    if (!inviter) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    let email = '';
    let message = '';
    try {
      const body = await req.json();
      email = String(body.email ?? '').trim().toLowerCase();
      message = String(body.message ?? '').trim().slice(0, 1000);
    } catch {
      return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || email.length > 320) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
    }
    if (email === (inviter.email ?? '').toLowerCase()) {
      return NextResponse.json({ ok: false, error: 'cannot_invite_self' }, { status: 400 });
    }

    // Inviter display name (best-effort).
    let inviterName = inviter.email ?? 'A VentureThrust investor';
    const metaName = (inviter.user_metadata as Record<string, unknown> | undefined)?.full_name;
    if (typeof metaName === 'string' && metaName.trim()) inviterName = metaName.trim();

    // Does the founder already have a VentureThrust account?
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
    const founder = list.users.find((u) => u.email?.toLowerCase() === email);
    const hasAccount = !!founder;

    // In-app notification for existing accounts.
    if (hasAccount && founder) {
      try {
        await admin.from('alerts').insert({
          user_id: founder.id,
          space_id: null,
          type: 'data_room_request',
          message: message
            ? `${inviterName} is requesting access to your data room: "${message}"`
            : `${inviterName} is requesting access to your data room.`,
        });
      } catch (err) {
        console.warn('[invite-founder] alert insert failed (non-blocking):', err);
      }
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
    try {
      await sendFounderEmail({
        to: email,
        inviterName,
        inviterEmail: inviter.email ?? '',
        message,
        hasAccount,
        appUrl,
      });
    } catch (err) {
      console.warn('[invite-founder] email failed (non-blocking):', err);
    }

    return NextResponse.json({ ok: true, hasAccount });
  } catch (err) {
    console.error('[invite-founder] unhandled error:', err);
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}

async function sendFounderEmail(opts: {
  to: string;
  inviterName: string;
  inviterEmail: string;
  message: string;
  hasAccount: boolean;
  appUrl: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[invite-founder] SMTP not configured - skipping email.');
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
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const cta = opts.hasAccount
    ? { href: `${opts.appUrl}/login`, label: 'Log in to respond' }
    : { href: `${opts.appUrl}/signup?email=${encodeURIComponent(opts.to)}`, label: 'Create your data room' };

  await transporter.sendMail({
    from: fromAddr,
    to: opts.to,
    replyTo: opts.inviterEmail || undefined,
    subject: `${opts.inviterName} is requesting your data room on VentureThrust`,
    html: `
      <div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-weight:600;font-size:22px;margin:0 0 4px">A request for your data room</h2>
        <p style="color:#6b6b8a;margin:0 0 20px">on VentureThrust</p>
        <p style="line-height:1.6">
          <strong>${esc(opts.inviterName)}</strong>${opts.inviterEmail ? ` (${esc(opts.inviterEmail)})` : ''}
          is requesting access to your data room.
        </p>
        ${opts.message ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#f4f4f7;border-left:3px solid #6366f1;border-radius:6px;line-height:1.6">${esc(opts.message)}</blockquote>` : ''}
        <p style="margin:28px 0">
          <a href="${cta.href}"
             style="background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">
            ${cta.label}
          </a>
        </p>
        <p style="color:#6b6b8a;font-size:13px;line-height:1.6">
          ${opts.hasAccount
            ? 'You can also reply directly to this email to reach the investor.'
            : 'VentureThrust lets you securely share a data room, track every view, and run AI due diligence. Reply to this email to reach the investor directly.'}
        </p>
        <p style="color:#9a9ab0;font-size:12px;margin-top:24px">
          If you weren't expecting this, you can safely ignore this email.
        </p>
      </div>`,
  });
}
