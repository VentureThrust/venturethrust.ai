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

import { useEffect, useRef, useState } from 'react';
import { Download, FileWarning, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PdfViewer from '@/components/PdfViewer';
import { FileWatchlistButton } from '@/components/file-watchlist-button';

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  watermarkText: string | null;
  allowDownload: boolean;
}

function getDeviceInfo(): { device: string; os: string } {
  if (typeof navigator === 'undefined') return { device: 'Unknown', os: 'Unknown' };
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'Tablet';
  else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) device = 'Mobile';
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  return { device, os };
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

export function SharedFileView({
  file,
  token,
  visitorEmail,
}: {
  file: SharedFile;
  /** Share link token: when present, session analytics are recorded. */
  token?: string;
  visitorEmail?: string | null;
}) {
  const kind = detectKind(file);

  // ── Session analytics ─────────────────────────────────────────────────
  // One visit entry per open (files.visits), updated by cumulative beats:
  // duration, device/os, and per-page dwell for PDFs. Without this the
  // owner's activity view showed 00:00 and "No device details recorded".
  //
  // Duration counts ONLY eyes-on-screen time: the stopwatch pauses when the
  // visitor switches to another tab or minimizes, and resumes when they come
  // back. Leaving the deck open in a background tab records nothing.
  const visitIdRef = useRef(`visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const activeMsRef = useRef(0);
  const visibleSinceRef = useRef<number | null>(null);
  const pageTimesRef = useRef<Record<string, number>>({});
  const totalPagesRef = useRef(0);

  // Video engagement: full watch-throughs ('ended' events), replays (a
  // backward seek of more than 2s, recording the second they jumped BACK
  // TO), and the chronological WATCH SEGMENTS - each continuous stretch
  // actually played, e.g. 0:00→0:30 then 0:11→0:30 tells the owner the
  // viewer rewound at 0:30 and rewatched from 0:11. A restart right after
  // the video ended is not double-counted as a replay: that watch already
  // counts in completedViews.
  const videoStatsRef = useRef({
    completedViews: 0,
    replays: [] as number[],
    segments: [] as Array<[number, number]>,
    segStart: null as number | null,
    durationSec: 0,
    maxPos: 0,
    lastTime: 0,
    justEnded: false,
  });
  // Close the currently playing stretch at `endPos` (ignore blips under 1s).
  const closeVideoSegment = (endPos: number) => {
    const s = videoStatsRef.current;
    if (s.segStart !== null && endPos > s.segStart + 1 && s.segments.length < 100) {
      s.segments.push([Math.round(s.segStart), Math.round(endPos)]);
    }
    s.segStart = null;
  };

  useEffect(() => {
    if (!token) return;
    if (visibleSinceRef.current === null && document.visibilityState === 'visible') {
      visibleSinceRef.current = Date.now();
    }
    const { device, os } = getDeviceInfo();
    const activeSeconds = () =>
      Math.floor((activeMsRef.current
        + (visibleSinceRef.current ? Date.now() - visibleSinceRef.current : 0)) / 1000);
    const payload = () => JSON.stringify({
      token,
      visitId: visitIdRef.current,
      email: visitorEmail || undefined,
      durationSeconds: activeSeconds(),
      device,
      os,
      pageViews: pageTimesRef.current,
      totalPages: totalPagesRef.current,
      video: kind === 'video'
        ? (() => {
            const s = videoStatsRef.current;
            // Cumulative snapshot: closed segments plus the live one (its
            // end keeps advancing beat by beat while they watch).
            const segments = [...s.segments];
            if (s.segStart !== null && s.lastTime > s.segStart + 1 && segments.length < 100) {
              segments.push([Math.round(s.segStart), Math.round(s.lastTime)]);
            }
            return {
              completedViews: s.completedViews,
              replays: s.replays,
              segments,
              durationSec: Math.round(s.durationSec),
              maxPos: Math.round(s.maxPos),
            };
          })()
        : undefined,
    });
    const beat = () => {
      fetch('/api/track/file-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload(),
        keepalive: true,
      }).catch(() => {});
    };
    const flush = () => {
      // sendBeacon survives tab close; fetch keepalive is the fallback.
      try {
        navigator.sendBeacon('/api/track/file-open', new Blob([payload()], { type: 'application/json' }));
      } catch {
        beat();
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (visibleSinceRef.current !== null) {
          activeMsRef.current += Date.now() - visibleSinceRef.current;
          visibleSinceRef.current = null;
        }
        flush(); // save what was watched the moment they switch away
      } else if (visibleSinceRef.current === null) {
        visibleSinceRef.current = Date.now();
      }
    };
    beat(); // the visit appears the moment the file opens
    const timer = setInterval(beat, 6000);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [token, visitorEmail]);

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
          <PdfViewer
            url={file.url}
            watermarkText={file.watermarkText ?? undefined}
            onDocumentLoad={(n) => { totalPagesRef.current = n; }}
            onPageView={(page, seconds) => {
              const k = String(page);
              pageTimesRef.current[k] = (pageTimesRef.current[k] || 0) + seconds;
            }}
          />
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
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d)) videoStatsRef.current.durationSec = d;
              }}
              onPlay={(e) => {
                const s = videoStatsRef.current;
                if (s.segStart === null) s.segStart = e.currentTarget.currentTime;
              }}
              onPause={(e) => {
                closeVideoSegment(e.currentTarget.currentTime);
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (!v.seeking) {
                  videoStatsRef.current.lastTime = v.currentTime;
                  if (v.currentTime > videoStatsRef.current.maxPos) {
                    videoStatsRef.current.maxPos = v.currentTime;
                  }
                }
              }}
              onSeeked={(e) => {
                const v = e.currentTarget;
                const s = videoStatsRef.current;
                const target = v.currentTime;
                // The stretch watched before the jump ends where they left.
                closeVideoSegment(s.lastTime);
                if (s.justEnded && target < 2) {
                  // Post-end restart: counted by completedViews, not a replay.
                  s.justEnded = false;
                } else if (target < s.lastTime - 2) {
                  s.replays.push(Math.max(0, Math.round(target)));
                }
                s.lastTime = target;
                if (!v.paused) s.segStart = target;
              }}
              onEnded={(e) => {
                closeVideoSegment(e.currentTarget.duration || videoStatsRef.current.lastTime);
                videoStatsRef.current.completedViews += 1;
                videoStatsRef.current.justEnded = true;
              }}
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
        <div className="flex shrink-0 items-center gap-2">
          {/* Investor plan accounts only; everyone else sees nothing. */}
          <FileWatchlistButton fileId={file.id} startupName={file.name} />
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
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {body}
        {/* PdfViewer stamps per-page watermarks itself; overlay the rest. */}
        {file.watermarkText && kind !== 'pdf' && <WatermarkOverlay text={file.watermarkText} />}
      </div>
    </div>
  );
}
