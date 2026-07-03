//frontend file 
 'use client';

import { ContentLibraryIllustration } from '@/components/illustrations';
import { ProductTour } from '@/components/product-tour';
import {
  MoreHorizontal,
  Folder as FolderIcon,
  FolderPlus,
  Trash2,
  FileUp,
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  ChevronDown,
  ChevronLeft,
  Cloud,
  PenSquare,
  Search,
  Users,
  Link as LinkIcon,
  Upload,
  Eye,
  Calendar as CalendarIcon,
  Clock,
  Copy,
  Download,
  Laptop,
  Globe,
  ChevronUp,
  FileSignature,
  Loader2,
  Plus,
  Shield,
  Lock,
  Palette,
  X,
  Minus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Layers,
  ExternalLink,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SendByEmailDialog } from './send-by-email-dialog';
import { fireDealWatchEvent } from '@/lib/deal-watch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useState, useMemo, useRef, useEffect, Suspense, memo, useCallback, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { checkStorageRoom, formatGib } from '@/lib/storage-usage';
import { safeStorageKey } from '@/lib/storage-path';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { getDocumentIcon, getFileType } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useFolders, type Folder, type File, type Visit, type Signature, type DeletedItem } from '@/lib/folder-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, formatDistanceToNow } from 'date-fns';
import { type ShareLink } from '@/lib/documents-provider.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PieChart, Pie, Cell } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PerformanceView } from './_components/performance-view';
import { supabase } from '@/lib/supabaseClient';
import { getEffectiveOwnerId } from '@/lib/workspace';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getFileTypeStyle } from '@/lib/file-icons';

const FileViewer = dynamic(
  () => import('@/components/file-viewer').then((mod) => mod.FileViewer),
  { ssr: false }
);

// ─── Space type ───────────────────────────────────────────────────────────────

interface Space {
  id: string;
  name: string;
  created_at?: string;
}

// ─── Upload progress types ────────────────────────────────────────────────────

type UploadStatus = 'in_progress' | 'completed' | 'failed';

interface UploadItem {
  id: string;
  name: string;
  type: string;
  progress: number;
  status: UploadStatus;
  fileId?: string;
  contentUrl?: string;
}

// ─── PDF Encryption Helpers ───────────────────────────────────────────────────

async function isPdfEncrypted(file: globalThis.File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const checkBytes = (start: number, end: number) => {
    let text = '';
    for (let i = start; i < end; i++) text += String.fromCharCode(bytes[i]);
    return text.includes('/Encrypt');
  };
  const head = checkBytes(0, Math.min(2048, bytes.length));
  const tail = checkBytes(Math.max(0, bytes.length - 2048), bytes.length);
  return head || tail;
}

async function decryptPdf(file: globalThis.File, password: string): Promise<globalThis.File> {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer, { password });
  const decryptedBytes = await pdfDoc.save();
  return new globalThis.File([decryptedBytes], file.name, { type: 'application/pdf' });
}

// ─── Password Dialog ──────────────────────────────────────────────────────────

function PasswordDialog({
  fileName,
  open,
  error,
  onSubmit,
  onCancel,
}: {
  fileName: string;
  open: boolean;
  error?: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Password Protected File</DialogTitle>
              <DialogDescription className="mt-0.5">
                Enter the password to unlock and upload this file.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div className="px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground truncate">
            📄 {fileName}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdf-password">Password</Label>
            <Input
              id="pdf-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter file password"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && password && onSubmit(password)}
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> {error}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Skip File</Button>
          <Button onClick={() => onSubmit(password)} disabled={!password}>
            <KeyRound className="mr-1.5 h-4 w-4" /> Unlock & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton Loading Screen ──────────────────────────────────────────────────

function ContentLibrarySkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <Skeleton className="h-8 w-44 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-52 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-60 shrink-0 border-r border-gray-200 overflow-y-auto py-4 pr-2 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
          </div>
          <div className="px-3 py-1">
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center justify-between px-2 py-1 mt-1">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
              <Skeleton className="h-4 w-4 rounded shrink-0" />
              <Skeleton className="h-4 rounded" style={{ width: `${55 + Math.random() * 30}%` }} />
            </div>
          ))}
          <div className="flex-1" />
          <Skeleton className="h-px w-full" />
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pl-6 pt-4 min-w-0">
          <div className="flex items-center justify-between mb-5 gap-4">
            <Skeleton className="h-7 w-48 rounded-md" />
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
          <div className="border-t border-gray-200" />
          <div className="flex items-center py-2 px-2 gap-3">
            <Skeleton className="flex-1 h-3 rounded" />
            <Skeleton className="w-28 h-3 rounded" />
            <Skeleton className="w-8 h-3 rounded" />
          </div>
          <div className="border-t border-gray-200" />
          <div className="px-2 py-3"><Skeleton className="h-4 w-14 rounded" /></div>
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="border-t border-gray-200" />
              <div className="flex items-center gap-3 py-2.5 px-2">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <Skeleton className="flex-1 h-4 rounded" style={{ maxWidth: `${25 + Math.random() * 50}%` }} />
                <Skeleton className="w-20 h-3 rounded shrink-0" />
                <Skeleton className="w-7 h-7 rounded shrink-0" />
              </div>
            </div>
          ))}
          <div className="border-t border-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Upload Progress Panel ────────────────────────────────────────────────────

type UploadTab = 'all' | 'completed' | 'in_progress' | 'failed';

function UploadProgressPanel({
  items,
  onClose,
  onView,
}: {
  items: UploadItem[];
  onClose: () => void;
  onView: (item: UploadItem) => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab] = useState<UploadTab>('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    return items.filter((i) => i.status === tab);
  }, [items, tab]);

  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  const overallProgress = useMemo(() => {
    if (!items.length) return 0;
    return Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length);
  }, [items]);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl bg-gray-900 text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="font-semibold text-base">Uploads</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized((v) => !v)} className="p-1.5 rounded hover:bg-gray-700 transition-colors">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="flex items-center gap-1 px-3 pt-3 pb-1">
            {(
              [
                { key: 'all', label: 'All Uploads' },
                { key: 'completed', label: 'Completed' },
                { key: 'in_progress', label: 'In progress' },
                { key: 'failed', label: 'Failed' },
              ] as { key: UploadTab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  tab === key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col max-h-56 overflow-y-auto px-3 py-2 gap-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No uploads in this category.</p>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5">
                  <div className="shrink-0">
                    {item.status === 'in_progress' && <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />}
                    {item.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    {item.status === 'failed' && <XCircle className="h-5 w-5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white" title={item.name}>{item.name}</p>
                    <p className="text-xs text-gray-400 uppercase">{item.type}</p>
                    {item.status === 'in_progress' && (
                      <div className="mt-1.5 space-y-1">
                        <Progress value={item.progress} className="h-1.5 bg-gray-700 [&>div]:bg-blue-500" />
                        <p className="text-xs text-gray-400">{item.progress}% uploaded</p>
                      </div>
                    )}
                    {item.status === 'failed' && (
                      <p className="text-xs text-red-400 mt-0.5">Upload failed. Please try again.</p>
                    )}
                  </div>
                  {item.status === 'completed' && item.fileId && (
                    <button
                      onClick={() => onView(item)}
                      className="shrink-0 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-medium transition-colors"
                    >
                      View
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {inProgressCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-700 mt-1">
              <Upload className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Processing {inProgressCount} item{inProgressCount > 1 ? 's' : ''}</p>
                <p className="text-xs text-blue-200">Some items are still uploading, {overallProgress}% overall</p>
              </div>
            </div>
          )}
          {inProgressCount === 0 && completedCount > 0 && failedCount === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-700 mt-1">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">All uploads complete</p>
                <p className="text-xs text-green-200">{completedCount} file{completedCount > 1 ? 's' : ''} uploaded successfully</p>
              </div>
            </div>
          )}
          {failedCount > 0 && inProgressCount === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-700 mt-1">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{failedCount} upload{failedCount > 1 ? 's' : ''} failed</p>
                <p className="text-xs text-red-200">Please try uploading again</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Helper: flatten folder tree ─────────────────────────────────────────────

type FlatFolder = { id: string; name: string; depth: number };

function flattenFolders(folders: Folder[], depth = 0): FlatFolder[] {
  const result: FlatFolder[] = [];
  for (const folder of folders) {
    result.push({ id: folder.id, name: folder.name, depth });
    if (folder.children?.length) result.push(...flattenFolders(folder.children, depth + 1));
  }
  return result;
}

// ─── FolderTree ───────────────────────────────────────────────────────────────

type FolderTreeProps = {
  folderList: Folder[];
  selectedFolderId: string;
  fileIdFromUrl: string | null;
  findFolder: (id: string, list?: Folder[]) => Folder | null;
  onSelectFolder: (id: string) => void;
  onShare: () => void;
  onAddSubfolder: (folder: Folder) => void;
  onAddFile: (folder: Folder) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
};

const FolderTree = memo(function FolderTree({
  folderList,
  selectedFolderId,
  fileIdFromUrl,
  findFolder,
  onSelectFolder,
  onShare,
  onAddSubfolder,
  onAddFile,
  onRename,
  onDelete,
}: FolderTreeProps) {
  return (
    <>
      {folderList.map((folder) => {
        const isSelected = selectedFolderId === folder.id;
        return (
          <Collapsible
            key={folder.id}
            className="w-full"
            defaultOpen={isSelected || (selectedFolderId ? findFolder(selectedFolderId, [folder]) != null : false)}
          >
            <div className={cn(
              'flex items-center group min-w-0 w-full border-b border-gray-200',
              isSelected && !fileIdFromUrl
                ? 'bg-blue-50 text-blue-800'
                : 'hover:bg-gray-100 text-gray-700'
            )}>
              <CollapsibleTrigger asChild>
                <div
                  className="flex items-center gap-2 py-2.5 px-2 cursor-pointer flex-1 min-w-0 overflow-hidden"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <FolderIcon className={cn('h-4 w-4 shrink-0', isSelected && !fileIdFromUrl ? 'fill-blue-400 text-blue-500' : 'fill-blue-100 text-blue-400')} />
                  <span className="text-base font-medium truncate min-w-0 flex-1" title={folder.name}>{folder.name}</span>
                </div>
              </CollapsibleTrigger>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddFile(folder); }}
                title={`Upload a file to "${folder.name}"`}
                className="p-1.5 rounded-md hover:bg-blue-50 shrink-0"
              >
                <FileUp className="h-4 w-4 text-blue-600" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddSubfolder(folder); }}
                title={`Create a folder inside "${folder.name}"`}
                className="p-1.5 rounded-md hover:bg-emerald-50 shrink-0"
              >
                <FolderPlus className="h-4 w-4 text-emerald-600" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 mr-1" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={onShare}><Users className="mr-2 h-4 w-4" />Share</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddSubfolder(folder)}><FolderPlus className="mr-2 h-4 w-4" />Add Subfolder</DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/file-requests?folder=${folder.id}&folderName=${encodeURIComponent(folder.name)}`}><FileUp className="mr-2 h-4 w-4" />Request File</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRename(folder)}><PenSquare className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(folder)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {folder.children?.length > 0 && (
              <CollapsibleContent>
                <div className="pl-5 border-l border-gray-200 ml-4 mt-0.5 space-y-0.5">
                  <FolderTree
                    folderList={folder.children}
                    selectedFolderId={selectedFolderId}
                    fileIdFromUrl={fileIdFromUrl}
                    findFolder={findFolder}
                    onSelectFolder={onSelectFolder}
                    onShare={onShare}
                    onAddSubfolder={onAddSubfolder}
                    onAddFile={onAddFile}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>
        );
      })}
    </>
  );
});

// ─── CreateLinkDialog ─────────────────────────────────────────────────────────

function CreateLinkDialog({ file, open, onOpenChange, onLinkCreated }: {
  file: File; open: boolean; onOpenChange: (open: boolean) => void; onLinkCreated: (link: ShareLink) => void;
}) {
  const [accountName, setAccountName] = useState('');
  const [viewingRequirement, setViewingRequirement] = useState('require_email');
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [allowBlockByEmail, setAllowBlockByEmail] = useState(false);
  const [allowBlockType, setAllowBlockType] = useState<'allow' | 'block'>('allow');
  const [allowBlockEmails, setAllowBlockEmails] = useState<string[]>([]);
  const [allowBlockInput, setAllowBlockInput] = useState('');
  const [allowDownloads, setAllowDownloads] = useState(false);
  const [setExpiry, setSetExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('{{email}}');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Validation ────────────────────────────────────────────────────────
  // The Create button stays dimmed/disabled until every toggled-on setting
  // that needs a value actually has one. Today (local midnight) is also the
  // earliest selectable expiry - you can't expire a link in the past.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const needsPassword = passwordProtection && !passwordValue.trim();
  const needsExpiryDate = setExpiry && !expiryDate;
  const needsAllowBlock = allowBlockByEmail && allowBlockEmails.length === 0;
  const isIncomplete = needsPassword || needsExpiryDate || needsAllowBlock;
  const incompleteHint = needsPassword
    ? 'Enter a password to continue.'
    : needsExpiryDate
      ? 'Pick an expiration date to continue.'
      : needsAllowBlock
        ? 'Add at least one email, or uncheck allow/block.'
        : '';

  const EMAIL_OR_DOMAIN_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^@[^\s@]+\.[^\s@]+$/;
  const addAllowBlockEmail = () => {
    const v = allowBlockInput.trim().toLowerCase();
    if (!v) return;
    if (!EMAIL_OR_DOMAIN_RE.test(v)) {
      setSaveError('Enter a valid email (name@company.com) or domain (@company.com).');
      return;
    }
    if (!allowBlockEmails.includes(v)) setAllowBlockEmails((prev) => [...prev, v]);
    setAllowBlockInput('');
    setSaveError(null);
  };
  const removeAllowBlockEmail = (e: string) =>
    setAllowBlockEmails((prev) => prev.filter((x) => x !== e));

  // Persist a REAL share_links row (file-scoped) so every setting is enforced
  // by the same server-side gates the space links use. The link opens via
  // /shared/<token>.
  const handleCreate = async () => {
    if (isIncomplete || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const userId = session?.user?.id;
      if (!accessToken || !userId) {
        setSaveError('Please sign in again.');
        setSaving(false);
        return;
      }

      // Hash the password server-side (bcrypt) - never store plaintext.
      let passwordHash: string | null = null;
      if (passwordProtection && passwordValue.trim()) {
        const res = await fetch('/api/share-links/hash-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ password: passwordValue }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.hash) {
          setSaveError('Could not secure the password. Please try again.');
          setSaving(false);
          return;
        }
        passwordHash = j.hash;
      }

      const linkToken =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '')
          : `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const useAllowBlock = allowBlockByEmail && allowBlockEmails.length > 0;

      // Scope the link to the user's Content Library space (a real, owned space).
      // share_links.space_id is NOT NULL and RLS expects an owned space; the
      // viewer's owner-plan check also resolves the owner from space_id. Every
      // content-library file lives under this sentinel space.
      const { data: clSpace } = await supabase
        .from('spaces')
        .select('id')
        .eq('created_by', userId)
        .eq('title', 'CONTENT_LIBRARY')
        .maybeSingle();
      const linkSpaceId = (clSpace?.id as string | undefined) ?? null;

      const basePayload = {
        space_id: linkSpaceId,
        file_id: file.id,
        created_by: userId,
        token: linkToken,
        link_name: accountName || null,
        email_required: viewingRequirement === 'require_email' || useAllowBlock,
        password_hash: passwordHash,
        expires_at: setExpiry && expiryDate ? expiryDate.toISOString() : null,
        watermark: addWatermark,
        allow_download: allowDownloads,
        is_active: true,
      };
      const extendedPayload = {
        ...basePayload,
        watermark_text: addWatermark ? watermarkText.trim() || '{{email}}' : null,
        allow_block_type: useAllowBlock ? allowBlockType : null,
        allow_block_emails: useAllowBlock ? allowBlockEmails : null,
      };

      let { data, error } = await supabase
        .from('share_links')
        .insert(extendedPayload)
        .select('id, token')
        .single();
      // Retry without the extended columns if this DB hasn't run that migration.
      if (error && (error.code === '42703' || error.code === 'PGRST204' || /column/i.test(error.message ?? ''))) {
        ({ data, error } = await supabase
          .from('share_links')
          .insert(basePayload)
          .select('id, token')
          .single());
      }
      if (error || !data) {
        console.error('[create file link] insert failed:', error);
        setSaveError(
          error?.message ? `Could not create the link: ${error.message}` : 'Could not create the link. Please try again.',
        );
        setSaving(false);
        return;
      }
      const inserted = data as { id: string; token: string };

      const newLink: ShareLink = {
        id: inserted.id,
        account: accountName || 'Shared link',
        requireEmail: viewingRequirement === 'require_email',
        allowDownloading: allowDownloads,
        requireNameToSign: false,
        expires: setExpiry,
        expiryDate,
        passcode: passwordProtection,
        passcodeValue: passwordValue,
        // Relative path - CopyLinkDialog prepends the origin.
        url: `/shared/${inserted.token}`,
        createdAt: new Date().toISOString(),
        eSignatures: 0,
        enabled: true,
      };
      onLinkCreated(newLink);
      onOpenChange(false);
    } catch {
      setSaveError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">Create link</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Name link <span className="font-normal italic">(not visible to visitors)</span></Label>
            <Select value={accountName} onValueChange={setAccountName}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select an account name or enter a new one" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="example_account">Example Account</SelectItem>
                <SelectItem value="my_company">My Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 group">
                <div className="flex items-center gap-2"><Lock className="h-4 w-4" /><span className="font-semibold text-base">Manage file access</span></div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=closed]:rotate-180 transition-transform" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Viewing requirements</Label>
                <Select value={viewingRequirement} onValueChange={setViewingRequirement}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="require_email">Require an email to view</SelectItem>
                    <SelectItem value="no_requirement">No requirement</SelectItem>
                    <SelectItem value="require_login">Require login</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="password-protection" checked={passwordProtection} onCheckedChange={(c) => setPasswordProtection(Boolean(c))} className="mt-0.5" />
                <div className="flex-1 space-y-2">
                  <label htmlFor="password-protection" className="text-sm font-medium cursor-pointer">Add password protection</label>
                  {passwordProtection && <Input placeholder="Enter password" value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)} type="password" />}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="allow-block-email" checked={allowBlockByEmail} onCheckedChange={(c) => setAllowBlockByEmail(Boolean(c))} className="mt-0.5" />
                <div className="flex-1 space-y-3">
                  <label htmlFor="allow-block-email" className="text-sm font-medium cursor-pointer">Allow or block visitors by email address or domain</label>
                  {allowBlockByEmail && (
                    <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                      <Select value={allowBlockType} onValueChange={(v) => setAllowBlockType(v as 'allow' | 'block')}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="allow">Allow only these people</SelectItem>
                          <SelectItem value="block">Block these people</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input
                          placeholder="name@company.com or @company.com"
                          value={allowBlockInput}
                          onChange={(e) => setAllowBlockInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllowBlockEmail(); } }}
                        />
                        <Button type="button" variant="outline" onClick={addAllowBlockEmail}>Add</Button>
                      </div>
                      {allowBlockEmails.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {allowBlockEmails.map((e) => (
                            <span key={e} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                              {e}
                              <button type="button" onClick={() => removeAllowBlockEmail(e)} className="text-gray-500 hover:text-gray-900" aria-label={`Remove ${e}`}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {allowBlockType === 'allow'
                          ? 'Only the people you add here can open this link. Everyone else is denied, even with the link.'
                          : 'The people you add here are blocked from opening this link. Everyone else can still view it.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 group">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span className="font-semibold text-base">Add extra security settings</span></div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=closed]:rotate-180 transition-transform" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox id="allow-downloads" checked={allowDownloads} onCheckedChange={(c) => setAllowDownloads(Boolean(c))} className="mt-0.5" />
                <label htmlFor="allow-downloads" className="text-sm font-medium cursor-pointer">Allow downloads</label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="set-expiry" checked={setExpiry} onCheckedChange={(c) => setSetExpiry(Boolean(c))} className="mt-0.5" />
                <div className="flex-1 space-y-2">
                  <label htmlFor="set-expiry" className="text-sm font-medium cursor-pointer">Set an expiration date</label>
                  {setExpiry && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !expiryDate && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />{expiryDate ? format(expiryDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} disabled={{ before: today }} initialFocus /></PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="watermark" checked={addWatermark} onCheckedChange={(c) => setAddWatermark(Boolean(c))} className="mt-0.5" />
                <div className="flex-1 space-y-2">
                  <label htmlFor="watermark" className="text-sm font-medium cursor-pointer">Add a watermark to protect from unauthorized use</label>
                  {addWatermark && (
                    <>
                      <Input placeholder="{{email}}" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Use {'{{email}}'} to stamp each viewer&apos;s email across the document.</p>
                    </>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-600 min-h-[1rem]">{saveError || incompleteHint}</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isIncomplete || saving}>{saving ? 'Creating...' : 'Create link'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── CopyLinkDialog ───────────────────────────────────────────────────────────

function CopyLinkDialog({ link, open, onOpenChange }: { link: ShareLink; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const fullLink = typeof window !== 'undefined' ? `${window.location.origin}${link.url}` : link.url;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Copy the link to securely share your file</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
          <Input defaultValue={fullLink} readOnly className="bg-muted" />
          <p className="text-sm text-muted-foreground">This link belongs to {link.account} account.</p>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="ghost">Preview</Button>
          <Button onClick={() => { navigator.clipboard.writeText(fullLink); toast({ title: 'Copied!' }); }}>
            <Copy className="mr-2 h-4 w-4" />Copy link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// File-type icon + colour pair moved to @/lib/file-icons so the analytics
// session drilldown reuses the exact same mapping. See top of file for
// the re-export keeping local call sites working.

// ─── Empty-state illustrations ────────────────────────────────────────────────
// Hand-drawn SVG illustrations for the file-detail empty states.
// Kept inline (no external dep) and in a single accent-blue palette so the
// page doesn't feel monochrome when a file has no activity yet.
// Defined at module scope so they're not re-created per render.

const EmptyIllustrations = {
  Visits: () => (
    <svg viewBox="0 0 220 160" className="w-44 h-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Paper */}
      <rect x="50" y="20" width="90" height="120" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
      <line x1="62" y1="42" x2="118" y2="42" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="55" x2="128" y2="55" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="68" x2="108" y2="68" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      {/* Pie slice - analytics motif */}
      <circle cx="95" cy="108" r="18" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
      <path d="M 95 90 A 18 18 0 0 1 113 108 L 95 108 Z" fill="#3b82f6" />
      {/* Magnifying glass */}
      <circle cx="168" cy="80" r="22" fill="white" stroke="#1f2937" strokeWidth="2" />
      <line x1="186" y1="98" x2="202" y2="115" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  Links: () => (
    <svg viewBox="0 0 240 160" className="w-44 h-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Tilted paper */}
      <g transform="rotate(-8 120 80)">
        <rect x="50" y="40" width="110" height="80" rx="5" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
        <line x1="65" y1="62" x2="140" y2="62" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        <line x1="65" y1="78" x2="145" y2="78" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
        <line x1="65" y1="94" x2="120" y2="94" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Paper plane */}
      <g transform="translate(160 28)">
        <path d="M0 12 L42 0 L26 36 L20 24 L0 12 Z" fill="#3b82f6" />
        <path d="M0 12 L20 24 L26 36" fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {/* Trajectory dashes */}
      <path d="M 30 130 Q 100 110 158 50" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" />
    </svg>
  ),
  Signatures: () => (
    <svg viewBox="0 0 220 160" className="w-44 h-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Clipboard */}
      <rect x="48" y="32" width="100" height="116" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
      <rect x="80" y="22" width="36" height="16" rx="3" fill="#1f2937" />
      {/* Lines */}
      <line x1="62" y1="60" x2="130" y2="60" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="74" x2="138" y2="74" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="88" x2="120" y2="88" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      {/* Signature scribble + dashed line */}
      <line x1="62" y1="118" x2="138" y2="118" stroke="#1f2937" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M 70 112 Q 82 100 95 112 Q 108 124 122 110" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Pen */}
      <g transform="translate(150 95) rotate(35)">
        <rect x="0" y="-3" width="44" height="6" rx="1" fill="#1f2937" />
        <polygon points="44,-3 54,0 44,3" fill="#3b82f6" />
        <line x1="0" y1="0" x2="-6" y2="0" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  ),
};

// ─── DocumentDetailView ───────────────────────────────────────────────────────

function DocumentDetailView({ file, onPreview }: { file: File; onPreview: (file: File) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const { addLinkToFile, updateFile } = useFolders();
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [lastCreatedLink, setLastCreatedLink] = useState<ShareLink | null>(null);
  const [isCopyLinkDialogOpen, setIsCopyLinkDialogOpen] = useState(false);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [dbLinks, setDbLinks] = useState<ShareLink[]>([]);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sends, setSends] = useState<Array<{ id: string; email: string; opened: boolean; openCount: number; createdAt: string }>>([]);

  // Live-poll this file's visits + signatures every 8s so a new signer
  // shows up WITHOUT a manual refresh. The page receives `file` as a prop
  // from the parent (which only loads once); this keeps the activity tab
  // fresh on its own.
  const [liveVisits, setLiveVisits] = useState<Visit[] | null>(null);
  const [liveSignatures, setLiveSignatures] = useState<Signature[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const refetch = async () => {
      const { data } = await supabase
        .from('files')
        .select('visits, signatures')
        .eq('id', file.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setLiveVisits(Array.isArray(data.visits) ? (data.visits as Visit[]) : []);
      setLiveSignatures(Array.isArray(data.signatures) ? (data.signatures as Signature[]) : []);
    };
    refetch();
    const id = setInterval(refetch, 8000);
    const onFocus = () => refetch();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [file.id]);

  // Prefer live-polled data; fall back to the prop on first paint.
  const visits: Visit[] = liveVisits ?? file.visits ?? [];
  const signatures: Signature[] = liveSignatures ?? file.signatures ?? [];

  // A file is treated as an agreement if it has placed signature fields or
  // the legacy id prefix. (New agreements use UUIDs, so the old
  // startsWith('agreement_') check alone no longer suffices.)
  const isAgreement = (file.agreementFields?.length ?? 0) > 0 || file.id.startsWith('agreement_');

  // ── Per-SESSION page attention ─────────────────────────────────────────
  // Each visit (session) carries its OWN per-page dwell in `pageViews`. The
  // same person visiting twice produces two separate visits, so the owner can
  // click a specific visit row in "All visits" and see exactly that session's
  // page breakdown - not a merged per-email aggregate.
  const sessionPageData = useMemo(() => {
    const map = new Map<string, { rows: { page: number; seconds: number }[]; max: number }>();
    for (const v of visits) {
      const pv = (v as { pageViews?: Record<string, number> }).pageViews;
      if (!pv || typeof pv !== 'object') continue;
      const rows = Object.entries(pv)
        .map(([page, seconds]) => ({ page: Number(page), seconds: Number(seconds) }))
        .filter((r) => Number.isFinite(r.page) && Number.isFinite(r.seconds) && r.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds);
      if (rows.length === 0) continue;
      map.set(v.id, { rows, max: rows[0]?.seconds || 1 });
    }
    return map;
  }, [visits]);

  // Default selection = the most-recent visit that actually recorded pages.
  const defaultSessionId = useMemo(() => {
    let bestId: string | null = null;
    let bestTs = -1;
    for (const v of visits) {
      if (!sessionPageData.has(v.id)) continue;
      const ts = new Date((v as { openedAt?: string }).openedAt ?? v.time ?? 0).getTime() || 0;
      if (ts >= bestTs) { bestTs = ts; bestId = v.id; }
    }
    return bestId;
  }, [visits, sessionPageData]);

  // Which visit's (session's) breakdown is shown. null → default to most recent.
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const activeVisitId = selectedVisitId ?? defaultSessionId;
  const activeVisit = useMemo(
    () => visits.find((v) => v.id === activeVisitId) ?? null,
    [visits, activeVisitId],
  );
  const activePageRows = useMemo(
    () => sessionPageData.get(activeVisitId ?? '') ?? { rows: [] as { page: number; seconds: number }[], max: 1 },
    [sessionPageData, activeVisitId],
  );
  // Human-readable timestamp of the selected session, for the header.
  const activeVisitTime = useMemo(() => {
    if (!activeVisit) return '';
    const raw = (activeVisit as { openedAt?: string }).openedAt ?? activeVisit.time;
    if (raw) { const d = new Date(raw); if (!isNaN(d.getTime())) return format(d, "MMM d, yyyy 'at' h:mm a"); }
    return '';
  }, [activeVisit]);

  // Load this file's real share links from the DB (source of truth) so the
  // "All links" list shows every link created for it, across refreshes.
  const loadLinks = useCallback(async () => {
    // Select recipient_email so we can EXCLUDE per-recipient send-by-email links
    // from this list (they have their own "Sent by email" section). Falls back
    // to the base columns on databases that have not run that migration yet.
    const sel = 'id, token, link_name, email_required, allow_download, expires_at, password_hash, created_at, is_active';
    const withRecip = await supabase
      .from('share_links')
      .select(`${sel}, recipient_email`)
      .eq('file_id', file.id)
      .order('created_at', { ascending: false });
    let data: Array<Record<string, unknown>>;
    if (withRecip.error) {
      // Pre-migration DBs lack recipient_email; fall back to the base columns.
      const base = await supabase
        .from('share_links')
        .select(sel)
        .eq('file_id', file.id)
        .order('created_at', { ascending: false });
      data = (base.data ?? []) as Array<Record<string, unknown>>;
    } else {
      data = (withRecip.data ?? []) as Array<Record<string, unknown>>;
    }
    const rows = data.filter((r) => !r.recipient_email);
    setDbLinks(
      rows.map((r) => ({
        id: r.id as string,
        account: (r.link_name as string) || 'Shared link',
        requireEmail: !!r.email_required,
        allowDownloading: r.allow_download !== false,
        requireNameToSign: false,
        expires: !!r.expires_at,
        expiryDate: r.expires_at ? new Date(r.expires_at as string) : undefined,
        passcode: !!r.password_hash,
        passcodeValue: '',
        url: `/shared/${r.token as string}`,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
        eSignatures: 0,
        enabled: r.is_active !== false,
      })),
    );
  }, [file.id]);

  // Per-recipient "send by email" invites for this file, with opened status.
  const loadSends = useCallback(async () => {
    const { data, error } = await supabase
      .from('share_links')
      .select('id, recipient_email, opened_at, open_count, created_at')
      .eq('file_id', file.id)
      .not('recipient_email', 'is', null)
      .order('created_at', { ascending: false });
    if (error) { setSends([]); return; }
    setSends(
      (data ?? []).map((r) => ({
        id: r.id as string,
        email: (r.recipient_email as string) ?? '',
        opened: !!r.opened_at,
        openCount: Number(r.open_count) || 0,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
      })),
    );
  }, [file.id]);

  useEffect(() => {
    loadLinks();
    loadSends();
  }, [loadLinks, loadSends]);

  const handleLinkCreated = (link: ShareLink) => {
    setLastCreatedLink(link);
    setIsCopyLinkDialogOpen(true);
    void loadLinks();
    toast({ title: 'Link Created!' });
  };

  const handleToggleLink = async (linkId: string, enabled: boolean) => {
    await supabase.from('share_links').update({ is_active: enabled }).eq('id', linkId);
    void loadLinks();
  };

  // ── Update file (new version) ──────────────────────────────────────────
  // Uploads a replacement and repoints THIS file row's storage_path at it.
  // Every existing share link keeps working because links resolve the file
  // by id and sign the storage path fresh on each open. Also fires a Deal
  // Watch event so the account manager sees the update.
  const updateFileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingFile, setIsUpdatingFile] = useState(false);
  const handleUpdateFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || isUpdatingFile) return;
    setIsUpdatingFile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) throw new Error('Not signed in');
      const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const newPath = `${uid}/${file.id}/v${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from('documents')
        .upload(newPath, f, { upsert: false });
      if (upErr) throw upErr;
      const newType = f.name.split('.').pop()?.toUpperCase() ?? 'FILE';
      const { error: dbErr } = await supabase
        .from('files')
        .update({ name: f.name, type: newType, storage_path: newPath, size_bytes: f.size })
        .eq('id', file.id);
      if (dbErr) throw dbErr;
      updateFile(file.id, { name: f.name });
      void fireDealWatchEvent({ fileId: file.id, fileName: f.name, eventType: 'file_updated' });
      toast({
        title: 'File updated',
        description: 'All existing links now open the new version.',
      });
    } catch (err) {
      console.error('[update file] failed:', err);
      toast({ variant: 'destructive', title: 'Update failed', description: 'Please try again.' });
    } finally {
      setIsUpdatingFile(false);
    }
  };

  const handleDownloadSignedCopy = async (visit: Visit) => {
    if (!file.contentUrl) { toast({ variant: 'destructive', title: 'Download failed' }); return; }
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const signature = signatures.find(sig => sig.email === visit.email);
      const existingPdfBytes = await fetch(file.contentUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      if (file.agreementFields && signature?.fieldValues) {
        for (const field of file.agreementFields) {
          const page = pages[field.page - 1];
          if (!page) continue;
          const fieldValue = signature.fieldValues[field.id];
          if (!fieldValue) continue;
          const x = (field.x / 100) * page.getWidth();
          const y = page.getHeight() - (field.y / 100) * page.getHeight();
          if (typeof fieldValue === 'object') {
            if (fieldValue.type === 'drawn' && fieldValue.value) {
              const pngImage = await pdfDoc.embedPng(fieldValue.value);
              const { width, height } = pngImage.scale(0.25);
              page.drawImage(pngImage, { x, y: y - height, width, height });
            } else if (fieldValue.type === 'typed' && fieldValue.value) {
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              page.drawText(fieldValue.value, { x, y: y - 18, font, size: 18, color: rgb(0, 0, 0) });
            }
          } else {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            page.drawText(String(fieldValue), { x, y: y - 14, font, size: 12, color: rgb(0, 0, 0) });
          }
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${file.name.replace('.pdf', '')}_signed.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) { console.error(e); toast({ variant: 'destructive', title: 'Download failed' }); }
  };

  const pieData = (pct: number) => [{ value: pct, fill: '#3b82f6' }, { value: 100 - pct, fill: '#e5e7eb' }];

  const visitCount = visits.length;
  const linkCount = dbLinks.length;
  const signatureCount = signatures.length;

  // DocSend-style empty card: illustration on top, headline, helper text,
  // optional CTA. The illustration is a small SVG scene (defined at module
  // scope) - keeps the page from reading flat / black-and-white when the
  // file has no activity yet.
  const EmptyState = ({
    illustration,
    title,
    description,
    action,
  }: {
    illustration: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
  }) => (
    <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-gray-200 rounded-xl bg-white">
      <div className="mb-5">{illustration}</div>
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
        {/* ─── Breadcrumb ──────────────────────────────────────────────── */}
        <button
          onClick={() => router.push('/content-library')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          My Company Content
        </button>

        {/* ─── Title block: file icon + name + metadata + actions ─────── */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Colored file icon - tinted bg + matching icon, derived from
                file extension (PDF=red, docs=blue, sheets=green, images=pink,
                video=indigo, agreement=purple). Replaces the flat grey block
                the user flagged as monochrome. */}
            {(() => {
              const { Icon, bg, text } = getFileTypeStyle(file.name, isAgreement);
              return (
                <div className={cn('h-14 w-14 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon className={cn('h-7 w-7', text)} />
                </div>
              );
            })()}
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="text-2xl font-bold tracking-tight truncate" title={file.name}>{file.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground flex-wrap">
                <span>Last updated {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                {isAgreement && (
                  <>
                    <span className="text-gray-300">•</span>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-medium hover:bg-blue-50">
                      Signable Agreement
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />Preview
            </Button>
            <input
              ref={updateFileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpdateFileChosen}
            />
            <Button
              variant="outline"
              disabled={isUpdatingFile}
              onClick={() => updateFileInputRef.current?.click()}
            >
              {isUpdatingFile
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Upload className="mr-2 h-4 w-4" />}
              {isUpdatingFile ? 'Updating...' : 'Upload new version'}
            </Button>
            <Button variant="outline" onClick={() => setIsSendOpen(true)}>
              <Send className="mr-2 h-4 w-4" />Send by email
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setIsCreateLinkOpen(true)}>
              Create link
            </Button>
          </div>
        </div>

        {/* ─── Tabs (underline style for cleaner reading) ─────────────── */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start gap-2">
            {[
              { value: 'activity', label: 'Activity' },
              { value: 'performance', label: 'Performance' },
              { value: 'signatures', label: 'Signatures' },
            ].map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-gray-900 px-1 pb-2.5 pt-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ─── Activity tab ─────────────────────────────────────────── */}
          <TabsContent value="activity" className="mt-8 space-y-10">
            {/* All Visits */}
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <h3 className="text-base font-semibold">All visits</h3>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">{visitCount}</span>
              </div>
              {visitCount === 0 ? (
                <EmptyState
                  illustration={<EmptyIllustrations.Visits />}
                  title="No visits yet"
                  description="Visits will appear here when someone opens your shared link."
                />
              ) : (
                <div className="border-y border-gray-200 divide-y divide-gray-200">
                  {visits.map((visit) => {
                    const isActiveSession = activeVisitId === visit.id;
                    const hasPageData = sessionPageData.has(visit.id);
                    return (
                    <div key={visit.id} className={cn('group transition-colors', isActiveSession && 'bg-blue-50/40')}>
                      <div className="flex items-center py-4 gap-4">
                        {/* Clicking the name/email selects THIS visit (session)
                            and drives the Page attention section below. */}
                        <button
                          type="button"
                          onClick={() => setSelectedVisitId(visit.id)}
                          aria-pressed={isActiveSession}
                          title="Click to see this session's page activity"
                          className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Avatar className={cn('h-9 w-9 shrink-0', isActiveSession && 'ring-2 ring-blue-500 ring-offset-1')}>
                            <AvatarFallback className="bg-orange-500 text-white text-sm">
                              {visit.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('font-medium truncate', isActiveSession && 'text-blue-700')}>
                                {visit.name}
                              </span>
                              {/* Signed indicator - pen-and-paper icon + label,
                                  shown right in front of anyone who signed. */}
                              {visit.signed && (
                                <span
                                  title="Signed this document"
                                  className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700"
                                >
                                  <FileSignature className="h-3 w-3" />
                                  Signed
                                </span>
                              )}
                              {visit.isInternal && <span className="shrink-0 font-normal text-muted-foreground text-xs">[Internal]</span>}
                              {hasPageData && <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" title="Has page activity" />}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {(() => {
                                // Show the EXACT timestamp the visit happened.
                                // New visits store an ISO string in openedAt.
                                // If there's no real, parseable timestamp (old
                                // rows that stored the literal "just now"), show
                                // ONLY the email - never a vague "earlier"
                                // placeholder or fabricated time.
                                const ident = visit.email || visit.account;
                                const raw = (visit as { openedAt?: string }).openedAt ?? visit.time;
                                if (raw) {
                                  const d = new Date(raw);
                                  if (!isNaN(d.getTime())) return `${ident} • ${format(d, "MMM d, yyyy 'at' h:mm a")}`;
                                }
                                return ident;
                              })()}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-4 shrink-0">
                          {visit.signed && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadSignedCopy(visit)}>
                                  <FileSignature className="h-4 w-4 text-gray-700" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Download signed copy</p></TooltipContent>
                            </Tooltip>
                          )}
                          <Badge variant="outline" className="font-mono text-xs">
                            {`${Math.floor(visit.durationSeconds / 60).toString().padStart(2, '0')}:${(visit.durationSeconds % 60).toString().padStart(2, '0')}`}
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-6 w-6 cursor-help">
                                <PieChart width={24} height={24}>
                                  <Pie data={pieData(visit.viewPercentage)} dataKey="value" cx="50%" cy="50%" innerRadius={6} outerRadius={12} stroke="none">
                                    {pieData(visit.viewPercentage).map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                  </Pie>
                                </PieChart>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{visit.viewPercentage}% viewed</p></TooltipContent>
                          </Tooltip>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedVisit(prev => prev === visit.id ? null : visit.id)}>
                            {expandedVisit === visit.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      {expandedVisit === visit.id && (
                        <div className="pb-4 -mt-1">
                          <div className="flex items-center gap-6 text-sm text-muted-foreground pl-12">
                            {(() => {
                              // Only render details we actually captured - never
                              // an "Unknown" placeholder (incomplete data).
                              const real = (s?: string) => !!s && s.trim() !== '' && s.toLowerCase() !== 'unknown';
                              const items: React.ReactNode[] = [];
                              if (real(visit.device)) items.push(<div key="d" className="flex items-center gap-2"><Laptop className="h-4 w-4" />{visit.device}</div>);
                              if (real(visit.os)) items.push(<div key="o" className="flex items-center gap-2"><Globe className="h-4 w-4" />{visit.os}</div>);
                              if (real(visit.location)) items.push(<div key="l" className="flex items-center gap-2"><Globe className="h-4 w-4" />{visit.location}</div>);
                              return items.length > 0 ? items : <span className="italic">No device details recorded for this visit.</span>;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Page attention - PER SESSION. Reflects the visit selected in
                "All visits" above (defaults to the most-recent visit that has
                page data). The same person's two visits are two separate
                sessions, so each can be inspected on its own. */}
            {sessionPageData.size > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-base font-semibold">Page attention</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {activePageRows.rows.length} page{activePageRows.rows.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeVisit ? (
                    <>
                      Time <strong className="text-foreground font-medium">{activeVisit.name}</strong> spent on each
                      page in this session{activeVisitTime ? <> · <span className="text-foreground">{activeVisitTime}</span></> : ''}. Most-viewed first.
                      {' '}Click another visit above to switch sessions.
                    </>
                  ) : (
                    <>Click a visit above to see that session&apos;s page activity.</>
                  )}
                </p>

                {activePageRows.rows.length > 0 ? (
                  <div className="border-y border-gray-200 divide-y divide-gray-200">
                    {activePageRows.rows.map(({ page, seconds }, idx) => {
                      const pct = Math.round((seconds / activePageRows.max) * 100);
                      const mm = Math.floor(seconds / 60);
                      const ss = seconds % 60;
                      const label = mm > 0 ? `${mm}m ${ss}s` : `${ss}s`;
                      return (
                        <div key={page} className="flex items-center gap-4 py-3">
                          <div className="w-16 shrink-0 text-sm font-medium flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-red-500" />
                            P{page}
                          </div>
                          <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', idx === 0 ? 'bg-blue-600' : 'bg-blue-400')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-20 shrink-0 text-right text-sm font-mono tabular-nums">{label}</div>
                          {idx === 0 && (
                            <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              Top
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-y border-gray-200 py-8 text-center text-sm text-muted-foreground">
                    No page-by-page activity was recorded for this session.
                  </div>
                )}
              </section>
            )}

            {/* All Links */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold">All links</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">{linkCount}</span>
                </div>
                {linkCount > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setIsCreateLinkOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />New link
                  </Button>
                )}
              </div>
              {linkCount === 0 ? (
                <EmptyState
                  illustration={<EmptyIllustrations.Links />}
                  title="Add a link to share your content"
                  description="Create a secure shareable link to track who opens this file and gate access."
                  action={
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setIsCreateLinkOpen(true)}>
                      Create link
                    </Button>
                  }
                />
              ) : (
                <div className="border-t border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>NAME</TableHead>
                        <TableHead>LINK</TableHead>
                        <TableHead>ACTIVITY</TableHead>
                        <TableHead className="text-right">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbLinks.map(link => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div className="font-medium">{link.account}</div>
                            <div className="text-xs text-muted-foreground">Created {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</div>
                          </TableCell>
                          <TableCell>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                              venturethrust.com{link.url}
                            </a>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {link.eSignatures > 0 ? `${link.eSignatures} eSignature${link.eSignatures > 1 ? 's' : ''}` : 'No activity'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Switch checked={link.enabled} onCheckedChange={(c) => handleToggleLink(link.id, c)} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Settings</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Sent by email */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold">Sent by email</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">{sends.length}</span>
                </div>
                {sends.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setIsSendOpen(true)}>
                    <Send className="mr-1.5 h-4 w-4" />Send more
                  </Button>
                )}
              </div>
              {sends.length === 0 ? (
                <EmptyState
                  illustration={<EmptyIllustrations.Links />}
                  title="Send this deck straight to investors"
                  description="Paste a list of investor emails. Each one gets a private link that opens the deck directly, with no email prompt, and you will see exactly who opened it."
                  action={
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setIsSendOpen(true)}>
                      <Send className="mr-2 h-4 w-4" />Send by email
                    </Button>
                  }
                />
              ) : (
                <div className="border-t border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>INVESTOR</TableHead>
                        <TableHead>STATUS</TableHead>
                        <TableHead>SENT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sends.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.email}</TableCell>
                          <TableCell>
                            {s.opened ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Opened{s.openCount > 1 ? ` (${s.openCount})` : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                <Clock className="h-3.5 w-3.5" />
                                Not opened yet
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </TabsContent>

          {/* ─── Performance tab ──────────────────────────────────────── */}
          <TabsContent value="performance" className="mt-8">
            <PerformanceView file={file} />
          </TabsContent>


          {/* ─── Signatures tab ───────────────────────────────────────── */}
          <TabsContent value="signatures" className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-semibold">Signatures</h3>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">{signatureCount}</span>
              </div>
              {signatureCount > 0 && (
                <Button size="sm" variant="outline">
                  <Download className="mr-1.5 h-4 w-4" />Export
                </Button>
              )}
            </div>
            {signatureCount === 0 ? (
              <EmptyState
                illustration={<EmptyIllustrations.Signatures />}
                title="Share a link to collect signatures"
                description="You can also set viewing permissions to control access to your file. Signatures will appear here once collected."
              />
            ) : (
              <div className="border-t border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>CONTACT</TableHead>
                      <TableHead>EMAIL</TableHead>
                      <TableHead>DATE SIGNED</TableHead>
                      <TableHead>SIGNED FROM</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signatures.map((sig, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-medium">{sig.name}</div>
                          <div className="text-sm text-muted-foreground">{sig.account}</div>
                        </TableCell>
                        <TableCell>{sig.email}</TableCell>
                        <TableCell>{sig.dateSigned ? format(new Date(sig.dateSigned), 'MMM d, yyyy') : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2"><LinkIcon className="h-4 w-4" />{sig.signedFrom}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <CreateLinkDialog file={file} open={isCreateLinkOpen} onOpenChange={setIsCreateLinkOpen} onLinkCreated={handleLinkCreated} />
      <SendByEmailDialog fileId={file.id} open={isSendOpen} onOpenChange={setIsSendOpen} onSent={() => { void loadSends(); }} />
      {lastCreatedLink && <CopyLinkDialog link={lastCreatedLink} open={isCopyLinkDialogOpen} onOpenChange={setIsCopyLinkDialogOpen} />}
      <FileViewer file={file} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </TooltipProvider>
  );
}

// ─── DeletedContentView ───────────────────────────────────────────────────────

function DeletedContentView({ items }: { items: DeletedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 h-full text-muted-foreground py-24">
        <Trash2 className="h-12 w-12" />
        <p className="text-lg font-medium">No deleted items</p>
        <p className="text-sm">Items you delete will appear here permanently.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold">Deleted Content</h2>
        <p className="text-sm text-muted-foreground mt-1">All items you have deleted from your Content Library.</p>
      </div>
      <div className="border-t border-gray-200" />
      <div className="flex items-center py-2 px-2 gap-3">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</span>
        <span className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</span>
        <span className="w-44 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deleted At</span>
      </div>
      <div className="border-t border-gray-200" />
      {items.map((item) => {
        // Color the file icon by extension (folders stay blue - they're
        // already coloured). Adds a touch of visual variety to the trash.
        const fileStyle = item.itemType === 'file'
          ? getFileTypeStyle(item.name, item.id.startsWith('agreement_'))
          : null;
        return (
        <div key={`${item.itemType}-${item.id}`}>
          <div className="flex items-center gap-3 py-2.5 px-2">
            {item.itemType === 'folder' ? (
              <FolderIcon className="h-5 w-5 shrink-0 fill-blue-100 text-blue-400" />
            ) : fileStyle ? (
              <fileStyle.Icon className={cn('h-5 w-5 shrink-0', fileStyle.text)} />
            ) : (
              <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 text-sm font-medium truncate min-w-0" title={item.name}>{item.name}</span>
            <span className="w-16 text-center">
              <Badge variant="outline" className="text-xs capitalize">{item.itemType}</Badge>
            </span>
            <span className="w-44 text-right text-xs text-muted-foreground shrink-0">
              {format(item.deletedAt, 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          <div className="border-t border-gray-200" />
        </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ContentLibraryPageComponent() {
  const { toast } = useToast();
  const { folders, isLoading, deletedItems, findFolder, addFolder, renameFolder, deleteFolder, addFilesToFolder, deleteFile, findDocument } = useFolders();
  const router = useRouter();
  const searchParams = useSearchParams();
  // fileIdFromUrl drives the file-detail view - must stay reactive.
  const fileIdFromUrl = searchParams.get('fileId');
  // Folder selection is managed locally; we only read the URL once on initial load.
  const initialFolderIdRef = useRef(searchParams.get('folderId'));
  const hasInitializedRef = useRef(false);

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showDeletedContent, setShowDeletedContent] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [createLinkFile, setCreateLinkFile] = useState<File | null>(null);
  const [lastCreatedLink, setLastCreatedLink] = useState<ShareLink | null>(null);
  const [isCopyLinkDialogOpen, setIsCopyLinkDialogOpen] = useState(false);

  // ── Spaces state ──────────────────────────────────────────────────────────
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  // ── Fetch spaces from Supabase (excluding the internal CL sentinel space) ─
  useEffect(() => {
    async function fetchSpaces() {
      try {
        // Scope to the active workspace (own or a joined one), so the sidebar
        // stays consistent with /spaces and the switcher.
        const ownerId = await getEffectiveOwnerId();
        if (!ownerId) return;
        const { data, error } = await supabase
          .from('spaces')
          .select('id, name, created_at, title')
          .eq('created_by', ownerId)
          // Exclude the dedicated content-library space (identified by its sentinel title)
          .neq('title', 'CONTENT_LIBRARY')
          .order('created_at', { ascending: true });
        if (!error && data) setSpaces(data);
      } catch (err) {
        console.warn('[SPACES] Failed to fetch spaces:', err);
      } finally {
        setSpacesLoading(false);
      }
    }
    fetchSpaces();
  }, []);

  // The folder-provider already scopes `folders` to content-library folders
  // only (space_id === contentLibrarySpaceId), so no extra filter is needed.
  const contentLibraryFolders = folders;
  const personalFolders = useMemo(() => contentLibraryFolders.filter(f => f.type !== 'team'), [contentLibraryFolders]);
  const teamFolders = useMemo(() => contentLibraryFolders.filter(f => f.type === 'team'), [contentLibraryFolders]);

  // ── Password dialog state ─────────────────────────────────────────────────
  const [passwordDialogState, setPasswordDialogState] = useState<{
    open: boolean;
    fileName: string;
    error?: string;
    resolve?: (password: string | null) => void;
  }>({ open: false, fileName: '' });

  // Promise-based password prompt - awaitable inside async upload handlers
  const promptForPassword = useCallback((fileName: string, errorMsg?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setPasswordDialogState({ open: true, fileName, error: errorMsg, resolve });
    });
  }, []);

  const handlePasswordSubmit = (password: string) => {
    const resolve = passwordDialogState.resolve;
    setPasswordDialogState({ open: false, fileName: '' });
    resolve?.(password);
  };

  const handlePasswordCancel = () => {
    const resolve = passwordDialogState.resolve;
    setPasswordDialogState({ open: false, fileName: '' });
    resolve?.(null);
  };

  // ── Prepare files: detect encryption, prompt for password, decrypt ────────
  const prepareFiles = useCallback(async (files: globalThis.File[]): Promise<globalThis.File[]> => {
    const result: globalThis.File[] = [];
    for (const file of files) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        let encrypted = false;
        try { encrypted = await isPdfEncrypted(file); } catch { /* treat as not encrypted */ }

        if (encrypted) {
          let decryptedFile: globalThis.File | null = null;
          let errorMsg: string | undefined;

          while (!decryptedFile) {
            const password = await promptForPassword(file.name, errorMsg);
            if (!password) break;

            try {
              decryptedFile = await decryptPdf(file, password);
              toast({ title: `"${file.name}" unlocked successfully.` });
            } catch {
              errorMsg = 'Incorrect password. Please try again.';
            }
          }

          if (decryptedFile) {
            result.push(decryptedFile);
          } else {
            toast({ title: `"${file.name}" skipped.`, description: 'File was not uploaded.', variant: 'destructive' });
          }
        } else {
          result.push(file);
        }
      } else {
        result.push(file);
      }
    }
    return result;
  }, [promptForPassword, toast]);

  // Run exactly once after folders load to pick the initial selected folder.
  // After that, selectedFolderId is managed locally - the URL is updated via
  // window.history.replaceState (bypasses Next.js navigation & the NavigationLoader).
  useEffect(() => {
    if (isLoading || hasInitializedRef.current) return;
    if (fileIdFromUrl) { hasInitializedRef.current = true; return; }
    const initialId = initialFolderIdRef.current;
    if (initialId && findFolder(initialId, contentLibraryFolders)) {
      setSelectedFolderId(initialId);
    } else if (contentLibraryFolders.length > 0) {
      setSelectedFolderId(contentLibraryFolders[0].id);
    }
    hasInitializedRef.current = true;
  }, [isLoading, contentLibraryFolders, fileIdFromUrl, findFolder]);

  // ── Defensive pointer-events cleanup ────────────────────────────────────
  // Radix UI sometimes leaves `pointer-events: none` on the <body> after a
  // Dialog/DropdownMenu closes (especially when a dropdown item opens a dialog).
  // This watchdog runs after every render and force-clears the style if no
  // dialog should be open - guaranteeing the page is never stuck unclickable.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    }, 200);
    return () => window.clearTimeout(id);
  });

  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [isDeleteFileOpen, setIsDeleteFileOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isFolderUploadSheetOpen, setIsFolderUploadSheetOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'personal' | 'team'>('personal');
  // Section (Personal/Team) chosen when uploading a folder to the top level.
  const [uploadFolderType, setUploadFolderType] = useState<'personal' | 'team'>('personal');
  const [createInsideActiveFolder, setCreateInsideActiveFolder] = useState(true);
  const [renamingFolderName, setRenamingFolderName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<globalThis.File[]>([]);
  const [uploadedFolder, setUploadedFolder] = useState<globalThis.File[]>([]);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);

  // ── Resizable sidebar ─────────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const resizeStateRef = useRef({ active: false, startX: 0, startW: 240 });

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStateRef.current = { active: true, startX: e.clientX, startW: sidebarWidth };
    const onMove = (ev: MouseEvent) => {
      if (!resizeStateRef.current.active) return;
      const newW = Math.max(160, Math.min(480, resizeStateRef.current.startW + ev.clientX - resizeStateRef.current.startX));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      resizeStateRef.current.active = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const selectedFile = useMemo(() => fileIdFromUrl ? findDocument(fileIdFromUrl) : null, [fileIdFromUrl, findDocument]);
  const selectedFolder = useMemo(() => selectedFolderId ? findFolder(selectedFolderId, contentLibraryFolders) : null, [selectedFolderId, contentLibraryFolders, findFolder]);
  const flatFolderList = useMemo(() => flattenFolders(contentLibraryFolders), [contentLibraryFolders]);

  const updateUploadItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploadItems((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
  }, []);

  // Use replaceState (not router.push/replace) so the NavigationLoader overlay
  // never fires and no Next.js navigation is triggered on folder clicks.
  const handleSelectFolder = useCallback((id: string) => {
    setSelectedFolderId(id);
    setShowDeletedContent(false);
    window.history.replaceState({}, '', `/content-library?folderId=${encodeURIComponent(id)}`);
  }, []);

  // All dialog-opening handlers are deferred via setTimeout(0) so that the
  // DropdownMenu that triggered them has time to fully close (and release focus)
  // before the dialog mounts. Without this, Radix UI blocks aria-hidden on the
  // dropdown's focused descendant, which leaves pointer-events: none on the body
  // and makes the page look fine but unclickable until a hard refresh.
  const handleOpenShare = useCallback(() => {
    setTimeout(() => setIsShareOpen(true), 0);
  }, []);
  // Quick "+file" on a folder row: open the upload sheet pre-targeted at it.
  const handleOpenUploadToFolder = useCallback((folder: Folder) => {
    setUploadedFiles([]);
    setUploadTargetFolderId(folder.id);
    setIsUploadSheetOpen(true);
  }, []);

  const handleOpenAddSubfolder = useCallback((folder: Folder) => {
    setTimeout(() => { setActiveFolder(folder); setCreateInsideActiveFolder(true); setIsAddFolderOpen(true); }, 0);
  }, []);
  const handleOpenRename = useCallback((folder: Folder) => {
    setTimeout(() => { setActiveFolder(folder); setRenamingFolderName(folder.name); setIsRenameFolderOpen(true); }, 0);
  }, []);
  const handleOpenDeleteFolder = useCallback((folder: Folder) => {
    setTimeout(() => { setActiveFolder(folder); setIsDeleteFolderOpen(true); }, 0);
  }, []);
  const openCreateLink = useCallback((file: File) => {
    setTimeout(() => { setCreateLinkFile(file); setIsCreateLinkOpen(true); }, 0);
  }, []);
  const handleLinkCreated = useCallback((link: ShareLink) => {
    setIsCreateLinkOpen(false);
    setLastCreatedLink(link);
    setIsCopyLinkDialogOpen(true);
    // Auto-copy for convenience; the dialog also shows it with a Copy button.
    try {
      const full = typeof window !== 'undefined' ? `${window.location.origin}${link.url}` : link.url;
      navigator.clipboard?.writeText(full);
    } catch {
      /* clipboard may be blocked; the dialog still shows the link */
    }
    toast({ title: 'Link created and copied', description: 'Share it with anyone, per your access settings.' });
  }, [toast]);

  const handleAddFolder = async () => {
    if (!newFolderName) return;
    // Sub-folders inherit parent's type; top-level folders use user selection.
    const folderType = (createInsideActiveFolder && activeFolder)
      ? (activeFolder.type ?? 'personal')
      : newFolderType;
    const newFolder: Folder = { id: `folder_${Date.now()}`, name: newFolderName, type: folderType, children: [], files: [] };
    try {
      if (createInsideActiveFolder && activeFolder) {
        await addFolder(activeFolder.id, newFolder);
        toast({ title: `Folder "${newFolderName}" created inside "${activeFolder.name}".` });
      } else {
        await addFolder(null, newFolder);
        toast({ title: `Folder "${newFolderName}" created in ${folderType === 'team' ? 'Team' : 'Personal'} Folders.` });
      }
      setIsAddFolderOpen(false); setNewFolderName(''); setNewFolderType('personal'); setActiveFolder(null);
    } catch { toast({ variant: 'destructive', title: 'Failed to create folder.' }); }
  };

  const handleRenameFolder = () => {
    if (!renamingFolderName || !activeFolder) return;
    renameFolder(activeFolder.id, renamingFolderName);
    toast({ title: `Folder renamed to "${renamingFolderName}".` });
    setIsRenameFolderOpen(false); setRenamingFolderName(''); setActiveFolder(null);
  };

  const handleDeleteFolder = useCallback(async () => {
    if (!activeFolder) return;

    const folderToDelete = activeFolder;
    const wasSelected = selectedFolderId === folderToDelete.id;

    setIsDeleteFolderOpen(false);
    setActiveFolder(null);

    // Navigate away from the deleted folder using replaceState (no Next.js navigation,
    // no NavigationLoader overlay, no page freeze).
    if (wasSelected) {
      const findParent = (list: Folder[], targetId: string): Folder | null => {
        for (const folder of list) {
          if (folder.children?.some(child => child.id === targetId)) return folder;
          const found = findParent(folder.children || [], targetId);
          if (found) return found;
        }
        return null;
      };
      const parentFolder = findParent(contentLibraryFolders, folderToDelete.id);
      if (parentFolder) {
        setSelectedFolderId(parentFolder.id);
        window.history.replaceState({}, '', `/content-library?folderId=${encodeURIComponent(parentFolder.id)}`);
      } else {
        const remaining = contentLibraryFolders.filter(f => f.id !== folderToDelete.id);
        if (remaining.length > 0) {
          setSelectedFolderId(remaining[0].id);
          window.history.replaceState({}, '', `/content-library?folderId=${encodeURIComponent(remaining[0].id)}`);
        } else {
          setSelectedFolderId('');
          window.history.replaceState({}, '', '/content-library');
        }
      }
    }

    deleteFolder(folderToDelete.id);
    toast({ title: `Folder "${folderToDelete.name}" deleted.` });
  }, [activeFolder, selectedFolderId, contentLibraryFolders, deleteFolder, toast]);

  const openDeleteFileDialog = (file: File) => {
    setTimeout(() => { setActiveFile(file); setIsDeleteFileOpen(true); }, 0);
  };

  const handleDeleteFile = () => {
    if (!activeFile || !selectedFolder) return;
    const deletedFileId = activeFile.id;
    const fileName = activeFile.name;
    const currentFolderId = selectedFolder.id;
    const wasViewing = fileIdFromUrl === deletedFileId;

    setIsDeleteFileOpen(false);
    setActiveFile(null);

    deleteFile(currentFolderId, deletedFileId);
    toast({ title: `File "${fileName}" deleted.` });

    if (wasViewing) {
      router.push(`/content-library?folderId=${currentFolderId}`, { scroll: false });
    }
  };

  // Block uploads that would exceed the plan's storage cap.
  const ensureStorageRoom = async (files: globalThis.File[]): Promise<boolean> => {
    const incoming = files.reduce((s, f) => s + (f.size || 0), 0);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const room = await checkStorageRoom(user.id, incoming);
    if (!room.ok) {
      const free = Math.max(0, room.capBytes - room.usageBytes);
      setUpgradeMsg(
        `This upload needs ${formatGib(incoming)}, but only ${formatGib(free)} of your ${formatGib(room.capBytes)} storage is free.`,
      );
      return false;
    }
    return true;
  };

  // ── handleAddFiles ────────────────────────────────────────────────────────
  const handleAddFiles = async () => {
    if (!uploadedFiles.length) return;
    setIsUploadSheetOpen(false);

    // Destination: the chosen folder, or - when the user has no folders yet - a
    // default "My Files" folder created at the library root, so file uploads
    // always have a home (the model can't store loose files at the root).
    let targetFolderId = uploadTargetFolderId;
    if (!targetFolderId) {
      const existing = contentLibraryFolders.find((f) => f.name === 'My Files' && f.type === 'personal');
      if (existing) {
        targetFolderId = existing.id;
      } else {
        const defaultFolder: Folder = { id: `folder_${Date.now()}`, name: 'My Files', type: 'personal', children: [], files: [] };
        await addFolder(null, defaultFolder);
        targetFolderId = defaultFolder.id;
      }
    }

    const readyFiles = await prepareFiles(uploadedFiles);
    if (readyFiles.length === 0) {
      toast({ title: 'No files to upload.', variant: 'destructive' });
      return;
    }
    if (!(await ensureStorageRoom(readyFiles))) return;

    const newItems: UploadItem[] = readyFiles.map((f, i) => ({
      id: `upload_${Date.now()}_${i}`,
      name: f.name,
      type: f.name.split('.').pop()?.toUpperCase() ?? 'FILE',
      progress: 0,
      status: 'in_progress' as UploadStatus,
    }));
    setUploadItems((prev) => [...prev, ...newItems]);
    setShowUploadPanel(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newDocs: File[] = [];

      for (let index = 0; index < readyFiles.length; index++) {
        const file = readyFiles[index];
        const item = newItems[index];
        const fileId = `file_${Date.now()}_${index}`;
        const storagePath = `${user.id}/${fileId}/${safeStorageKey(file.name)}`;

        try {
          let lastProgress = 0;
          const progressInterval = setInterval(() => {
            lastProgress = Math.min(lastProgress + Math.random() * 15, 90);
            updateUploadItem(item.id, { progress: Math.round(lastProgress) });
          }, 300);

          const { error } = await supabase.storage
            .from('documents')
            .upload(storagePath, file, {
              upsert: false,
              // @ts-ignore
              onUploadProgress: (evt: { loaded: number; total: number }) => {
                clearInterval(progressInterval);
                const pct = Math.round((evt.loaded / evt.total) * 100);
                updateUploadItem(item.id, { progress: pct });
              },
            });

          clearInterval(progressInterval);
          if (error) throw error;

          const { data: urlData } = await supabase.storage
            .from('documents')
            .createSignedUrl(storagePath, 604800);

          const doc: File = {
            id: fileId,
            name: file.name,
            type: getFileType(file) as File['type'],
            createdAt: new Date().toISOString(),
            views: 0,
            storagePath,
            contentUrl: urlData?.signedUrl,
            size: file.size,
          };
          newDocs.push(doc);
          updateUploadItem(item.id, { progress: 100, status: 'completed', fileId, contentUrl: urlData?.signedUrl });
        } catch {
          updateUploadItem(item.id, { progress: 0, status: 'failed' });
        }
      }

      if (newDocs.length > 0) {
        await addFilesToFolder(targetFolderId, newDocs);
        toast({ title: `${newDocs.length} file(s) uploaded successfully.` });

        // ONE summary alert per upload batch - was previously firing one
        // alert per file inside the loop, which produced N duplicate-looking
        // rows in the notification bell when the user uploaded N files.
        const summary = newDocs.length === 1
          ? `File "${newDocs[0].name}" uploaded`
          : `${newDocs.length} files uploaded: ${newDocs.slice(0, 3).map(d => d.name).join(', ')}${newDocs.length > 3 ? `, +${newDocs.length - 3} more` : ''}`;
        await supabase.from('alerts').insert({
          user_id: user.id,
          space_id: null,
          type: 'file_upload',
          message: summary,
        });
      }

      setUploadedFiles([]);
      setUploadTargetFolderId('');
    } catch (error) {
      console.error(error);
      setUploadItems((prev) =>
        prev.map((i) => (i.status === 'in_progress' ? { ...i, status: 'failed', progress: 0 } : i))
      );
      toast({ variant: 'destructive', title: 'Upload failed' });
    }
  };

  // ── handleAddUploadedFolder ────────────────────────────────────────────────
  const handleAddUploadedFolder = async () => {
    if (!uploadedFolder.length) return;
    setIsFolderUploadSheetOpen(false);

    const readyFiles = await prepareFiles(uploadedFolder);
    if (!(await ensureStorageRoom(readyFiles))) return;

    const newItems: UploadItem[] = readyFiles.map((f, i) => ({
      id: `upload_folder_${Date.now()}_${i}`,
      name: f.name,
      type: f.name.split('.').pop()?.toUpperCase() ?? 'FILE',
      progress: 0,
      status: 'in_progress' as UploadStatus,
    }));
    setUploadItems((prev) => [...prev, ...newItems]);
    setShowUploadPanel(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const folderName = uploadedFolder[0]?.webkitRelativePath.split('/')[0];
      if (!folderName) { toast({ variant: 'destructive', title: 'Could not determine folder name.' }); return; }
      const newFolderObj: Folder = { id: `folder_${Date.now()}`, name: folderName, type: selectedFolder ? (selectedFolder.type ?? 'personal') : uploadFolderType, children: [], files: [] };
      // No folder selected (e.g. brand-new library) -> add it at the top level.
      await addFolder(selectedFolder ? selectedFolder.id : null, newFolderObj);

      const newDocs: File[] = [];
      for (let index = 0; index < readyFiles.length; index++) {
        const file = readyFiles[index];
        const item = newItems[index];
        const fileId = `file_in_folder_${Date.now()}_${index}`;
        const storagePath = `${user.id}/${fileId}/${safeStorageKey(file.name)}`;
        try {
          let lastProgress = 0;
          const progressInterval = setInterval(() => {
            lastProgress = Math.min(lastProgress + Math.random() * 15, 90);
            updateUploadItem(item.id, { progress: Math.round(lastProgress) });
          }, 300);
          const { error } = await supabase.storage.from('documents').upload(storagePath, file, { upsert: false });
          clearInterval(progressInterval);
          if (error) throw error;
          const { data: urlData } = await supabase.storage.from('documents').createSignedUrl(storagePath, 604800);
          const doc: File = { id: fileId, name: file.name, type: getFileType(file) as File['type'], createdAt: new Date().toISOString(), views: 0, storagePath, contentUrl: urlData?.signedUrl, size: file.size };
          newDocs.push(doc);
          updateUploadItem(item.id, { progress: 100, status: 'completed', fileId, contentUrl: urlData?.signedUrl });
        } catch {
          updateUploadItem(item.id, { progress: 0, status: 'failed' });
        }
      }
      if (newDocs.length > 0) await addFilesToFolder(newFolderObj.id, newDocs);
      toast({ title: `Folder "${folderName}" uploaded with ${newDocs.length} file(s).` });
      setUploadedFolder([]);
    } catch (error) {
      console.error(error);
      setUploadItems((prev) => prev.map((i) => (i.status === 'in_progress' ? { ...i, status: 'failed', progress: 0 } : i)));
      toast({ variant: 'destructive', title: 'Upload failed' });
    }
  };

  const handleFileClick = (file: File) => router.push(`/content-library?fileId=${file.id}`);
  const handlePreviewFile = (file: File) => {
    setTimeout(() => { setViewingFile(file); setIsFileViewerOpen(true); }, 0);
  };
  const copyLinkToClipboard = () => { navigator.clipboard.writeText(window.location.href); toast({ title: 'Copied to clipboard!' }); };
  const openUploadSheet = useCallback(() => {
    setUploadedFiles([]);
    setUploadTargetFolderId(selectedFolderId ?? '');
    setTimeout(() => setIsUploadSheetOpen(true), 0);
  }, [selectedFolderId]);

  const handleViewUploadedFile = useCallback((item: UploadItem) => {
    if (item.fileId) router.push(`/content-library?fileId=${item.fileId}`);
  }, [router]);

  if (isLoading) return <ContentLibrarySkeleton />;
  if (selectedFile) return <DocumentDetailView file={selectedFile} onPreview={handlePreviewFile} />;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* TOP BAR - secondary actions are outline buttons; only the primary
             Upload dropdown gets the dark pill treatment, matching the
             Agreements page header. */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <div className="flex items-center gap-2">
            <div className="relative w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-9 h-10" />
            </div>
            <Button variant="outline" asChild>
              <Link href="/file-requests"><FileUp className="mr-1.5 h-4 w-4" />Request File</Link>
            </Button>
            <Button
              variant="outline"
              data-tour="cl-addfolder"
              onClick={() => { setCreateInsideActiveFolder(false); setActiveFolder(null); setIsAddFolderOpen(true); }}
            >
              <FolderPlus className="mr-1.5 h-4 w-4" />Add Folder
            </Button>
            <Button variant="outline" onClick={handleOpenShare}>
              <Users className="mr-1.5 h-4 w-4" />Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800 text-white" data-tour="cl-upload">
                  Upload
                  <ChevronDown className="ml-1.5 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={openUploadSheet}><FileIcon className="mr-2 h-4 w-4" />File</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setUploadedFolder([]); setTimeout(() => setIsFolderUploadSheetOpen(true), 0); }}><FolderIcon className="mr-2 h-4 w-4" />Folder</DropdownMenuItem>
                <DropdownMenuItem><Cloud className="mr-2 h-4 w-4" />Cloud Storage</DropdownMenuItem>
                <DropdownMenuItem><PenSquare className="mr-2 h-4 w-4" />Signable Document</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ProductTour
          tourKey="tour-content-library"
          steps={[
            {
              title: 'Your Content Library',
              description: 'Keep every document in one place and reuse files across multiple data rooms without uploading them again.',
            },
            {
              selector: '[data-tour="cl-upload"]',
              title: 'Upload your documents',
              description: 'Add files or whole folders here. You can also import from cloud storage.',
            },
            {
              selector: '[data-tour="cl-addfolder"]',
              title: 'Organize with folders',
              description: 'Create folders to keep your library tidy, then drag files between them.',
            },
          ]}
        />

        {/* SIDEBAR + CONTENT */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR - width is user-resizable */}
          <div style={{ width: sidebarWidth, minWidth: 160, maxWidth: 480 }} className="shrink-0 border-r border-gray-200 overflow-y-auto py-4 pr-2 flex flex-col">

            {/* ── PERSONAL FOLDERS SECTION ── */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-2 py-1.5 mb-1 group">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Personal Folders</span>
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 flex items-center justify-center rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setNewFolderType('personal'); setCreateInsideActiveFolder(false); setActiveFolder(null); setIsAddFolderOpen(true); }}>
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {personalFolders.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground italic">No personal folders yet.</p>
                ) : (
                  <div className="border-t border-gray-200">
                  <FolderTree
                    folderList={personalFolders}
                    selectedFolderId={selectedFolderId}
                    fileIdFromUrl={fileIdFromUrl}
                    findFolder={findFolder}
                    onSelectFolder={handleSelectFolder}
                    onShare={handleOpenShare}
                    onAddSubfolder={handleOpenAddSubfolder}
                    onAddFile={handleOpenUploadToFolder}
                    onRename={handleOpenRename}
                    onDelete={handleOpenDeleteFolder}
                  />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* ── VISIBLE SEPARATOR ── */}
            <div className="border-t border-gray-200 my-1.5" />

            {/* ── TEAM FOLDERS SECTION ── */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-2 py-1.5 mb-1 group">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Folders</span>
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 flex items-center justify-center rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setNewFolderType('team'); setCreateInsideActiveFolder(false); setActiveFolder(null); setIsAddFolderOpen(true); }}>
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mb-2">
                {teamFolders.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground italic">No team folders yet.</p>
                ) : (
                  <div className="border-t border-gray-200">
                  <FolderTree
                    folderList={teamFolders}
                    selectedFolderId={selectedFolderId}
                    fileIdFromUrl={fileIdFromUrl}
                    findFolder={findFolder}
                    onSelectFolder={handleSelectFolder}
                    onShare={handleOpenShare}
                    onAddSubfolder={handleOpenAddSubfolder}
                    onAddFile={handleOpenUploadToFolder}
                    onRename={handleOpenRename}
                    onDelete={handleOpenDeleteFolder}
                  />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* ── VISIBLE SEPARATOR ── */}
            <div className="border-t border-gray-200 my-1.5" />

            {/* ── SPACES SECTION ── */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-2 py-1.5 mb-1 group">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Spaces</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mb-2">
                {spacesLoading ? (
                  <div className="border-t border-gray-200 px-3 py-2 space-y-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                ) : spaces.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground italic">No spaces yet.</p>
                ) : (
                  <div className="border-t border-gray-200">
                  {spaces.map((space) => (
                    <Link
                      key={space.id}
                      href={`/spaces/${space.id}/edit`}
                      className="flex items-center gap-2 py-2.5 px-2 hover:bg-gray-100 text-gray-700 group min-w-0 w-full border-b border-gray-200"
                    >
                      <Layers className="h-4 w-4 shrink-0 text-violet-500" />
                      <span className="text-sm font-medium truncate min-w-0 flex-1" title={space.name}>{space.name}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex-1" />

            {/* ── VISIBLE SEPARATOR ── */}
            <div className="border-t border-gray-200 my-1.5" />

            <button
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md w-full text-left transition-colors",
                showDeletedContent
                  ? "bg-red-50 text-red-700 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
              )}
              onClick={() => setShowDeletedContent(v => !v)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Deleted Content
              {deletedItems.length > 0 && (
                <span className={cn(
                  "ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full",
                  showDeletedContent ? "bg-red-200 text-red-800" : "bg-gray-200 text-gray-600"
                )}>{deletedItems.length}</span>
              )}
            </button>
          </div>

          {/* RESIZE HANDLE */}
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-400 active:bg-blue-500 transition-colors"
            onMouseDown={handleResizeMouseDown}
          />

          {/* RIGHT CONTENT PANEL */}
          <div className="flex-1 overflow-y-auto pl-6 pt-4 min-w-0">
            {showDeletedContent ? (
              <DeletedContentView items={deletedItems} />
            ) : selectedFolder ? (
              <>
                <div className="flex items-center justify-between mb-5 gap-4">
                  <h2 className="text-xl font-bold truncate min-w-0" title={selectedFolder.name}>{selectedFolder.name}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Folder-view actions - all three use the dark Agreements-style pill.
                        Default-variant dome on hover (white highlight on dark). */}
                    <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white" onClick={openUploadSheet}>
                      <Upload className="mr-1.5 h-3.5 w-3.5" />Add content
                    </Button>
                    <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => handleOpenAddSubfolder(selectedFolder)}>
                      <FolderPlus className="mr-1.5 h-3.5 w-3.5" />Create folder
                    </Button>
                    <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white" asChild>
                      <Link href={`/file-requests?folder=${selectedFolder.id}&folderName=${encodeURIComponent(selectedFolder.name)}`}>
                        <FileUp className="mr-1.5 h-3.5 w-3.5" />Request files
                      </Link>
                    </Button>
                  </div>
                </div>

                {selectedFolder.files.length === 0 && selectedFolder.children.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center text-center gap-3 py-20 border-t border-gray-200"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) { setUploadedFiles(Array.from(e.dataTransfer.files)); setUploadTargetFolderId(selectedFolderId); setIsUploadSheetOpen(true); } }}
                  >
                    <div className="w-40"><ContentLibraryIllustration /></div>
                    <p className="text-muted-foreground">Drop files here or <button onClick={openUploadSheet} className="underline text-foreground">add content</button></p>
                  </div>
                ) : (
                  <div>
                    <div className="border-t border-gray-200" />
                    <div className="flex items-center py-2 px-2 gap-3">
                      <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</span>
                      <span className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Updated</span>
                      <span className="w-8" />
                    </div>
                    <div className="border-t border-gray-200" />

                    {selectedFolder.children.length > 0 && (
                      <>
                        <div className="px-2 py-3"><span className="font-semibold text-sm text-foreground">Folders</span></div>
                        {selectedFolder.children.map((folder) => (
                          <div key={folder.id}>
                            <div className="border-t border-gray-200" />
                            <div className="flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 cursor-pointer group" onClick={() => handleSelectFolder(folder.id)}>
                              <FolderIcon className="h-5 w-5 shrink-0 fill-blue-100 text-blue-400" />
                              <span className="flex-1 text-base font-medium truncate min-w-0" title={folder.name}>{folder.name}</span>
                              <span className="w-28 text-right text-xs text-muted-foreground shrink-0">-</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={handleOpenShare}><Users className="mr-2 h-4 w-4" />Share</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenAddSubfolder(folder)}><FolderPlus className="mr-2 h-4 w-4" />Add Subfolder</DropdownMenuItem>
                                  <DropdownMenuItem asChild><Link href={`/file-requests?folder=${folder.id}&folderName=${encodeURIComponent(folder.name)}`}><FileUp className="mr-2 h-4 w-4" />Request File</Link></DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenRename(folder)}><PenSquare className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteFolder(folder)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {selectedFolder.files.length > 0 && (
                      <>
                        {selectedFolder.children.length > 0 && <div className="border-t border-gray-200 mt-1" />}
                        <div className="px-2 py-3"><span className="font-semibold text-sm text-foreground">Files</span></div>
                        {selectedFolder.files.map((file) => {
                          // Colour each row's file icon by extension so the
                          // list reads visually (red PDF / blue doc / pink
                          // image) instead of a wall of grey.
                          const { Icon, text } = getFileTypeStyle(file.name, file.id.startsWith('agreement_'));
                          return (
                            <div key={file.id}>
                              <div className="border-t border-gray-200" />
                              <div className="flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 cursor-pointer group" onClick={() => handleFileClick(file)}>
                                <Icon className={cn('h-5 w-5 shrink-0', text)} />
                                <span className="flex-1 text-base font-medium truncate min-w-0" title={file.name}>{file.name}</span>
                                <span className="w-28 text-right text-xs text-muted-foreground shrink-0">{new Date(file.createdAt).toLocaleDateString()}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => handlePreviewFile(file)}><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openCreateLink(file)}><Users className="mr-2 h-4 w-4" />Share</DropdownMenuItem>
                                    <DropdownMenuItem><PenSquare className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => openDeleteFileDialog(file)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                        <div className="border-t border-gray-200" />
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-4 h-full text-muted-foreground py-24">
                <FolderIcon className="h-12 w-12" />
                <p>Select a folder to view its contents.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════ PASSWORD DIALOG ══════ */}
      <PasswordDialog
        fileName={passwordDialogState.fileName}
        open={passwordDialogState.open}
        error={passwordDialogState.error}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />

      <UpgradeDialog
        open={!!upgradeMsg}
        onOpenChange={(o) => { if (!o) setUpgradeMsg(null); }}
        title="Storage limit reached"
        description={upgradeMsg ?? ''}
      />

      {/* ══════ UPLOAD PROGRESS PANEL ══════ */}
      {showUploadPanel && uploadItems.length > 0 && (
        <UploadProgressPanel
          items={uploadItems}
          onClose={() => { setShowUploadPanel(false); setUploadItems([]); }}
          onView={handleViewUploadedFile}
        />
      )}

      {/* ════════ DIALOGS ════════ */}

      {createLinkFile && (
        <CreateLinkDialog
          file={createLinkFile}
          open={isCreateLinkOpen}
          onOpenChange={(open) => { setIsCreateLinkOpen(open); if (!open) setCreateLinkFile(null); }}
          onLinkCreated={handleLinkCreated}
        />
      )}

      {lastCreatedLink && (
        <CopyLinkDialog
          link={lastCreatedLink}
          open={isCopyLinkDialogOpen}
          onOpenChange={setIsCopyLinkDialogOpen}
        />
      )}

      <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Folder</DialogTitle>
            <DialogDescription>{createInsideActiveFolder && activeFolder ? `Will be created inside "${activeFolder.name}".` : 'Will be created at the top level.'}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input id="folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Marketing Materials" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()} />
            </div>
            {(!activeFolder || !createInsideActiveFolder) && (
              <div className="space-y-2">
                <Label>Folder Section</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFolderType('personal')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border-2 text-sm font-medium transition-colors',
                      newFolderType === 'personal'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                  >
                    <Lock className="h-4 w-4" />
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFolderType('team')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border-2 text-sm font-medium transition-colors',
                      newFolderType === 'team'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                  >
                    <Users className="h-4 w-4" />
                    Team Folder
                  </button>
                </div>
              </div>
            )}
            {activeFolder && (
              <div className="rounded-md border border-gray-200 p-3 bg-muted/40 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Folder Location</p>
                <div className="flex items-start gap-3">
                  <Checkbox id="create-inside" checked={createInsideActiveFolder} onCheckedChange={(c) => setCreateInsideActiveFolder(Boolean(c))} className="mt-0.5" />
                  <div className="grid gap-1">
                    <label htmlFor="create-inside" className="text-sm font-medium cursor-pointer">Create inside &ldquo;{activeFolder.name}&rdquo;</label>
                    <p className="text-xs text-muted-foreground">{createInsideActiveFolder ? `Nested inside "${activeFolder.name}".` : 'Top level of your library.'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFolder} disabled={!newFolderName.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameFolderOpen} onOpenChange={setIsRenameFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Folder</DialogTitle><DialogDescription>New name for &apos;{activeFolder?.name}&apos;.</DialogDescription></DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-folder-name">New Folder Name</Label>
            <Input id="new-folder-name" value={renamingFolderName} onChange={(e) => setRenamingFolderName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameFolder}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteFolderOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteFolderOpen(false);
            setActiveFolder(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete &quot;{activeFolder?.name}&quot; and all its contents.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteFolderOpen(false); setActiveFolder(null); }}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteFolder}>Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteFileOpen}
        onOpenChange={(open) => { if (!open) { setIsDeleteFileOpen(false); setActiveFile(null); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete &quot;{activeFile?.name}&quot;.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteFileOpen(false); setActiveFile(null); }}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteFile}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share &quot;{selectedFolder?.name}&quot;</DialogTitle><DialogDescription>Anyone with the link can view this content.</DialogDescription></DialogHeader>
          <div className="flex items-center space-x-2 pt-4">
            <Input defaultValue={typeof window !== 'undefined' ? window.location.href : ''} readOnly />
            <Button size="sm" className="px-3" onClick={copyLinkToClipboard}><LinkIcon className="h-4 w-4" /></Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsShareOpen(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isUploadSheetOpen} onOpenChange={(open) => { setIsUploadSheetOpen(open); if (!open) { setUploadedFiles([]); setUploadTargetFolderId(''); } }}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader><SheetTitle>Upload Files</SheetTitle><SheetDescription>Choose files to upload. Pick a destination folder below, or leave it blank to add them to a &quot;My Files&quot; folder.</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-2">
            <Label className="flex items-center gap-1"><FolderIcon className="h-4 w-4 text-muted-foreground" />Upload to folder <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <Select value={uploadTargetFolderId} onValueChange={setUploadTargetFolderId}>
              <SelectTrigger className={cn(!uploadTargetFolderId && 'text-muted-foreground')}><SelectValue placeholder="My Files (default)" /></SelectTrigger>
              <SelectContent>
                {flatFolderList.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <span style={{ paddingLeft: `${f.depth * 12}px` }} className="flex items-center gap-2"><FolderIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />{f.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex flex-col items-center justify-center text-center gap-4 border-dashed border-2 rounded-lg h-52"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) setUploadedFiles(Array.from(e.dataTransfer.files)); }}>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag and drop or</p>
            <Input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files) setUploadedFiles(Array.from(e.target.files)); }} className="hidden" multiple />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">Selected files ({uploadedFiles.length}):</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground bg-gray-100 p-4 rounded-md max-h-32 overflow-y-auto">
                {uploadedFiles.map((f, i) => <li key={i} className="truncate">{f.name}</li>)}
              </ul>
            </div>
          )}
          <SheetFooter className="mt-6">
            <Button onClick={handleAddFiles} className="w-full" disabled={!uploadedFiles.length}>
              Upload
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isFolderUploadSheetOpen} onOpenChange={(open) => setIsFolderUploadSheetOpen(open)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader><SheetTitle>Upload Folder to &quot;{selectedFolder?.name ?? 'Content Library'}&quot;</SheetTitle><SheetDescription>Select a folder from your computer.{selectedFolder ? '' : ' It will be added to the top level of your library.'}</SheetDescription></SheetHeader>
          {!selectedFolder && (
            <div className="mt-6 space-y-2">
              <Label>Add to section</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUploadFolderType('personal')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border-2 text-sm font-medium transition-colors',
                    uploadFolderType === 'personal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  <Lock className="h-4 w-4" />Personal
                </button>
                <button
                  type="button"
                  onClick={() => setUploadFolderType('team')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border-2 text-sm font-medium transition-colors',
                    uploadFolderType === 'team' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  <Users className="h-4 w-4" />Team Folder
                </button>
              </div>
            </div>
          )}
          <div className="py-4 flex flex-col items-center justify-center text-center gap-4 border-dashed border-2 rounded-lg h-64 mt-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Click below to select a folder</p>
            {/* @ts-ignore */}
            <input type="file" webkitdirectory="true" directory="true" ref={folderInputRef} onChange={(e) => { if (e.target.files) setUploadedFolder(Array.from(e.target.files)); }} className="hidden" multiple />
            <Button variant="outline" onClick={() => folderInputRef.current?.click()}>Browse Folder</Button>
          </div>
          {uploadedFolder.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Selected: {uploadedFolder[0]?.webkitRelativePath.split('/')[0]}</h4>
              <p className="text-sm text-muted-foreground">{uploadedFolder.length} file(s)</p>
            </div>
          )}
          <SheetFooter className="mt-4">
            <Button onClick={handleAddUploadedFolder} className="w-full" disabled={!uploadedFolder.length}>Upload Folder</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FileViewer file={viewingFile} open={isFileViewerOpen} onOpenChange={setIsFileViewerOpen} />
    </>
  );
}

export default function ContentLibraryPage() {
  return (
    <Suspense fallback={<ContentLibrarySkeleton />}>
      <ContentLibraryPageComponent />
    </Suspense>
  );
}