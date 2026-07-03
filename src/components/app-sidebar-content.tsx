//src\components\app-sidebar-content.tsx
'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Folder as FolderIcon,
  FolderPlus,
  FilePlus2,
  Settings,
  LifeBuoy,
  FileUp,
  BarChart2,
  Package,
  Home,
  ShieldCheck,
  MessageSquare,
  FileClock,
  Trash2,
  ChevronRight,
  File as FileIcon,
  ArrowLeft,
  Info,
  FileLock,
  Users,
  Inbox,
  CreditCard,
  Star,
  Headset,
  Radar,
} from 'lucide-react';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import Image from 'next/image';
import Link from 'next/link';
import { SupportDialog } from '@/components/support-dialog';
import { supabase } from '@/lib/supabaseClient';
import { useAlerts } from '@/lib/alerts-provider';
import { usePathname, useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSpaces } from '@/lib/spaces-provider';
import type { Folder, File as TFile } from '@/lib/folder-provider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';
import { useToast } from '@/hooks/use-toast';
import { getDocumentIcon } from '@/lib/data';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useLayout } from '@/app/(app)/layout-context';

const FileViewer = dynamic(
  () => import('@/components/file-viewer').then((mod) => mod.FileViewer),
  { ssr: false }
);

type Item = (Folder | TFile) & { itemType: 'folder' | 'file' | 'section' };

type FolderTreeProps = {
  items: Item[];
  level?: number;
  parentIndex?: string;
  onFolderClick: (folder: Folder) => void;
  onFileClick: (file: TFile) => void;
  /** Fires when the user clicks the "+folder" hover icon on a folder row.
   *  Receives the parent folder so the space-edit page knows where to
   *  create the new subfolder. Optional - the sidebar omits the icons when
   *  this is not provided. */
  onCreateSubfolder?: (parent: Folder) => void;
  /** Same as above but for the "+file" hover icon. */
  onAddFileToFolder?: (parent: Folder) => void;
};

// ✅ Forward declare FolderTree so FolderTreeItem can reference it without it being undefined
let FolderTree: React.ComponentType<FolderTreeProps>;

const FolderTreeItem = React.memo(({
  item,
  index,
  level,
  parentIndex,
  onFolderClick,
  onFileClick,
  onCreateSubfolder,
  onAddFileToFolder,
}: {
  item: Item;
  index: number;
  level: number;
  parentIndex: string;
  onFolderClick: (folder: Folder) => void;
  onFileClick: (file: TFile) => void;
  onCreateSubfolder?: (parent: Folder) => void;
  onAddFileToFolder?: (parent: Folder) => void;
}) => {
  const isFolder = item.itemType === 'folder';
  const isSection = item.itemType === 'section';
  const folder = isFolder ? (item as Folder) : null;
  const file = !isFolder && !isSection ? (item as TFile) : null;
  const Icon = isFolder ? FolderIcon : (isSection ? ChevronRight : getDocumentIcon(file!.type));
  const hasSubFolders = folder ? (folder.children?.length ?? 0) > 0 : false;
  const currentIndex = parentIndex ? `${parentIndex}${index + 1}` : `${index + 1}`;

  const combinedChildren = useMemo(() => folder
    ? [
        ...(folder.children?.map((c) => ({ ...c, itemType: 'folder' as const })) || []),
        ...(folder.files?.map((f) => ({ ...f, itemType: f.itemType || 'file' as const })) || []),
      ]
    : [], [folder]);

  if (isSection) {
    return (
      <div className="flex items-center text-muted-foreground group py-1.5 rounded-md">
        <div className="flex items-center gap-2 w-full">
          <span className="w-8 h-8" />
          <span className="truncate text-xs font-bold uppercase tracking-wider flex-1">{item.name}</span>
        </div>
      </div>
    );
  }

  if (isFolder) {
    const folderItem = item as Folder;
    return (
      <Collapsible defaultOpen={level < 2} className="group/collapsible">
        <div className="flex items-center text-muted-foreground hover:text-foreground group py-1.5 rounded-md hover:bg-gray-100 pr-1">
          <CollapsibleTrigger asChild className="flex-1 min-w-0">
            <div className="flex items-center gap-2 cursor-pointer w-full min-w-0" onClick={() => onFolderClick(folderItem)}>
              {hasSubFolders ? (
                <ChevronRight className="h-8 w-8 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 p-2" />
              ) : (
                <span className="w-8 h-8" />
              )}
              <FolderIcon className="h-5 w-5 text-amber-500 fill-amber-200 shrink-0" />
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">{currentIndex}</div>
              <span className="truncate text-sm font-medium flex-1 min-w-0">{item.name}</span>
            </div>
          </CollapsibleTrigger>
          {/* Quick-action icons - always visible (no hover-to-reveal).
              Distinct colours so they read as "add file" (blue) and
              "add folder" (green) instead of a muted grey wash. */}
          {(onCreateSubfolder || onAddFileToFolder) && (
            <div className="flex items-center gap-0.5 shrink-0">
              {onAddFileToFolder && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAddFileToFolder(folderItem); }}
                  title={`Add file to "${folderItem.name}"`}
                  className="p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <FilePlus2 className="h-4 w-4 text-blue-600" />
                </button>
              )}
              {onCreateSubfolder && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folderItem); }}
                  title={`Create folder inside "${folderItem.name}"`}
                  className="p-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                >
                  <FolderPlus className="h-4 w-4 text-emerald-600" />
                </button>
              )}
            </div>
          )}
        </div>
        {hasSubFolders && (
          <CollapsibleContent>
            <FolderTree
              items={combinedChildren}
              level={level + 1}
              parentIndex={`${currentIndex}.`}
              onFolderClick={onFolderClick}
              onFileClick={onFileClick}
              onCreateSubfolder={onCreateSubfolder}
              onAddFileToFolder={onAddFileToFolder}
            />
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  return (
    <div className="flex items-center text-muted-foreground hover:text-foreground group py-1.5 rounded-md hover:bg-gray-100">
      <div className="flex items-center gap-2 cursor-pointer w-full" onClick={() => onFileClick(item as TFile)}>
        <span className="w-8 h-8" />
        <Icon className="h-5 w-5 ml-0" />
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">{currentIndex}</div>
        <span className="truncate text-sm font-medium flex-1">{item.name}</span>
      </div>
    </div>
  );
});
FolderTreeItem.displayName = 'FolderTreeItem';

FolderTree = React.memo(({
  items,
  level = 0,
  parentIndex = '',
  onFolderClick,
  onFileClick,
  onCreateSubfolder,
  onAddFileToFolder,
}: FolderTreeProps) => {
  return (
    <div className={cn("space-y-1", level > 0 ? 'pl-5' : '')}>
      {items.map((item, index) => (
        <FolderTreeItem
          key={item.id}
          item={item}
          index={index}
          level={level}
          parentIndex={parentIndex}
          onFolderClick={onFolderClick}
          onFileClick={onFileClick}
          onCreateSubfolder={onCreateSubfolder}
          onAddFileToFolder={onAddFileToFolder}
        />
      ))}
    </div>
  );
});
(FolderTree as React.MemoExoticComponent<React.FC<FolderTreeProps>>).displayName = 'FolderTree';


export function AppSidebarContent({
  fileRequestCount,
  isSpaceView = false,
}: {
  fileRequestCount: number;
  isSpaceView?: boolean;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const [isClient, setIsClient] = useState(false);

  // ✅ FIX: Derive space directly from spaces array using useMemo
  const { findSpace, spaces } = useSpaces();
  const space = useMemo(() => {
    if (!spaceId) return null;
    return spaces.find(s => s.id === spaceId || s.spaceId === spaceId) ?? null;
  }, [spaces, spaceId]);

  const { setBreadcrumbs, setPendingAction } = useLayout();
  const { toast } = useToast();

  // Unopened "shared with me" invites - drives the red badge on the nav item.
  const { alerts } = useAlerts();
  const sharedUnopened = useMemo(
    () => alerts.filter((a) => (a.type as string) === 'space_shared' && !a.read_at).length,
    [alerts],
  );
  const [viewingFile, setViewingFile] = useState<TFile | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isSupportAdmin, setIsSupportAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
      if (active && (data as { is_admin?: boolean } | null)?.is_admin) setIsSupportAdmin(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isActive = useCallback((path: string, exact: boolean = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  }, [pathname]);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleFolderClick = useCallback((folder: Folder) => {
    if (!space) return;

    const findPath = (currentItems: Item[], targetId: string, path: { id: string, name: string }[]): { id: string, name: string }[] | null => {
      for (const item of currentItems) {
        if (item.id === targetId) {
          return [...path, { id: item.id, name: item.name }];
        }
        if (item.itemType === 'folder') {
          const folderItem = item as Folder;
          const combinedChildren: Item[] = [
            ...(folderItem.children?.map((c) => ({ ...c, itemType: 'folder' as const })) || []),
            ...(folderItem.files?.map((f) => ({ ...f, itemType: f.itemType || 'file' as const })) || []),
          ];
          const result = findPath(combinedChildren, targetId, [...path, { id: item.id, name: item.name }]);
          if (result) return result;
        }
      }
      return null;
    };

    const rootItems: Item[] = [
      ...(space.folders?.map(f => ({ ...f, itemType: 'folder' as const })) || []),
      ...(space.files?.map(f => ({ ...f, itemType: f.itemType || 'file' as const })) || [])
    ];

    if (folder.id === 'root') {
      setBreadcrumbs([{ id: 'root', name: 'Home' }]);
    } else {
      const foundPath = findPath(rootItems, folder.id, []);
      if (foundPath) {
        setBreadcrumbs([{ id: 'root', name: 'Home' }, ...foundPath]);
      }
    }

    router.push(`/spaces/${spaceId}/edit`);
  }, [space, spaceId, setBreadcrumbs, router]);

  const handleFileClick = useCallback((file: TFile) => {
    if (file.contentUrl) {
      setViewingFile(file);
      setIsFileViewerOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Cannot open file',
        description: 'File content is not available. Please try refreshing the page.',
      });
    }
  }, [toast]);

  const rootItems = useMemo(() => {
    if (!space) return [];
    const topFolders = space.folders || [];

    // Wrapper-folder promotion (mirrors the logic in spaces/[id]/edit/page.tsx).
    // When a single top-level folder exists and its name is one of the
    // internal "root container" names ("files" / "root" / "home"), it's
    // an auto-created wrapper - surface its contents at the Home view
    // instead of showing the wrapper itself in the sidebar.
    const INTERNAL = ['files', 'root', 'home'];
    const isPromotedWrapper =
      topFolders.length === 1 && INTERNAL.includes(topFolders[0].name.toLowerCase());

    const folders = isPromotedWrapper ? (topFolders[0].children || []) : topFolders;
    const files = isPromotedWrapper
      ? [...(space.files || []), ...(topFolders[0].files || [])]
      : (space.files || []);

    return [
      ...folders.map(f => ({ ...f, itemType: 'folder' as const })),
      ...files.map(f => ({ ...f, itemType: f.itemType || 'file' as const })),
    ];
  }, [space]);

  // Deal Watch nav visibility: Watchlist + Account Manager only for Investor
  // plan accounts; the Deal Watch dashboard only for the account manager.
  // Errors (e.g. the migration not run yet) simply leave both hidden.
  const [dwInvestor, setDwInvestor] = useState(false);
  const [dwManager, setDwManager] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();
        const uid = session?.user?.id;
        if (!email || !uid) return;
        if (active && email === DW_MANAGER_EMAIL) setDwManager(true);
        const { data } = await supabase
          .from('profiles')
          .select('is_investor')
          .eq('id', uid)
          .maybeSingle();
        if (active && (data as { is_investor?: boolean } | null)?.is_investor === true) {
          setDwInvestor(true);
        }
      } catch {
        /* hidden by default */
      }
    })();
    return () => { active = false; };
  }, []);

  if (isSpaceView) {
    if (!isClient || !space) return null;

    return (
      <>
        <SidebarHeader className="p-4 border-b">
          <Button variant="ghost" className="justify-start -ml-2 h-12 text-base font-medium hover:bg-gray-100 transition-colors" asChild>
            <Link href="/spaces">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All spaces
            </Link>
          </Button>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  setBreadcrumbs([{ id: 'root', name: 'Home' }]);
                  handleNavigate(`/spaces/${spaceId}/edit`);
                }}
                isActive={isActive(`/spaces/${spaceId}/edit`, true)}
                variant="ghost"
                className="justify-start font-semibold text-lg px-4 h-14 rounded-md hover:bg-gray-100 transition-colors"
                tooltip="Home"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <Home className="shrink-0 h-6 w-6" />
                  <span className="truncate text-base">Home</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="border-t border-gray-200" />

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate(`/spaces/${spaceId}/edit/permissions`)}
                isActive={isActive(`/spaces/${spaceId}/edit/permissions`)}
                variant="ghost"
                className="justify-start text-muted-foreground font-normal px-4 h-14 rounded-md hover:bg-gray-100 transition-colors"
                tooltip="Permissions"
              >
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="text-base">Permissions</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="border-t border-gray-200" />

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate(`/spaces/${spaceId}/edit/qna`)}
                isActive={isActive(`/spaces/${spaceId}/edit/qna`)}
                variant="ghost"
                className="justify-start text-muted-foreground font-normal px-4 h-14 rounded-md hover:bg-gray-100 transition-colors"
                tooltip="Q&A"
              >
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-base">Q&A</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="border-t border-gray-200" />

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate(`/spaces/${spaceId}/edit/analytics`)}
                isActive={isActive(`/spaces/${spaceId}/edit/analytics`)}
                variant="ghost"
                className="justify-start text-muted-foreground font-normal px-4 h-14 rounded-md hover:bg-gray-100 transition-colors"
                tooltip="Analytics"
              >
                <div className="flex items-center gap-4">
                  <BarChart2 className="h-6 w-6" />
                  <span className="text-base">Analytics</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="border-t border-gray-200" />

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate(`/spaces/${spaceId}/edit/audit-log`)}
                isActive={isActive(`/spaces/${spaceId}/edit/audit-log`)}
                variant="ghost"
                className="justify-start text-muted-foreground font-normal px-4 h-14 rounded-md hover:bg-gray-100 transition-colors"
                tooltip="Audit Log"
              >
                <div className="flex items-center gap-4">
                  <FileClock className="h-6 w-6" />
                  <span className="text-base">Audit log</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="px-3 pt-5 pb-1 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Space content</h3>
            </div>

            {/* Folders rendered flat - no fake "Home" wrapper. The big "Home"
                button above (this menu's first item) is the only Home affordance.
                Hover any folder row to reveal "+file" and "+folder" quick-action
                icons; they post a PendingAction to the layout context which the
                space-edit page picks up to open the right dialog. */}
            <div className="px-2 mt-1">
              {rootItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2 py-2">
                  No folders yet. Use &ldquo;Create folder&rdquo; on the Home page to add one.
                </p>
              ) : (
                <FolderTree
                  items={rootItems}
                  level={0}
                  parentIndex=""
                  onFolderClick={handleFolderClick}
                  onFileClick={handleFileClick}
                  onCreateSubfolder={(parent) =>
                    setPendingAction({ kind: 'create-subfolder', folderId: parent.id, folderName: parent.name })
                  }
                  onAddFileToFolder={(parent) =>
                    setPendingAction({ kind: 'add-file-to-folder', folderId: parent.id, folderName: parent.name })
                  }
                />
              )}
            </div>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                variant="ghost"
                className="justify-between text-muted-foreground font-normal px-4 h-14 rounded-md hover:bg-gray-100 transition-colors"
                tooltip="Trash"
              >
                <div className="flex items-center gap-4">
                  <Trash2 className="h-6 w-6" />
                  <span className="text-base">Trash</span>
                </div>
                <Info className="h-4 w-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <FileViewer
            file={viewingFile}
            open={isFileViewerOpen}
            onOpenChange={setIsFileViewerOpen}
            bucket="vdr-files"
          />
        </SidebarFooter>
      </>
    );
  }

  // ─── Main sidebar (non-space view) ───────────────────────────────────────────
  return (
    <>
      <SidebarHeader className="px-4 py-4 border-b">
        <Logo isPen={true} />
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu className="gap-0">

          <SidebarMenuItem>
            <Link href="/dashboard" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/dashboard', true)}
                tooltip="Dashboard"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Home className="h-6 w-6 shrink-0" />
                  <span className="text-base">Dashboard</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="border-t border-gray-200" />

          <SidebarMenuItem>
            <Link href="/content-library" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/content-library')}
                tooltip="Content Library"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FolderIcon className="h-6 w-6 shrink-0" />
                  <span className="text-base">Content Library</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="border-t border-gray-200" />

          <SidebarMenuItem>
            <Link href="/spaces" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/spaces')}
                tooltip="Spaces"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Package className="h-6 w-6 shrink-0" />
                  <span className="text-base">Spaces</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="border-t border-gray-200" />

          <SidebarMenuItem>
            <Link href="/agreements" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/agreements')}
                tooltip="Agreements"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileLock className="h-6 w-6 shrink-0" />
                  <span className="text-base">Agreements</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="border-t border-gray-200" />

          <SidebarMenuItem>
            <Link href="/file-requests" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/file-requests')}
                tooltip="File Requests"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileUp className="h-6 w-6 shrink-0" />
                  <span className="text-base">File Requests</span>
                  {fileRequestCount > 0 && (
                    <SidebarMenuBadge>{fileRequestCount}</SidebarMenuBadge>
                  )}
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="border-t border-gray-200" />

          <SidebarMenuItem>
            <Link href="/analytics" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/analytics')}
                tooltip="Analytics"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <BarChart2 className="h-5 w-5 shrink-0" />
                  <span className="text-base">Analytics</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <div className="border-t border-gray-200" />

          <SidebarMenuItem>
            <Link href="/dashboard/shared-with-me" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/dashboard/shared-with-me')}
                tooltip="Shared with me"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Users className="h-6 w-6 shrink-0" />
                  <span className="text-base">Shared with me</span>
                  {sharedUnopened > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white animate-red-dot-blink">
                      {sharedUnopened}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {dwInvestor && (
            <>
              <div className="border-t border-gray-200" />
              <SidebarMenuItem>
                <Link href="/watchlist" className="w-full" passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/watchlist')}
                    tooltip="Watchlist"
                    className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Star className="h-6 w-6 shrink-0" />
                      <span className="text-base">Watchlist</span>
                    </div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <div className="border-t border-gray-200" />
              <SidebarMenuItem>
                <Link href="/account-manager" className="w-full" passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/account-manager')}
                    tooltip="Account Manager"
                    className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Headset className="h-6 w-6 shrink-0" />
                      <span className="text-base">Account Manager</span>
                    </div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}

          {dwManager && (
            <>
              <div className="border-t border-gray-200" />
              <SidebarMenuItem>
                <Link href="/deal-watch" className="w-full" passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/deal-watch')}
                    tooltip="Deal Watch"
                    className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Radar className="h-6 w-6 shrink-0" />
                      <span className="text-base">Deal Watch</span>
                    </div>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}

        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2 py-3 border-t">
        <SidebarMenu className="gap-0">

          <SidebarMenuItem>
            <Link href="/settings" className="w-full" passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive('/settings')}
                tooltip="Settings"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Settings className="h-6 w-6 shrink-0" />
                  <span className="text-base">Settings</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/dashboard/billing">
              <SidebarMenuButton
                tooltip="Billing & plans"
                className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="h-6 w-6 shrink-0" />
                  <span className="text-base">Billing</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {isSupportAdmin && (
            <SidebarMenuItem>
              <Link href="/dashboard/support">
                <SidebarMenuButton
                  tooltip="Support inbox"
                  className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Inbox className="h-6 w-6 shrink-0" />
                    <span className="text-base">Support inbox</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Support"
              onClick={() => setSupportOpen(true)}
              className="h-14 px-4 text-base font-medium gap-4 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <LifeBuoy className="h-6 w-6 shrink-0" />
                <span className="text-base">Support</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
}