'use client';

/**
 * SharedFileView - renders a SINGLE file for a file-scoped share link, after the
 * gates (email/password/NDA/etc.) have passed. The signed URL is fetched by
 * GatesFlow from /api/share-links/validate, which only returns it once every
 * server-side gate has cleared - so the URL never reaches an unauthorized
 * visitor. ScreenGuard (mounted on all /shared routes) adds the right-click /
 * copy / print / screenshot deterrents on top.
 *
 * Rendering strategy (the DocSend approach - works on phones too):
 *   - PDF     -> canvas-based <PdfViewer> (pdf.js). Mobile browsers cannot
 *                render PDFs inside iframes (Android/iOS show a blank box or
 *                force a download), which is why the old blob-iframe version
 *                "could not open" for recipients on phones. Canvas pages render
 *                everywhere, and the watermark is stamped per page.
 *   - Images  -> <img>
 *   - Video   -> <video controls>  |  Audio -> <audio controls>
 *   - Text    -> fetched and rendered as monospace text (txt/csv/md/json/logs)
 *   - Office  -> Microsoft Office online viewer iframe (docx/xlsx/pptx/doc/xls/ppt)
 *   - Other   -> download button if allowed, otherwise an honest explanation -
 *                never a silent dead end.
 */

import { useEffect, useState } from 'react';
import { Download, FileWarning, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PdfViewer from '@/components/PdfViewer';

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  watermarkText: string | null;
  allowDownload: boolean;
}

type Kind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'office' | 'other';

function detectKind(file: SharedFile): Kind {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop()! : '';

  const is = (...exts: string[]) => exts.includes(ext);

  if (is('pdf') || /pdf/.test(type)) return 'pdf';
  if (is('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'heic') || /image/.test(type)) return 'image';
  if (is('mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi') || /video/.test(type)) return 'video';
  if (is('mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac') || /audio/.test(type)) return 'audio';
  if (is('txt', 'csv', 'md', 'json', 'log', 'xml', 'yml', 'yaml')) return 'text';
  if (is('doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx')) return 'office';
  return 'other';
}

// Tiled overlay for the non-PDF types (PdfViewer stamps its own per-page
// watermark so screenshots of the page surface always carry it).
function WatermarkOverlay({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-wrap content-center justify-center gap-x-16 gap-y-24 overflow-hidden opacity-20">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="rotate-[-30deg] whitespace-nowrap text-2xl font-bold text-gray-500 select-none"
        >
          {text}
        </span>
      ))}
    </div>
  );
}

export function SharedFileView({ file }: { file: SharedFile }) {
  const kind = detectKind(file);

  // Text files: fetch the content so we can render it inline.
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textFailed, setTextFailed] = useState(false);
  useEffect(() => {
    if (kind !== 'text') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error('fetch failed');
        const t = await res.text();
        if (!cancelled) setTextContent(t.slice(0, 500_000)); // cap absurd files
      } catch {
        if (!cancelled) setTextFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [kind, file.url]);

  const Fallback = ({ reason }: { reason: string }) => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-gray-300">
      <FileWarning className="h-10 w-10 text-gray-500" />
      <p className="text-sm max-w-sm">{reason}</p>
      {file.allowDownload ? (
        <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download to view
          </Button>
        </a>
      ) : (
        <p className="text-xs text-gray-500 max-w-sm">
          The sender has turned off downloads for this link, so this file type can only be
          previewed. Ask the sender to enable downloads or share it as a PDF.
        </p>
      )}
    </div>
  );

  const body = (() => {
    switch (kind) {
      case 'pdf':
        return (
          <PdfViewer url={file.url} watermarkText={file.watermarkText ?? undefined} />
        );
      case 'image':
        return (
          <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={file.name} className="max-h-full max-w-full object-contain" />
          </div>
        );
      case 'video':
        return (
          <div className="flex h-full w-full items-center justify-center bg-black p-2">
            <video
              src={file.url}
              controls
              controlsList={file.allowDownload ? undefined : 'nodownload'}
              playsInline
              className="max-h-full max-w-full"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="flex h-full w-full items-center justify-center p-6">
            <audio
              src={file.url}
              controls
              controlsList={file.allowDownload ? undefined : 'nodownload'}
              className="w-full max-w-xl"
            />
          </div>
        );
      case 'text':
        return textFailed ? (
          <Fallback reason="This file could not be loaded. The link may have expired - try reopening it." />
        ) : textContent === null ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="h-full w-full overflow-auto bg-white">
            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-sm text-gray-900">
              {textContent}
            </pre>
          </div>
        );
      case 'office':
        // Microsoft's online viewer renders Word / Excel / PowerPoint from any
        // publicly reachable URL (our 1-hour signed URL qualifies). Same-page
        // iframe is allowed by CSP frame-src (view.officeapps.live.com).
        return (
          <iframe
            title={file.name}
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
            className="h-full w-full border-0 bg-white"
          />
        );
      default:
        return (
          <Fallback reason={`A preview isn't available for this file type (${file.name.split('.').pop() ?? 'unknown'}).`} />
        );
    }
  })();

  return (
    <div className="relative flex h-screen w-full flex-col bg-gray-900">
      <header className="flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-950 px-4 py-3 text-white">
        <span className="truncate text-sm font-medium">{file.name}</span>
        {file.allowDownload ? (
          <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </a>
        ) : (
          <span className="text-xs text-gray-400">Downloads disabled</span>
        )}
      </header>

      <div className="relative flex-1 overflow-hidden">
        {body}
        {/* PdfViewer stamps per-page watermarks itself; overlay the rest. */}
        {file.watermarkText && kind !== 'pdf' && <WatermarkOverlay text={file.watermarkText} />}
      </div>
    </div>
  );
}
