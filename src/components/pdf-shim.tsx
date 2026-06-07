'use client';

/**
 * pdf-shim - minimal drop-in replacement for react-pdf's <Document> + <Page>.
 *
 * react-pdf v10 + Next.js 15 has a fatal Webpack bundling issue with its
 * internal pdfjs-dist (`Object.defineProperty called on non-object` at
 * pdf.mjs:1) that no amount of transpilePackages / fullySpecified config
 * has been able to fix. The visitor-facing PdfViewer already side-steps
 * this by loading pdfjs as a CDN <script>; this shim does the same thing
 * but exposes a react-pdf-compatible API so the agreement editor can swap
 * in without rewriting its drag-and-drop overlay logic.
 *
 * Loads pdfjs v3.11.174 UMD once (cached on `window.pdfjsLib`), then
 * renders each page to a <canvas>. Children of <Document> have access to
 * the loaded pdf object via PdfContext; <Page> consumes it to render.
 */

import {
  useEffect, useRef, useState, useContext, createContext,
  type ReactNode,
} from 'react';

// ── Types (only what we use from pdfjs) ───────────────────────────────────────
type PdfPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string | { url: string; data?: ArrayBuffer }) => { promise: Promise<PdfDoc> };
  version: string;
};

declare global {
  interface Window { pdfjsLib?: PdfJsLib }
}

// ── CDN loader ────────────────────────────────────────────────────────────────
// pdfjs-dist 3.11.174 is the last version with a UMD build (window.pdfjsLib),
// so it loads cleanly via a plain <script> tag - no Webpack, no ESM externals,
// no crash. Cached at module scope so subsequent <Document> mounts reuse it.

const PDFJS_VERSION = '3.11.174';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsPromise: Promise<PdfJsLib> | null = null;
function loadPdfjs(): Promise<PdfJsLib> {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = new Promise<PdfJsLib>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('pdfjs requires a browser environment'));
      return;
    }
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = `${PDFJS_BASE}/pdf.min.js`;
    script.async = true;
    script.onload = () => {
      const lib = window.pdfjsLib;
      if (!lib) {
        reject(new Error('pdfjsLib failed to attach to window after script load'));
        return;
      }
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.js`;
      resolve(lib);
    };
    script.onerror = () => reject(new Error('Failed to load pdfjs from cdnjs'));
    document.head.appendChild(script);
  });
  return pdfjsPromise;
}

// ── Context - passes the loaded PdfDoc from <Document> to <Page> children ────
const PdfContext = createContext<PdfDoc | null>(null);

// ── <Document> ────────────────────────────────────────────────────────────────
export function Document({
  file,
  onLoadSuccess,
  loading,
  error,
  children,
  className,
}: {
  /** URL or data URI of the PDF. */
  file: string | null | undefined;
  /** Fires with `{ numPages }` once the PDF parses. Matches react-pdf's API. */
  onLoadSuccess?: (info: { numPages: number }) => void;
  /** Rendered while pdfjs + the file are loading. */
  loading?: ReactNode;
  /** Rendered if the load fails. */
  error?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!file) {
      setPdf(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setPdf(null);
    setLoadError(null);

    loadPdfjs()
      .then((lib) => lib.getDocument(file).promise)
      .then((loaded) => {
        if (cancelled) return;
        setPdf(loaded);
        onLoadSuccess?.({ numPages: loaded.numPages });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error('[pdf-shim] failed to load PDF:', err);
        setLoadError(err);
      });

    return () => { cancelled = true; };
    // onLoadSuccess deliberately omitted - callers usually pass an inline
    // function which would reset this effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  if (loadError) return <div className={className}>{error}</div>;
  if (!pdf) return <div className={className}>{loading}</div>;

  return (
    <div className={className}>
      <PdfContext.Provider value={pdf}>{children}</PdfContext.Provider>
    </div>
  );
}

// ── <Page> ────────────────────────────────────────────────────────────────────
export function Page({
  pageNumber,
  width,
  scale = 1,
  className,
}: {
  pageNumber: number;
  /** Optional fixed width in px. When set, scale is computed from this. */
  width?: number;
  /** Direct scale factor (ignored if `width` provided). Defaults to 1. */
  scale?: number;
  className?: string;
  /** Accepted for react-pdf API compatibility - the shim never renders
   *  a text layer (canvas-only), so this prop is intentionally ignored. */
  renderTextLayer?: boolean;
  /** Same - react-pdf compat. Shim has no annotation layer. */
  renderAnnotationLayer?: boolean;
}) {
  const pdf = useContext(PdfContext);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const cssScale = width ? width / baseViewport.width : scale;
      // Hi-DPI: render the canvas at 2-3× the display size so text stays razor
      // sharp (crisp at fullscreen / retina), but show it at the logical size
      // so layout + field overlays are unaffected.
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      const renderMult = Math.min(3, Math.max(2, dpr * 2));
      const viewport = page.getViewport({ scale: cssScale * renderMult });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / renderMult}px`;
      canvas.style.height = `${viewport.height / renderMult}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      page.render({ canvasContext: ctx, viewport }).promise.catch(() => {
        // Cancelled renders throw - ignore.
      });
    });

    return () => { cancelled = true; };
  }, [pdf, pageNumber, width, scale]);

  return <canvas ref={canvasRef} className={className} />;
}

// ── pdfjs proxy - for callers that did `import { pdfjs } from 'react-pdf'` ───
// They mostly use it to set `GlobalWorkerOptions.workerSrc`, which our loader
// already does. Provide a no-op shim so existing code doesn't crash.
export const pdfjs = {
  GlobalWorkerOptions: {
    // Setter is a no-op - the shim sets the worker itself.
    set workerSrc(_v: string) { /* ignored */ },
    get workerSrc(): string { return `${PDFJS_BASE}/pdf.worker.min.js`; },
  },
  version: PDFJS_VERSION,
};
