/**
 * POST /api/deal-watch/open
 *
 * The account manager opens a watched founder's file. Returns a short-lived
 * signed URL AND logs the visit on the file attributed to the INVESTOR's
 * email (the manager acts as the investor's delegate, so the founder's
 * analytics show the investor, not the manager).
 *
 * Body: { fileId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import { dwAdmin, dwCaller } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-open:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (caller.email !== DW_MANAGER_EMAIL) {
    return NextResponse.json({ error: 'NOT_MANAGER' }, { status: 403 });
  }

  let body: { fileId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
  const fileId = typeof body.fileId === 'string' ? body.fileId : '';
  if (!fileId) return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 });

  const { data: file } = await dwAdmin
    .from('files')
    .select('id, name, user_id, storage_path, visits')
    .eq('id', fileId)
    .maybeSingle();
  if (!file?.storage_path) {
    return NextResponse.json({ error: 'FILE_NOT_FOUND' }, { status: 404 });
  }

  // The manager may only open files of founders that are actually on an
  // assigned watchlist (the manager rides on the investor's access).
  const { data: watchRow } = await dwAdmin
    .from('dw_watchlist')
    .select('investor_id')
    .eq('founder_id', file.user_id as string)
    .not('manager_id', 'is', null)
    .limit(1)
    .maybeSingle();
  if (!watchRow) {
    return NextResponse.json({ error: 'NOT_WATCHED' }, { status: 403 });
  }

  const { data: investorProfile } = await dwAdmin
    .from('profiles')
    .select('email')
    .eq('id', watchRow.investor_id as string)
    .maybeSingle();
  const investorEmail = (investorProfile?.email as string) ?? 'Investor';

  const { data: signed, error: signErr } = await dwAdmin.storage
    .from('documents')
    .createSignedUrl(file.storage_path as string, 3600);
  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'SIGN_FAILED' }, { status: 500 });
  }

  // Masquerade attribution: the founder sees the investor's email in the
  // file's visit analytics, never the manager's.
  try {
    const visits = Array.isArray(file.visits) ? (file.visits as Array<Record<string, unknown>>) : [];
    const nowIso = new Date().toISOString();
    visits.push({
      id: `visit_${Date.now()}`,
      name: investorEmail.split('@')[0],
      email: investorEmail,
      account: 'Deal Watch',
      isInternal: false,
      openedAt: nowIso,
      time: nowIso,
      link: 'Deal Watch',
      duration: '',
      durationSeconds: 0,
      device: 'Desktop',
      os: 'Unknown',
      location: 'Unknown',
      signed: false,
      viewPercentage: 0,
      pageViews: {},
    });
    await dwAdmin.from('files').update({ visits }).eq('id', fileId);
  } catch (e) {
    console.warn('[deal-watch/open] visit log failed:', e);
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl, name: file.name });
}
