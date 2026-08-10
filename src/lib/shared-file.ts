/**
 * Resolve a file-scoped share link into the object the viewer renders.
 *
 * Lives here because two callers need the identical answer: the validate
 * endpoint, which serves links that have gates to pass, and the /shared page
 * itself, which can resolve an ungated link server-side and hand the result
 * straight to the browser. Duplicating this logic in both places is how the
 * two would quietly drift apart on something like the watchlist rule.
 *
 * Callers are responsible for the gates. This function assumes every check
 * has already passed and simply builds the payload.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ResolvedFile = {
  id: string;
  name: string;
  type: string;
  url: string;
  watermarkText: string | null;
  allowDownload: boolean;
  /** Agreements open in the signing experience, not the plain viewer. */
  isAgreement: boolean;
  /** False for a Deal Watch brief: there is nothing to watch on a report. */
  watchable: boolean;
  /** Our own marketing links only. Never on a customer's document. */
  showDemoCta: boolean;
  /** Carried so a demo request can say which document prompted it. */
  shareLinkId: string;
};

export async function buildSharedFile(
  admin: SupabaseClient,
  link: Record<string, unknown>,
  viewerEmail: string | null,
  /** Optional already-started query, so a caller can overlap round trips. */
  filePromise?: PromiseLike<{ data: Record<string, unknown> | null }> | null,
): Promise<ResolvedFile | null> {
  if (!link.file_id) return null;

  const { data: fileRow } = await (filePromise ??
    admin
      .from('files')
      .select('id, name, type, storage_path, agreement_fields')
      .eq('id', link.file_id as string)
      .maybeSingle());

  const path = (fileRow?.storage_path as string | undefined) ?? '';
  if (!path) return null;

  // A Deal Watch brief is not a startup you can watch, it is the output of
  // already watching one, so the viewer hides "Add to Watchlist" on it. Two
  // ways to be a report: a row in dw_reports (one we delivered to an investor)
  // or filed under a reports folder (a sample shared publicly, which was never
  // delivered and so has no row).
  const filedAsReport = /(^|\/)reports\//i.test(path);
  const [signedRes, reportRes] = await Promise.all([
    admin.storage.from('documents').createSignedUrl(path, 3600),
    filedAsReport
      ? Promise.resolve({ data: { id: 'path' } })
      : admin.from('dw_reports').select('id').eq('storage_path', path).limit(1).maybeSingle(),
  ]);

  const wmRaw = link.watermark ? ((link.watermark_text as string | null) ?? null) : null;
  const wm = wmRaw
    ? wmRaw.replace(/\{\{\s*email\s*\}\}/gi, viewerEmail || 'Confidential')
    : null;

  return {
    id: fileRow!.id as string,
    name: (fileRow!.name as string) ?? 'Document',
    type: (fileRow!.type as string) ?? 'Doc',
    url: signedRes.data?.signedUrl ?? '',
    watermarkText: wm,
    allowDownload: link.allow_download !== false,
    isAgreement:
      Array.isArray(fileRow!.agreement_fields) && (fileRow!.agreement_fields as unknown[]).length > 0,
    watchable: !reportRes.data,
    // Explicit opt-in. A missing column reads as undefined, which is false,
    // which is the safe answer.
    showDemoCta: link.show_demo_cta === true,
    shareLinkId: (link.id as string) ?? '',
  };
}

/** True when a link has no gate left for the visitor to pass. */
export function isUngated(link: Record<string, unknown>): boolean {
  return (
    !link.email_required &&
    !link.password_hash &&
    !link.require_nda &&
    !link.require_signature
  );
}
