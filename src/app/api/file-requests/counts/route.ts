/**
 * POST /api/file-requests/counts
 *
 * Returns per-request upload counts for a set of file-request tokens:
 *   { ok: true, counts: { "<token>": { files: N, uploaders: M } } }
 *
 * `files`     = total rows in file_request_uploads for that request.
 * `uploaders` = distinct uploader emails for that request.
 *
 * Uses the service-role key so it works regardless of whether the owner has a
 * SELECT RLS policy on file_request_uploads (anonymous uploaders write to it
 * via the public /request/[token] page; the owner just needs to read counts).
 * Tokens are 20-char random and not sensitive, so accepting them directly
 * (rather than resolving the session) keeps this simple and reliable.
 *
 * Body: { tokens: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`fr-counts:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  let body: { tokens?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const tokens = Array.isArray(body.tokens)
    ? body.tokens.filter((t): t is string => typeof t === 'string').slice(0, 200)
    : [];
  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, counts: {} });
  }

  // Resolve tokens → request ids.
  const { data: reqs, error: reqErr } = await supabase
    .from('file_requests')
    .select('id, token')
    .in('token', tokens);
  if (reqErr || !reqs) {
    return NextResponse.json({ ok: true, counts: {} });
  }

  const counts: Record<string, { files: number; uploaders: number }> = {};
  const idToToken = new Map<string, string>();
  for (const r of reqs) {
    idToToken.set(r.id as string, r.token as string);
    counts[r.token as string] = { files: 0, uploaders: 0 };
  }

  const ids = reqs.map((r) => r.id as string);
  if (ids.length > 0) {
    // NOTE: the upload page writes `file_request_id` (not `request_id`).
    const { data: ups } = await supabase
      .from('file_request_uploads')
      .select('file_request_id, uploader_email')
      .in('file_request_id', ids);

    const emailsByToken = new Map<string, Set<string>>();
    for (const u of ups ?? []) {
      const token = idToToken.get(u.file_request_id as string);
      if (!token) continue;
      counts[token].files += 1;
      let set = emailsByToken.get(token);
      if (!set) { set = new Set(); emailsByToken.set(token, set); }
      const email = String((u.uploader_email as string) ?? '').toLowerCase().trim();
      if (email) set.add(email);
    }
    for (const [token, set] of emailsByToken) {
      counts[token].uploaders = set.size;
    }
  }

  return NextResponse.json({ ok: true, counts });
}
