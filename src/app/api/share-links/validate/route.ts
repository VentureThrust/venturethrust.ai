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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

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
  // The client still needs to advance through NDA / signature gates, but
  // those are tracked client-side (acceptance + name capture only) so the
  // server doesn't gate on them here. We return the space_id so the client
  // can redirect after the remaining gates clear.
  return NextResponse.json({
    status: 'OK',
    space_id: link.space_id,
    require_nda: !!link.require_nda,
    require_signature: !!link.require_signature,
  });
}
