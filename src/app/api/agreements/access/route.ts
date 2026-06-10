/**
 * POST /api/agreements/access
 *
 * Records a recipient interaction with an agreement share link and
 * notifies the owner. Three actions:
 *
 *   action: 'opened'   → recipient passed the name/email gate. Records a
 *                        (signed:false) visit + fires an "X opened your
 *                        agreement" alert to the owner.
 *   action: 'progress' → silent heartbeat / on-leave beacon from the viewer.
 *                        Updates that recipient's existing visit with the
 *                        latest per-page dwell + duration. No alert, no email,
 *                        no new row (no-op if there's no open visit).
 *   action: 'signed'   → recipient completed all fields and clicked Done.
 *                        Upgrades their visit to signed + records the
 *                        signature and fires an "X signed your agreement" alert.
 *
 * Uses the service-role key because the recipient is anonymous (no RLS
 * grant to UPDATE the owner's file row or INSERT into the owner's alerts).
 *
 * Body: { fileId, linkId, name, email, action, fieldValues?, durationSeconds?, device?, os? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ShareLinkRow = { id: string; enabled?: boolean; account?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// pageViews payloads are CUMULATIVE snapshots of a session's per-page dwell,
// so merging successive snapshots (or a progress snapshot with the final sign
// snapshot) must take the per-page MAX - adding would massively overcount.
function maxMergePageViews(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = Math.max(out[k] ?? 0, Number(v) || 0);
  }
  return out;
}

export async function POST(req: NextRequest) {
  // 60/min: a single viewing session legitimately sends opened + a 15s
  // progress heartbeat + sign + on-leave beacon, which adds up over a long read.
  const rate = consumeRateLimit(`agreement-access:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const fileId = typeof body.fileId === 'string' ? body.fileId : '';
  const linkId = typeof body.linkId === 'string' ? body.linkId : '';
  // 'progress' is a silent telemetry update (page dwell + duration) sent by
  // the viewer heartbeat / on-leave beacon - no alert, no email, no new row.
  const action = body.action === 'signed' ? 'signed'
    : body.action === 'opened' ? 'opened'
    : body.action === 'progress' ? 'progress'
    : '';
  const rawName = typeof body.name === 'string' ? body.name : '';
  const rawEmail = typeof body.email === 'string' ? body.email : '';

  if (!fileId || !linkId || !action || !rawName || !rawEmail) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }
  if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 320) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  // Sanitize / cap lengths (defends against injecting newlines into the
  // alert message and oversized JSONB payloads).
  const name = rawName.replace(/[\r\n]+/g, ' ').slice(0, 200).trim();
  const email = rawEmail.trim().toLowerCase();
  const durationSeconds = Number(body.durationSeconds);
  const numPages = Number(body.numPages);
  const device = typeof body.device === 'string' ? body.device.slice(0, 50) : 'Unknown';
  const os = typeof body.os === 'string' ? body.os.slice(0, 50) : 'Unknown';
  const fieldValues = (body.fieldValues && typeof body.fieldValues === 'object') ? body.fieldValues : {};
  // Per-page dwell time captured while the recipient flipped pages -
  // { "1": 45, "2": 12, ... } seconds. Powers the agreement page-attention
  // analytics. Sanitize to a plain number map.
  const rawPageViews = (body.pageViews && typeof body.pageViews === 'object') ? body.pageViews as Record<string, unknown> : {};
  const pageViews: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawPageViews)) {
    const n = Number(v);
    if (/^\d+$/.test(k) && Number.isFinite(n) && n >= 0) pageViews[k] = Math.round(n);
  }

  const { data: file, error } = await supabase
    .from('files')
    .select('id, name, links, signatures, visits, user_id, agreement_fields, storage_path')
    .eq('id', fileId)
    .maybeSingle();

  if (error || !file) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const links: ShareLinkRow[] = Array.isArray(file.links) ? (file.links as ShareLinkRow[]) : [];
  const link = links.find((l) => l.id === linkId);
  if (!link || link.enabled === false) {
    // Not a public share link - allow if this is a per-file agreement GATE
    // (the agreement is configured as a gate somewhere in file_permissions).
    const { data: gateRow } = await supabase
      .from('file_permissions')
      .select('file_id')
      .eq('agreement_file_id', fileId)
      .limit(1)
      .maybeSingle();
    if (!gateRow) {
      return NextResponse.json({ ok: false, error: 'disabled' }, { status: 403 });
    }
  }

  const signed = action === 'signed';
  const account = link?.account ?? 'Direct Link';

  const nowIso = new Date().toISOString();
  const newVisit = {
    id: `visit_${Date.now()}`,
    name,
    email,
    account,
    isInternal: false,
    // Real timestamp so the owner's dashboard shows live relative time
    // ("2 minutes ago") instead of a frozen "just now".
    openedAt: nowIso,
    time: nowIso,
    link: account,
    duration: '',
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
    device,
    os,
    location: 'Unknown',
    signed,
    viewPercentage: signed ? 100 : 0,
    pageViews,
  };

  // Visit list: on 'signed' we UPGRADE the recipient's existing "opened"
  // visit (same email, not yet signed) to signed=true rather than adding a
  // second row - otherwise one person who opens then signs shows up as two
  // separate visitors. Only if no prior opened-visit exists do we append.
  const existingVisits: Array<Record<string, unknown>> = Array.isArray(file.visits)
    ? (file.visits as Array<Record<string, unknown>>)
    : [];

  // Helper: index of the most-recent unsigned visit by this email (the row a
  // sign or progress update belongs to).
  const findUnsignedIdx = () => {
    for (let i = existingVisits.length - 1; i >= 0; i--) {
      const v = existingVisits[i];
      if (v?.email === email && v?.signed !== true) return i;
    }
    return -1;
  };

  let nextVisits: Array<Record<string, unknown>>;
  if (signed) {
    const upgradeIdx = findUnsignedIdx();
    if (upgradeIdx !== -1) {
      nextVisits = existingVisits.map((v, i) => {
        if (i !== upgradeIdx) return v;
        // Merge the per-page dwell captured during signing with whatever the
        // progress heartbeat already recorded (cumulative → take per-page max).
        const prevPv = (v.pageViews && typeof v.pageViews === 'object') ? v.pageViews as Record<string, number> : {};
        const mergedPv = maxMergePageViews(prevPv, pageViews);
        return {
          ...v,
          signed: true,
          viewPercentage: 100,
          // Duration is also a cumulative session figure → max, not sum.
          durationSeconds: Math.max(Number(v.durationSeconds) || 0, newVisit.durationSeconds),
          time: v.time ?? nowIso,
          pageViews: mergedPv,
        };
      });
    } else {
      nextVisits = [...existingVisits, newVisit];
    }
  } else if (action === 'progress') {
    // Update the recipient's existing (unsigned) visit in place. Never append
    // - if there's no open visit yet (or they've already signed), do nothing.
    const idx = findUnsignedIdx();
    if (idx === -1) {
      return NextResponse.json({ ok: true, noop: true });
    }
    nextVisits = existingVisits.map((v, i) => {
      if (i !== idx) return v;
      const prevPv = (v.pageViews && typeof v.pageViews === 'object') ? v.pageViews as Record<string, number> : {};
      const mergedPv = maxMergePageViews(prevPv, pageViews);
      const pagesViewed = Object.values(mergedPv).filter((s) => s > 0).length;
      const computedVp = Number.isFinite(numPages) && numPages > 0
        ? Math.min(100, Math.round((pagesViewed / numPages) * 100))
        : Number(v.viewPercentage) || 0;
      return {
        ...v,
        durationSeconds: Math.max(Number(v.durationSeconds) || 0, newVisit.durationSeconds),
        pageViews: mergedPv,
        viewPercentage: Math.max(Number(v.viewPercentage) || 0, computedVp),
      };
    });
  } else {
    // 'opened' - append a fresh visit row.
    nextVisits = [...existingVisits, newVisit];
  }

  const updates: Record<string, unknown> = { visits: nextVisits };

  if (signed) {
    const newSignature = {
      name,
      email,
      dateSigned: new Date().toISOString(),
      signedFrom: 'Direct Link',
      account,
      fieldValues,
    };
    updates.signatures = [...(Array.isArray(file.signatures) ? file.signatures : []), newSignature];
  }

  const { error: updErr } = await supabase.from('files').update(updates).eq('id', fileId);
  if (updErr) {
    console.error('[agreement-access] file update failed:', updErr);
    return NextResponse.json({ ok: false, error: 'update_failed' }, { status: 500 });
  }

  // Notify the owner (bell + welcome-back popup). Best-effort - a missing
  // alerts table or RLS hiccup must not fail the recipient's action.
  // Only 'opened' and 'signed' alert; 'progress' is silent telemetry and
  // must NOT fire an alert on every heartbeat. Email is only sent on SIGN.
  if (file.user_id && action !== 'progress') {
    const message = signed
      ? `${name} (${email}) signed your agreement "${file.name}".`
      : `${name} (${email}) opened your agreement "${file.name}".`;
    try {
      await supabase.from('alerts').insert({
        user_id: file.user_id,
        space_id: null,
        type: signed ? 'agreement_signed' : 'agreement_opened',
        message,
      });
    } catch (alertErr) {
      console.warn('[agreement-access] alert insert failed (non-blocking):', alertErr);
    }
  }

  // ── Email on SIGN only ───────────────────────────────────────────────────
  // - Owner (User A): "X signed your agreement" with a View button that
  //   deep-links to the agreement detail page.
  // - Signer (User B): a confirmation copy of the signed document.
  // Opening does NOT send email - just the in-app alert above.
  if (signed) {
    try {
      await sendSignedEmails({
        ownerId: file.user_id as string | null,
        fileId,
        fileName: String(file.name ?? 'Agreement'),
        signerName: name,
        signerEmail: email,
        storagePath: (file.storage_path as string) ?? null,
        agreementFields: Array.isArray(file.agreement_fields) ? file.agreement_fields : [],
        fieldValues: fieldValues as Record<string, unknown>,
      });
    } catch (emailErr) {
      console.warn('[agreement-access] email send failed (non-blocking):', emailErr);
    }
  }

  return NextResponse.json({ ok: true });
}

// ── Signed-PDF generator ─────────────────────────────────────────────────────
// Downloads the original PDF, stamps the signer's field values onto it at the
// recorded positions, then tiles the signer's email as a faint diagonal
// watermark across every page. Returns the bytes (or null on any failure -
// the caller falls back to a plain confirmation email).
async function buildSignedPdf(opts: {
  storagePath: string;
  agreementFields: Array<{ id: string; type: string; x: number; y: number; page: number }>;
  fieldValues: Record<string, unknown>;
  watermarkEmail: string;
}): Promise<Uint8Array | null> {
  try {
    const { data: blob, error } = await supabase.storage.from('documents').download(opts.storagePath);
    if (error || !blob) return null;
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 1. Stamp field values
    for (const field of opts.agreementFields) {
      const page = pages[field.page - 1];
      if (!page) continue;
      const value = opts.fieldValues[field.id];
      if (!value) continue;
      const x = (field.x / 100) * page.getWidth();
      const y = page.getHeight() - (field.y / 100) * page.getHeight();
      if (typeof value === 'object' && value !== null) {
        const v = value as { type?: string; value?: string };
        if (v.type === 'drawn' && v.value) {
          try {
            const png = await pdfDoc.embedPng(v.value);
            const dims = png.scale(0.25);
            page.drawImage(png, { x, y: y - dims.height, width: dims.width, height: dims.height });
          } catch { /* skip malformed image */ }
        } else if (v.type === 'typed' && v.value) {
          page.drawText(v.value, { x, y: y - 18, font: helv, size: 18, color: rgb(0, 0, 0) });
        }
      } else {
        page.drawText(String(value), { x, y: y - 14, font: helv, size: 12, color: rgb(0, 0, 0) });
      }
    }

    // 2. Tile the signer's email as a faint diagonal watermark.
    for (const page of pages) {
      const { width, height } = page.getSize();
      for (let yy = -40; yy < height + 40; yy += 130) {
        for (let xx = -40; xx < width + 40; xx += 220) {
          page.drawText(opts.watermarkEmail, {
            x: xx, y: yy, size: 9, font: helv,
            color: rgb(0.6, 0.6, 0.6), opacity: 0.18, rotate: degrees(-30),
          });
        }
      }
    }

    return await pdfDoc.save();
  } catch (err) {
    console.warn('[agreement-access] buildSignedPdf failed:', err);
    return null;
  }
}

// ── Email helper ────────────────────────────────────────────────────────────
async function sendSignedEmails(opts: {
  ownerId: string | null;
  fileId: string;
  fileName: string;
  signerName: string;
  signerEmail: string;
  storagePath: string | null;
  agreementFields: Array<{ id: string; type: string; x: number; y: number; page: number }>;
  fieldValues: Record<string, unknown>;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[agreement-access] SMTP not configured - skipping emails.');
    return;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const viewUrl = `${appUrl}/content-library?fileId=${encodeURIComponent(opts.fileId)}`;

  // Resolve owner email from profiles.
  let ownerEmail: string | null = null;
  if (opts.ownerId) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', opts.ownerId)
      .maybeSingle();
    ownerEmail = (prof?.email as string) ?? null;
  }

  // @ts-ignore - nodemailer ships no bundled types; build tolerates this
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
  const fromAddr = process.env.SMTP_FROM ?? `VentureThrust <${smtpUser}>`;

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeName = esc(opts.signerName);
  const safeFile = esc(opts.fileName);

  // Generate the watermarked, signature-stamped PDF (best-effort).
  let signedPdf: Uint8Array | null = null;
  if (opts.storagePath) {
    signedPdf = await buildSignedPdf({
      storagePath: opts.storagePath,
      agreementFields: opts.agreementFields,
      fieldValues: opts.fieldValues,
      watermarkEmail: opts.signerEmail,
    });
  }
  const attachments = signedPdf
    ? [{
        filename: `signed-${opts.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`,
        content: Buffer.from(signedPdf),
        contentType: 'application/pdf',
      }]
    : undefined;

  const sends: Promise<unknown>[] = [];

  // 1. Owner email - "X signed", with a View button + the signed PDF attached.
  if (ownerEmail) {
    sends.push(transporter.sendMail({
      from: fromAddr,
      to: ownerEmail,
      subject: `${opts.signerName} signed "${opts.fileName}"`,
      attachments,
      html: `
        <div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
          <h2 style="font-weight:600">Your agreement was signed ✍️</h2>
          <p><strong>${safeName}</strong> (${esc(opts.signerEmail)}) has signed your agreement
             <strong>${safeFile}</strong>.</p>
          ${signedPdf ? '<p>The signed copy is attached to this email.</p>' : ''}
          <p style="margin:28px 0">
            <a href="${viewUrl}"
               style="background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">
              View agreement
            </a>
          </p>
          <p style="color:#6b6b8a;font-size:13px">VentureThrust - the clear path to smarter startup investing.</p>
        </div>`,
    }));
  }

  // 2. Signer email - copy of the signed document (watermarked with their email).
  sends.push(transporter.sendMail({
    from: fromAddr,
    to: opts.signerEmail,
    subject: `Your signed copy of "${opts.fileName}"`,
    attachments,
    html: `
      <div style="font-family:Geist,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="font-weight:600">Document completed ✅</h2>
        <p>Hi ${safeName}, this confirms you have signed <strong>${safeFile}</strong>.</p>
        ${signedPdf
          ? '<p>A copy of the signed document is attached, watermarked with your email for your records.</p>'
          : '<p>A copy has been recorded and shared with the sender.</p>'}
        <p style="color:#6b6b8a;font-size:13px;margin-top:28px">Sent via VentureThrust on behalf of the document owner.</p>
      </div>`,
  }));

  await Promise.allSettled(sends);
}
