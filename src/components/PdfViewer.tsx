'use client';

/**
 * PdfViewer - CDN-loaded pdf.js implementation with per-page tracking.
 *
 * Why CDN script-tag loading? Because Next.js 15's Webpack ESM externals
 * handler crashes when bundling pdfjs-dist - the module's pdf.mjs runs
 * `Object.defineProperty(exports, '__esModule', …)` before `exports` is
 * initialised by Webpack, throwing "Object.defineProperty called on non-object".
 *
 * Loading pdfjs-dist as a UMD script at runtime in the browser sidesteps the
 * bundler completely:
 *   - Browser fetches a static .js file from cdnjs
 *   - Runs it as a global, setting window.pdfjsLib
 *   - We use that global for getDocument/getPage/render
 *
 * No Webpack, no ESM externals, no crash. The trade-off is a 1-time CDN
 * fetch (~300KB) on first PDF open - cached forever after.
 *
 * Per-page tracking is preserved via IntersectionObserver - onPageView fires
 * each time the most-visible page changes, recording seconds spent.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, FileWarning, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── PDF.js types (minimal - we only use a few APIs) ──────────────────────
type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string | { url: string }) => { promise: Promise<PdfDoc> };
  version: string;
};
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

// ── CDN loader ─────────────────────────────────────────────────────────────
// pdfjs-dist 3.11.174 is the last version with a UMD build (window.pdfjsLib),
// so it loads cleanly via a plain <script> tag without `type="module"` ceremony.
// Its API surface (getDocument/getPage/render) is identical to v4/v5 for our
// needs, so swapping versions later is a one-line change.
const PDFJS_VERSION = '3.11.174';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfJsLoadPromise: Promise<PdfJsLib> | null = null;

function loadPdfJsFromCdn(): Promise<PdfJsLib> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PDF.js can only load in the browser.'));
  }
  // Already loaded once on this page? Reuse it.
  const existing = (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
  if (existing) return Promise.resolve(existing);

  // Already loading? Return the in-flight promise so we don't inject the script twice.
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise<PdfJsLib>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${PDFJS_BASE}/pdf.min.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      const lib = (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
      if (!lib) {
        reject(new Error('PDF.js loaded but global pdfjsLib was not set.'));
        return;
      }
      // Point at the matching worker on the same CDN
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.js`;
      resolve(lib);
    };
    script.onerror = () => {
      pdfJsLoadPromise = null; // allow retry
      reject(new Error('Failed to load PDF.js from CDN. Check your network connection.'));
    };
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
}

interface PdfViewerProps {
  url: string;
  /** Called when a page leaves the viewport or the viewer unmounts. */
  onPageView?: (pageNumber: number, secondsViewed: number) => void;
  /** Called once the document loads, with its total page count. */
  onDocumentLoad?: (numPages: number) => void;
  /**
   * Watermark text already resolved (tokens replaced). When set, it's
   * tiled across each rendered PDF page - not in the surrounding chrome -
   * so any screenshot of the visible content carries the watermark.
   */
  watermarkText?: string | null;
}

// Tiled SVG watermark - placed inside each PDF page wrapper so it covers
// only the actual page content. White-on-low-opacity reads on most light/
// dark PDFs without obscuring text; pointer-events-none never blocks
// scroll or text-selection clicks.
function PageWatermark({ text }: { text: string }) {
  if (typeof window === 'undefined') return null;
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='380' height='220'>
                 <text
                   x='50%' y='50%'
                   font-size='14'
                   font-family='Geist, ui-sans-serif, sans-serif'
                   font-weight='600'
                   fill='black' fill-opacity='0.18'
                   transform='rotate(-28, 190, 110)'
                   text-anchor='middle' dominant-baseline='middle'
                 >${safe}</text>
               </svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundImage: url, backgroundRepeat: 'repeat' }}
      aria-hidden
    />
  );
}

export default function PdfViewer({ url, onPageView, onDocumentLoad, watermarkText }: PdfViewerProps) {
  const [pdfLib, setPdfLib] = useState<PdfJsLib | null>(null);
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // PAGED mode (phones): small screens fit several scaled-down pages in the
  // viewport at once, which splits page-time analytics evenly across all of
  // them and lies to the founder. On phones we show ONE page at a time with
  // prev/next controls so per-page timing is exact.
  const [paged, setPaged] = useState(false);
  useEffect(() => {
    setPaged(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageWrapperRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  const pageTimerRef = useRef<{ page: number; start: number }>({ page: 1, start: Date.now() });

  const onPageViewRef = useRef(onPageView);
  useEffect(() => {
    onPageViewRef.current = onPageView;
  }, [onPageView]);

  // Background tabs must not accrue page time: when the tab hides, flush
  // what was actually watched and freeze the clock; when it becomes visible
  // again, restart it. Otherwise "opened the deck, went to another tab for
  // ten minutes" reads as ten minutes on that page.
  useEffect(() => {
    const onVis = () => {
      const t = pageTimerRef.current;
      if (document.visibilityState === 'hidden') {
        const elapsed = Math.round((Date.now() - t.start) / 1000);
        if (elapsed > 0 && onPageViewRef.current) onPageViewRef.current(t.page, elapsed);
      }
      // Either direction: restart the clock so hidden time never counts.
      pageTimerRef.current = { page: t.page, start: Date.now() };
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Step 1: load PDF.js via CDN script tag (one-time global load).
  useEffect(() => {
    let cancelled = false;
    loadPdfJsFromCdn()
      .then((lib) => {
        if (cancelled) return;
        setPdfLib(lib);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error('Failed to load PDF.js:', err);
        setError(err.message);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 2: load this specific document.
  useEffect(() => {
    if (!pdfLib || !url) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const doc = await pdfLib.getDocument(url).promise;
        if (cancelled) return;
        setPdf(doc);
        setNumPages(doc.numPages);
        try { onDocumentLoad?.(doc.numPages); } catch { /* analytics only */ }
        pageTimerRef.current = { page: 1, start: Date.now() };
        setCurrentPage(1);
      } catch (err) {
        if (cancelled) return;
        console.error('PDF load failed:', err);
        setError('Could not load this PDF. The file may be unavailable or the link may have expired.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfLib, url]);

  // Step 3: render each page to its canvas, scaled to container width.
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdf) return;
      const canvas = pageCanvasRefs.current.get(pageNum);
      const wrapper = pageWrapperRefs.current.get(pageNum);
      if (!canvas || !wrapper) return;

      try {
        const page = await pdf.getPage(pageNum);
        // Tighter side margins on phones so the page uses the full width.
        const sidePad = paged ? 16 : 64;
        const containerWidth = (containerRef.current?.clientWidth ?? 800) - sidePad;
        const initial = page.getViewport({ scale: 1 });
        const cssScale = Math.min(2, containerWidth / initial.width);

        // RETINA FIX: render the canvas backing store at devicePixelRatio,
        // but display it at CSS size. Without this, high-density screens
        // (every phone is 2x to 3x) stretch a low-res raster and the page
        // looks blurry instead of print-sharp.
        const dpr = Math.min(
          (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1,
          3,
        );
        const viewport = page.getViewport({ scale: cssScale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.error(`Failed to render PDF page ${pageNum}:`, err);
      }
    },
    [pdf, paged]
  );

  useEffect(() => {
    if (!pdf || numPages === 0) return;
    let cancelled = false;
    (async () => {
      // Render in sequence so a big PDF doesn't block the main thread all at once.
      for (let i = 1; i <= numPages; i++) {
        if (cancelled) break;
        await renderPage(i);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, numPages, renderPage]);

  // Step 4: track which page is most prominent in the viewport.
  // (Desktop continuous-scroll mode only - paged mode times pages exactly
  // on navigation instead.)
  useEffect(() => {
    if (numPages === 0 || paged) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Determine the page with the highest intersection ratio across all entries
        let bestPage = pageTimerRef.current.page;
        let bestRatio = -1;
        entries.forEach((entry) => {
          const p = Number((entry.target as HTMLElement).dataset.page);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestPage = p;
          }
        });

        if (bestRatio > 0 && bestPage !== pageTimerRef.current.page) {
          const elapsed = Math.floor((Date.now() - pageTimerRef.current.start) / 1000);
          if (elapsed > 0 && onPageViewRef.current) {
            onPageViewRef.current(pageTimerRef.current.page, elapsed);
          }
          pageTimerRef.current = { page: bestPage, start: Date.now() };
          setCurrentPage(bestPage);
        }
      },
      { root: container, threshold: [0.1, 0.25, 0.5, 0.75, 0.9] }
    );

    pageWrapperRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [numPages, paged]);

  // Step 5: on unmount, flush the final page's time. Skipped while the tab
  // is hidden: that stretch was already flushed at hide, and counting from
  // there would bill background time to the page.
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const { page, start } = pageTimerRef.current;
      const elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed > 0 && onPageViewRef.current) {
        onPageViewRef.current(page, elapsed);
      }
    };
  }, []);

  const scrollToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    if (paged) {
      // Flush the time spent on the page we're leaving, then switch.
      const { page, start } = pageTimerRef.current;
      const elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed > 0 && page !== pageNum && onPageViewRef.current) {
        onPageViewRef.current(page, elapsed);
      }
      pageTimerRef.current = { page: pageNum, start: Date.now() };
      setCurrentPage(pageNum);
      containerRef.current?.scrollTo({ top: 0 });
      return;
    }
    const wrapper = pageWrapperRefs.current.get(pageNum);
    if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading && !error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-white/60">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm">{pdfLib ? 'Loading PDF…' : 'Loading viewer…'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-900 text-white/60 p-8 text-center">
        <FileWarning className="h-12 w-12" />
        <p className="text-base font-medium">Preview not available</p>
        <p className="text-sm max-w-md">{error}</p>
        {url && (
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Open in a new tab
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-800">
      {/* Floating prev/next arrows, vertically centered on the sides - one
          tap to move a page without hunting for the bottom bar. */}
      {numPages > 1 && (
        <>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={() => scrollToPage(currentPage + 1)}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto py-6 flex flex-col items-center gap-4"
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <div
            key={pageNum}
            data-page={pageNum}
            ref={(el) => {
              if (el) pageWrapperRefs.current.set(pageNum, el);
              else pageWrapperRefs.current.delete(pageNum);
            }}
            className={`bg-white shadow-2xl relative${
              paged
                ? pageNum !== currentPage
                  ? ' hidden'
                  : ' m-auto' /* auto margins center the single page vertically
                                 AND horizontally, but never crop when the page
                                 is taller than the screen (unlike justify-center) */
                : ''
            }`}
          >
            <canvas
              ref={(el) => {
                if (el) pageCanvasRefs.current.set(pageNum, el);
                else pageCanvasRefs.current.delete(pageNum);
              }}
            />
            {/* Watermark - tiled over the actual page surface only,
                so a screenshot of the page contents includes the
                visitor's email/IP. */}
            {watermarkText && <PageWatermark text={watermarkText} />}
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-white/80 text-xs font-mono">
              {pageNum} / {numPages}
            </div>
          </div>
        ))}
      </div>

      {numPages > 1 && (
        <div className="shrink-0 flex items-center justify-center gap-4 py-3 bg-black/70 border-t border-white/10">
          <button
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
            className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="text-white/70 text-sm select-none font-mono tabular-nums">
            Page {currentPage} of {numPages}
          </span>
          <button
            disabled={currentPage >= numPages}
            onClick={() => scrollToPage(currentPage + 1)}
            className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
