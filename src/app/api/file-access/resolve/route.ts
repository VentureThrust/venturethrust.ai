/**
 * POST /api/file-access/resolve
 *
 * Resolves a single file's per-file permissions for a (possibly anonymous)
 * visitor, so the space viewer can enforce them. Runs with the service role
 * because visitors have no session and RLS would otherwise hide the rows.
 *
 * Body: { spaceId?: string, fileId: string, email?: string | null }
 * Returns:
 *   {
 *     ok: true,
 *     requireAgreement, agreementFileId, agreementName, signed,
 *     blocked, expired, watermarkText, allowDownloading
 *   }
 *
 * If the file has no file_permissions row, everything is permissive.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { isSpaceOwnerPlanActive } from '@/lib/owner-plan';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const OPEN = {
  ok: true as const,
  requireAgreement: false,
  agreementFileId: null as string | null,
  agreementName: null as string | null,
  signed: false,
  blocked: false,
  expired: false,
  watermarkText: null as string | null,
  allowDownloading: true,
};

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`file-access:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  let fileId = '';
  let email = '';
  try {
    const body = await req.json();
    fileId = String(body.fileId ?? '').trim();
    email = String(body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  if (!fileId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  try {
    // Owner-plan gate: if the workspace owner's plan has lapsed, the link is
    // dead for everyone, regardless of per-file permissions.
    const { data: fRow } = await admin.from('files').select('space_id').eq('id', fileId).maybeSingle();
    const spaceId = (fRow as { space_id?: string | null } | null)?.space_id ?? null;
    if (!(await isSpaceOwnerPlanActive(admin, spaceId))) {
      return NextResponse.json({ ...OPEN, expired: true });
    }

    const { data: perm, error } = await admin
      .from('file_permissions')
      .select('*')
      .eq('file_id', fileId)
      .maybeSingle();

    // No row (or table missing) → fully permissive.
    if (error || !perm) return NextResponse.json(OPEN);

    const p = perm as Record<string, unknown>;

    // Expiry
    const expiresAt = p.expires_at as string | null;
    const expired = !!expiresAt && new Date(expiresAt).getTime() < Date.now();

    // Allow / block by email
    const allow = ((p.allow_emails as string[]) ?? []).map((e) => e.toLowerCase());
    const block = ((p.block_emails as string[]) ?? []).map((e) => e.toLowerCase());
    let blocked = false;
    if (email) {
      if (block.includes(email)) blocked = true;
      else if (allow.length > 0 && !allow.includes(email)) blocked = true;
    } else if (allow.length > 0) {
      blocked = true; // allow-list set but visitor gave no email
    }

    // Agreement gate
    const requireAgreement = p.require_agreement === true && !!p.agreement_file_id;
    const agreementFileId = (p.agreement_file_id as string | null) ?? null;
    let agreementName: string | null = null;
    let signed = false;
    if (requireAgreement && agreementFileId) {
      const { data: agr } = await admin
        .from('files')
        .select('name, signatures')
        .eq('id', agreementFileId)
        .maybeSingle();
      agreementName = (agr?.name as string) ?? 'Agreement';
      const sigs = Array.isArray(agr?.signatures) ? (agr!.signatures as Array<Record<string, unknown>>) : [];
      signed = !!email && sigs.some((s) => String(s?.email ?? '').toLowerCase() === email);
    }

    return NextResponse.json({
      ok: true,
      requireAgreement,
      agreementFileId,
      agreementName,
      signed,
      blocked,
      expired,
      watermarkText: (p.watermark_text as string | null) ?? null,
      allowDownloading: p.allow_downloading !== false,
    });
  } catch (err) {
    console.error('[file-access/resolve] error:', err);
    return NextResponse.json(OPEN); // fail open - never hard-block on a server hiccup
  }
}
