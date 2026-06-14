/**
 * POST /api/spaces/invite
 *
 * An owner invites an existing VentureThrust user to one of their spaces. The
 * invitee gets an in-app notification (the bell) AND the space appears in their
 * "Shared with me" page, flagged unopened until they open it. We reuse the
 * existing `alerts` table (type 'space_shared', with the space_id + a metadata
 * payload) so no new table is needed.
 *
 * This is intentionally lighter than /api/invite/send (workspace collaborator):
 * it shares a single space for viewing, it does not add a workspace member.
 *
 * If the email has no VentureThrust account we DO NOT email a stranger; we tell
 * the owner so they can share the link by email themselves.
 *
 * Body: { spaceId: string, email: string, token?: string }
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok: true, hasAccount: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { resolveUserByEmail } from '@/lib/resolve-user';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`spaces-invite:${clientIp(req)}`, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user: owner } } = await authed.auth.getUser();
  if (!owner) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let spaceId = '', email = '', token = '';
  try {
    const body = await req.json();
    spaceId = String(body.spaceId ?? '').trim();
    email = String(body.email ?? '').trim().toLowerCase();
    token = String(body.token ?? '').trim();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  if (!spaceId) return NextResponse.json({ ok: false, error: 'missing_space' }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  if (email === (owner.email ?? '').toLowerCase()) {
    return NextResponse.json({ ok: false, error: 'cannot_invite_self' }, { status: 400 });
  }

  // The caller must own the space.
  const { data: space } = await admin
    .from('spaces')
    .select('id, name, title, created_by')
    .eq('id', spaceId)
    .maybeSingle();
  if (!space) return NextResponse.json({ ok: false, error: 'space_not_found' }, { status: 404 });
  if ((space.created_by as string) !== owner.id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const spaceName = (space.name as string) || (space.title as string) || 'a data room';

  // The invite feature is only for existing VentureThrust users.
  const invitee = await resolveUserByEmail(email);
  if (!invitee) return NextResponse.json({ ok: true, hasAccount: false });
  if (invitee.id === owner.id) {
    return NextResponse.json({ ok: false, error: 'cannot_invite_self' }, { status: 400 });
  }

  // A token to open with: prefer the one the dialog passed, else the latest
  // active link for the space.
  let openToken = token;
  if (!openToken) {
    const { data: link } = await admin
      .from('share_links')
      .select('token')
      .eq('space_id', spaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    openToken = (link?.token as string) ?? '';
  }

  // Owner display name (best-effort).
  let ownerName = owner.email ?? 'A VentureThrust user';
  const metaName = (owner.user_metadata as Record<string, unknown> | undefined)?.full_name;
  if (typeof metaName === 'string' && metaName.trim()) ownerName = metaName.trim();

  // Safe columns first; metadata is added on top but is OPTIONAL - some installs
  // have no `metadata` column on alerts. shared-with-me resolves the open token
  // and owner email on its own, so a missing metadata column must not break the
  // share. (The previous version never checked the insert error, so a failed
  // write silently reported success - that is fixed below.)
  const baseAlert = {
    user_id: invitee.id,
    space_id: spaceId,
    type: 'space_shared',
    message: `${ownerName} shared the data room "${spaceName}" with you.`,
  };
  const withMeta = {
    ...baseAlert,
    metadata: { token: openToken, space_name: spaceName, owner_email: owner.email ?? null, owner_name: ownerName },
  };

  // Refresh an existing unopened invite for this space, else insert a new one.
  let targetId: string | null = null;
  try {
    const { data: existing } = await admin
      .from('alerts')
      .select('id')
      .eq('user_id', invitee.id)
      .eq('space_id', spaceId)
      .eq('type', 'space_shared')
      .is('read_at', null)
      .limit(1)
      .maybeSingle();
    targetId = (existing?.id as string) ?? null;
  } catch { /* non-fatal - fall through to insert */ }

  const isMissingColumn = (e: { message?: string; code?: string } | null) =>
    !!e && (e.code === 'PGRST204' || e.code === '42703' ||
      (e.message ?? '').toLowerCase().includes('metadata') ||
      (e.message ?? '').toLowerCase().includes('column'));

  const write = (payload: Record<string, unknown>) =>
    targetId
      ? admin.from('alerts').update(payload).eq('id', targetId)
      : admin.from('alerts').insert(payload);

  let { error: writeErr } = await write(withMeta);
  if (isMissingColumn(writeErr)) {
    ({ error: writeErr } = await write(baseAlert)); // retry without metadata
  }
  if (writeErr) {
    console.error('[spaces/invite] alert write failed:', writeErr);
    return NextResponse.json({ ok: false, error: 'save_failed', detail: writeErr.message }, { status: 500 });
  }

  // Email the invitee (best-effort, never blocks the in-app share).
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
  try {
    await sendShareEmail({ to: email, ownerName, spaceName, appUrl, token: openToken });
  } catch (err) {
    console.warn('[spaces/invite] email failed (non-blocking):', err);
  }

  return NextResponse.json({ ok: true, hasAccount: true });
}

async function sendShareEmail(opts: {
  to: string;
  ownerName: string;
  spaceName: string;
  appUrl: string;
  token: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[spaces/invite] SMTP not configured - skipping email.');
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

  const href = opts.token ? `${opts.appUrl}/shared/${opts.token}` : `${opts.appUrl}/dashboard/shared-with-me`;

  await transporter.sendMail({
    from: fromAddr,
    to: opts.to,
    subject: `${opts.ownerName} shared a data room with you on VentureThrust`,
    html: `
      <div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-weight:600;font-size:22px;margin:0 0 4px">A data room was shared with you</h2>
        <p style="color:#6b6b8a;margin:0 0 20px">on VentureThrust</p>
        <p style="line-height:1.6">
          <strong>${esc(opts.ownerName)}</strong> shared the data room
          <strong>"${esc(opts.spaceName)}"</strong> with you. It is now in your
          "Shared with me" page, and you can open it any time.
        </p>
        <p style="margin:28px 0">
          <a href="${href}"
             style="background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">
            Open the data room
          </a>
        </p>
        <p style="color:#9a9ab0;font-size:12px;margin-top:24px">
          If you weren't expecting this, you can safely ignore this email.
        </p>
      </div>`,
  });
}
