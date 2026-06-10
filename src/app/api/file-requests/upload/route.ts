/**
 * POST /api/file-requests/upload
 *
 * Public, service-role endpoint that RECORDS a batch of uploads against a file
 * request, after the browser has already pushed the bytes to Storage. The file
 * bytes never pass through this route (so we don't hit serverless body limits);
 * the browser uploads to the `documents` bucket, then posts the resulting
 * storage paths here.
 *
 * This replaces the old flow where the anonymous browser inserted directly into
 * `file_request_uploads`, `files`, and `alerts`. Doing it server-side means:
 *   - those tables can be locked to owners only (no anon INSERT policy), and
 *   - the server re-validates the token, the request's active/expiry state, the
 *     batch size, the storage-path prefix, and the uploader email - so an
 *     anonymous caller can no longer write arbitrary rows.
 *
 * Body: {
 *   token: string,
 *   uploaderName: string,
 *   uploaderEmail: string,
 *   files: { fileId: string; fileName: string; fileSize: number; storagePath: string }[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MAX_FILES_PER_REQUEST = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFileType(name: string): 'PDF' | 'Deck' | 'Sheet' | 'Doc' | 'Image' {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'Deck';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Sheet';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'Image';
  return 'Doc';
}

function sanitizeFileName(raw: string): string {
  const lastSlash = Math.max(raw.lastIndexOf('/'), raw.lastIndexOf('\\'));
  const baseName = lastSlash >= 0 ? raw.slice(lastSlash + 1) : raw;
  return (
    baseName
      .replace(/[\x00-\x1f\x7f]/g, '')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+/, '')
      .slice(0, 200)
      .trim() || 'file'
  );
}

function safeFileId(raw: unknown, idx: number): string {
  const s = typeof raw === 'string' ? raw : '';
  return /^[A-Za-z0-9_-]{1,64}$/.test(s) ? s : `file_${Date.now()}_${idx}`;
}

type IncomingFile = { fileId: string; fileName: string; fileSize: number; storagePath: string };

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`fr-upload:${clientIp(req)}`, 30, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  let body: {
    token?: unknown;
    uploaderName?: unknown;
    uploaderEmail?: unknown;
    files?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const uploaderName = (typeof body.uploaderName === 'string' ? body.uploaderName : '').trim().slice(0, 200);
  const uploaderEmail = (typeof body.uploaderEmail === 'string' ? body.uploaderEmail : '').trim().slice(0, 200);

  if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  if (!uploaderName) return NextResponse.json({ ok: false, error: 'missing_name' }, { status: 400 });
  if (!EMAIL_RE.test(uploaderEmail)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const filesIn: unknown[] = Array.isArray(body.files) ? body.files.slice(0, MAX_FILES_PER_REQUEST) : [];
  if (filesIn.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_files' }, { status: 400 });
  }

  // ── Validate the token + request state (service role) ──────────────────────
  const { data: reqRow, error: reqErr } = await supabase
    .from('file_requests')
    .select('id, title, created_by, target_folder_id, target_space_id, expires_at, is_active')
    .eq('token', token)
    .maybeSingle();

  if (reqErr || !reqRow) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  if (!reqRow.is_active) return NextResponse.json({ ok: false, error: 'inactive' }, { status: 403 });
  if (reqRow.expires_at && new Date(reqRow.expires_at as string) < new Date()) {
    return NextResponse.json({ ok: false, error: 'expired' }, { status: 403 });
  }

  // Files may ONLY be recorded under this request's own storage prefix.
  const prefix = `file-requests/${reqRow.id}/`;
  const nowIso = new Date().toISOString();

  const uploadRows: Record<string, unknown>[] = [];
  const fileRows: Record<string, unknown>[] = [];
  let accepted = 0;

  filesIn.forEach((raw, idx) => {
    const f = (raw ?? {}) as Partial<IncomingFile>;
    const storagePath = typeof f.storagePath === 'string' ? f.storagePath : '';
    // Reject anything not scoped to this request, or with traversal.
    if (!storagePath.startsWith(prefix) || storagePath.includes('..')) return;

    const fileName = sanitizeFileName(typeof f.fileName === 'string' ? f.fileName : 'file');
    const fileSize = Number.isFinite(Number(f.fileSize)) ? Math.max(0, Math.floor(Number(f.fileSize))) : 0;
    const fileId = safeFileId(f.fileId, idx);

    uploadRows.push({
      file_request_id: reqRow.id,
      uploader_name: uploaderName,
      uploader_email: uploaderEmail,
      file_name: fileName,
      file_size: fileSize,
      storage_path: storagePath,
    });

    // Mirror into the owner's content library at the request's target folder.
    if (reqRow.target_folder_id) {
      const fileRow: Record<string, unknown> = {
        id: fileId,
        user_id: reqRow.created_by,
        folder_id: reqRow.target_folder_id,
        name: fileName,
        type: getFileType(fileName),
        created_at: nowIso,
        views: 0,
        storage_path: storagePath,
      };
      if (reqRow.target_space_id) fileRow.space_id = reqRow.target_space_id;
      fileRows.push(fileRow);
    }

    accepted += 1;
  });

  if (accepted === 0) {
    return NextResponse.json({ ok: false, error: 'no_valid_files' }, { status: 400 });
  }

  // Audit log (best-effort).
  const { error: trackErr } = await supabase.from('file_request_uploads').insert(uploadRows);
  if (trackErr) console.warn('file_request_uploads insert failed:', trackErr.message);

  // Content-library mirror (best-effort).
  if (fileRows.length > 0) {
    const { error: fileErr } = await supabase.from('files').insert(fileRows);
    if (fileErr) console.warn('files insert failed:', fileErr.message);
  }

  // Notify the owner (powers the bell + welcome-back popup).
  const { error: alertErr } = await supabase.from('alerts').insert({
    user_id: reqRow.created_by,
    space_id: reqRow.target_space_id ?? null,
    type: 'file_request_upload',
    message: `${uploaderName} (${uploaderEmail}) uploaded ${accepted} file${accepted !== 1 ? 's' : ''} for "${reqRow.title}".`,
  });
  if (alertErr) console.warn('alert insert failed:', alertErr.message);

  return NextResponse.json({ ok: true, uploaded: accepted });
}
