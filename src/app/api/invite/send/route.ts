/**
 * POST /api/invite/send
 *
 * Invites someone to join the caller's workspace as a collaborator.
 *   1. Verifies the inviter from their bearer access token.
 *   2. Generates a Supabase magic link (creates the invitee's auth user if new)
 *      that redirects to /invite/accept/[token] after sign-in.
 *   3. Records a pending row in space_invitations.
 *   4. Emails a VentureThrust-branded invite containing that magic link.
 *
 * Body: { email: string, role?: 'editor' | 'viewer' }
 * Header: Authorization: Bearer <supabase access token>
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

function genToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`invite-send:${clientIp(req)}`, 20, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  // Everything is wrapped so we ALWAYS return JSON - never a bare 500 text body
  // (which would make the client's res.json() throw "Unexpected token ...").
  try {
    // ── Identify the inviter from their access token ──
    const authHeader = req.headers.get('authorization') ?? '';
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user: inviter } } = await authed.auth.getUser();
    if (!inviter) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role === 'viewer' ? 'viewer' : 'editor';
    const resend = body.resend === true;
    if (!EMAIL_RE.test(email) || email.length > 320) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
    }
    if (email === (inviter.email ?? '').toLowerCase()) {
      return NextResponse.json({ ok: false, error: 'cannot_invite_self' }, { status: 400 });
    }

    // ── Already a member? (accepted) → nothing to do. ──
    const { data: existingMember } = await admin
      .from('workspace_members')
      .select('id')
      .eq('workspace_owner_id', inviter.id)
      .eq('member_email', email)
      .limit(1)
      .maybeSingle();
    if (existingMember) {
      return NextResponse.json({ ok: false, code: 'already_member' });
    }

    // ── Already invited (pending)? → ask the client whether to resend. ──
    const { data: existingInvite } = await admin
      .from('space_invitations')
      .select('id, token')
      .eq('workspace_owner_id', inviter.id)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingInvite && !resend) {
      // 200 so the client parses it cleanly and shows the resend dialog.
      return NextResponse.json({ ok: false, code: 'already_invited' });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
    // Reuse the existing token on resend so the accept link stays consistent.
    const token = existingInvite?.token ?? genToken();
    const redirectTo = `${appUrl}/invite/accept/${token}`;

    // ── Magic link: 'invite' creates a brand-new user; existing users fall
    //    back to 'magiclink'. Either way we get an action_link that signs them
    //    in and lands on our accept page. generateLink can throw → the outer
    //    try/catch keeps the response JSON. ──
    let actionLink = '';
    const inviteRes = await admin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } });
    if (inviteRes.data?.properties?.action_link) {
      actionLink = inviteRes.data.properties.action_link;
    } else {
      const mlRes = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } });
      if (mlRes.data?.properties?.action_link) {
        actionLink = mlRes.data.properties.action_link;
      } else {
        console.error('[invite-send] generateLink failed:', inviteRes.error?.message, mlRes.error?.message);
        return NextResponse.json({ ok: false, error: 'link_failed' }, { status: 500 });
      }
    }

    // Inviter display name (best-effort).
    let inviterName = inviter.email ?? 'A VentureThrust user';
    const metaName = (inviter.user_metadata as Record<string, unknown> | undefined)?.full_name;
    if (typeof metaName === 'string' && metaName.trim()) inviterName = metaName.trim();

    // ── Record (or refresh) the invitation ──
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (existingInvite) {
      await admin
        .from('space_invitations')
        .update({ role, status: 'pending', expires_at: expiresAt })
        .eq('id', existingInvite.id);
    } else {
      const { error: insErr } = await admin.from('space_invitations').insert({
        token,
        workspace_owner_id: inviter.id,
        invited_email: email,
        invited_by_email: inviter.email ?? null,
        role,
        status: 'pending',
        expires_at: expiresAt,
      });
      if (insErr) {
        console.error('[invite-send] insert failed:', insErr);
        return NextResponse.json({ ok: false, error: 'db_failed', detail: insErr.message }, { status: 500 });
      }
    }

    // ── Send the branded email (best-effort - the row already exists) ──
    try {
      await sendInviteEmail({ to: email, inviterName, actionLink });
    } catch (err) {
      console.warn('[invite-send] email failed (non-blocking):', err);
    }

    return NextResponse.json({ ok: true, email, role, resent: !!existingInvite });
  } catch (err) {
    console.error('[invite-send] unhandled error:', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

async function sendInviteEmail(opts: { to: string; inviterName: string; actionLink: string }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[invite-send] SMTP not configured - skipping email.');
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

  await transporter.sendMail({
    from: fromAddr,
    to: opts.to,
    subject: `${opts.inviterName} invited you to VentureThrust`,
    html: `
      <div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-weight:600;font-size:22px;margin:0 0 4px">Join VentureThrust</h2>
        <p style="color:#6b6b8a;margin:0 0 24px">Welcome,</p>
        <p style="line-height:1.6">
          <strong>${esc(opts.inviterName)}</strong> has invited you to collaborate on their
          workspace on <strong>VentureThrust</strong>. Get started by clicking the button below -
          no password needed.
        </p>
        <p style="margin:28px 0">
          <a href="${opts.actionLink}"
             style="background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">
            Accept invitation
          </a>
        </p>
        <p style="color:#6b6b8a;font-size:13px;line-height:1.6">
          VentureThrust is the clear path to smarter startup investing - securely share, track,
          and run due diligence on your documents.
        </p>
        <p style="color:#9a9ab0;font-size:12px;margin-top:24px">
          If you weren't expecting this invitation, you can safely ignore this email.
        </p>
      </div>`,
  });
}
