//src\app\(app)\spaces\[spaceId]\edit\page.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo, forwardRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSpaces } from '@/lib/spaces-provider';
import type { Space } from '@/lib/spaces-provider';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragCancelEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown, FolderPlus, FileUp, Folder as FolderIcon, File as FileIcon,
  MoreHorizontal, FolderOpen, Plus, Copy, ArrowDownAZ, PlusSquare,
  ListOrdered, LayoutGrid, GripVertical, PenSquare, Search, Download,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { checkStorageRoom, formatGib } from '@/lib/storage-usage';
import { UploadProgressPanel, useUploadTracker, type UploadItem } from '@/components/upload-progress-panel';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFileRequests } from '@/lib/file-requests-provider';
import { getDocumentIcon, getFileType, type Document as FileType } from '@/lib/data';
import { FolderSelectionDialog } from '@/components/folder-selection-dialog';
import { Clock, Calendar as CalendarIcon, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useLayout } from '../../../layout-context';
import { useFolders, type Folder } from '@/lib/folder-provider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';
import { SectionHeader } from './_components/section-header';
import { supabase } from '@/lib/supabaseClient';
import { fireDealWatchEvent } from '@/lib/deal-watch';
import { v4 as uuidv4 } from 'uuid';

const FileViewer = dynamic(
  () => import('@/components/file-viewer').then((mod) => mod.FileViewer),
  { ssr: false }
);

const INTERNAL_FOLDER_NAMES = ['files', 'root', 'home'];
const waitForDialogClose = () => new Promise(resolve => setTimeout(resolve, 300));

type SpaceContentItem = (FileType | Folder | { id: string, name: string, type: 'section', itemType?: 'section' }) & { itemType: 'file' | 'folder' | 'section' };

const SortableItemWrapper = forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>((props, ref) => {
  return <TableRow ref={ref} {...props} />;
});
SortableItemWrapper.displayName = 'SortableItemWrapper';

function SortableItem({ item, spaceId, currentFolderId, getRootIndex, index, isIndexingOff, visibleItems, toggleVisibility, handleFileClick, handleFolderClick, handleDownloadItem }: {
  item: SpaceContentItem, spaceId: string, currentFolderId: string, getRootIndex: string, index: number,
  isIndexingOff: boolean, visibleItems: Record<string, boolean>, toggleVisibility: (id: string) => void,
  handleFileClick: (file: FileType) => void, handleFolderClick: (folder: Folder) => void,
  handleDownloadItem: (item: SpaceContentItem) => void
}) {
  const { renameItemInSpace, deleteItemFromSpace, moveItemInSpace, addSectionHeaderToSpace } = useSpaces() as any;
  const router = useRouter();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [renamingName, setRenamingName] = useState(item.name);

  const openRenameDialog = () => { setRenamingName(item.name); setIsRenameOpen(true); };
  const handleRename = () => {
    if (renamingName.trim() && renamingName !== item.name) renameItemInSpace(spaceId, item.id, renamingName.trim());
    setIsRenameOpen(false);
  };
  const handleDelete = () => { deleteItemFromSpace(spaceId, item.id, currentFolderId); setIsDeleteOpen(false); };
  const countItems = (folder: Folder): number => (folder.files?.length || 0) + (folder.children?.length || 0);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 'auto' };
  const itemCount = item.itemType === 'folder' ? countItems(item as Folder) : 0;
  const Icon = item.itemType === 'file' ? getDocumentIcon((item as FileType).type) : FolderIcon;

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12 text-center"><Checkbox /></TableCell>
      <TableCell className="w-12 text-center align-middle cursor-grab p-0" {...attributes} {...listeners}>
        <div className="flex items-center justify-center h-full w-full">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="text-center text-muted-foreground">{!isIndexingOff && `${getRootIndex}${index + 1}`}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {item.itemType === 'folder'
            ? <FolderIcon className={cn("h-5 w-5 text-blue-500 fill-blue-100")} />
            : <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            {item.itemType === 'folder' ? (
              <Button variant="link" className="p-0 h-auto font-medium text-foreground" onClick={() => handleFolderClick(item as Folder)}>
                <span className="truncate max-w-xs">{item.name}</span>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" className="p-0 h-auto font-medium text-foreground max-w-xs" onClick={() => handleFileClick(item as FileType)}>
                    <span className="truncate">{item.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{item.name}</p></TooltipContent>
              </Tooltip>
            )}
            {item.itemType === 'folder' && (
              <div className="text-xs text-muted-foreground">{`${itemCount} item${itemCount !== 1 ? 's' : ''}`}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{item.itemType === 'file' ? `${(item as FileType).views} views` : ""}</TableCell>
      <TableCell className="text-muted-foreground">{item.itemType === 'folder' ? 'Folder' : 'File'}</TableCell>
      <TableCell className="text-muted-foreground">{item.itemType === 'folder' ? 'Folder' : formatDistanceToNow(new Date((item as FileType).createdAt), { addSuffix: true })}</TableCell>
      <TableCell>
        <Switch checked={visibleItems[item.id] !== false} onCheckedChange={() => toggleVisibility(item.id)} id={`visible-switch-${item.id}`} />
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          {/* modal={false} + deferred dialog-openers: opening a Dialog/AlertDialog
              straight from a DropdownMenuItem otherwise leaves Radix's focus-lock
              stuck (pointer-events:none + aria-hidden on the app wrapper) and
              freezes the whole page. setTimeout lets the menu close first. */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setTimeout(openRenameDialog, 0)}><PenSquare className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDownloadItem(item)}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => moveItemInSpace(spaceId, item.id, currentFolderId, 'up')}><ArrowUp className="mr-2 h-4 w-4" /> Move up</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => moveItemInSpace(spaceId, item.id, currentFolderId, 'down')}><ArrowDown className="mr-2 h-4 w-4" /> Move down</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => addSectionHeaderToSpace(spaceId, 'Untitled Section', currentFolderId, 'above', item.id)}><PlusSquare className="mr-2 h-4 w-4" />Section above</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addSectionHeaderToSpace(spaceId, 'Untitled Section', currentFolderId, 'below', item.id)}><PlusSquare className="mr-2 h-4 w-4" />Section below</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setTimeout(() => router.push(`/spaces/${spaceId}/edit/permissions?itemId=${item.id}`), 0)}>Edit permissions</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => setIsDeleteOpen(true), 0)}><Trash2 className="mr-2 h-4 w-4" />Move to Trash</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename "{item?.name}"</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-name">New Name</Label>
            <Input id="rename-name" value={renamingName} onChange={(e) => setRenamingName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will move "{item?.name}" to the trash.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Move to Trash</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TableRow>
  );
}

function SpaceEditPageComponent() {
  const params = useParams();
  const router = useRouter();
  const {
    spaces, updateSpace, refreshSpace, addFolderToSpace,
    renameItemInSpace, deleteItemFromSpace, addSectionHeaderToSpace, reorderItemsInSpace,
  } = useSpaces() as any;
  const { addFileRequest } = useFileRequests();
  const { toast } = useToast();
  const { breadcrumbs, setBreadcrumbs, spaceSearchQuery, pendingAction, setPendingAction } = useLayout() as any;
  const foldersContext = useFolders();
  const spaceId = params.spaceId as string;

  const space = useMemo(() => {
    if (!spaceId || !spaces) return null;
    return (spaces as Space[]).find(s => s.id === spaceId || s.spaceId === spaceId) ?? null;
  }, [spaces, spaceId]);

  const [isUploading, setIsUploading] = useState(false);
  const uploadTracker = useUploadTracker();
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSignableDocOpen, setIsSignableDocOpen] = useState(false);
  const [isFromLibraryOpen, setIsFromLibraryOpen] = useState(false);
  const [isRequestSheetOpen, setIsRequestSheetOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDate, setRequestDate] = useState<Date | undefined>();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderUploadDialogOpen, setIsFolderUploadDialogOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<globalThis.File[]>([]);
  const [uploadedFolder, setUploadedFolder] = useState<globalThis.File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
  const [viewingFile, setViewingFile] = useState<FileType | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'manual' | 'asc'>('manual');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isIndexingOff, setIsIndexingOff] = useState(false);
  const [spaceTitle, setSpaceTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleSavedRef = useRef(false);

  // ✅ NUCLEAR FIX: MutationObserver watches body and instantly removes
  // pointer-events: none whenever Radix Dialog sets it after a re-render
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => {
      observer.disconnect();
      document.body.style.pointerEvents = '';
    };
  }, []);

  useEffect(() => {
    if (space && !titleSavedRef.current && !isEditingTitle) {
      setSpaceTitle(space.name || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.name]);

  // Refresh space on mount so template folders appear immediately
  useEffect(() => {
    if (spaceId) {
      setBreadcrumbs([{ id: 'root', name: 'Home' }]);
      refreshSpace(spaceId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  // Hydrate visibility state from loaded folders/files. Walks the tree
  // and records every item whose isVisible was loaded as false - anything
  // not in the map is treated as visible by the Switch component
  // (`checked={visibleItems[item.id] !== false}`).
  useEffect(() => {
    if (!space) return;
    const seed: Record<string, boolean> = {};
    const walk = (folders: Folder[]) => {
      for (const f of folders) {
        if (f.isVisible === false) seed[f.id] = false;
        for (const file of f.files ?? []) {
          if (file.isVisible === false) seed[file.id] = false;
        }
        if (f.children?.length) walk(f.children);
      }
    };
    walk(space.folders ?? []);
    for (const file of space.files ?? []) {
      if (file.isVisible === false) seed[file.id] = false;
    }
    setVisibleItems(seed);
  }, [space]);

  // Consume sidebar-initiated actions. When the user clicks the "+folder"
  // or "+file" hover icon on a sidebar folder row, the sidebar sets a
  // PendingAction on the layout context. We:
  //   1. Navigate to that folder (so currentFolderId === folder.id)
  //   2. Open the matching dialog
  //   3. Clear the pending action so it doesn't re-fire
  useEffect(() => {
    if (!pendingAction || !space) return;

    // Navigate so the dialog's "parent folder" logic resolves to this folder.
    setBreadcrumbs([
      { id: 'root', name: 'Home' },
      { id: pendingAction.folderId, name: pendingAction.folderName },
    ]);

    if (pendingAction.kind === 'create-subfolder') {
      setIsAddFolderOpen(true);
    } else if (pendingAction.kind === 'add-file-to-folder') {
      setUploadedFiles([]);
      setIsUploadDialogOpen(true);
    }

    setPendingAction(null);
  }, [pendingAction, space, setBreadcrumbs, setPendingAction]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    const trimmed = spaceTitle.trim();
    if (!space || !trimmed || trimmed === space.name) return;
    titleSavedRef.current = true;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ name: trimmed, title: trimmed, last_updated: new Date().toISOString() })
        .eq('id', space.id);
      if (error) throw error;
      if (typeof updateSpace === 'function') updateSpace({ id: space.id, name: trimmed });
      toast({ title: 'Space renamed successfully.' });
    } catch (err: any) {
      titleSavedRef.current = false;
      setSpaceTitle(space.name || '');
      toast({ variant: 'destructive', title: 'Failed to rename space', description: err.message });
    }
  };

  const currentFolderId = useMemo(() => breadcrumbs?.[breadcrumbs.length - 1]?.id ?? 'root', [breadcrumbs]);

  const currentFolder = useMemo(() => {
    if (!space) return null;
    if (currentFolderId === 'root') {
      const topFolders: Folder[] = space.folders || [];
      // Wrapper-folder promotion. When `ensureRootFolder` auto-creates
      // a "Files" / "Home" container so that upload code has a folder_id
      // to insert into, that container should be INVISIBLE - root uploads
      // must look like they're at the root.
      //
      // Previous version flattened only the wrapper's CHILDREN (sub-
      // folders). That left the wrapper's FILES stranded inside it,
      // so a fresh upload appeared to "go into a Files folder" instead
      // of showing on the Home view (the user's exact complaint).
      const isPromotedWrapper =
        topFolders.length === 1 &&
        INTERNAL_FOLDER_NAMES.includes(topFolders[0].name.toLowerCase());
      const visibleFolders = isPromotedWrapper ? (topFolders[0].children || []) : topFolders;
      const visibleFiles = isPromotedWrapper
        ? [...(space.files || []), ...(topFolders[0].files || [])]
        : (space.files || []);
      return { id: 'root', name: space.name, files: visibleFiles, folders: visibleFolders, children: visibleFolders };
    }
    const findInFolders = (folders: Folder[], id: string): Folder | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        const found = findInFolders(folder.children || [], id);
        if (found) return found;
      }
      return null;
    };
    return findInFolders(space.folders || [], currentFolderId);
  }, [space, currentFolderId]);

  const allContent = useMemo(() => {
    if (!currentFolder) return [];
    const orderedCombined: SpaceContentItem[] = [
      ...((currentFolder as Folder).children || currentFolder.folders || []).map(f => ({ ...f, itemType: 'folder' as const })),
      ...(currentFolder.files || []).map(f => ({ ...f, itemType: f.itemType || ('file' as const) }))
    ];
    if (sortOrder === 'asc') {
      orderedCombined.sort((a, b) => {
        if (a.itemType === 'section') return -1;
        if (b.itemType === 'section') return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Manual order: interleave folders, files AND sections by their saved
      // `position` so a section can be dragged anywhere (e.g. above a folder).
      orderedCombined.sort((a, b) => {
        const pa = (a as any).position ?? Number.MAX_SAFE_INTEGER;
        const pb = (b as any).position ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        const ta = new Date((a as any)._ts ?? (a as any).createdAt ?? 0).getTime();
        const tb = new Date((b as any)._ts ?? (b as any).createdAt ?? 0).getTime();
        return ta - tb;
      });
    }
    if (spaceSearchQuery) {
      return orderedCombined.filter(item => item.name.toLowerCase().includes(spaceSearchQuery.toLowerCase()));
    }
    return orderedCombined;
  }, [currentFolder, sortOrder, spaceSearchQuery]);

  const handleDownloadItem = async (item: SpaceContentItem) => {
    try {
      if (item.itemType === 'file') {
        const fileItem = item as FileType;
        const { data, error } = await supabase.storage.from('vdr-files').download(fileItem.storagePath);
        if (error) throw error;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(data);
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } else {
        toast({ title: 'Folder download coming soon' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Download failed', description: error.message });
    }
  };

  const handleAddSectionHeader = () => {
    if (!space) return;
    addSectionHeaderToSpace(space.id, 'Untitled Section', currentFolderId, 'end');
    toast({ title: `Section "Untitled Section" added.` });
  };

  // Persist visibility to the DB. Visitors' folder/file query filters
  // by `is_visible IS NOT FALSE`, so toggling off here actually hides
  // the item from anyone who opens the share link.
  //
  // Strategy:
  //   1. Compute the new value
  //   2. Optimistic update of local state (UI flips immediately)
  //   3. Try the `folders` table first; if 0 rows updated, try `files`
  //   4. On failure, revert local state and toast the error
  const toggleVisibility = async (itemId: string) => {
    const currentVisible = visibleItems[itemId] !== false;
    const nextVisible = !currentVisible;
    setVisibleItems(prev => ({ ...prev, [itemId]: nextVisible }));

    try {
      const { data: folderRows, error: folderErr } = await supabase
        .from('folders')
        .update({ is_visible: nextVisible })
        .eq('id', itemId)
        .select('id');
      if (folderErr) throw folderErr;

      if (!folderRows || folderRows.length === 0) {
        const { error: fileErr } = await supabase
          .from('files')
          .update({ is_visible: nextVisible })
          .eq('id', itemId);
        if (fileErr) throw fileErr;
      }
    } catch (err) {
      // Revert optimistic update
      setVisibleItems(prev => ({ ...prev, [itemId]: currentVisible }));
      toast({
        variant: 'destructive',
        title: 'Could not save visibility',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleAddFolder = () => {
    if (!newFolderName || !space) return;
    addFolderToSpace(space.id, newFolderName, currentFolderId === 'root' ? null : currentFolderId);
    toast({ title: `Folder "${newFolderName}" created.` });
    setIsAddFolderOpen(false);
    setNewFolderName('');
  };

  const resetRequestForm = () => { setRequestTitle(''); setRequestMessage(''); setRequestDate(undefined); };

  const handleCreateRequest = () => {
    if (!requestTitle || !space) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }
    const newRequest = addFileRequest({ title: requestTitle, message: requestMessage, expiresAt: requestDate, uploadLocation: { id: space.id, name: space.name, type: 'space' } });
    if (newRequest) {
      setGeneratedLink((typeof window !== 'undefined' ? window.location.origin : '') + newRequest.link);
      setIsLinkDialogOpen(true);
    }
    resetRequestForm();
    setIsRequestSheetOpen(false);
  };

  const copyLinkToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied to clipboard!' });
  };

  const uploadFileToSupabase = async (file: globalThis.File, spaceId: string, folderId: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');
    const fileExt = file.name.split('.').pop();
    const filePath = `${spaceId}/${folderId}/${uuidv4()}.${fileExt}`;
    const { error } = await supabase.storage.from('vdr-files').upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  // Returns the first root-level folder if one exists, or null otherwise.
  // Previously this auto-CREATED a folder literally named "Files" so root
  // uploads would always have a folder_id to attach to. That's why the
  // user kept seeing their root uploads appear inside a phantom "Files"
  // folder. Now: root uploads are not allowed - the user must explicitly
  // create a folder first, then upload into it.
  const findRootFolder = async (spaceId: string): Promise<string | null> => {
    const { data: existing } = await supabase
      .from('folders').select('id').eq('space_id', spaceId).is('parent_id', null).limit(1).maybeSingle();
    return existing?.id ?? null;
  };

  const createFileRecord = async (file: globalThis.File, spaceId: string, folderId: string, storagePath: string): Promise<FileType> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase.from('files').insert({
      id: uuidv4(), user_id: user.id, folder_id: folderId, name: file.name,
      type: getFileType(file), storage_path: storagePath, space_id: spaceId, views: 0,
      size_bytes: file.size,
    }).select().single();
    if (error) { console.error('files insert error:', error); throw error; }
    // Deal Watch: notify the account manager when a watched founder adds a
    // file to their space. No-op server-side when the founder isn't watched.
    void fireDealWatchEvent({ spaceId, fileId: data.id, fileName: file.name, eventType: 'file_added' });
    return { id: data.id, name: data.name, type: data.type, createdAt: data.created_at, views: data.views, storagePath: data.storage_path };
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

  const handleAddFiles = async (filesToAdd: globalThis.File[]) => {
    if (!space || filesToAdd.length === 0) return;
    if (!(await ensureStorageRoom(filesToAdd))) return;
    // Files can only live inside a folder. If we're at the root view with
    // no current folder selected, fall back to the first root-level folder
    // (legacy-compat for spaces that still have an auto-created "Files"
    // wrapper). For brand-new empty spaces, refuse the upload with a
    // clear prompt to create a folder first.
    let resolvedFolderId: string;
    if (currentFolderId === 'root') {
      const root = await findRootFolder(space.id);
      if (!root) {
        toast({
          variant: 'destructive',
          title: 'Create a folder first',
          description: 'Files must live inside a folder. Click "Create folder" to add one, then upload into it.',
        });
        return;
      }
      resolvedFolderId = root;
    } else {
      resolvedFolderId = currentFolderId;
    }
    setIsUploading(true);
    const items: UploadItem[] = filesToAdd.map((f, i) => ({
      id: `up_${Date.now()}_${i}`,
      name: f.name,
      type: (f.name.split('.').pop() ?? 'file').toUpperCase(),
      progress: 0,
      status: 'in_progress',
    }));
    uploadTracker.addItems(items);
    let successCount = 0;
    for (let i = 0; i < filesToAdd.length; i++) {
      const file = filesToAdd[i];
      const item = items[i];
      let prog = 0;
      const iv = window.setInterval(() => {
        prog = Math.min(prog + Math.random() * 15, 90);
        uploadTracker.updateItem(item.id, { progress: Math.round(prog) });
      }, 300);
      try {
        const storagePath = await uploadFileToSupabase(file, space.id, resolvedFolderId);
        const created = await createFileRecord(file, space.id, resolvedFolderId, storagePath);
        window.clearInterval(iv);
        uploadTracker.updateItem(item.id, { progress: 100, status: 'completed', fileId: created.id });
        successCount++;
      } catch {
        window.clearInterval(iv);
        uploadTracker.updateItem(item.id, { status: 'failed', progress: 0 });
      }
    }
    if (successCount > 0) await refreshSpace(space.id);
    setIsUploading(false);
  };

  const handleFileUploadConfirm = async () => {
    if (uploadedFiles.length === 0) return;
    const filesToUpload = [...uploadedFiles];
    setIsUploadDialogOpen(false);
    setUploadedFiles([]);
    await waitForDialogClose();
    await handleAddFiles(filesToUpload);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setUploadedFiles(Array.from(event.target.files));
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setUploadedFolder(Array.from(event.target.files));
  };

  const handleAddUploadedFolder = async () => {
    if (!space || uploadedFolder.length === 0) return;
    const folderToUpload = [...uploadedFolder];
    if (!(await ensureStorageRoom(folderToUpload))) return;
    setIsFolderUploadDialogOpen(false);
    setUploadedFolder([]);
    await waitForDialogClose();

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const folderName = folderToUpload[0].webkitRelativePath.split('/')[0];
      // For folder uploads at root: parent_id is NULL (a true root folder).
      // For nested uploads: nest under whatever folder we're currently in.
      const parentDbId: string | null = currentFolderId === 'root' ? null : currentFolderId;
      const newFolderDbId = uuidv4();
      const { error: folderError } = await supabase.from('folders').insert({
        id: newFolderDbId, user_id: user.id, name: folderName, space_id: space.id, parent_id: parentDbId,
      });
      if (folderError) throw new Error(`Could not create folder: ${folderError.message}`);
      const items: UploadItem[] = folderToUpload.map((f, i) => ({
        id: `upf_${Date.now()}_${i}`,
        name: f.name,
        type: (f.name.split('.').pop() ?? 'file').toUpperCase(),
        progress: 0,
        status: 'in_progress',
      }));
      uploadTracker.addItems(items);
      let successCount = 0;
      for (let i = 0; i < folderToUpload.length; i++) {
        const file = folderToUpload[i];
        const item = items[i];
        let prog = 0;
        const iv = window.setInterval(() => {
          prog = Math.min(prog + Math.random() * 15, 90);
          uploadTracker.updateItem(item.id, { progress: Math.round(prog) });
        }, 300);
        try {
          const storagePath = await uploadFileToSupabase(file, space.id, newFolderDbId);
          const created = await createFileRecord(file, space.id, newFolderDbId, storagePath);
          window.clearInterval(iv);
          uploadTracker.updateItem(item.id, { progress: 100, status: 'completed', fileId: created.id });
          successCount++;
        } catch {
          window.clearInterval(iv);
          uploadTracker.updateItem(item.id, { status: 'failed', progress: 0 });
        }
      }
      if (successCount > 0) await refreshSpace(space.id);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err instanceof Error ? err.message : 'An unexpected error occurred.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFromLibrary = (folder: { id: string; name: string }) => {
    if (!space) return;
    const libraryFolder = foldersContext.findFolder(folder.id);
    if (!libraryFolder || libraryFolder.files.length === 0) {
      toast({ title: "No files to add.", description: `The folder "${folder.name}" is empty.` });
      return;
    }
    refreshSpace(space.id);
    toast({ title: `Files added from "${folder.name}".` });
    setIsFromLibraryOpen(false);
  };

  const handleFolderClick = (folder: Folder) => setBreadcrumbs([...(breadcrumbs || []), { id: folder.id, name: folder.name }]);
  const handleFileClick = (file: FileType) => { setViewingFile(file); setIsFileViewerOpen(true); };

  const getRootIndex = useMemo(() => {
    if (!space || !currentFolder) return '';
    if (currentFolder.id === 'root') return '';
    const findPath = (folders: Folder[], targetId: string, currentPath: string): string | null => {
      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        const newPath = currentPath ? `${currentPath}${i + 1}.` : `${i + 1}.`;
        if (folder.id === targetId) return newPath;
        if (folder.children) { const result = findPath(folder.children, targetId, newPath); if (result) return result; }
      }
      return null;
    };
    return findPath(space.folders, currentFolder.id, '') || '';
  }, [space, currentFolder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && space) {
      reorderItemsInSpace(space.id, currentFolderId, active.id as string, over.id as string);
    }
  }, [space, currentFolderId, reorderItemsInSpace]);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {}, []);

  if (!space || !currentFolder) return <div>Loading...</div>;

  return (
    <TooltipProvider>
      <div className="mb-1">
        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={spaceTitle}
            onChange={(e) => setSpaceTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') { setSpaceTitle(space.name || ''); setIsEditingTitle(false); }
            }}
            className="text-3xl font-bold h-auto py-1 px-2 border-blue-400 focus-visible:ring-blue-400 max-w-xl"
          />
        ) : (
          <h1
            className="text-3xl font-bold cursor-text hover:bg-muted/50 rounded px-2 py-1 -mx-2 inline-block max-w-xl truncate"
            onClick={() => setIsEditingTitle(true)}
            title="Click to rename space"
          >
            {spaceTitle || space.name || 'Untitled Space'}
          </h1>
        )}
      </div>

      {/* Toolbar wraps on phones (DocSend-style stacked buttons) instead of
          overflowing off the right edge of the screen. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {currentFolderId === 'root' ? 'Home' : currentFolder.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><ListOrdered className="mr-2 h-4 w-4" />Organize <ChevronDown className="ml-2 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setSortOrder(prev => prev === 'asc' ? 'manual' : 'asc')}><ArrowDownAZ className="mr-2 h-4 w-4" />Sort A to Z</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleAddSectionHeader}><PlusSquare className="mr-2 h-4 w-4" />Add a section header</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsIndexingOff(!isIndexingOff)}><ListOrdered className="mr-2 h-4 w-4" />{isIndexingOff ? 'Turn on indexing' : 'Turn off indexing'}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}><LayoutGrid className="mr-2 h-4 w-4" />Set grid view for visitors</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setIsRequestSheetOpen(true)}><FileUp className="mr-2 h-4 w-4" /> Request files</Button>
          <Button variant="outline" onClick={() => setIsAddFolderOpen(true)}><FolderPlus className="mr-2 h-4 w-4" /> Create folder</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add content <ChevronDown className="ml-2 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setIsFromLibraryOpen(true)}><FolderIcon className="mr-2 h-4 w-4" /> From Content Library</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsUploadDialogOpen(true)}><FileIcon className="mr-2 h-4 w-4" /> Upload Files</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsFolderUploadDialogOpen(true)}><FolderIcon className="mr-2 h-4 w-4" /> Upload Folder</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsSignableDocOpen(true)}><PenSquare className="mr-2 h-4 w-4" /> Signable Document</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4">
        {allContent.length > 0 ? (
          <Card className="shadow-none border rounded-lg">
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead className="w-16 text-center">{!isIndexingOff && "Index"}</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last updated</TableHead>
                      <TableHead>Visible</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext items={allContent.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {allContent.map((item, index) => {
                        if (item.itemType === 'section') {
                          return <SectionHeader key={item.id} id={item.id} name={item.name} spaceId={spaceId} parentId={currentFolderId} index={`${getRootIndex}${index + 1}`} isIndexingOff={isIndexingOff} />;
                        }
                        return (
                          <SortableItem
                            key={item.id} item={item} spaceId={spaceId}
                            currentFolderId={currentFolderId} getRootIndex={getRootIndex}
                            index={index} isIndexingOff={isIndexingOff}
                            visibleItems={visibleItems} toggleVisibility={toggleVisibility}
                            handleFileClick={handleFileClick} handleFolderClick={handleFolderClick}
                            handleDownloadItem={handleDownloadItem}
                          />
                        );
                      })}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </CardContent>
          </Card>
        ) : (
          <div className="border-2 border-dashed rounded-lg min-h-96 flex flex-col items-center justify-center text-muted-foreground py-16 px-6">
            {spaceSearchQuery ? (
              <>
                <Search className="h-12 w-12 mb-4" />
                <p className="font-semibold text-foreground">No results for &quot;{spaceSearchQuery}&quot;</p>
                <p className="text-sm">Try another search.</p>
              </>
            ) : currentFolderId === 'root' ? (
              // Brand-new space (no folders). The user explicitly asked for
              // *only* a "Create folder" call-to-action here - no file upload,
              // no auto-created wrapper folder. Files must live inside a folder.
              <>
                <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mb-5">
                  <FolderPlus className="h-7 w-7 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-foreground">This space is empty</p>
                <p className="text-sm max-w-sm text-center mt-1.5">
                  Start by creating a folder. Files always live inside a folder, and you can
                  upload into it once it exists.
                </p>
                <Button
                  className="mt-6 bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => setIsAddFolderOpen(true)}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create folder
                </Button>
              </>
            ) : (
              // Inside an existing folder - keep the empty state actionable
              // (the parent toolbar already has Add content / Create folder
              // buttons that target this folder).
              <>
                <FolderOpen className="h-12 w-12 mb-4" />
                <p className="font-semibold text-foreground">This folder is empty</p>
                <p className="text-sm">Use &ldquo;Add content&rdquo; above to upload files into this folder.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Folder Dialog */}
      <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Folder</DialogTitle><DialogDescription>Enter a name for your new folder.</DialogDescription></DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input id="folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Due Diligence" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFolder}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Request Sheet */}
      <Sheet open={isRequestSheetOpen} onOpenChange={(isOpen) => { setIsRequestSheetOpen(isOpen); if (!isOpen) resetRequestForm(); }}>
        <SheetContent className="sm:max-w-2xl bg-white text-black p-0 flex flex-col">
          <SheetHeader className="p-6">
            <SheetTitle className="text-2xl font-bold">Create file request for "{space.name}"</SheetTitle>
            <SheetDescription className="text-muted-foreground">Collect and receive files from anyone, right in this Space.</SheetDescription>
          </SheetHeader>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="request-title" className="font-semibold">Request title <span className="font-normal text-gray-500">(Visible to viewers)</span></Label>
                <Input id="request-title" placeholder="Explain what the request is for" className="bg-gray-100" value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="font-semibold">Message <span className="font-normal text-gray-500">(Optional)</span></Label>
                <Textarea id="message" placeholder="Add any extra details" value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} maxLength={200} className="bg-gray-100 min-h-[100px]" />
                <p className="text-sm text-gray-500 text-right">{requestMessage.length}/200</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Link settings</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="require-email" defaultChecked />
                  <Label htmlFor="require-email" className="font-normal">Require email to access</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="expires" checked={!!requestDate} onCheckedChange={(checked) => setRequestDate(checked ? new Date() : undefined)} />
                  <div className="grid gap-2 grid-cols-2 w-full items-center">
                    <Label htmlFor="expires" className="font-normal">Expires</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn('w-full justify-start text-left font-normal bg-gray-100', !requestDate && 'text-gray-500')} disabled={!requestDate}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {requestDate ? format(requestDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white">
                          <Calendar mode="single" selected={requestDate} onSelect={setRequestDate} disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input type="time" className="pl-8 bg-gray-100" disabled={!requestDate} defaultValue={requestDate ? format(requestDate, 'HH:mm') : ''} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="passcode" />
                  <div className="grid gap-2 grid-cols-2 w-full items-center">
                    <Label htmlFor="passcode" className="font-normal">Passcode</Label>
                    <Input id="passcode-input" type="text" className="bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 border-t mt-auto">
            <Button onClick={handleCreateRequest} className="w-full bg-gray-900 text-white hover:bg-gray-800" disabled={isUploading}>Continue</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Share Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" />File request created</DialogTitle>
            <DialogDescription>Anyone with the link can upload to this file request.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input id="link" defaultValue={generatedLink} readOnly />
            </div>
            <Button type="submit" size="sm" className="px-3" onClick={() => copyLinkToClipboard(generatedLink)}>
              <span className="sr-only">Copy</span><Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setIsLinkDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload to "{space.name}"</DialogTitle>
            <DialogDescription>Select files from your computer to upload.</DialogDescription>
          </DialogHeader>

          <Input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />

          {/* Scrollable body so the dialog never overflows the screen */}
          <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 py-1">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) setUploadedFiles(Array.from(e.dataTransfer.files)); }}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-[#4285F4] hover:bg-blue-50/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#4285F4]">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Drag and drop files here, or click to browse</p>
                <p className="mt-0.5 text-xs text-muted-foreground">You can select multiple files</p>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="overflow-hidden rounded-xl border bg-gray-50">
                <div className="flex items-center justify-between border-b bg-white px-4 py-2.5">
                  <span className="text-sm font-semibold text-gray-900">Selected files</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {uploadedFiles.length} file{uploadedFiles.length === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="max-h-48 space-y-0.5 overflow-y-auto px-4 py-2 text-sm">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex items-center gap-2 py-0.5 text-muted-foreground">
                      <FileIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleFileUploadConfirm}
              disabled={uploadedFiles.length === 0 || isUploading}
              className="bg-[#4285F4] text-white hover:bg-[#3367d6]"
            >
              {isUploading
                ? 'Uploading...'
                : uploadedFiles.length > 0
                  ? `Upload ${uploadedFiles.length} file${uploadedFiles.length === 1 ? '' : 's'}`
                  : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Folder Dialog */}
      <Dialog open={isFolderUploadDialogOpen} onOpenChange={setIsFolderUploadDialogOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload folder to "{space.name}"</DialogTitle>
            <DialogDescription>Select a folder from your computer to upload its files.</DialogDescription>
          </DialogHeader>

          <input type="file" /* @ts-ignore */ webkitdirectory="true" directory="true" ref={folderInputRef} onChange={handleFolderSelect} className="hidden" multiple />

          {/* Scrollable body so the dialog never overflows the screen */}
          <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 py-1">
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-[#4285F4] hover:bg-blue-50/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#4285F4]">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {uploadedFolder.length > 0 ? 'Choose a different folder' : 'Click to select a folder'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Everything inside the folder will be uploaded</p>
              </div>
            </button>

            {uploadedFolder.length > 0 && (
              <div className="overflow-hidden rounded-xl border bg-gray-50">
                <div className="flex items-center justify-between border-b bg-white px-4 py-2.5">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {uploadedFolder[0]?.webkitRelativePath.split('/')[0] || 'Folder'}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {uploadedFolder.length} file{uploadedFolder.length === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="max-h-48 space-y-0.5 overflow-y-auto px-4 py-2 text-sm">
                  {uploadedFolder.map((file, index) => (
                    <li key={index} className="flex items-center gap-2 py-0.5 text-muted-foreground">
                      <FileIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setIsFolderUploadDialogOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUploadedFolder}
              disabled={uploadedFolder.length === 0 || isUploading}
              className="bg-[#4285F4] text-white hover:bg-[#3367d6]"
            >
              {isUploading
                ? 'Uploading...'
                : uploadedFolder.length > 0
                  ? `Upload ${uploadedFolder.length} file${uploadedFolder.length === 1 ? '' : 's'}`
                  : 'Upload folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* From Content Library */}
      <FolderSelectionDialog open={isFromLibraryOpen} onOpenChange={setIsFromLibraryOpen} onSelectFolder={handleSelectFromLibrary} title="Add from Content Library" description="Select a folder to add its contents to this space." />

      {/* Signable Document */}
      <Dialog open={isSignableDocOpen} onOpenChange={setIsSignableDocOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Signable Documents</DialogTitle><DialogDescription>This feature is coming soon!</DialogDescription></DialogHeader>
          <DialogFooter><Button onClick={() => setIsSignableDocOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <FileViewer file={viewingFile} open={isFileViewerOpen} onOpenChange={setIsFileViewerOpen} bucket="vdr-files" />

      {/* Bottom-right upload tracker (per-file progress, auto-hides after 30s) */}
      {uploadTracker.visible && uploadTracker.items.length > 0 && (
        <UploadProgressPanel items={uploadTracker.items} onClose={uploadTracker.close} />
      )}

      <UpgradeDialog
        open={!!upgradeMsg}
        onOpenChange={(o) => { if (!o) setUpgradeMsg(null); }}
        title="Storage limit reached"
        description={upgradeMsg ?? ''}
      />
    </TooltipProvider>
  );
}

export default function SpaceEditPage() {
  return <SpaceEditPageComponent />;
}