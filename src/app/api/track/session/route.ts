/**
 * POST /api/track/session
 *
 * Records a visitor's viewing session for space analytics. Visitors are
 * ANONYMOUS, and RLS blocks anonymous writes to `viewer_sessions`, so this
 * runs with the service-role key (same pattern as the file-request / agreement
 * endpoints). The owner reads the rows back via RLS on the analytics page.
 *
 * Body (one of):
 *   { action: 'start', spaceId, email?, device?, location? }      → { sessionId }
 *   { action: 'beat',  sessionId, currentFileId?, currentFileName?, totalSeconds? }
 *   { action: 'end',   sessionId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { resolveUserTierId, limitsForTier } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  // Generous - a session beats every 5s; allow bursts but block abuse.
  const rate = consumeRateLimit(`track-session:${clientIp(req)}`, 200, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const action = body.action;

  try {
    if (action === 'start') {
      const spaceId = String(body.spaceId ?? '').trim();
      if (!spaceId) return NextResponse.json({ ok: false, error: 'missing_space' }, { status: 400 });

      // Visitor cap: block a brand-new visitor (identified by email) once the
      // space has reached the owner's plan limit. Unlimited plans and anonymous
      // (no email) visitors are not capped.
      const visEmail = body.email ? String(body.email).trim().toLowerCase() : null;
      if (visEmail) {
        const { data: sp } = await admin.from('spaces').select('created_by').eq('id', spaceId).maybeSingle();
        const ownerId = (sp as { created_by?: string } | null)?.created_by ?? null;
        if (ownerId) {
          const { visitorsPerSpace } = limitsForTier(await resolveUserTierId(admin, ownerId));
          if (visitorsPerSpace !== null) {
            const { data: rows } = await admin
              .from('viewer_sessions')
              .select('visitor_email')
              .eq('space_id', spaceId)
              .not('visitor_email', 'is', null);
            const seen = new Set(
              (rows ?? []).map((r) => String((r as { visitor_email?: string }).visitor_email ?? '').toLowerCase()),
            );
            if (!seen.has(visEmail) && seen.size >= visitorsPerSpace) {
              return NextResponse.json({ ok: false, error: 'visitor_limit' }, { status: 403 });
            }
          }
        }
      }
      // NOTE: viewer_sessions has no `location` column - only the columns below.
      const { data, error } = await admin
        .from('viewer_sessions')
        .insert({
          space_id: spaceId,
          visitor_email: body.email ? String(body.email) : null,
          device: body.device ? String(body.device) : null,
          started_at: new Date().toISOString(),
          last_heartbeat: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) {
        console.error('[track-session] start failed:', error.message);
        return NextResponse.json({ ok: false, error: 'insert_failed' }, { status: 500 });
      }
      return NextResponse.json({ ok: true, sessionId: data.id });
    }

    if (action === 'beat') {
      const id = String(body.sessionId ?? '').trim();
      if (!id) return NextResponse.json({ ok: false, error: 'missing_session' }, { status: 400 });
      const total = Number(body.totalSeconds);
      await admin
        .from('viewer_sessions')
        .update({
          last_heartbeat: new Date().toISOString(),
          current_file_id: body.currentFileId ? String(body.currentFileId) : null,
          current_file_name: body.currentFileName ? String(body.currentFileName) : null,
          total_seconds: Number.isFinite(total) ? total : 0,
        })
        .eq('id', id);
      return NextResponse.json({ ok: true });
    }

    if (action === 'end') {
      const id = String(body.sessionId ?? '').trim();
      if (!id) return NextResponse.json({ ok: false, error: 'missing_session' }, { status: 400 });
      await admin
        .from('viewer_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', id);
      return NextResponse.json({ ok: true });
    }

    // ── Deep analytics writes ──────────────────────────────────────────────
    // Visitors are anonymous (or signed in as a non-member), so RLS rightly
    // blocks them from writing files.visits / file_page_views /
    // file_playback_events directly. These actions perform those writes with
    // the service role after checking the file really belongs to the space.

    if (action === 'file-visit') {
      const fileId = String(body.fileId ?? '').trim();
      const sId = String(body.spaceId ?? '').trim();
      if (!fileId || !sId) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
      }
      const timeSpent = Math.min(86_400, Math.max(1, Math.floor(Number(body.timeSpent) || 0)));
      const openedAtMs = Date.parse(String(body.openedAt ?? ''));
      const openedAt = Number.isFinite(openedAtMs)
        ? new Date(openedAtMs).toISOString()
        : new Date(Date.now() - timeSpent * 1000).toISOString();

      const { data: file } = await admin
        .from('files')
        .select('id, visits')
        .eq('id', fileId)
        .eq('space_id', sId)
        .maybeSingle();
      if (!file) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

      const visits = Array.isArray(file.visits) ? file.visits : [];
      visits.push({
        email: body.email ? String(body.email).slice(0, 320) : 'anonymous',
        device: body.device ? String(body.device).slice(0, 40) : 'Unknown',
        timeSpent,
        openedAt,
      });
      const { error } = await admin.from('files').update({ visits }).eq('id', fileId);
      if (error) {
        console.warn('[track-session] file-visit failed:', error.message);
        return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'page-view') {
      const fileId = String(body.fileId ?? '').trim();
      const sId = String(body.spaceId ?? '').trim();
      const pageNumber = Math.max(0, Math.floor(Number(body.pageNumber) || 0));
      const secondsViewed = Math.min(86_400, Math.max(1, Math.floor(Number(body.secondsViewed) || 0)));
      if (!fileId || !sId || pageNumber < 1) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
      }
      const { data: file } = await admin
        .from('files').select('id').eq('id', fileId).eq('space_id', sId).maybeSingle();
      if (!file) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

      const { error } = await admin.from('file_page_views').insert({
        file_id: fileId,
        space_id: sId,
        visitor_email: body.email ? String(body.email).slice(0, 320) : null,
        session_id: body.sessionId ? String(body.sessionId).slice(0, 64) : null,
        page_number: pageNumber,
        seconds_viewed: secondsViewed,
      });
      if (error) console.warn('[track-session] page-view failed:', error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === 'playback') {
      const fileId = String(body.fileId ?? '').trim();
      const sId = String(body.spaceId ?? '').trim();
      const eventType = String(body.eventType ?? '').slice(0, 40);
      if (!fileId || !sId || !eventType) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
      }
      const { data: file } = await admin
        .from('files').select('id').eq('id', fileId).eq('space_id', sId).maybeSingle();
      if (!file) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

      const row: Record<string, unknown> = {
        file_id: fileId,
        space_id: sId,
        visitor_email: body.email ? String(body.email).slice(0, 320) : null,
        session_id: body.sessionId ? String(body.sessionId).slice(0, 64) : null,
        event_type: eventType,
      };
      if (body.position !== undefined) row.position_seconds = Number(body.position) || 0;
      if (body.rangeStart !== undefined) row.range_start = Number(body.rangeStart) || 0;
      if (body.rangeEnd !== undefined) row.range_end = Number(body.rangeEnd) || 0;
      const { error } = await admin.from('file_playback_events').insert(row);
      if (error) console.warn('[track-session] playback failed:', error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'bad_action' }, { status: 400 });
  } catch (err) {
    console.error('[track-session] error:', err);
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}
