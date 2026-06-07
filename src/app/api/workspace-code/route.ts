/**
 * POST /api/workspace-code
 *
 * Fallback for an invitee who doesn't know the workspace owner's password (and
 * for the signup "set up my own account" claim): email them a 6-digit login
 * code. We generate the code via an admin magic-link (its `email_otp`), keep the
 * paired `hashed_token` server-side, and email the code ourselves via Zoho SMTP.
 *
 * The code is verified at POST /api/workspace-code/verify, which returns the
 * token_hash for the client to exchange:
 *   supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
 *
 * Body: { email: string }
 * Returns:
 *   { ok: true, ownerId }
 *   { ok: false, reason: 'not_invitee' | 'no_user' | 'bad_request'
 *                       | 'rate_limited' | 'server' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { putLoginCode } from '@/lib/login-codes';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`wscode:${clientIp(req)}`, 6, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  try {
    let email = '';
    try {
      const body = await req.json();
      email = String(body.email ?? '').trim().toLowerCase();
    } catch {
      return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
    }
    if (!email) return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });

    // Confirm this email is a known invitee (member of someone's workspace).
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
    const invitee = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!invitee) return NextResponse.json({ ok: false, reason: 'no_user' });

    const { data: memberships } = await admin
      .from('workspace_members')
      .select('workspace_owner_id')
      .eq('member_user_id', invitee.id);
    const ownerIds = Array.from(
      new Set((memberships ?? [])
        .map((m) => m.workspace_owner_id as string)
        .filter((id) => id && id !== invitee.id)),
    );
    if (ownerIds.length === 0) {
      return NextResponse.json({ ok: false, reason: 'not_invitee' });
    }

    // Generate a magic-link OTP: email_otp (the 6-digit code we email) is paired
    // with hashed_token (used to mint the session after the code is verified).
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    const code = link?.properties?.email_otp;
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !code || !tokenHash) {
      return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
    }

    putLoginCode(email, { code, tokenHash, ownerId: ownerIds[0] });

    // Send the code via Zoho. A missing email = unusable, so surface a server error.
    try {
      await sendCodeEmail({ to: email, code });
    } catch (err) {
      console.error('[workspace-code] email failed:', err);
      return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ownerId: ownerIds[0] });
  } catch (err) {
    console.error('[workspace-code] unhandled error:', err);
    return NextResponse.json({ ok: false, reason: 'server' }, { status: 500 });
  }
}

async function sendCodeEmail(opts: { to: string; code: string }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP not configured');
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

  await transporter.sendMail({
    from: fromAddr,
    to: opts.to,
    subject: `${opts.code} is your VentureThrust login code`,
    html: `
      <div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-weight:600;font-size:22px;margin:0 0 4px">Your login code</h2>
        <p style="color:#6b6b8a;margin:0 0 24px">Use this code to log in to your shared workspace.</p>
        <p style="font-size:34px;font-weight:700;letter-spacing:10px;background:#f4f4f7;border-radius:10px;padding:18px 0;text-align:center;margin:0 0 24px">
          ${opts.code}
        </p>
        <p style="color:#6b6b8a;font-size:13px;line-height:1.6">
          This code expires in 10 minutes. If you didn't try to log in, you can safely ignore this email.
        </p>
        <p style="color:#9a9ab0;font-size:12px;margin-top:24px">VentureThrust</p>
      </div>`,
  });
}
