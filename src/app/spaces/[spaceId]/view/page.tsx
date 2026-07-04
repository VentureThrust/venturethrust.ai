//src\app\spaces\[spaceId]\view\page.tsx

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { UpcomingFeatureDialog } from '@/components/upcoming-feature-dialog';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2, Folder, File as FileIcon, ChevronRight,
  Search, Sparkles, MessageSquare, Link2Off, Package,
  FileText, Image as ImageIcon, Film, Music, Archive, Download,
  CheckCircle, X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight as ChevronRightIcon,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { InactiveLink } from '@/components/inactive-link';
import { WatchlistButton } from './watchlist-button';
import { format } from 'date-fns';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-white/60" />
    </div>
  ),
});

const VideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  { ssr: false }
);

import type { PlaybackEvent } from '@/components/VideoPlayer';

// ─── Types ────────────────────────────────────────────────────────────────────

type SpaceRow = {
  id: string;
  title: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  logo: string | null;
  // Watermark template - uses {{email}} / {{ip-address}} / {{date}} / {{time}}
  // tokens which are replaced at render time with the visitor's actual info.
  // Null when the space owner has watermark disabled.
  watermark_text: string | null;
  // ISO 8601 timestamp. After this moment the visitor view shows a
  // "link expired" message instead of the space contents. Null = never
  // expires.
  expires_at: string | null;
};

type FileRow = {
  id: string;
  name: string;
  type: string;
  storage_path: string;
  created_at: string;
  views: number;
  folder_id: string | null;
  space_id: string;
  visits: FileVisitEntry[];
  is_visible?: boolean | null;
};

type FolderRow = {
  id: string;
  name: string;
  parent_id: string | null;
  space_id: string;
  is_visible?: boolean | null;
};

type FolderNode = FolderRow & {
  children: FolderNode[];
  files: FileRow[];
};

type BreadcrumbItem = { id: string | null; name: string };

export type FileVisitEntry = {
  email: string;
  device: string;
  timeSpent: number;
  openedAt: string;
};

type ActiveFileSession = {
  file: FileRow;
  openedAt: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseType(type: string, name = ''): string {
  const filenameExt = (name.split('.').pop() ?? '').toLowerCase().trim();
  if (filenameExt && !filenameExt.includes(' ')) return filenameExt;
  const raw = (type || '').toLowerCase().trim();
  if (!raw) return '';
  if (!raw.includes('/')) return raw;
  const sub = raw.split('/')[1] ?? '';
  if (sub === 'quicktime') return 'mov';
  if (sub === 'x-msvideo') return 'avi';
  if (sub === 'mpeg') return 'mp3';
  if (sub === 'svg+xml') return 'svg';
  return sub;
}

function getFileIcon(type: string, name = '') {
  const t = normaliseType(type, name);
  if (t === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(t)) return ImageIcon;
  if (['mp4', 'mov', 'avi', 'webm'].includes(t)) return Film;
  if (['mp3', 'wav', 'ogg'].includes(t)) return Music;
  if (['zip', 'rar', '7z', 'tar'].includes(t)) return Archive;
  return FileIcon;
}

function getDeviceType(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

// (Removed the INTERNAL_FOLDER_NAMES promotion - it used to flatten any
// top-level folder named "Home/Root/Files" by promoting its contents up to
// the root. That hid the real folder hierarchy from visitors. Now the
// folder tree is rendered exactly as stored in the DB, so structure is
// always visible.)

// Recursively count files in a folder + all its subfolders. Visitors see this
// total on each folder card so they know how much content is inside without
// navigating in.
function countFilesRecursive(folder: FolderNode): number {
  let count = folder.files.length;
  for (const child of folder.children) count += countFilesRecursive(child);
  return count;
}

/**
 * Visitor-facing folder card - clean DocSend-style row with:
 *   - Expand chevron (only if the folder has subfolders) - toggles a nested
 *     preview without leaving the current view
 *   - Folder icon + name
 *   - File count badge ("12 files" - counted recursively across all subfolders)
 *   - Subfolder count badge (if any)
 *   - Hover ChevronRight indicating click-to-enter
 *
 * The whole row navigates into the folder when clicked; the chevron is a
 * separate hit target that toggles inline expansion instead.
 */
function VisitorFolderCard({
  folder,
  onNavigate,
  depth = 0,
}: {
  folder: FolderNode;
  onNavigate: (f: FolderNode) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalFiles = countFilesRecursive(folder);
  const subfolderCount = folder.children.length;
  const hasSubfolders = subfolderCount > 0;

  return (
    <div>
      <div
        onClick={() => onNavigate(folder)}
        className="group flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm cursor-pointer transition-all"
        style={{ marginLeft: depth * 20 }}
      >
        {/* Expand toggle - separate hit target, only when there are subfolders */}
        {hasSubfolders ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="p-1 -m-1 rounded hover:bg-gray-200 transition-colors shrink-0"
            aria-label={expanded ? 'Collapse subfolders' : 'Expand subfolders'}
          >
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        ) : (
          <div className="w-6" /> /* spacer so titles align */
        )}

        <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
          <Folder className="h-5 w-5 text-blue-500 fill-blue-200" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate group-hover:text-blue-700 transition-colors">
            {folder.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>
              {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
            </span>
            {hasSubfolders && (
              <>
                <span>·</span>
                <span>
                  {subfolderCount} {subfolderCount === 1 ? 'folder' : 'folders'}
                </span>
              </>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Expanded preview - nested folders shown inline */}
      {expanded && hasSubfolders && (
        <div className="mt-1.5 space-y-1.5 ml-3 pl-3 border-l-2 border-blue-100">
          {folder.children.map((sub) => (
            <VisitorFolderCard
              key={sub.id}
              folder={sub}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildFolderTree(folders: FolderRow[], files: FileRow[]): {
  tree: FolderNode[];
  rootFolderId: string | null;
} {
  const map = new Map<string, FolderNode>();
  folders.forEach(f => map.set(f.id, { ...f, children: [], files: [] }));
  files.forEach(file => {
    if (file.folder_id && map.has(file.folder_id)) {
      map.get(file.folder_id)!.files.push(file);
    }
  });
  const roots: FolderNode[] = [];
  folders.forEach(f => {
    if (f.parent_id && map.has(f.parent_id)) {
      map.get(f.parent_id)!.children.push(map.get(f.id)!);
    } else if (!f.parent_id) {
      roots.push(map.get(f.id)!);
    }
  });
  // Return the real DB structure as-is. Visitors see actual folders.
  return { tree: roots, rootFolderId: null };
}

function findFolderById(nodes: FolderNode[], id: string): FolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findFolderById(node.children, id);
    if (found) return found;
  }
  return null;
}

type FileCategory = 'pdf' | 'image' | 'video' | 'audio' | 'office' | 'text' | 'unsupported';

function getFileCategory(type: string, name = ''): FileCategory {
  const t = normaliseType(type, name);
  if (t === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(t)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(t)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(t)) return 'audio';
  // Word / Excel / PowerPoint render through Microsoft's embed viewer.
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(t)) return 'office';
  if (['txt', 'csv', 'md', 'json', 'xml', 'log', 'yml', 'yaml'].includes(t)) return 'text';
  return 'unsupported';
}

function getMimeType(type: string, name = ''): string {
  const t = normaliseType(type, name);
  const map: Record<string, string> = {
    mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', webm: 'video/webm',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  };
  return map[t] || 'application/octet-stream';
}

type ReportState = 'idle' | 'generating' | 'done' | 'error' | 'notified';

// ─── Watermark token resolver ─────────────────────────────────────────────────
// The space owner stores a watermark template with tokens like {{email}},
// {{ip-address}}, {{date}}, {{time}} via the permissions page. At render
// time we swap each token for the actual visitor data so every viewer sees
// a unique watermark - discourages screenshot leaks because the screenshot
// itself shows who took it.
//
// Returns null if the template is empty/disabled OR if the resolved string
// is just whitespace - caller uses null to skip rendering the overlay.

function resolveWatermarkText(
  template: string | null | undefined,
  vars: { email?: string | null; ip?: string | null }
): string | null {
  if (!template || !template.trim()) return null;
  const now = new Date();
  const resolved = template
    .replace(/\{\{\s*email\s*\}\}/gi, vars.email?.trim() || 'Anonymous')
    .replace(/\{\{\s*ip-address\s*\}\}/gi, vars.ip?.trim() || 'Unknown')
    .replace(/\{\{\s*date\s*\}\}/gi, now.toLocaleDateString())
    .replace(/\{\{\s*time\s*\}\}/gi, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  return resolved.trim() || null;
}

// Tiled SVG watermark - positioned absolute over the file content.
// pointer-events-none so it never intercepts clicks/scrolls; z-10 lifts
// it above PDF/img/video. White text with low opacity reads on the
// dark FileViewer background; XML-escapes specials so a bracket in
// the visitor's email won't break the SVG.

function FileWatermark({ text }: { text: string }) {
  const style = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='260'>
                   <text
                     x='50%'
                     y='50%'
                     font-size='15'
                     font-family='Geist, ui-sans-serif, sans-serif'
                     font-weight='600'
                     fill='white'
                     fill-opacity='0.22'
                     transform='rotate(-28, 210, 130)'
                     text-anchor='middle'
                     dominant-baseline='middle'
                   >
                     ${safe}
                   </text>
                 </svg>`;
    return {
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
      backgroundRepeat: 'repeat' as const,
    };
  }, [text]);

  return <div className="absolute inset-0 z-10 pointer-events-none" style={style} aria-hidden />;
}

// ─── Inline File Viewer ───────────────────────────────────────────────────────

interface FileViewerProps {
  file: FileRow;
  url: string;
  allFiles: FileRow[];
  onClose: () => void;
  onNavigate: (file: FileRow) => void;
  allowDownload?: boolean;
  onPageView?: (fileId: string, pageNumber: number, secondsViewed: number) => void;
  onPlaybackEvent?: (fileId: string, event: PlaybackEvent) => void;
  /** Opens the Ask-a-Question dialog. Question context will be tagged with
   *  the currently-open file via activeSessionRef, so the owner sees which
   *  file the question came from. */
  onAskQuestion?: () => void;
  /** Resolved watermark text (tokens already replaced). Null = no watermark. */
  watermarkText?: string | null;
}

function FileViewer({ file, url, allFiles, onClose, onNavigate, allowDownload = false, onPageView, onPlaybackEvent, onAskQuestion, watermarkText }: FileViewerProps) {
  const category = getFileCategory(file.type, file.name);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotation, setImgRotation] = useState(0);
  // Text files are fetched and rendered inline (readable on every device).
  const [textContent, setTextContent] = useState<string | null>(null);
  useEffect(() => {
    setTextContent(null);
    if (category !== 'text' || !url) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const t = await res.text();
        if (!cancelled) setTextContent(t.slice(0, 500_000));
      } catch { /* falls through to unsupported-style fallback */ }
    })();
    return () => { cancelled = true; };
  }, [category, url]);
  const currentIndex = allFiles.findIndex(f => f.id === file.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allFiles.length - 1;

  useEffect(() => {
    setImgZoom(1);
    setImgRotation(0);
  }, [file.id]);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onContextMenu={handleContextMenu}>
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <span className="text-white font-medium truncate text-sm">{file.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {category === 'image' && (
            <>
              <button onClick={() => setImgZoom(z => Math.max(0.5, z - 0.25))} className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
              <span className="text-white/50 text-xs w-12 text-center">{Math.round(imgZoom * 100)}%</span>
              <button onClick={() => setImgZoom(z => Math.min(4, z + 0.25))} className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
              <button onClick={() => setImgRotation(r => (r + 90) % 360)} className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors" title="Rotate"><RotateCw className="h-4 w-4" /></button>
              <div className="w-px h-5 bg-white/20 mx-1" />
            </>
          )}
          {onAskQuestion && (
            <button
              onClick={onAskQuestion}
              className="flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 transition-colors font-medium"
              title="Ask the space owner a question about this file"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Ask a question
            </button>
          )}
          {allowDownload && (
            <a href={url} download={file.name} className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors border border-white/20">
              <Download className="h-3.5 w-3.5" />Download
            </a>
          )}
          {allFiles.length > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <button disabled={!hasPrev} onClick={() => hasPrev && onNavigate(allFiles[currentIndex - 1])} className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-white/40 text-xs">{currentIndex + 1}/{allFiles.length}</span>
              <button disabled={!hasNext} onClick={() => hasNext && onNavigate(allFiles[currentIndex + 1])} className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRightIcon className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex items-center justify-center relative">
        {/* Watermark goes ON the content (PDF page / image / video frame),
            not in the surrounding black chrome. Each content branch wraps
            its content in a `relative` container with the watermark inside,
            so a screenshot of just the content captures the watermark. */}
        {category === 'pdf' && (
          <PdfViewer
            url={url}
            onPageView={(pageNumber, secondsViewed) => onPageView?.(file.id, pageNumber, secondsViewed)}
            watermarkText={watermarkText}
          />
        )}
        {category === 'image' && (
          <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
            <div
              className="relative inline-block"
              style={{ transform: `scale(${imgZoom}) rotate(${imgRotation}deg)`, transition: 'transform 0.2s ease' }}
            >
              <img
                src={url}
                alt={file.name}
                draggable={false}
                className="block"
                style={{ maxWidth: imgZoom <= 1 ? '100%' : 'none', maxHeight: imgZoom <= 1 ? '100%' : 'none', userSelect: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
                onContextMenu={handleContextMenu}
              />
              {watermarkText && <FileWatermark text={watermarkText} />}
            </div>
          </div>
        )}
        {category === 'video' && (
          <div className="relative max-w-full max-h-full">
            <VideoPlayer
              url={url}
              mimeType={getMimeType(file.type, file.name)}
              onPlaybackEvent={(event) => onPlaybackEvent?.(file.id, event)}
            />
            {watermarkText && <FileWatermark text={watermarkText} />}
          </div>
        )}
        {category === 'audio' && (
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="h-32 w-32 rounded-full bg-white/10 flex items-center justify-center"><Music className="h-16 w-16 text-white/40" /></div>
            <p className="text-white/70 font-medium">{file.name}</p>
            <audio key={url} controls controlsList="nodownload" className="w-full max-w-sm"><source src={url} type={getMimeType(file.type, file.name)} /></audio>
          </div>
        )}
        {category === 'office' && (
          <div className="relative h-full w-full">
            <iframe
              title={file.name}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              className="h-full w-full border-0 bg-white"
            />
            {watermarkText && <FileWatermark text={watermarkText} />}
          </div>
        )}
        {category === 'text' && (
          <div className="relative h-full w-full overflow-auto bg-white">
            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-sm text-gray-900">
              {textContent ?? 'Loading...'}
            </pre>
            {watermarkText && <FileWatermark text={watermarkText} />}
          </div>
        )}
        {category === 'unsupported' && (
          <div className="flex flex-col items-center gap-4 text-white/60 p-8 text-center">
            <FileIcon className="h-16 w-16" />
            <p className="text-lg font-medium text-white/80">Preview not available</p>
            <p className="text-sm">This file type cannot be previewed inline.</p>
            {allowDownload && (
              <a href={url} download={file.name} className="mt-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                <Download className="h-4 w-4" />Download to view
              </a>
            )}
          </div>
        )}

        {/* Floating prev/next FILE arrows, centered on the sides. Hidden for
            PDFs, where the same positions already flip pages (PdfViewer);
            PDF file switching stays in the header controls. */}
        {allFiles.length > 1 && category !== 'pdf' && (
          <>
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => hasPrev && onNavigate(allFiles[currentIndex - 1])}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous file"
              aria-label="Previous file"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => hasNext && onNavigate(allFiles[currentIndex + 1])}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next file"
              aria-label="Next file"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function SpaceViewPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  // `?preview=true` is set by the owner-facing Preview button in /edit.
  // When previewing, we skip session creation + heartbeat + visit logging
  // so the owner's sanity-check doesn't pollute analytics, the audit log
  // ("Anonymous visitor entered"), or visitor-count metrics.
  const isPreview = searchParams?.get('preview') === 'true';
  const { toast } = useToast();
  const [inactive, setInactive] = useState(false);

  const [space, setSpace] = useState<SpaceRow | null>(null);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [rootFiles, setRootFiles] = useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorLimited, setVisitorLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [questionName, setQuestionName] = useState('');
  const [questionEmail, setQuestionEmail] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'Home' }]);

  const [viewerFile, setViewerFile] = useState<FileRow | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  const [reportState, setReportState] = useState<ReportState>('idle');
  const [reportProgress, setReportProgress] = useState(0);
  const [reportId, setReportId] = useState<string | null>(null);

  // ─── Notify-by-email dialog state ───────────────────────────────────────────
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);

  const activeSessionRef = useRef<ActiveFileSession | null>(null);

  const visitorEmail = useMemo(() => {
    if (typeof window === 'undefined') return null;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('shared_session_')) {
        try {
          const val = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (val.spaceId === spaceId && val.email) return val.email;
        } catch { /* ignore */ }
      }
    }
    return null;
  }, [spaceId]);

  // Visitor's name from the same gate record (for prefilling the agreement sign page).
  const visitorName = useMemo(() => {
    if (typeof window === 'undefined') return null;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('shared_session_')) {
        try {
          const val = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (val.spaceId === spaceId && val.name) return val.name as string;
        } catch { /* ignore */ }
      }
    }
    return null;
  }, [spaceId]);

  // ── Visitor meta for watermark + analytics ───────────────────────────────
  // One-shot lookup of the visitor's IP + city. Stored in state so the
  // file watermark can interpolate {{ip-address}} and so the analytics
  // session insert can include `location`. Defaults to nulls - never let
  // a slow geo upstream block rendering.
  const [visitorIp, setVisitorIp] = useState<string | null>(null);
  const [visitorLocation, setVisitorLocation] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/geo', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((j: { ip?: string | null; location?: string | null } | null) => {
        if (cancelled || !j) return;
        if (j.ip) setVisitorIp(j.ip);
        if (j.location) setVisitorLocation(j.location);
      })
      .catch(() => { /* swallow - watermark just shows token literal */ });
    return () => { cancelled = true; };
  }, []);

  // Resolve the watermark template into a concrete string using the
  // current visitor's email + IP (best-effort). When the owner has the
  // watermark setting disabled, space.watermark_text is null and the
  // resolver returns null, so no overlay is rendered.
  //
  // MUST be declared before any early-return branches below - moving it
  // after `if (isLoading) return ...` produced a "change in order of
  // Hooks" warning because the hook would fire on the final render only.
  // Watermarking is ON BY DEFAULT for every shared document: if the owner has
  // not set a custom template, fall back to email + IP + date so every viewer's
  // screenshot is stamped with who they are. This is the real leak protection,
  // since the screenshot itself cannot be blocked.
  const resolvedWatermark = useMemo(
    () => resolveWatermarkText(
      space?.watermark_text && space.watermark_text.trim()
        ? space.watermark_text
        : '{{email}}  •  {{ip-address}}  •  {{date}}',
      { email: visitorEmail, ip: visitorIp },
    ),
    [space?.watermark_text, visitorEmail, visitorIp]
  );

  // ── Deep analytics: per-page PDF tracking & per-segment video tracking ──
  // These callbacks are passed to FileViewer → PdfViewer / VideoPlayer.
  // They write to file_page_views / file_playback_events tables which the
  // analytics drill-down UI reads (with Supabase Realtime). If the tables
  // don't exist yet (migration not run), the inserts fail silently - we log
  // a warning and continue, so the viewer never breaks.

  const handlePageView = useCallback(
    async (fileId: string, pageNumber: number, secondsViewed: number) => {
      if (secondsViewed <= 0) return;
      // Written via the service-role track endpoint: visitors are anonymous
      // (or non-members), so RLS blocks a direct insert from the browser.
      try {
        await fetch('/api/track/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'page-view',
            fileId,
            spaceId,
            email: visitorEmail || null,
            sessionId: viewerSessionIdRef.current,
            pageNumber,
            secondsViewed,
          }),
          keepalive: true,
        });
      } catch (err) {
        console.warn('[file_page_views] write error:', err);
      }
    },
    [spaceId, visitorEmail]
  );

  const handlePlaybackEvent = useCallback(
    async (fileId: string, event: PlaybackEvent) => {
      try {
        const payload: Record<string, unknown> = {
          action: 'playback',
          fileId,
          spaceId,
          email: visitorEmail || null,
          sessionId: viewerSessionIdRef.current,
          eventType: event.type,
        };
        if ('position' in event) payload.position = event.position;
        if ('range_start' in event) payload.rangeStart = event.range_start;
        if ('range_end' in event) payload.rangeEnd = event.range_end;

        await fetch('/api/track/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch (err) {
        console.warn('[file_playback_events] write error:', err);
      }
    },
    [spaceId, visitorEmail]
  );

  const saveFileVisit = useCallback(async (session: ActiveFileSession) => {
    // Don't log file visits when the owner is previewing - same
    // reasoning as skipping session creation. Their sanity-check shouldn't
    // bloat the file.visits array (which drives the analytics file-by-file
    // breakdown).
    if (isPreview) return;
    const timeSpent = Math.max(1, Math.floor((Date.now() - session.openedAt) / 1000));
    // Written via the service-role track endpoint: RLS blocks visitors from
    // updating files.visits directly. keepalive lets the request survive the
    // tab closing (beforeunload), so long viewing sessions are not lost.
    try {
      await fetch('/api/track/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file-visit',
          spaceId,
          fileId: session.file.id,
          email: visitorEmail || null,
          device: getDeviceType(),
          timeSpent,
          openedAt: new Date(session.openedAt).toISOString(),
        }),
        keepalive: true,
      });
    } catch (err) {
      console.warn('[file-visit] write failed:', err);
    }
  }, [visitorEmail, isPreview, spaceId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSessionRef.current) { saveFileVisit(activeSessionRef.current); activeSessionRef.current = null; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveFileVisit]);

  // ── Live viewer-session tracking (heartbeat) ────────────────────────────
  // Creates a row in `viewer_sessions` and pings `last_heartbeat` every 5s.
  // The analytics page subscribes to this table via Supabase Realtime so the
  // owner sees "currently viewing" indicators and live-ticking durations.
  const viewerSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!spaceId || !space) return;
    // Owner-initiated preview - skip session creation entirely. No row in
    // viewer_sessions means: no audit-log "Visitor entered" line, no
    // "Anonymous" entry, no inflated visitor count, no heartbeat traffic.
    if (isPreview) return;

    let cancelled = false;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    const startSession = async () => {
      try {
        // Best-effort IP-based location lookup - fires in parallel with the
        // insert preparation; we don't await the network round-trip blocking
        // session creation if the geo endpoint is slow / unreachable.
        const locationPromise = fetch('/api/geo', { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : null))
          .then((j: { location?: string | null } | null) => j?.location ?? null)
          .catch(() => null);

        const location = await Promise.race([
          locationPromise,
          // Hard timeout - never let geo lookup delay session start > 1.5s
          new Promise<null>(resolve => setTimeout(() => resolve(null), 1500)),
        ]);

        // Create the session via the server (service-role) - anonymous
        // visitors can't write viewer_sessions directly (RLS), so the API does it.
        const res = await fetch('/api/track/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            spaceId,
            email: visitorEmail || null,
            device: getDeviceType(),
            location,
          }),
        });
        const json = await res.json().catch(() => ({ ok: false }));

        if (cancelled) return;
        if ((json as { error?: string }).error === 'visitor_limit') {
          setVisitorLimited(true);
          return;
        }
        if (!json.ok || !json.sessionId) {
          console.warn('[viewer_sessions] start failed - live tracking disabled.');
          return;
        }
        viewerSessionIdRef.current = json.sessionId;

        // Heartbeat every 5 seconds - also reports the current open file.
        heartbeatInterval = setInterval(() => {
          const id = viewerSessionIdRef.current;
          if (!id) return;
          const cur = activeSessionRef.current?.file;
          const totalSec = activeSessionRef.current
            ? Math.floor((Date.now() - activeSessionRef.current.openedAt) / 1000)
            : 0;
          fetch('/api/track/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'beat',
              sessionId: id,
              currentFileId: cur?.id ?? null,
              currentFileName: cur?.name ?? null,
              totalSeconds: totalSec,
            }),
          }).catch(() => {});
        }, 5000);
      } catch (err) {
        console.warn('[viewer_sessions] start failed:', err);
      }
    };

    startSession();

    return () => {
      cancelled = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      const id = viewerSessionIdRef.current;
      if (id) {
        // Mark session ended via the server - sendBeacon survives unmount/tab close.
        const endBody = JSON.stringify({ action: 'end', sessionId: id });
        try {
          navigator.sendBeacon('/api/track/session', new Blob([endBody], { type: 'application/json' }));
        } catch {
          fetch('/api/track/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: endBody, keepalive: true }).catch(() => {});
        }
      }
      viewerSessionIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, space, visitorEmail]);

  useEffect(() => {
    if (!spaceId) return;
    const load = async () => {
      setIsLoading(true);
      const { data: spaceData, error: spaceError } = await supabase.from('spaces').select('id, title, name, description, cover_image, logo, watermark_text, expires_at').eq('id', spaceId).single();
      // Hard expiration gate - if the owner set an expiration date and it's
      // already past, refuse to render the space at all. Surfaced as a
      // friendly "link expired" message via the `error` state.
      if (spaceData?.expires_at) {
        const expiresAt = new Date(spaceData.expires_at as string);
        if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
          setInactive(true); // show the reactivate/message popup, not the room
          setIsLoading(false);
          return;
        }
      }
      if (spaceError || !spaceData) { setError('Space not found.'); setIsLoading(false); return; }

      // Owner-plan gate: if the workspace owner's plan has lapsed, the whole
      // space is inactive. Show the reactivate/message popup, not the room.
      try {
        const st = await fetch('/api/share-links/space-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceId }),
        });
        const sj = st.ok ? await st.json() : { active: true };
        if (sj.active === false) {
          setInactive(true);
          setIsLoading(false);
          return;
        }
      } catch {
        /* fail open - never block a paying owner's room on a hiccup */
      }

      setSpace(spaceData as SpaceRow);

      // Resolve cover image - handles three storage scenarios that visitors hit:
      //  1. cover_image already a full https URL → use as-is
      //  2. cover_image is a storage path → try getPublicUrl (works if bucket public)
      //  3. fallback to signed URL (only works if bucket RLS allows anonymous SELECT)
      const resolveStorageUrl = async (raw: string, bucket: string): Promise<string | null> => {
        if (!raw) return null;
        if (raw.startsWith('http')) return raw;
        // Path stored - get a public URL (always returns something, may 404 if bucket private)
        const pub = supabase.storage.from(bucket).getPublicUrl(raw);
        if (pub.data?.publicUrl) return pub.data.publicUrl;
        // Last-ditch signed URL
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(raw, 86400);
        return signed?.signedUrl ?? null;
      };

      // ── Parallelize all secondary data fetches ─────────────────────────
      // Previously: sequential awaits for cover URL → logo URL → folders →
      // files. Each round-trip is ~150ms over the wire, so 4 sequential
      // calls = ~600ms of waterfall before the page becomes usable.
      // Running them in parallel cuts that to ~150ms (the slowest single
      // call). Space data was already awaited above; everything below it
      // depends only on `spaceData`, so they can all start at once.
      const coverPromise = spaceData.cover_image
        ? resolveStorageUrl(spaceData.cover_image, 'space-covers')
        : Promise.resolve('https://picsum.photos/seed/space-cover-3/1600/400');
      const logoPromise = spaceData.logo
        ? resolveStorageUrl(spaceData.logo, 'space-logos')
        : Promise.resolve(null);
      // Fetch ALL folders + files - we can't apply the is_visible filter
      // at query level because hidden-folder children would then look like
      // orphans (no matching parent in the result set) and the buildTree
      // logic below promotes orphans to root. Cascade is applied client-
      // side after the fetch so descendants of a hidden folder are
      // recursively hidden too.
      const foldersPromise = supabase
        .from('folders')
        .select('*')
        .eq('space_id', spaceId)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
      const filesPromise = supabase
        .from('files')
        .select('*')
        .eq('space_id', spaceId)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      const [coverUrl, logoResolved, foldersRes, filesRes] = await Promise.all([
        coverPromise,
        logoPromise,
        foldersPromise,
        filesPromise,
      ]);

      if (coverUrl) setCoverImageUrl(coverUrl);
      if (logoResolved) setLogoUrl(logoResolved);

      const allFiles = ((filesRes.data) || []) as FileRow[];
      const allFolders = ((foldersRes.data) || []) as FolderRow[];

      // ── Cascade is_visible ──────────────────────────────────────────────
      // A folder is "effectively hidden" if its own is_visible is false OR
      // any ancestor is hidden. A file is hidden if its own is_visible is
      // false OR its parent folder is effectively hidden. We compute the
      // closure by walking from each folder up the parent chain.
      const folderById = new Map(allFolders.map(f => [f.id, f]));
      const hiddenFolderIds = new Set<string>();
      const isVisibleRow = (row: { is_visible?: boolean | null }) => row.is_visible !== false;
      const isFolderEffectivelyVisible = (folderId: string): boolean => {
        let current: FolderRow | undefined = folderById.get(folderId);
        while (current) {
          if (!isVisibleRow(current)) return false;
          if (!current.parent_id) return true;
          current = folderById.get(current.parent_id);
        }
        return true;
      };
      for (const f of allFolders) {
        if (!isFolderEffectivelyVisible(f.id)) hiddenFolderIds.add(f.id);
      }

      const visibleFolders = allFolders.filter(f => !hiddenFolderIds.has(f.id));
      const visibleFiles = allFiles.filter(file => {
        if (!isVisibleRow(file)) return false;
        if (file.folder_id && hiddenFolderIds.has(file.folder_id)) return false;
        return true;
      });

      const { tree, rootFolderId: rid } = buildFolderTree(visibleFolders, visibleFiles);
      setFolderTree(tree);
      const folderIds = new Set(visibleFolders.map((f) => f.id));
      setRootFiles(
        rid
          ? visibleFiles.filter((f) => f.folder_id === rid)
          : visibleFiles.filter((f) => !f.folder_id || !folderIds.has(f.folder_id))
      );
      setIsLoading(false);
    };
    load();
  }, [spaceId]);

  // ─── Core report generation ──────────────────────────────────────────────────
  // notifyTo: if provided, send email after done instead of redirecting
  const handleGenerateReport = async (notifyTo?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast({ variant: 'destructive', title: 'Login required', description: 'Please log in to generate a report.' });
      return;
    }

    // If notifying by email, close the dialog and show a toast - user is free to leave
    if (notifyTo) {
      setIsNotifyDialogOpen(false);
      setReportState('notified');
      toast({
        title: 'Got it! We\'ll notify you.',
        description: `The report will be sent to ${notifyTo} once ready.`,
      });
    } else {
      setReportState('generating');
      setReportProgress(0);
    }

    const progressInterval = !notifyTo
      ? setInterval(() => {
          setReportProgress(prev => {
            if (prev >= 88) { clearInterval(progressInterval); return 88; }
            return prev + (prev < 30 ? 8 : prev < 60 ? 5 : 2);
          });
        }, 600)
      : null;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_BACKEND_URL}/run-diligence-from-space`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ space_id: spaceId }),
      });

      if (progressInterval) clearInterval(progressInterval);

      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(e.error || `Status ${res.status}`);
      }

      const result = await res.json();

      if (notifyTo) {
        // Send the report link to the user's email via your backend
        await fetch(`${process.env.NEXT_PUBLIC_AI_BACKEND_URL}/send-report-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({
            report_id: result.report_id,
            email: notifyTo,
            company_name: result.company_name || space?.name || 'your space',
          }),
        });
        setReportState('done');
        setReportId(result.report_id);
        toast({
          title: 'Report ready!',
          description: `We've sent the report to ${notifyTo}.`,
        });
      } else {
        setReportProgress(100);
        setReportState('done');
        setReportId(result.report_id);
        toast({ title: 'Report generated!', description: `Report for ${result.company_name || 'this space'} is ready.` });
        if (result.report_id) setTimeout(() => router.push(`/dashboard/due-diligence/${result.report_id}`), 1200);
      }
    } catch (err: any) {
      if (progressInterval) clearInterval(progressInterval);
      setReportState('error');
      setReportProgress(0);
      toast({ variant: 'destructive', title: 'Report generation failed', description: err.message || 'Something went wrong.' });
    }
  };

  // ─── Opens the "notify me" dialog, pre-filling visitor email ────────────────
  const openReportDialog = () => {
    // AI Due Diligence is gated as an upcoming feature → show the pilot waitlist
    // instead of calling the report backend. (Re-enable by restoring the notify dialog.)
    setIsUpcomingOpen(true);
  };

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;
  const currentFolders = useMemo(() => currentFolderId === null ? folderTree : findFolderById(folderTree, currentFolderId)?.children ?? [], [currentFolderId, folderTree]);
  const currentFiles = useMemo(() => currentFolderId === null ? rootFiles : findFolderById(folderTree, currentFolderId)?.files ?? [], [currentFolderId, folderTree, rootFiles]);
  const filteredFolders = useMemo(() => searchQuery ? currentFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) : currentFolders, [currentFolders, searchQuery]);
  const filteredFiles = useMemo(() => searchQuery ? currentFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) : currentFiles, [currentFiles, searchQuery]);

  const handleFolderClick = (folder: FolderNode) => { setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]); setSearchQuery(''); };
  const handleBreadcrumbClick = (index: number) => { setBreadcrumbs(prev => prev.slice(0, index + 1)); setSearchQuery(''); };

  const openFile = async (file: FileRow) => {
    setViewerLoading(true);

    // ── Per-file permission gate (skipped during owner preview) ──
    if (!isPreview) {
      try {
        const res = await fetch('/api/file-access/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceId, fileId: file.id, email: visitorEmail }),
        });
        const perm = res.ok ? await res.json() : { ok: false };
        if (perm.ok) {
          if (perm.blocked) {
            setViewerLoading(false);
            toast({ variant: 'destructive', title: 'Access restricted', description: 'You don’t have permission to view this file.' });
            return;
          }
          if (perm.expired) {
            // ONE file's access ending must never replace the whole room with
            // the "link expired" popup (that read as a broken space). Scope the
            // message to the file and leave the room open.
            setViewerLoading(false);
            toast({
              variant: 'destructive',
              title: 'This file is not available',
              description: 'Access to this file has ended. Please contact the sender.',
            });
            return;
          }
          if (perm.requireAgreement && !perm.signed && perm.agreementFileId) {
            // Send them to the existing e-sign flow, then back to this file.
            setViewerLoading(false);
            const next = `/spaces/${spaceId}/view?file=${encodeURIComponent(file.id)}`;
            const qs = new URLSearchParams({ next, gate: '1' });
            if (visitorEmail) qs.set('email', visitorEmail);
            if (visitorName) qs.set('name', visitorName);
            toast({ title: 'Agreement required', description: `Please sign “${perm.agreementName ?? 'the agreement'}” to view this file.` });
            router.push(`/view/${perm.agreementFileId}/${spaceId}?${qs.toString()}`);
            return;
          }
        }
      } catch {
        /* fail open - don't block viewing on a resolve hiccup */
      }
    }

    const { data } = await supabase.storage.from('vdr-files').createSignedUrl(file.storage_path, 3600);
    if (!data?.signedUrl) { toast({ variant: 'destructive', title: 'Could not open file' }); setViewerLoading(false); return; }
    if (activeSessionRef.current) await saveFileVisit(activeSessionRef.current);
    activeSessionRef.current = { file, openedAt: Date.now() };
    // Skip view-counter bump during owner preview.
    if (!isPreview) {
      await supabase.from('files').update({ views: (file.views || 0) + 1 }).eq('id', file.id);
    }
    setViewerUrl(data.signedUrl);
    setViewerFile(file);
    setViewerLoading(false);
  };

  const handleViewerNavigate = async (file: FileRow) => {
    if (activeSessionRef.current) await saveFileVisit(activeSessionRef.current);
    await openFile(file);
  };

  // After returning from the agreement sign page (?file=<id>), auto-open that
  // file - the gate re-checks and now passes because the visitor just signed.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current || isLoading) return;
    const wanted = searchParams?.get('file');
    if (!wanted) return;
    const collect = (nodes: FolderNode[]): FileRow[] =>
      nodes.flatMap((n) => [...(n.files ?? []), ...collect(n.children ?? [])]);
    const all = [...rootFiles, ...collect(folderTree)];
    const f = all.find((x) => x.id === wanted);
    if (f) { autoOpenedRef.current = true; openFile(f); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, rootFiles, folderTree, searchParams]);

  const closeViewer = useCallback(async () => {
    if (activeSessionRef.current) { await saveFileVisit(activeSessionRef.current); activeSessionRef.current = null; }
    setViewerFile(null); setViewerUrl(null);
  }, [saveFileVisit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && viewerFile) closeViewer(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerFile, closeViewer]);

  const downloadFile = async (file: FileRow) => {
    try {
      const { data, error } = await supabase.storage.from('vdr-files').download(file.storage_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
    } catch { toast({ variant: 'destructive', title: 'Download failed' }); }
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim()) {
      toast({ variant: 'destructive', title: 'Question required', description: 'Please type your question first.' });
      return;
    }
    setIsSubmittingQuestion(true);
    const currentFile = activeSessionRef.current?.file;
    try {
      // 1. Save the question itself
      const { error: insErr } = await supabase.from('space_questions').insert({
        space_id: spaceId,
        file_id: currentFile?.id ?? null,
        file_name: currentFile?.name ?? null,
        visitor_name: questionName.trim() || null,
        visitor_email: (questionEmail.trim() || visitorEmail) || null,
        question: questionText.trim(),
      });
      if (insErr) {
        // Table may not exist - surface a clear message but don't crash
        if (insErr.message?.includes('relation') || insErr.code === '42P01') {
          toast({ variant: 'destructive', title: 'Q&A not configured yet', description: 'Ask the space owner to run the space_questions migration.' });
        } else {
          throw insErr;
        }
      }

      // 2. Notify space owner via the alerts table (powers the bell + popup)
      try {
        const { data: spaceRow } = await supabase
          .from('spaces')
          .select('created_by, name, title')
          .eq('id', spaceId)
          .maybeSingle();
        if (spaceRow?.created_by) {
          const spaceName = spaceRow.name || spaceRow.title || 'your space';
          const askerName = questionName.trim() || questionEmail.trim() || visitorEmail || 'A visitor';
          const fileSuffix = currentFile?.name ? ` (on ${currentFile.name})` : '';
          await supabase.from('alerts').insert({
            user_id: spaceRow.created_by,
            space_id: spaceId,
            type: 'question_asked',
            message: `${askerName} asked a question${fileSuffix} in "${spaceName}".`,
          });
        }
      } catch (notifyErr) {
        console.warn('[alerts] question notification failed:', notifyErr);
      }

      toast({ title: 'Question submitted', description: 'The space owner has been notified.' });
      setIsQuestionDialogOpen(false);
      setQuestionName('');
      setQuestionEmail('');
      setQuestionText('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      toast({ variant: 'destructive', title: 'Could not submit', description: message });
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const renderReportButton = () => {
    if (reportState === 'generating') return (
      <div className="hidden sm:flex flex-col gap-1 min-w-[240px]">
        <Button variant="outline" disabled className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing {Math.round(reportProgress)}%…
        </Button>
        <Progress value={reportProgress} className="h-1.5" />
      </div>
    );
    if (reportState === 'notified') return (
      <Button variant="outline" disabled className="hidden sm:flex items-center gap-2 bg-indigo-50 border-indigo-200 text-indigo-700">
        <Bell className="h-4 w-4" /> Report being prepared…
      </Button>
    );
    if (reportState === 'done') return (
      <Button variant="outline" onClick={() => reportId && router.push(`/dashboard/due-diligence/${reportId}`)} className="hidden sm:flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100">
        <CheckCircle className="h-4 w-4" /> View Report
      </Button>
    );
    if (reportState === 'error') return (
      <Button variant="outline" onClick={openReportDialog} className="hidden sm:flex items-center gap-2 bg-red-50 border-red-200 text-red-600 hover:bg-red-100">
        <Sparkles className="h-4 w-4" /> Retry Report
      </Button>
    );
    return (
      <Button variant="outline" onClick={openReportDialog} className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100">
        <Sparkles className="h-4 w-4" /> Generate AI due diligence Report
      </Button>
    );
  };

  if (visitorLimited) return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center items-center gap-4">
          <div className="rounded-full border border-amber-300/40 bg-amber-50 p-3"><Link2Off className="h-8 w-8 text-amber-500" /></div>
          <CardTitle className="text-2xl">This data room is full</CardTitle>
          <p className="text-muted-foreground">
            This data room has reached its visitor limit. Please contact the owner for access.
          </p>
        </CardHeader>
      </Card>
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
    </div>
  );

  // Inactive (owner plan lapsed, or the link/space expired): replace the entire
  // room with the email-capture + reactivate/message popup. Nothing behind it
  // renders, so no interaction leaks through.
  if (inactive) return <InactiveLink spaceId={spaceId} />;

  if (error || !space) return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center items-center gap-4">
          <div className="rounded-full border border-destructive/20 bg-destructive/10 p-3"><Link2Off className="h-8 w-8 text-destructive" /></div>
          <CardTitle className="text-2xl">Space Unavailable</CardTitle>
          <CardDescription className="pt-2">{error ?? 'This Space link is disabled or invalid.'}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  const spaceName = space.name || space.title || 'Untitled Space';
  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;
  const ALLOW_DOWNLOAD = false;
  const spaceInitial = (spaceName?.[0] ?? 'V').toUpperCase();

  return (
    <>
      {viewerFile && viewerUrl && (
        <FileViewer
          file={viewerFile}
          url={viewerUrl}
          allFiles={currentFiles}
          onClose={closeViewer}
          onNavigate={handleViewerNavigate}
          allowDownload={ALLOW_DOWNLOAD}
          onPageView={handlePageView}
          onPlaybackEvent={handlePlaybackEvent}
          onAskQuestion={() => setIsQuestionDialogOpen(true)}
          watermarkText={resolvedWatermark}
        />
      )}

      {viewerLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* ─── Top bar - VentureThrust branding + Create login button ─── */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 bg-white">
          <Logo />
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`/signup${visitorEmail ? `?email=${encodeURIComponent(visitorEmail)}` : ''}`)}
            >
              Create login
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-orange-500 text-white font-medium">
                {(visitorEmail?.[0] ?? spaceInitial).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {/* ─── Banner area - uses cover image, or a default gradient if none ─── */}
          <div className="relative h-72 w-full overflow-hidden">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Space Cover"
                className="w-full h-full object-cover"
                onError={() => {
                  console.warn(
                    '[view] Cover image failed to load. The space-covers bucket may not be public.',
                    'URL:', coverImageUrl
                  );
                  setCoverImageUrl(null);
                }}
              />
            ) : (
              // Default banner - moody bookshelf-style gradient with soft pattern overlay
              <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 24px)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}
          </div>

          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-6 relative">
            {/* ─── Logo + space title row.
                Only the LOGO overlaps the banner upward (-mt-16). The title
                sits below the banner edge on the page background - readable
                regardless of how dark the banner image is. Previously the
                whole row was pulled up with -mt-12, which made the title
                bleed across the banner's bottom half. */}
            <div className="flex items-start gap-4 mb-6">
              <div className="h-24 w-24 rounded-lg border-4 border-white bg-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center -mt-16">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={spaceName}
                    className="w-full h-full object-contain"
                    onError={() => setLogoUrl(null)}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-3xl font-bold truncate">{spaceName}</h1>
                {space.description && <p className="text-muted-foreground mt-1 line-clamp-2">{space.description}</p>}
              </div>
            </div>

            {/* ─── Breadcrumbs ──────────────────────────────────────── */}
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-foreground"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {crumb.name}
                  </Button>
                </div>
              ))}
            </div>

            {/* ─── Section header: title + tabs + search/ask ────────── */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">
                  {breadcrumbs[breadcrumbs.length - 1]?.name ?? 'Home'}
                </h2>
                <div className="inline-flex bg-gray-100 rounded-full p-1 text-sm">
                  <button className="px-3 py-1 rounded-full bg-gray-900 text-white font-medium">All files</button>
                  <button className="px-3 py-1 rounded-full text-gray-600 hover:text-gray-900 transition-colors">Recently added</button>
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search this space"
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {renderReportButton()}
                <WatchlistButton />
                <Button variant="default" onClick={() => setIsQuestionDialogOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask a question
                </Button>
              </div>
            </div>

            {isEmpty ? (
              <div className="flex flex-col items-center justify-center rounded-xl h-[28rem] gap-3 text-muted-foreground bg-gradient-to-b from-gray-50 to-white border">
                {/* Friendly sleeping-dog SVG illustration matching DocSend's empty state */}
                <svg viewBox="0 0 200 160" className="w-44 h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="100" cy="148" rx="60" ry="6" fill="#000" opacity="0.06" />
                  {/* body */}
                  <ellipse cx="100" cy="110" rx="70" ry="30" fill="#8B5A3C" />
                  {/* head */}
                  <ellipse cx="60" cy="92" rx="32" ry="28" fill="#A06A47" />
                  {/* ear */}
                  <ellipse cx="42" cy="78" rx="14" ry="20" fill="#6B4226" transform="rotate(-25 42 78)" />
                  {/* snout */}
                  <ellipse cx="42" cy="100" rx="14" ry="10" fill="#C49572" />
                  {/* nose */}
                  <ellipse cx="34" cy="98" rx="3" ry="2.5" fill="#2A2A2A" />
                  {/* closed eye */}
                  <path d="M 55 88 Q 62 84, 69 88" stroke="#2A2A2A" strokeWidth="2" strokeLinecap="round" fill="none" />
                  {/* sleepy "zzz" */}
                  <text x="135" y="58" fontSize="14" fill="#9CA3AF" fontFamily="sans-serif" fontWeight="600">z</text>
                  <text x="148" y="48" fontSize="18" fill="#9CA3AF" fontFamily="sans-serif" fontWeight="600">z</text>
                  <text x="162" y="36" fontSize="22" fill="#9CA3AF" fontFamily="sans-serif" fontWeight="600">z</text>
                </svg>
                <h2 className="text-xl font-semibold text-gray-700">
                  {searchQuery ? `No results for "${searchQuery}"` : 'This folder is empty'}
                </h2>
                <p className="text-sm">The owner has not added any files here yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Root view: folders shown first as cards (with file counts
                    + expandable subfolder preview), then any loose root files
                    appear below in a separate "Files" section. This gives the
                    folder-first hierarchy the owner wanted while still
                    surfacing files that live at the space root. */}
                {currentFolderId === null ? (
                  <>
                    {filteredFolders.map((folder) => (
                      <VisitorFolderCard
                        key={folder.id}
                        folder={folder}
                        onNavigate={handleFolderClick}
                      />
                    ))}
                    {filteredFiles.length > 0 && (
                      <div className="pt-2">
                        {filteredFolders.length > 0 && (
                          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 mt-4">
                            Files
                          </h3>
                        )}
                        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                          {filteredFiles.map((file, idx) => {
                            const Icon = getFileIcon(file.type, file.name);
                            return (
                              <div
                                key={file.id}
                                onClick={() => openFile(file)}
                                className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-50/30 cursor-pointer group transition-colors ${
                                  idx > 0 ? 'border-t border-gray-100' : ''
                                }`}
                              >
                                <div className="h-9 w-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                  <Icon className="h-4 w-4 text-gray-600" />
                                </div>
                                <span className="flex-1 font-medium truncate group-hover:text-blue-700 transition-colors">
                                  {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
                                  {format(new Date(file.created_at), 'MMM d, yyyy')}
                                </span>
                                {ALLOW_DOWNLOAD && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    title="Download"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadFile(file);
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border rounded-lg">
                    <div className="space-y-1 p-2">
                  {filteredFolders.map(folder => (
                    <div key={folder.id} onClick={() => handleFolderClick(folder)} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer group">
                      <Folder className="h-5 w-5 text-blue-500 fill-blue-100 shrink-0" />
                      <span className="flex-1 font-medium truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {countFilesRecursive(folder)} {countFilesRecursive(folder) === 1 ? 'file' : 'files'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  {filteredFiles.map(file => {
                    const Icon = getFileIcon(file.type, file.name);
                    return (
                      <div key={file.id} onClick={() => openFile(file)} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Icon className="h-6 w-6 text-muted-foreground shrink-0" />
                        <span className="flex-1 font-medium truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                        {ALLOW_DOWNLOAD && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Download" onClick={e => { e.stopPropagation(); downloadFile(file); }}>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="w-full px-8 py-4 text-xs text-muted-foreground flex justify-between items-center border-t bg-background mt-auto">
            <div className="flex gap-4">
              <Link href="#" className="hover:underline">Privacy Policy</Link>
              <Link href="#" className="hover:underline">Cookies &amp; CCPA preferences</Link>
            </div>
            <span>© {new Date().getFullYear()} VentureThrust</span>
          </footer>
        </main>
      </div>

      {/* ─── Notify-by-email dialog ─────────────────────────────────────────────── */}
      <Dialog open={isNotifyDialogOpen} onOpenChange={setIsNotifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Generate AI Due Diligence Report
            </DialogTitle>
            <DialogDescription>
              This report typically takes <strong>3-6 minutes</strong> to generate. You can wait here, or we'll send the report link to your email so you can come back to it later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <Label htmlFor="notify-email">Send report to</Label>
            <Input
              id="notify-email"
              type="email"
              placeholder="your@email.com"
              value={notifyEmail}
              onChange={e => setNotifyEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We'll email you the report link once it's ready.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => {
                setIsNotifyDialogOpen(false);
                handleGenerateReport(); // wait - no email
              }}
            >
              Wait here
            </Button>
            <Button
              className="sm:flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              disabled={!notifyEmail || !/\S+@\S+\.\S+/.test(notifyEmail)}
              onClick={() => handleGenerateReport(notifyEmail)}
            >
              <Bell className="h-4 w-4 mr-1.5" />
              Notify me by email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Ask a question dialog ──────────────────────────────────────────────── */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Ask a Question</DialogTitle>
            <DialogDescription>Your question will be sent to the owner of this space.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="q-name">Name</Label><Input id="q-name" placeholder="Your Name" value={questionName} onChange={(e) => setQuestionName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="q-email">Email</Label><Input id="q-email" type="email" placeholder="your@email.com" value={questionEmail || visitorEmail || ''} onChange={(e) => setQuestionEmail(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="q-question">Question</Label><Textarea id="q-question" placeholder="Type your question here..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)} disabled={isSubmittingQuestion}>Cancel</Button>
            <Button onClick={handleAskQuestion} disabled={isSubmittingQuestion || !questionText.trim()}>
              {isSubmittingQuestion ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : 'Submit Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── AI Due Diligence - upcoming feature waitlist ──────────────────────── */}
      <UpcomingFeatureDialog
        open={isUpcomingOpen}
        onOpenChange={setIsUpcomingOpen}
        defaultEmail={visitorEmail ?? ''}
      />
    </>
  );
}