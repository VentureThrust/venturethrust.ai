/**
 * /api/share-links/validate
 *
 * Server-side gate validator for /shared/[token] visitors.
 *
 * Accepts a partial { link_id, email?, password? } payload and tells the
 * client which gate to render next, or that all gates have passed.
 *
 * Why server-side? Several gate decisions depend on data we never want
 * to ship to the browser:
 *   - password_hash (bcrypt comparison must run server-side)
 *   - allow_block_emails (the deny list itself is sensitive)
 *   - expires_at / is_active (must be the server's clock, not the user's)
 *
 * The client just renders the form for whichever gate the server says is
 * next. If the user tampers with the JS, they still hit this endpoint on
 * submit and get rejected.
 *
 * Rate-limited to 20 requests / IP / minute to slow down passcode guessing.
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { getSpaceOwner, isOwnerPlanActive } from '@/lib/owner-plan';
import { recordExpiredAttempt } from '@/lib/expired-attempts';
import { notifyLinkOpen } from '@/lib/link-open-notify';
import { buildSharedFile } from '@/lib/shared-file';

// Service-role client - we deliberately bypass RLS here because the visitor
// is anonymous and needs to read a single share_links row by id. RLS would
// otherwise block all anonymous reads.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function emailMatchesList(email: string, list: string[] | null | undefined): boolean {
  if (!list || list.length === 0) return false;
  const e = email.trim().toLowerCase();
  return list.some((item) => {
    const i = item.trim().toLowerCase();
    return i === e || (i.startsWith('@') && e.endsWith(i));
  });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = consumeRateLimit(`share-validate:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  let body: { link_id?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const { link_id, email, password } = body;
  if (!link_id || typeof link_id !== 'string') {
    return NextResponse.json({ error: 'LINK_REQUIRED' }, { status: 400 });
  }

  const { data: link } = await supabase
    .from('share_links')
    .select('*')
    .eq('id', link_id)
    .eq('is_active', true)
    .single();

  if (!link) {
    return NextResponse.json({ error: 'INVALID_LINK' }, { status: 403 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'EXPIRED' }, { status: 403 });
  }

  // The file row is fetched alongside the owner-plan check rather than after
  // it. Nothing from it is returned unless every gate below passes, and
  // overlapping the two round trips is worth ~300ms on a cold link.
  const filePromise = link.file_id
    ? supabase
        .from('files')
        .select('id, name, type, storage_path, agreement_fields')
        .eq('id', link.file_id)
        .maybeSingle()
    : null;

  // Owner-plan gate: a lapsed workspace owner's links stop working entirely.
  // Record the attempt and (throttled) nudge the owner to renew.
  const ownerId = await getSpaceOwner(supabase, link.space_id);
  if (!(await isOwnerPlanActive(supabase, ownerId))) {
    await recordExpiredAttempt(supabase, { ownerId, spaceId: link.space_id, visitorEmail: email ?? null });
    return NextResponse.json({ error: 'OWNER_INACTIVE' }, { status: 403 });
  }

  // ── Email gate ────────────────────────────────────────────────────────
  if (link.email_required && !email) {
    return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 403 });
  }

  // ── Allow/block list - server-side (deny list never reaches the client) ─
  if (email && link.allow_block_type && Array.isArray(link.allow_block_emails) && link.allow_block_emails.length > 0) {
    const matches = emailMatchesList(email, link.allow_block_emails);
    if (link.allow_block_type === 'block' && matches) {
      return NextResponse.json({ error: 'BLOCKED' }, { status: 403 });
    }
    if (link.allow_block_type === 'allow' && !matches) {
      return NextResponse.json({ error: 'BLOCKED' }, { status: 403 });
    }
  }

  // ── Password gate ──────────────────────────────────────────────────────
  if (link.password_hash) {
    if (!password) {
      return NextResponse.json({ error: 'PASSWORD_REQUIRED' }, { status: 403 });
    }
    const ok = await bcrypt.compare(password, link.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 403 });
    }
  }

  // ── All checks for email + password passed ─────────────────────────────
  // For a FILE-scoped link, return the file + a short-lived signed URL so the
  // client can render just that document. This is only reached AFTER email /
  // password / allow-block / expiry / owner-plan all passed above, so the URL
  // never reaches an unauthorized visitor. NDA / signature stay client-side
  // gates (acceptance + name capture), matching the space flow.
  // For send-by-email recipient links the viewer never types an email, so fall
  // back to the recipient address we already know it was sent to.
  const viewerEmail = email || (link.recipient_email as string | null) || null;
  const file = await buildSharedFile(
    supabase,
    link as Record<string, unknown>,
    viewerEmail,
    filePromise,
  );

  // Everything below is bookkeeping: counters, alerts, the "someone opened your
  // link" email. None of it is needed to render the document, and the SMTP
  // handshake alone was adding well over a second to a page a stranger is
  // waiting on. after() runs it once the response has already gone out.
  after(async () => {
    try {
      // Send-by-email recipient links: attribute this open to the known
      // recipient, bump the counters, and on the FIRST open log a visit and
      // alert the owner.
      if (link.recipient_email && link.file_id) {
        await recordRecipientOpen(link as Record<string, unknown>);
      }

      if (link.notify_email || link.link_name) {
        if (!(link.recipient_email && link.file_id)) {
          const nowIso = new Date().toISOString();
          await supabase
            .from('share_links')
            .update({
              open_count: (Number(link.open_count) || 0) + 1,
              last_opened_at: nowIso,
              opened_at: (link.opened_at as string | null) ?? nowIso,
            })
            .eq('id', link.id);
        }
        await notifyLinkOpen(supabase, {
          req,
          link: link as Record<string, unknown>,
          visitorEmail: email || (link.recipient_email as string | null) || null,
          documentName: file?.name ?? null,
        });
      }
    } catch (e) {
      console.warn('[validate] post-response bookkeeping failed:', e);
    }
  });

  return NextResponse.json({
    status: 'OK',
    space_id: link.space_id,
    file,
    require_nda: !!link.require_nda,
    require_signature: !!link.require_signature,
  });
}

// ── Send-by-email open tracking ──────────────────────────────────────────────
// Recipient links (created by /api/share-links/send) carry recipient_email and
// have the email gate off. We still want per-recipient attribution, so on every
// open we bump open_count, and on the FIRST open we append a visit (so it shows
// in the owner's "All visits") and fire an "X opened your document" alert.
async function recordRecipientOpen(link: Record<string, unknown>) {
  try {
    const nowIso = new Date().toISOString();
    const firstOpen = !link.opened_at;

    await supabase
      .from('share_links')
      .update({
        open_count: (Number(link.open_count) || 0) + 1,
        last_opened_at: nowIso,
        opened_at: (link.opened_at as string | null) ?? nowIso,
      })
      .eq('id', link.id as string);

    if (!firstOpen) return;

    const { data: f } = await supabase
      .from('files')
      .select('name, visits, user_id')
      .eq('id', link.file_id as string)
      .maybeSingle();
    if (!f) return;

    const recipient = (link.recipient_email as string) || 'Recipient';
    // NOTE: the visit entry itself is written by /api/track/file-open (real
    // duration, device, per-page dwell). Appending a zero placeholder here
    // produced duplicate "00:00 / no device" rows in the owner's activity.

    if (f.user_id) {
      try {
        await supabase.from('alerts').insert({
          user_id: f.user_id,
          space_id: null,
          type: 'deck_opened',
          message: `${recipient} opened your document "${(f.name as string) ?? 'document'}".`,
        });
      } catch {
        /* alerts table is optional - never block the open */
      }
    }
  } catch (e) {
    console.warn('[validate] recordRecipientOpen failed:', e);
  }
}
