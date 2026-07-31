/**
 * GET /api/deal-watch/report?id=<dw_reports.id>
 *
 * Returns a short lived signed URL for one Deal Watch report, and stamps
 * opened_at the first time the investor opens it.
 *
 * Reports live in a private bucket, so the browser cannot sign for itself.
 * This route checks the row belongs to the caller before signing anything.
 *
 * Header: Authorization: Bearer <supabase access token>
 * Returns: { ok: true, url, name }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(`dw-report:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, {
      status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const id = (req.nextUrl.searchParams.get('id') ?? '').trim();
  if (!id) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { data: report } = await admin
    .from('dw_reports')
    .select('id, investor_id, title, storage_path, opened_at')
    .eq('id', id)
    .maybeSingle();

  // Same response whether the row is missing or belongs to someone else, so
  // this cannot be used to probe for other investors' reports.
  if (!report || report.investor_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const { data: signed } = await admin.storage
    .from('vdr-files')
    .createSignedUrl(report.storage_path as string, 3600);
  if (!signed?.signedUrl) {
    return NextResponse.json({ ok: false, error: 'sign_failed' }, { status: 500 });
  }

  if (!report.opened_at) {
    try {
      await admin.from('dw_reports')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', report.id);
    } catch { /* read receipt only */ }
  }

  return NextResponse.json({
    ok: true,
    url: signed.signedUrl,
    name: `${report.title as string}.pdf`,
  });
}
