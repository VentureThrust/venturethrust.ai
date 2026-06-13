/**
 * GET /api/agreements/view?fileId=...&linkId=...
 *
 * Public resolver for an agreement share link. This is what powers the
 * standalone /view/[fileId]/[linkId] page that recipients open - they may
 * have a VentureThrust account or not, so we CANNOT rely on the owner's
 * in-memory folder tree. Instead we read the file straight from the DB
 * with the service-role key (bypassing RLS, like the /shared/[token]
 * validator does).
 *
 * Validation performed server-side:
 *   - file exists
 *   - the file's `links` array contains an entry with id === linkId
 *   - that link is enabled
 *   - that link has not expired
 *
 * On success we return the file's display name, agreement fields, the
 * list of existing signer emails (so a returning signer sees view-only
 * mode), and a short-lived signed URL for the PDF. The storage path and
 * other internal columns never reach the browser.
 *
 * No side effects - safe to call on every page load. The "owner gets
 * notified" logic lives in POST /api/agreements/access instead, so a
 * refresh doesn't spam the owner.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { isSpaceOwnerPlanActive } from '@/lib/owner-plan';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ShareLinkRow = {
  id: string;
  enabled?: boolean;
  expires?: boolean;
  expiryDate?: string | null;
  account?: string;
};

type SignatureRow = { email?: string };

export async function GET(req: NextRequest) {
  // 60 requests / IP / minute - generous (a recipient may reload, change
  // pages, etc.) but blocks anyone scripting the endpoint to enumerate
  // file ids.
  const rate = consumeRateLimit(`agreement-view:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const fileId = req.nextUrl.searchParams.get('fileId');
  const linkId = req.nextUrl.searchParams.get('linkId');
  if (!fileId || !linkId) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }

  const { data: file, error } = await supabase
    .from('files')
    .select('id, name, storage_path, agreement_fields, links, signatures, space_id')
    .eq('id', fileId)
    .maybeSingle();

  if (error || !file) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  // Gate mode: the agreement is being opened because a FILE requires it
  // (per-file permissions), not via a public share link. Authorize by
  // confirming this agreement is actually configured as a gate somewhere
  // in file_permissions - so arbitrary agreement ids can't be opened.
  const gate = req.nextUrl.searchParams.get('gate') === '1';
  let account: string | null = null;

  if (gate) {
    const { data: gateRow } = await supabase
      .from('file_permissions')
      .select('file_id')
      .eq('agreement_file_id', fileId)
      .limit(1)
      .maybeSingle();
    if (!gateRow) {
      return NextResponse.json({ ok: false, error: 'disabled' }, { status: 403 });
    }
  } else {
    const links: ShareLinkRow[] = Array.isArray(file.links) ? (file.links as ShareLinkRow[]) : [];
    const link = links.find((l) => l.id === linkId);
    if (!link || link.enabled === false) {
      return NextResponse.json({ ok: false, error: 'disabled' }, { status: 403 });
    }
    // Expiry - server clock, not the client's.
    if (link.expires && link.expiryDate) {
      const expiresAt = new Date(link.expiryDate).getTime();
      if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
        return NextResponse.json({ ok: false, error: 'expired' }, { status: 403 });
      }
    }
    account = link.account ?? null;
  }

  // Owner-plan gate: if the file's workspace owner has lapsed, block the link.
  const ownerSpaceId = (file as { space_id?: string | null }).space_id ?? null;
  if (!(await isSpaceOwnerPlanActive(supabase, ownerSpaceId))) {
    return NextResponse.json({ ok: false, error: 'expired' }, { status: 403 });
  }

  // Short-lived signed URL for the PDF (1 hour). The recipient never sees
  // the storage path; they get a temporary URL pdfjs can fetch.
  let contentUrl: string | null = null;
  if (file.storage_path) {
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path as string, 60 * 60);
    contentUrl = signed?.signedUrl ?? null;
  }

  const signerEmails = (Array.isArray(file.signatures) ? (file.signatures as SignatureRow[]) : [])
    .map((s) => (s.email ? String(s.email).toLowerCase() : null))
    .filter((e): e is string => !!e);

  return NextResponse.json({
    ok: true,
    file: {
      id: file.id,
      name: file.name,
      contentUrl,
      agreementFields: file.agreement_fields ?? [],
      signerEmails,
      account,
    },
  });
}
