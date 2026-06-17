'use client';

/**
 * Public file-request upload page.
 *
 * Flow:
 *   1. /request/[token] → fetch file_requests row by token
 *   2. Show owner avatar + name + request title + message
 *   3. Collect uploader's name + email (required)
 *   4. Drag/drop or browse multiple files
 *   5. Click "Upload N files":
 *        - Upload each file to Supabase Storage (documents bucket)
 *        - Insert a row into `files` table at the request's target folder
 *        - Insert a tracking row into `file_request_uploads`
 *        - Insert an alert for the owner so the bell rings
 *   6. Show "Finished uploading" success screen with celebrating runner SVG
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeStorageKey } from '@/lib/storage-path';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Loader2,
  Upload as UploadIcon,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  File as FileIcon,
  CheckCircle2,
  Shield,
  Folder,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FileRequestRow = {
  id: string;
  token: string;
  title: string;
  message: string | null;
  account_name: string | null;
  created_by: string;
  target_folder_id: string | null;
  target_folder_name: string | null;
  target_type: string | null;
  target_space_id: string | null;
  expires_at: string | null;
  is_active: boolean;
};

type OwnerInfo = {
  email: string | null;
  displayName: string;
  initial: string;
};

type Step = 'loading' | 'not_found' | 'inactive' | 'expired' | 'upload' | 'uploading' | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return ImageIcon;
  if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return Film;
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return Music;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return Archive;
  if (['pdf', 'doc', 'docx', 'txt', 'xlsx', 'csv'].includes(ext)) return FileText;
  return FileIcon;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Layout shell ─────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top brand */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">VentureThrust</span>
        </div>
      </div>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">{children}</main>
      <footer className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 text-center text-xs text-muted-foreground">
        Your files will be uploaded securely.
      </footer>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FileRequestUploadPage() {
  const params = useParams();
  const { toast } = useToast();
  const token = params.token as string;

  const [step, setStep] = useState<Step>('loading');
  const [request, setRequest] = useState<FileRequestRow | null>(null);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);

  // Uploader form
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Collection links (space target) return a folder list; the uploader picks one.
  const [folders, setFolders] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // ── Initial fetch: validate the link via the service-role route ──────────
  // (We no longer read file_requests / profiles with the anon key, so RLS can
  //  lock those tables to owners only.)
  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/file-requests/resolve?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data?.status === 'inactive') { setStep('inactive'); return; }
        if (data?.status === 'expired') { setStep('expired'); return; }
        if (data?.status !== 'ok' || !data.request) { setStep('not_found'); return; }

        setRequest({
          id: data.request.id,
          token,
          title: data.request.title ?? 'File request',
          message: data.request.message ?? null,
          account_name: null,
          created_by: '', // owner actions happen server-side now
          target_folder_id: data.request.target_folder_id ?? null,
          target_folder_name: data.request.target_folder_name ?? null,
          target_type: data.request.target_type ?? null,
          target_space_id: data.request.target_space_id ?? null,
          expires_at: null,
          is_active: true,
        });
        setOwner({
          email: null,
          displayName: data.owner?.displayName ?? 'Owner',
          initial: data.owner?.initial ?? 'O',
        });
        setFolders(Array.isArray(data.request.folders) ? data.request.folders : []);
        setSpaceName(data.request.space_name ?? null);
        setCoverImage(data.request.cover_image ?? null);
        setStep('upload');
      } catch {
        setStep('not_found');
      }
    };
    load();
  }, [token]);

  // ── Security: upload safety limits ─────────────────────────────────────
  // Anonymous visitors upload here, so we enforce hard limits client-side
  // AND the storage RLS policy + bucket settings should mirror these on the
  // server. Adjust as your business needs require.
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per file
  const MAX_FILES_PER_REQUEST = 20;             // batch cap
  // Block obviously-dangerous file types that could be used to phish other
  // viewers or auto-execute on the owner's machine. Keep permissive enough
  // for legitimate business files (PDF, Office, images, video, archives).
  const BLOCKED_EXTENSIONS = new Set([
    'exe', 'bat', 'cmd', 'sh', 'msi', 'scr', 'com', 'pif', 'cpl',
    'js', 'mjs', 'vbs', 'vbe', 'jar', 'app', 'dmg', 'pkg',
    'html', 'htm', 'svg', // SVG can carry script payloads when previewed inline
    'reg', 'lnk', 'ps1', 'psm1',
  ]);

  // Sanitize uploaded filenames before they hit storage. Strips path
  // traversal characters and control bytes; clamps length; preserves
  // a recognisable extension for the owner's content library.
  const sanitizeFileName = (raw: string): string => {
    const lastSlash = Math.max(raw.lastIndexOf('/'), raw.lastIndexOf('\\'));
    const baseName = lastSlash >= 0 ? raw.slice(lastSlash + 1) : raw;
    return baseName
      .replace(/[\x00-\x1f\x7f]/g, '')      // control chars
      .replace(/[\\/:*?"<>|]/g, '_')          // illegal FS chars
      .replace(/\.{2,}/g, '.')                // collapse repeated dots
      .replace(/^\.+/, '')                    // no leading dot
      .slice(0, 200)                          // length cap
      .trim() || 'file';
  };

  // ── File input handlers ────────────────────────────────────────────────
  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);

    // 1. Per-file size + extension allowlist
    const accepted: File[] = [];
    const rejected: { name: string; reason: string }[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        rejected.push({ name: f.name, reason: `exceeds 50 MB limit` });
        continue;
      }
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (BLOCKED_EXTENSIONS.has(ext)) {
        rejected.push({ name: f.name, reason: `file type .${ext} is not allowed` });
        continue;
      }
      // Wrap with sanitized filename - the original File object is immutable
      // but we keep a sibling cleanName for upload. (Set on the array we store.)
      const safeName = sanitizeFileName(f.name);
      if (safeName !== f.name) {
        // Re-wrap to give it the sanitized name. File constructor preserves
        // size + mime; only the .name property is replaced.
        const reWrapped = new File([f], safeName, { type: f.type, lastModified: f.lastModified });
        accepted.push(reWrapped);
      } else {
        accepted.push(f);
      }
    }

    if (rejected.length > 0) {
      toast({
        variant: 'destructive',
        title: `${rejected.length} file${rejected.length > 1 ? 's' : ''} rejected`,
        description: rejected.map((r) => `${r.name} - ${r.reason}`).slice(0, 3).join('\n'),
      });
    }

    // 2. Total-count cap (after rejections, before merging)
    setFiles((prev) => {
      const merged = [...prev, ...accepted];
      if (merged.length > MAX_FILES_PER_REQUEST) {
        toast({
          variant: 'destructive',
          title: `Too many files`,
          description: `You can upload up to ${MAX_FILES_PER_REQUEST} files at once. Extras were dropped.`,
        });
        return merged.slice(0, MAX_FILES_PER_REQUEST);
      }
      return merged;
    });
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  // ── Upload all files ───────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!request) return;
    if (files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No files',
        description: 'Please select at least one file to upload.',
      });
      return;
    }
    if (folders.length > 0 && !currentFolderId) {
      toast({
        variant: 'destructive',
        title: 'Open a folder',
        description: 'Please open the folder you want to upload these documents into.',
      });
      return;
    }

    setStep('uploading');
    setUploadProgress(0);

    const totalFiles = files.length;
    let completed = 0;
    let anyFailed = false;

    // 1. Push the bytes straight to Storage from the browser (so large files
    //    don't pass through a serverless function). Collect the resulting
    //    paths to record server-side afterwards.
    const recorded: { fileId: string; fileName: string; fileSize: number; storagePath: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `file_${Date.now()}_${i}`;
      // Belt-and-braces: sanitize again before building the storage key so an
      // untrusted segment can't escape the request's namespace.
      const safeName = safeStorageKey(file.name);
      const storagePath = `file-requests/${request.id}/${fileId}/${safeName}`;

      try {
        const { error: storageErr } = await supabase.storage
          .from('documents')
          .upload(storagePath, file, { upsert: false });
        if (storageErr) throw storageErr;

        recorded.push({ fileId, fileName: file.name, fileSize: file.size, storagePath });
        completed += 1;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        anyFailed = true;
      }
    }

    // 2. Record the batch + notify the owner via the secure service-role route.
    //    (file_request_uploads / files / alerts are no longer writable by anon.)
    if (recorded.length > 0) {
      try {
        const res = await fetch('/api/file-requests/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            uploaderName: uploaderName.trim() || 'Anonymous',
            uploaderEmail: uploaderEmail.trim(),
            files: recorded,
            folderId: currentFolderId || undefined,
          }),
        });
        if (!res.ok) anyFailed = true;
      } catch (err) {
        console.error('recording upload failed:', err);
        anyFailed = true;
      }
    }

    if (anyFailed) {
      toast({
        variant: 'destructive',
        title: 'Some files failed',
        description: `${completed} of ${totalFiles} uploaded. Please retry the failed ones.`,
      });
      // Still show the success screen - the owner will see which made it
    }

    setStep('done');
  };

  // Folder-browser helpers for the collection upload view.
  const folderById = new Map(folders.map((f) => [f.id, f] as const));
  const childFolders = folders
    .filter((f) => (f.parent_id ?? null) === currentFolderId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const breadcrumb: { id: string; name: string }[] = (() => {
    const path: { id: string; name: string }[] = [];
    let cur = currentFolderId ? folderById.get(currentFolderId) : undefined;
    while (cur) {
      path.unshift({ id: cur.id, name: cur.name });
      cur = cur.parent_id ? folderById.get(cur.parent_id) : undefined;
    }
    return path;
  })();
  const currentFolderName = currentFolderId ? (folderById.get(currentFolderId)?.name ?? 'folder') : null;

  // ─── Render by step ──────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading file request…</p>
        </div>
      </Shell>
    );
  }

  if (step === 'not_found' || step === 'inactive' || step === 'expired') {
    const titleMap = {
      not_found: 'Link not found',
      inactive: 'Link disabled',
      expired: 'Link expired',
    } as const;
    const descMap = {
      not_found: 'This file request link does not exist. Please check the URL or contact the sender.',
      inactive: 'This file request has been disabled by its owner. Please contact them for a new link.',
      expired: 'This file request expired. Please contact the sender for a new link.',
    } as const;
    return (
      <Shell>
        <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold">{titleMap[step]}</h1>
          <p className="text-muted-foreground max-w-md">{descMap[step]}</p>
        </div>
      </Shell>
    );
  }

  if (step === 'done') {
    return (
      <Shell>
        <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-4 text-center">
          {/* Celebrating-runner SVG (matches DocSend "finished" screen vibe) */}
          <svg viewBox="0 0 200 180" className="w-40 h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* finish-line tape */}
            <path d="M 30 110 Q 100 90 170 110 Q 175 115 170 120 Q 100 100 30 120 Z" fill="#a855f7" />
            {/* head */}
            <circle cx="100" cy="55" r="14" fill="#7c2d12" />
            {/* hair */}
            <path d="M 88 50 Q 100 38 112 50 Q 110 42 100 40 Q 90 42 88 50" fill="#1f1611" />
            {/* arms up */}
            <line x1="92" y1="72" x2="78" y2="40" stroke="#7c2d12" strokeWidth="6" strokeLinecap="round" />
            <line x1="108" y1="72" x2="122" y2="40" stroke="#7c2d12" strokeWidth="6" strokeLinecap="round" />
            {/* body */}
            <rect x="86" y="70" width="28" height="35" rx="4" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.5" />
            {/* legs */}
            <rect x="88" y="103" width="10" height="35" rx="3" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.5" />
            <rect x="102" y="103" width="10" height="35" rx="3" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.5" />
            {/* shoes */}
            <ellipse cx="93" cy="142" rx="6" ry="3" fill="#1f1611" />
            <ellipse cx="107" cy="142" rx="6" ry="3" fill="#1f1611" />
            {/* number bib */}
            <rect x="91" y="78" width="18" height="14" rx="2" fill="#dbeafe" />
            <text x="100" y="89" fontSize="9" fill="#1e40af" textAnchor="middle" fontWeight="bold">1</text>
          </svg>
          <h1 className="text-3xl font-bold">Finished uploading</h1>
          <p className="text-muted-foreground">
            We&apos;ll notify <span className="font-semibold text-foreground">{owner?.displayName ?? 'the owner'}</span> that you uploaded files.
          </p>
          <Button
            onClick={() => {
              setFiles([]);
              setStep('upload');
              setUploadProgress(0);
            }}
            className="mt-3"
          >
            Upload more files
          </Button>
        </div>
      </Shell>
    );
  }

  // ─── Main upload screen (step === 'upload' || 'uploading') ───────────────
  // Mirrors the space (data room) layout: full-width cover, logo box, title,
  // Home breadcrumb, and folder rows. The visitor can only upload.
  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col">
      <header className="flex h-16 shrink-0 items-center border-b px-4 sm:px-6 bg-white">
        <Logo />
      </header>

      {/* Cover - full width */}
      <div className="relative h-56 sm:h-64 w-full bg-gradient-to-br from-slate-200 to-slate-300">
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Logo box */}
      <div className="relative px-6 sm:px-10">
        <div className="absolute -top-16 left-6 sm:left-10 z-10 h-28 w-28 sm:h-32 sm:w-32 rounded-md border-4 border-white bg-white shadow-sm grid place-items-center overflow-hidden">
          <ImageIcon className="h-14 w-14 text-muted-foreground" />
        </div>
      </div>

      {/* Title */}
      <div className="px-6 sm:px-10 pt-16 sm:pt-20 pb-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{spaceName || request?.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-gray-900">{owner?.displayName ?? 'Someone'}</span> is requesting documents. Open a folder and upload your files.
        </p>
        {request?.message && (
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{request.message}</p>
        )}
      </div>

      {/* Breadcrumb */}
      {folders.length > 0 && (
        <div className="px-6 sm:px-10 pt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
            <button type="button" onClick={() => setCurrentFolderId(null)} disabled={step === 'uploading'} className="font-medium hover:text-foreground">Home</button>
            {breadcrumb.map((b) => (
              <span key={b.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <button type="button" onClick={() => setCurrentFolderId(b.id)} disabled={step === 'uploading'} className="hover:text-foreground">{b.name}</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-6 sm:px-10 py-5 flex-1">
        {/* Folder rows (data-room style) */}
        {childFolders.length > 0 && (
          <div className="space-y-3">
            {childFolders.map((f) => {
              const subs = folders.filter((x) => (x.parent_id ?? null) === f.id).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCurrentFolderId(f.id)}
                  disabled={step === 'uploading'}
                  className="flex w-full items-center gap-4 rounded-lg border border-gray-200 px-4 py-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/30"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50">
                    <Folder className="h-6 w-6 text-blue-500 fill-blue-200" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900 truncate">{f.name}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{subs > 0 ? `${subs} folder${subs === 1 ? '' : 's'}` : 'Open to upload'}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {folders.length > 0 && currentFolderId === null && (
          <p className="mt-4 text-sm text-muted-foreground">Open a folder to upload your documents into it.</p>
        )}

        {/* Upload panel - inside a folder (or when there are no folders at all) */}
        {(folders.length === 0 || currentFolderId !== null) && (
          <div className="mt-6 rounded-xl border border-gray-200 p-5">
            {currentFolderId !== null && (
              <p className="text-sm text-gray-700 mb-4">Uploading to <span className="font-semibold">{currentFolderName}</span></p>
            )}

            {files.length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center py-16 px-6 gap-3 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'}`}
              >
                <UploadIcon className="h-10 w-10 text-blue-500" />
                <p className="text-base"><span className="font-semibold">Drop files here</span> or <span className="text-blue-600 font-semibold underline">browse files</span></p>
                <p className="text-xs text-muted-foreground">Multiple files supported</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => { setFiles([]); }} disabled={step === 'uploading'}>Cancel</Button>
                  <span className="text-sm font-semibold">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={step === 'uploading'} className="text-blue-600 hover:text-blue-700">+ Add more</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {files.map((file, idx) => {
                    const Icon = getFileIcon(file.name);
                    return (
                      <div key={`${file.name}-${idx}`} className="relative group bg-gray-100 rounded-lg p-3 flex flex-col items-center gap-2">
                        {step !== 'uploading' && (
                          <button onClick={() => removeFile(idx)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" aria-label="Remove file">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <div className="h-16 w-16 rounded-md bg-white shadow-sm flex items-center justify-center">
                          <Icon className="h-7 w-7 text-blue-500" />
                        </div>
                        <p className="text-xs font-medium text-center line-clamp-2 break-all">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                      </div>
                    );
                  })}
                </div>
                {step === 'uploading' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading {files.length} file{files.length !== 1 ? 's' : ''}…</span>
                      <span className="font-mono">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

            {files.length > 0 && (
              <div className="mt-4 flex items-center justify-end">
                <Button onClick={handleUpload} disabled={step === 'uploading' || files.length === 0} className="bg-gray-900 hover:bg-gray-800 text-white">
                  {step === 'uploading' ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</>) : (<><CheckCircle2 className="h-4 w-4 mr-2" />Upload {files.length} file{files.length !== 1 ? 's' : ''}</>)}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="px-6 sm:px-10 pb-10 pt-2 text-center text-xs text-muted-foreground">Your files will be uploaded securely.</footer>
    </div>
  );
}
