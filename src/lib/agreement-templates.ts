// src/lib/agreement-templates.ts
// ---------------------------------------------------------------------------
// Sample agreement templates + a tiny PDF layout engine that renders them to
// a clean, professional, multi-page PDF entirely in the browser using pdf-lib
// (the same dependency already used elsewhere for PDF stamping).
//
// The wording below is standard, widely-used non-disclosure boilerplate
// assembled from common public templates. Every party/term-specific value is
// a [BRACKETED] placeholder the user fills in. These are starting templates to
// customise in the editor - not legal advice.
//
// IMPORTANT: only WinAnsi-safe characters are used in the content strings
// (straight quotes, ASCII hyphens, "(a)/(b)" enumerations) so pdf-lib's
// StandardFonts never throw an "cannot encode" error at render time.
// ---------------------------------------------------------------------------

export interface TemplateSection {
  /** Bold heading, rendered as "N. Heading." */
  heading: string;
  /** Body paragraph(s). Use "\n" to force a new paragraph within a section. */
  body: string;
}

export interface AgreementTemplate {
  /** Internal id used for selection + filenames. */
  id: string;
  /** Human label shown in the picker. */
  label: string;
  /** One-line description shown in the picker. */
  description: string;
  /** Suggested file name (no extension). */
  fileName: string;
  /** Document title rendered at the top of page 1. */
  title: string;
  /** Intro / recital paragraphs rendered before the numbered sections. */
  intro: string[];
  /** Numbered, headed sections. */
  sections: TemplateSection[];
  /** Closing line above the signature block. */
  closing: string;
  /** Signature-block party labels (e.g. "DISCLOSING PARTY"). */
  signatories: string[];
}

/**
 * A field the editor can render, pre-placed on the generated PDF. Shape is
 * intentionally identical to the editor's `PlacedField` so it can be assigned
 * straight to `File.agreementFields` without conversion.
 */
export interface TemplateField {
  id: string;
  type: string; // 'signature' | 'name' | 'title' | 'date-signed' | ...
  x: number;    // % of page width  (left edge of the field box)
  y: number;    // % of page height (top edge of the field box)
  page: number; // 1-based page number
}

/** Optional build-time data. `discloser` pre-fills the owner (Disclosing Party)
 *  side of the signature block so the recipient only signs the Receiving Party. */
export interface TemplateBuildOptions {
  discloser?: {
    name?: string;
    title?: string;
    date?: string;
    /** The owner's signature, stamped onto the Disclosing Party line.
     *  'drawn' = a PNG data-URL (embedded as an image, handwritten look);
     *  'typed' = text rendered in an italic style. */
    signature?: { type: 'typed' | 'drawn'; value: string };
  };
}

// ─── Mutual NDA ─────────────────────────────────────────────────────────────
const MUTUAL_NDA: AgreementTemplate = {
  id: 'mutual-nda',
  label: 'Mutual Non-Disclosure Agreement',
  description:
    'Two-way NDA for when both parties will share confidential information (e.g. exploring a partnership, fundraising, or M&A).',
  fileName: 'Mutual-Non-Disclosure-Agreement',
  title: 'MUTUAL NON-DISCLOSURE AGREEMENT',
  intro: [
    'This Mutual Non-Disclosure Agreement (this "Agreement") is entered into as of [Effective Date] by and between [Party A Name], with its principal place of business at [Party A Address] ("Party A"), and [Party B Name], with its principal place of business at [Party B Address] ("Party B"). Party A and Party B are each referred to as a "Party" and collectively as the "Parties."',
    'WHEREAS, the Parties wish to explore a potential business relationship (the "Purpose"); and WHEREAS, in connection with the Purpose, each Party may disclose to the other certain confidential and proprietary information. NOW, THEREFORE, in consideration of the mutual covenants set forth below, the Parties agree as follows:',
  ],
  sections: [
    {
      heading: 'Definition of Confidential Information',
      body:
        '"Confidential Information" means all non-public, proprietary, or confidential information or materials disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party"), in oral, visual, written, electronic, or other tangible or intangible form, whether or not marked or otherwise designated as "confidential," including but not limited to trade secrets, business plans, financial data, customer and supplier lists, product designs, source code, technical specifications, and marketing strategies.',
    },
    {
      heading: 'Exclusions',
      body:
        'Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was rightfully known to the Receiving Party before its disclosure; (c) was rightfully obtained by the Receiving Party from a third party without breach of any obligation of confidentiality; or (d) was independently developed by the Receiving Party without reference to or use of the Disclosing Party\'s Confidential Information.',
    },
    {
      heading: 'Purpose and Use',
      body:
        'Each Party shall use the other Party\'s Confidential Information solely for the Purpose and for no other purpose without the prior written consent of the Disclosing Party.',
    },
    {
      heading: 'Obligations of the Receiving Party',
      body:
        'The Receiving Party shall: (a) hold and maintain the Disclosing Party\'s Confidential Information in strict confidence; (b) not disclose such Confidential Information to any third party without the prior written approval of the Disclosing Party, except to its employees, officers, or advisors who have a reasonable need to know and who are bound by confidentiality obligations no less restrictive than those set forth in this Agreement; and (c) protect the Confidential Information using at least the same degree of care it uses to protect its own confidential information, and in no event less than a reasonable standard of care.',
    },
    {
      heading: 'Term',
      body:
        'This Agreement commences on the Effective Date and continues for a period of [two (2) years], unless earlier terminated by either Party upon thirty (30) days\' prior written notice. The confidentiality obligations set forth in this Agreement survive termination for a period of [three (3) years] thereafter, or, with respect to any trade secret, for so long as such information remains a trade secret under applicable law.',
    },
    {
      heading: 'Return or Destruction of Materials',
      body:
        'Upon the written request of the Disclosing Party, or upon completion or abandonment of the Purpose, the Receiving Party shall promptly return or destroy all tangible materials embodying the Disclosing Party\'s Confidential Information, including all copies, and shall certify such destruction in writing if requested.',
    },
    {
      heading: 'No License or Warranty',
      body:
        'All Confidential Information remains the property of the Disclosing Party. No license or other right under any patent, copyright, trademark, or trade secret is granted or implied by this Agreement. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, AND THE DISCLOSING PARTY SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM THE RECEIVING PARTY\'S USE OF THE CONFIDENTIAL INFORMATION.',
    },
    {
      heading: 'Remedies',
      body:
        'Each Party acknowledges that any unauthorized use or disclosure of the Disclosing Party\'s Confidential Information may cause irreparable harm for which monetary damages would be an inadequate remedy. Accordingly, the Disclosing Party is entitled to seek injunctive or other equitable relief, in addition to any other remedies available at law or in equity.',
    },
    {
      heading: 'Governing Law',
      body:
        'This Agreement is governed by and construed in accordance with the laws of the State of [State], without regard to its conflict-of-laws principles. The Parties consent to the exclusive jurisdiction of the state and federal courts located in [County, State] for the resolution of any dispute arising under this Agreement.',
    },
    {
      heading: 'Miscellaneous',
      body:
        '(a) Entire Agreement. This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior or contemporaneous understandings. (b) Severability. If any provision is held invalid or unenforceable, the remaining provisions continue in full force and effect. (c) Waiver. No failure or delay in exercising any right operates as a waiver of that right. (d) Assignment. Neither Party may assign this Agreement without the other Party\'s prior written consent, except to a successor in connection with a merger, acquisition, or sale of all or substantially all of its assets. (e) Counterparts. This Agreement may be executed in counterparts, including by electronic signature, each of which is deemed an original and all of which together constitute one instrument.',
    },
  ],
  closing:
    'IN WITNESS WHEREOF, the Parties have executed this Mutual Non-Disclosure Agreement as of the Effective Date.',
  signatories: ['PARTY A', 'PARTY B'],
};

// ─── One-way (Unilateral) NDA ─────────────────────────────────────────────────
const ONE_WAY_NDA: AgreementTemplate = {
  id: 'one-way-nda',
  label: 'One-Way Non-Disclosure Agreement',
  description:
    'Unilateral NDA for when only you disclose confidential information to a recipient (e.g. sharing a data room, deck, or financials).',
  fileName: 'One-Way-Non-Disclosure-Agreement',
  title: 'NON-DISCLOSURE AGREEMENT',
  intro: [
    'This Non-Disclosure Agreement (this "Agreement") is entered into as of [Effective Date] by and between [Disclosing Party Name], with its principal place of business at [Disclosing Party Address] (the "Disclosing Party"), and [Receiving Party Name], with its principal place of business at [Receiving Party Address] (the "Receiving Party").',
    'WHEREAS, the Disclosing Party wishes to disclose certain confidential information to the Receiving Party for the purpose of [describe purpose, e.g. evaluating a potential investment or business relationship] (the "Purpose"). NOW, THEREFORE, in consideration of the disclosure and the mutual covenants set forth below, the Parties agree as follows:',
  ],
  sections: [
    {
      heading: 'Definition of Confidential Information',
      body:
        '"Confidential Information" means all non-public, proprietary, or confidential information or materials disclosed by the Disclosing Party to the Receiving Party, in any form, whether or not marked or designated as "confidential," including but not limited to trade secrets, business and financial information, customer lists, product and technical information, source code, and strategic plans.',
    },
    {
      heading: 'Exclusions',
      body:
        'Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was rightfully known to the Receiving Party before disclosure; (c) was rightfully obtained from a third party without breach of any confidentiality obligation; or (d) was independently developed by the Receiving Party without use of the Confidential Information.',
    },
    {
      heading: 'Obligations of the Receiving Party',
      body:
        'The Receiving Party shall: (a) use the Confidential Information solely for the Purpose; (b) hold the Confidential Information in strict confidence and not disclose it to any third party without the Disclosing Party\'s prior written consent, except to employees or advisors with a need to know who are bound by confidentiality obligations no less protective than those in this Agreement; and (c) protect the Confidential Information with at least a reasonable standard of care.',
    },
    {
      heading: 'Term',
      body:
        'This Agreement commences on the Effective Date and the confidentiality obligations continue for a period of [three (3) years] from the date of disclosure, or, with respect to any trade secret, for so long as such information remains a trade secret under applicable law.',
    },
    {
      heading: 'Return or Destruction of Materials',
      body:
        'Upon the Disclosing Party\'s written request, or upon completion or abandonment of the Purpose, the Receiving Party shall promptly return or destroy all materials embodying the Confidential Information, including all copies, and certify such destruction in writing if requested.',
    },
    {
      heading: 'No License or Warranty',
      body:
        'All Confidential Information remains the property of the Disclosing Party. No license or other right is granted or implied by this Agreement. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND.',
    },
    {
      heading: 'Remedies',
      body:
        'The Receiving Party acknowledges that any unauthorized use or disclosure of the Confidential Information may cause the Disclosing Party irreparable harm for which monetary damages would be inadequate, and that the Disclosing Party is entitled to seek injunctive or other equitable relief in addition to any other remedies available at law or in equity.',
    },
    {
      heading: 'Governing Law',
      body:
        'This Agreement is governed by the laws of the State of [State], without regard to its conflict-of-laws principles, and the Parties consent to the exclusive jurisdiction of the courts located in [County, State].',
    },
    {
      heading: 'Miscellaneous',
      body:
        '(a) This Agreement constitutes the entire agreement between the Parties regarding its subject matter. (b) If any provision is held invalid, the remaining provisions continue in full force and effect. (c) No failure or delay in exercising any right operates as a waiver. (d) This Agreement may be executed in counterparts, including by electronic signature.',
    },
  ],
  closing:
    'IN WITNESS WHEREOF, the Parties have executed this Non-Disclosure Agreement as of the Effective Date.',
  signatories: ['DISCLOSING PARTY', 'RECEIVING PARTY'],
};

export const AGREEMENT_TEMPLATES: AgreementTemplate[] = [MUTUAL_NDA, ONE_WAY_NDA];

export function getTemplateById(id: string): AgreementTemplate | undefined {
  return AGREEMENT_TEMPLATES.find((t) => t.id === id);
}

// ─── PDF layout engine ───────────────────────────────────────────────────────
// Renders a template to a clean US-Letter PDF: centered title, justified-ish
// wrapped body, numbered bold headings, a signature block with ruled fields,
// and a subtle VentureThrust footer with page numbers.

export async function buildTemplatePdf(
  template: AgreementTemplate,
  opts?: TemplateBuildOptions,
): Promise<{ bytes: Uint8Array; fields: TemplateField[] }> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  doc.setTitle(template.title);
  doc.setCreator('VentureThrust');
  doc.setProducer('VentureThrust');

  // Clean, modern sans-serif (Helvetica) renders crisp at small sizes - looks
  // like typed digital text, not a scanned/serif document.
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Signature (drawn) image, embedded once if the owner drew one.
  const sig = opts?.discloser?.signature;
  let sigImage: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  if (sig?.type === 'drawn' && typeof sig.value === 'string' && sig.value.startsWith('data:image')) {
    try { sigImage = await doc.embedPng(sig.value); } catch { sigImage = null; }
  }
  const sigTyped = sig?.type === 'typed' ? (sig.value || '') : '';

  const PAGE_W = 612; // US Letter
  const PAGE_H = 792;
  const MARGIN_X = 72; // 1 inch
  const MARGIN_TOP = 78;
  const MARGIN_BOTTOM = 72;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;
  const ink = rgb(0.1, 0.1, 0.12);
  const faint = rgb(0.46, 0.46, 0.52);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  // `y` tracks the top of the next line slot (baseline = y - fontSize).
  let y = PAGE_H - MARGIN_TOP;
  // 0-based index of the page we're currently drawing on, kept in step with
  // `page` so pre-placed fields know which page they belong to.
  let pageIndex = 0;
  // Interactive fields pre-placed on the signature lines (returned to caller).
  const fields: TemplateField[] = [];
  // Approx. height of the editor's field chip as a % of page height - used to
  // sit the chip just above its ruled line. (chip ~36px / render height ~984px)
  const FIELD_BOX_PCT = 3.5;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    pageIndex += 1;
    y = PAGE_H - MARGIN_TOP;
  };
  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) newPage();
  };

  const wrapLines = (
    text: string,
    font: typeof fontRegular,
    size: number,
    maxWidth: number,
  ): string[] => {
    const lines: string[] = [];
    // Honour explicit paragraph breaks first.
    for (const para of text.split('\n')) {
      const words = para.split(/\s+/).filter(Boolean);
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      lines.push(line); // may be '' to preserve an intentional blank line
    }
    return lines;
  };

  const drawParagraph = (
    text: string,
    opts: {
      font?: typeof fontRegular;
      size?: number;
      lineHeight?: number;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      gapAfter?: number;
    } = {},
  ) => {
    const {
      font = fontRegular,
      size = 11,
      lineHeight = 15.5,
      color = ink,
      indent = 0,
      gapAfter = 9,
    } = opts;
    const lines = wrapLines(text, font, size, CONTENT_W - indent);
    for (const line of lines) {
      ensureSpace(lineHeight);
      if (line) {
        page.drawText(line, {
          x: MARGIN_X + indent,
          y: y - size,
          size,
          font,
          color,
        });
      }
      y -= lineHeight;
    }
    y -= gapAfter;
  };

  // ── Title ──
  {
    const size = 17;
    const w = fontBold.widthOfTextAtSize(template.title, size);
    page.drawText(template.title, {
      x: (PAGE_W - w) / 2,
      y: y - size,
      size,
      font: fontBold,
      color: ink,
    });
    y -= size + 10;
    // thin rule under the title
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_W - MARGIN_X, y },
      thickness: 0.75,
      color: faint,
    });
    y -= 20;
  }

  // ── Intro / recitals ──
  for (const para of template.intro) {
    drawParagraph(para, { size: 11, lineHeight: 15.5, gapAfter: 11 });
  }

  // ── Numbered sections ──
  template.sections.forEach((section, i) => {
    // Keep a heading with at least its first body line on the same page.
    ensureSpace(40);
    drawParagraph(`${i + 1}. ${section.heading}.`, {
      font: fontBold,
      size: 11.5,
      lineHeight: 16,
      gapAfter: 4,
    });
    drawParagraph(section.body, { size: 11, lineHeight: 15.5, gapAfter: 12 });
  });

  // ── Closing line ──
  ensureSpace(40);
  y -= 6;
  drawParagraph(template.closing, { size: 11, lineHeight: 15.5, gapAfter: 18 });

  // ── Signature block ──
  // Draws "Label: ___________" and, when a fieldType is given, records an
  // interactive field pre-placed on that line (mapped to editor % coords).
  const drawFieldLine = (
    label: string,
    lineWidth: number,
    fieldType?: string,
    prefill?: string,
    prefillImage?: Awaited<ReturnType<typeof doc.embedPng>> | null,
    prefillItalic?: boolean,
  ) => {
    const size = 11;
    ensureSpace(30);
    const baseline = y - size;
    page.drawText(label, {
      x: MARGIN_X,
      y: baseline,
      size,
      font: fontRegular,
      color: ink,
    });
    const labelW = fontRegular.widthOfTextAtSize(`${label} `, size);
    const lineStartX = MARGIN_X + labelW;
    const lineY = baseline - 1;
    page.drawLine({
      start: { x: lineStartX, y: lineY },
      end: { x: lineStartX + lineWidth, y: lineY },
      thickness: 0.75,
      color: faint,
    });

    // Owner-side pre-fill, sitting just above the ruled line.
    if (prefillImage) {
      // Drawn signature → scale to ~26pt tall, capped to the line width.
      const targetH = 26;
      const scale = targetH / (prefillImage.height || targetH);
      const w = Math.min((prefillImage.width || 120) * scale, lineWidth - 6);
      const h = (prefillImage.height || targetH) * (w / (prefillImage.width || 120));
      page.drawImage(prefillImage, { x: lineStartX + 3, y: lineY + 1, width: w, height: Math.min(h, 30) });
    } else if (prefill && prefill.trim()) {
      page.drawText(prefill.trim(), {
        x: lineStartX + 3,
        y: baseline + 2,
        size: prefillItalic ? 14 : size,
        font: prefillItalic ? fontItalic : fontRegular,
        color: ink,
      });
    }

    if (fieldType) {
      // PDF coords have y from the bottom; the editor places fields by their
      // top-left as a % from the top-left. Convert, then lift the chip so it
      // sits on (just above) the ruled line.
      const xPct = (lineStartX / PAGE_W) * 100;
      const lineTopPct = ((PAGE_H - lineY) / PAGE_H) * 100;
      const yPct = lineTopPct - FIELD_BOX_PCT;
      fields.push({
        id: `tpl-field-${fields.length}`,
        type: fieldType,
        x: Math.max(0, Math.min(85, xPct)),
        y: Math.max(0, Math.min(95, yPct)),
        page: pageIndex + 1,
      });
    }

    y -= 30;
  };

  // Only the RECIPIENT - the LAST signatory ("RECEIVING PARTY" / "PARTY B") -
  // gets interactive, recipient-fillable fields. The first party is the
  // DISCLOSING PARTY / owner side: its lines are drawn but left blank for the
  // owner to complete, so a single recipient can NEVER sign on both parties'
  // behalf.
  const recipientIdx = template.signatories.length - 1;
  const discloser = opts?.discloser ?? {};
  const discloserDate = discloser.date || new Date().toLocaleDateString('en-US');
  template.signatories.forEach((party, idx) => {
    const isRecipient = idx === recipientIdx;
    // Keep an entire party block together (label + 4 fields ~ 150pt).
    ensureSpace(160);
    drawParagraph(party, { font: fontBold, size: 11, lineHeight: 16, gapAfter: 10 });
    if (isRecipient) {
      // The recipient signs these - interactive fields.
      drawFieldLine('By:', 300, 'signature');
      drawFieldLine('Name:', 280, 'name');
      drawFieldLine('Title:', 285, 'title');
      drawFieldLine('Date:', 285, 'date-signed');
    } else {
      // Disclosing Party (the owner) - pre-filled + pre-signed, never signable
      // by the recipient. By: shows the owner's signature (drawn image, or the
      // typed signature / name in an italic "handwritten" style).
      drawFieldLine('By:', 300, undefined, sigImage ? undefined : (sigTyped || discloser.name), sigImage, true);
      drawFieldLine('Name:', 280, undefined, discloser.name);
      drawFieldLine('Title:', 285, undefined, discloser.title);
      drawFieldLine('Date:', 285, undefined, discloserDate);
    }
    y -= 10;
  });

  // ── Footer on every page (VentureThrust brand + page numbers) ──
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGIN_X, y: 52 },
      end: { x: PAGE_W - MARGIN_X, y: 52 },
      thickness: 0.5,
      color: faint,
    });
    p.drawText('VentureThrust', {
      x: MARGIN_X,
      y: 38,
      size: 8,
      font: fontBold,
      color: faint,
    });
    const pageLabel = `Page ${i + 1} of ${pages.length}`;
    const lw = fontRegular.widthOfTextAtSize(pageLabel, 8);
    p.drawText(pageLabel, {
      x: PAGE_W - MARGIN_X - lw,
      y: 38,
      size: 8,
      font: fontRegular,
      color: faint,
    });
  });

  return { bytes: await doc.save(), fields };
}

/**
 * Convenience: build the template and wrap it in a browser File object,
 * alongside the interactive fields pre-placed on the signature lines.
 */
export async function buildTemplateFile(
  template: AgreementTemplate,
  opts?: TemplateBuildOptions,
): Promise<{ file: globalThis.File; fields: TemplateField[] }> {
  const { bytes, fields } = await buildTemplatePdf(template, opts);
  // pdf-lib returns a Uint8Array; copy into a fresh ArrayBuffer so the Blob
  // constructor is happy across TS/runtime BlobPart typings.
  const blob = new Blob([bytes.slice()], { type: 'application/pdf' });
  const file = new globalThis.File([blob], `${template.fileName}.pdf`, {
    type: 'application/pdf',
  });
  return { file, fields };
}
