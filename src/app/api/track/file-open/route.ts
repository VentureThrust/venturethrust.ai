/**
 * POST /api/track/file-open
 *
 * Session analytics for FILE share links (/shared/{token} rendering a single
 * deck). The space viewer has viewer_sessions + heartbeats; emailed decks had
 * NOTHING - the owner saw "00:00" and "No device details recorded". This
 * route receives cumulative beats from SharedFileView and upserts ONE visit
 * entry (keyed by visitId) in files.visits, the same array the Content
 * Library activity view already renders (duration, device, % viewed, and the
 * per-session Page attention section).
 *
 * Body: {
 *   token:           string   - the share link token (must be active, file-scoped)
 *   visitId:         string   - client-generated id, one per open
 *   email?:          string   - viewer email if known
 *   durationSeconds: number   - cumulative for this session
 *   device?:         string
 *   os?:             string
 *   pageViews?:      Record<pageNumber, seconds> - cumulative snapshot
 *   totalPages?:     number   - for the % viewed figure (PDFs)
 * }
 *
 * Cumulative snapshots + max-merge make beats idempotent: a lost or repeated
 * beat can never shrink or double-count the numbers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const fmt = (secs: number) =>
  `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`file-open:${clientIp(req)}`, 120, 60_000);
  if (!rate.ok) return new NextResponse('Too many requests', { status: 429 });

  let body: {
    token?: string; visitId?: string; email?: string;
    durationSeconds?: number; device?: string; os?: string;
    pageViews?: Record<string, unknown>; totalPages?: number;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const token = (body.token ?? '').trim();
  const visitId = (body.visitId ?? '').trim();
  if (!token || !visitId || visitId.length > 80) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { data: link } = await admin
    .from('share_links')
    .select('id, file_id, is_active, recipient_email, recipient_name, link_name')
    .eq('token', token)
    .maybeSingle();
  if (!link || !link.is_active || !link.file_id) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Sanitize the inputs.
  const durationSeconds = Math.max(0, Math.min(24 * 3600, Math.round(Number(body.durationSeconds) || 0)));
  const device = typeof body.device === 'string' ? body.device.slice(0, 60) : '';
  const os = typeof body.os === 'string' ? body.os.slice(0, 60) : '';
  const totalPages = Math.max(0, Math.min(5000, Math.round(Number(body.totalPages) || 0)));
  const pageViews: Record<string, number> = {};
  if (body.pageViews && typeof body.pageViews === 'object') {
    for (const [k, v] of Object.entries(body.pageViews)) {
      const n = Number(v);
      if (/^\d+$/.test(k) && Number.isFinite(n) && n >= 0) pageViews[k] = Math.min(24 * 3600, Math.round(n));
    }
  }

  // Approximate location from the edge headers (present on Vercel).
  let location = '';
  try {
    const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') ?? '');
    const country = req.headers.get('x-vercel-ip-country') ?? '';
    location = [city, country].filter(Boolean).join(', ');
  } catch { /* header decoding - optional */ }

  const { data: file } = await admin
    .from('files')
    .select('id, visits')
    .eq('id', link.file_id as string)
    .maybeSingle();
  if (!file) return NextResponse.json({ ok: false }, { status: 404 });

  const visits: Array<Record<string, unknown>> = Array.isArray(file.visits)
    ? (file.visits as Array<Record<string, unknown>>)
    : [];

  const pagesSeen = Object.keys(pageViews).length;
  const viewPercentage = totalPages > 0
    ? Math.min(100, Math.round((pagesSeen / totalPages) * 100))
    : 0;

  const idx = visits.findIndex((v) => v.id === visitId);
  if (idx >= 0) {
    const prev = visits[idx];
    const prevPv = (prev.pageViews && typeof prev.pageViews === 'object')
      ? prev.pageViews as Record<string, number> : {};
    const mergedPv: Record<string, number> = { ...prevPv };
    for (const [k, v] of Object.entries(pageViews)) {
      mergedPv[k] = Math.max(Number(prevPv[k]) || 0, v);
    }
    const mergedSecs = Math.max(Number(prev.durationSeconds) || 0, durationSeconds);
    visits[idx] = {
      ...prev,
      durationSeconds: mergedSecs,
      duration: fmt(mergedSecs),
      device: device || (prev.device as string) || '',
      os: os || (prev.os as string) || '',
      location: location || (prev.location as string) || '',
      viewPercentage: Math.max(Number(prev.viewPercentage) || 0, viewPercentage),
      pageViews: mergedPv,
    };
  } else {
    const email = (link.recipient_email as string)
      || (typeof body.email === 'string' ? body.email.slice(0, 200) : '')
      || 'Visitor';
    const nowIso = new Date().toISOString();
    visits.push({
      id: visitId,
      name: (link.recipient_name as string) || email,
      email,
      account: (link.link_name as string) || 'Shared link',
      isInternal: false,
      openedAt: nowIso,
      time: nowIso,
      link: link.recipient_email ? 'Email invite' : 'Shared link',
      duration: fmt(durationSeconds),
      durationSeconds,
      device,
      os,
      location,
      signed: false,
      viewPercentage,
      pageViews,
    });
  }

  const { error } = await admin.from('files').update({ visits }).eq('id', link.file_id as string);
  return NextResponse.json({ ok: !error });
}
