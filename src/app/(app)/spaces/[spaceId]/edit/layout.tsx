'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSpaces } from '@/lib/spaces-provider';
import type { Space } from '@/lib/spaces-provider';
import {
  MoreHorizontal,
  Plus,
  Share2,
  Trash2,
  Edit,
  Users,
  Download,
  Copy as CopyIcon,
  BarChart2,
  Info,
  MessageSquare,
  Search,
  Bell,
  X,
  Power,
  Upload,
  ChevronDown,
  ChevronRight,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { ShareSpaceDialog } from '@/components/share-space-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ImageIcon, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { teamMembers } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserNav } from '@/components/user-nav';
import { NotificationBell } from '@/components/notification-bell';
import { AccountManagerButton } from '@/components/account-manager-button';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLayout } from '../../../layout-context';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const predefinedColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#808000', '#008000', '#800080', '#008080', '#000080', '#808080', '#C0C0C0'
];

const ColorPicker = ({ color, onChange }: { color: string, onChange: (color: string) => void }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-2">
        {predefinedColors.map(c => (
          <Button
            key={c}
            variant="outline"
            size="icon"
            className={cn("h-6 w-6 rounded-full", color === c && "ring-2 ring-ring")}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color }} />
        <Input value={color} onChange={(e) => onChange(e.target.value)} className="flex-1 h-8" />
      </div>
    </div>
  );
};

// Three-line hamburger, phones only. Opens the space sidebar drawer (Home,
// Permissions, Q&A, Analytics, Audit log) exactly like DocSend's mobile menu.
function MobileSidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="-ml-1 md:hidden"
      onClick={toggleSidebar}
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}

export default function SpaceEditLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { findSpace, updateSpace, deleteSpace, addSpace } = useSpaces();
  const { breadcrumbs, setBreadcrumbs, spaceSearchQuery, setSpaceSearchQuery } = useLayout();
  const [space, setSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const { toast } = useToast();

  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isCollaboratorDialogOpen, setIsCollaboratorDialogOpen] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [editingTitleColor, setEditingTitleColor] = useState('#000000');

  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [editingSubtitleValue, setEditingSubtitleValue] = useState('');
  const [editingSubtitleColor, setEditingSubtitleColor] = useState('#000000');

  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);

  // ── Collaborators ──
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const [members, setMembers] = useState<{ email: string; role: string; status: 'pending' | 'accepted' }[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string | null>(null);

  const spaceId = params.spaceId as string;

  // ── Space options menu: real actions ──────────────────────────────────
  const [isDownloadingSpace, setIsDownloadingSpace] = useState(false);
  // null = column not migrated yet (treated as ON, the default behaviour).
  const [questionsEnabled, setQuestionsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!spaceId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('questions_enabled')
        .eq('id', spaceId)
        .maybeSingle();
      if (!active || error) return; // pre-migration DB: leave null
      setQuestionsEnabled((data as { questions_enabled?: boolean } | null)?.questions_enabled !== false);
    })();
    return () => { active = false; };
  }, [spaceId]);

  const sanitizeName = (n: unknown) => String(n || 'file').replace(/[\\/:*?"<>|]/g, '_');

  const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // Download space: every file, zipped, preserving the folder structure.
  const handleDownloadSpace = async () => {
    if (isDownloadingSpace) return;
    setIsDownloadingSpace(true);
    toast({ title: 'Preparing download', description: 'Collecting the files. Large spaces can take a minute.' });
    try {
      const [{ data: files }, { data: folders }] = await Promise.all([
        supabase.from('files').select('id, name, storage_path, folder_id').eq('space_id', spaceId),
        supabase.from('folders').select('id, name, parent_id').eq('space_id', spaceId),
      ]);
      const fileRows = (files ?? []).filter((f) => f.storage_path);
      if (fileRows.length === 0) {
        toast({ title: 'Nothing to download', description: 'This space has no files yet.' });
        return;
      }
      const byId = new Map((folders ?? []).map((f) => [f.id as string, f]));
      const pathOf = (folderId: string | null): string => {
        const parts: string[] = [];
        let cur = folderId ? byId.get(folderId) : undefined;
        let guard = 0;
        while (cur && guard++ < 20) {
          parts.unshift(sanitizeName(cur.name));
          cur = cur.parent_id ? byId.get(cur.parent_id as string) : undefined;
        }
        return parts.length ? parts.join('/') + '/' : '';
      };
      const { data: signed } = await supabase.storage
        .from('documents')
        .createSignedUrls(fileRows.map((f) => f.storage_path as string), 3600);
      const urlByPath = new Map(
        (signed ?? []).filter((s) => s.signedUrl && s.path).map((s) => [s.path as string, s.signedUrl as string]),
      );
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let added = 0;
      for (const f of fileRows) {
        const url = urlByPath.get(f.storage_path as string);
        if (!url) continue;
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          zip.file(pathOf((f.folder_id as string | null) ?? null) + sanitizeName(f.name), await res.blob());
          added++;
        } catch { /* skip unfetchable file, keep the rest */ }
      }
      if (added === 0) {
        toast({ variant: 'destructive', title: 'Download failed', description: 'No files could be fetched.' });
        return;
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `space-${spaceId.slice(0, 8)}.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast({ title: 'Space downloaded', description: `${added} ${added === 1 ? 'file' : 'files'} zipped.` });
    } catch (e) {
      console.error('[download-space] failed:', e);
      toast({ variant: 'destructive', title: 'Download failed', description: 'Please try again.' });
    } finally {
      setIsDownloadingSpace(false);
    }
  };

  // Export visits: every viewer session of this space as a CSV.
  const handleExportVisits = async () => {
    const { data, error } = await supabase
      .from('viewer_sessions')
      .select('*')
      .eq('space_id', spaceId)
      .order('started_at', { ascending: false });
    if (error || !data || data.length === 0) {
      toast({ title: 'No visits yet', description: 'Visits appear here after someone opens the space.' });
      return;
    }
    const rows = (data as Array<Record<string, unknown>>).map((v) => [
      String(v.visitor_email ?? 'Anonymous'),
      String(v.device ?? ''),
      String(v.started_at ?? ''),
      String(v.last_heartbeat ?? v.ended_at ?? ''),
      String(v.total_seconds ?? v.duration_seconds ?? ''),
      String(v.current_file_name ?? ''),
    ]);
    downloadCsv(
      `visits-${spaceId.slice(0, 8)}.csv`,
      ['Visitor email', 'Device', 'Started at', 'Last active', 'Total seconds', 'Last file viewed'],
      rows,
    );
    toast({ title: 'Visits exported', description: `${data.length} ${data.length === 1 ? 'session' : 'sessions'} in the CSV.` });
  };

  // Download index: the space's structure (folders + files) as a CSV.
  const handleDownloadIndex = async () => {
    const [{ data: folders }, { data: files }] = await Promise.all([
      supabase.from('folders').select('id, name, parent_id, created_at').eq('space_id', spaceId),
      supabase.from('files').select('id, name, folder_id, type, created_at').eq('space_id', spaceId),
    ]);
    if ((folders ?? []).length === 0 && (files ?? []).length === 0) {
      toast({ title: 'Nothing to index', description: 'This space has no content yet.' });
      return;
    }
    const byId = new Map((folders ?? []).map((f) => [f.id as string, f]));
    const pathOf = (folderId: string | null): string => {
      const parts: string[] = [];
      let cur = folderId ? byId.get(folderId) : undefined;
      let guard = 0;
      while (cur && guard++ < 20) {
        parts.unshift(String(cur.name ?? ''));
        cur = cur.parent_id ? byId.get(cur.parent_id as string) : undefined;
      }
      return parts.join(' / ');
    };
    const rows: Array<Array<string | number>> = [];
    let i = 1;
    for (const f of folders ?? []) {
      rows.push([i++, 'Folder', String(f.name ?? ''), pathOf(f.parent_id as string | null), String(f.created_at ?? '')]);
    }
    for (const f of files ?? []) {
      rows.push([i++, String(f.type ?? 'File'), String(f.name ?? ''), pathOf(f.folder_id as string | null), String(f.created_at ?? '')]);
    }
    downloadCsv(`index-${spaceId.slice(0, 8)}.csv`, ['#', 'Type', 'Name', 'Location', 'Created'], rows);
    toast({ title: 'Index downloaded' });
  };

  // Toggle visitor questions for this space (needs the questions_enabled
  // column; the toast says which migration to run if it is missing).
  const handleToggleQuestions = async () => {
    const next = questionsEnabled === false;
    const { error } = await supabase.from('spaces').update({ questions_enabled: next }).eq('id', spaceId);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Could not update',
        description: 'Run sql/spaces_questions_toggle.sql in Supabase once, then try again.',
      });
      return;
    }
    setQuestionsEnabled(next);
    toast({ title: next ? 'Visitor questions turned on' : 'Visitor questions turned off' });
  };

  useEffect(() => {
    if (spaceId) {
      const foundSpace = findSpace(spaceId);
      if (foundSpace) {
        setSpace(foundSpace);
        setTitle(foundSpace.title);
        setEditingTitleValue(foundSpace.title);
        setSubtitle(foundSpace.description);
        setEditingSubtitleValue(foundSpace.description);
        setNewSpaceTitle(`${foundSpace.title} (Copy)`);
      }
    }
    setIsLoading(false);
  }, [spaceId, findSpace]);

  // ✅ FIXED: Uploads to Supabase storage and saves URL to database
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'coverImage' | 'logo'
  ) => {
    if (!event.target.files || event.target.files.length === 0 || !space) return;
    const file = event.target.files[0];
    setIsImageUploading(true);
    try {
      const bucket = imageType === 'coverImage' ? 'space-covers' : 'space-logos';
      const filePath = `${space.id}/${uuidv4()}.${file.name.split('.').pop()}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Could not get public URL');

      // Save URL to Supabase database
      const dbColumn = imageType === 'coverImage' ? 'cover_image' : 'logo';
      const { error: dbError } = await supabase
        .from('spaces')
        .update({ [dbColumn]: publicUrl })
        .eq('id', space.id);
      if (dbError) throw dbError;

      // Update local state so UI updates immediately
      updateSpace({ id: space.id, [imageType]: publicUrl });
      setSpace(prev => prev ? { ...prev, [imageType]: publicUrl } : prev);

      toast({ title: `${imageType === 'coverImage' ? 'Cover image' : 'Logo'} updated!` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsImageUploading(false);
      // Reset input so same file can be re-selected
      event.target.value = '';
    }
  };

  const handleDeleteSpace = async () => {
    if (!space) return;
    // Only claim success (and navigate away) when the database confirms.
    const res = await deleteSpace(space.id);
    setIsDeleteAlertOpen(false);
    if (!res.ok) {
      toast({
        variant: 'destructive',
        title: 'Could not delete the space',
        description: res.error ? `Reason: ${res.error}` : 'Something blocked the delete. Please try again.',
      });
      return;
    }
    toast({
      title: 'Space deleted',
      description: `The space "${space.title}" has been permanently deleted.`,
    });
    router.push('/spaces');
  };

  const handleDuplicateSpace = async () => {
    if (!space || !newSpaceTitle || isDuplicating) return;
    setIsDuplicating(true);
    try {
      // addSpace is async: without the await the route got a Promise and
      // navigated to /spaces/[object Promise]/edit ("Space not found").
      const newSpaceId = await addSpace({
        title: newSpaceTitle,
        description: space.description,
        files: space.files,
        isEnabled: space.isEnabled,
        coverImage: space.coverImage,
        logo: space.logo,
      });
      toast({ title: 'Space duplicated', description: `"${newSpaceTitle}" has been created.` });
      setIsDuplicateDialogOpen(false);
      router.push(`/spaces/${newSpaceId}/edit`);
    } catch (e) {
      console.error('[duplicate-space] failed:', e);
      toast({ variant: 'destructive', title: 'Could not duplicate', description: 'Please try again.' });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleTitleSave = () => {
    setTitle(editingTitleValue);
    if (space) updateSpace({ id: space.id, title: editingTitleValue });
    setIsEditingTitle(false);
  };

  const handleSubtitleSave = () => {
    setSubtitle(editingSubtitleValue);
    if (space) updateSpace({ id: space.id, description: editingSubtitleValue });
    setIsEditingSubtitle(false);
  };

  // ── Collaborators: load pending invites + accepted members for this owner ──
  const refreshMembers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: invs }, { data: mems }] = await Promise.all([
      supabase.from('space_invitations').select('invited_email, role, status').eq('workspace_owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('workspace_members').select('member_email, role').eq('workspace_owner_id', user.id),
    ]);
    const list: { email: string; role: string; status: 'pending' | 'accepted' }[] = [];
    const accepted = new Set<string>();
    for (const m of (mems ?? []) as Array<{ member_email: string; role: string }>) {
      list.push({ email: m.member_email, role: m.role, status: 'accepted' });
      accepted.add(String(m.member_email).toLowerCase());
    }
    for (const i of (invs ?? []) as Array<{ invited_email: string; role: string; status: string }>) {
      if (i.status !== 'accepted' && !accepted.has(String(i.invited_email).toLowerCase())) {
        list.push({ email: i.invited_email, role: i.role, status: 'pending' });
      }
    }
    setMembers(list);
  }, []);

  useEffect(() => { if (isCollaboratorDialogOpen) refreshMembers(); }, [isCollaboratorDialogOpen, refreshMembers]);

  // Load the owner's email + collaborators on mount so the stacked avatar
  // group next to the title is populated without opening the dialog.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserEmail(data.user?.email ?? null));
    refreshMembers();
  }, [refreshMembers]);

  // Owner + accepted members → the overlapping avatar stack by the title.
  const collaborators = useMemo(() => {
    const list: { email: string; isOwner: boolean }[] = [];
    if (currentUserEmail) list.push({ email: currentUserEmail, isOwner: true });
    for (const m of members) {
      if (m.status === 'accepted' && m.email.toLowerCase() !== (currentUserEmail ?? '').toLowerCase()) {
        list.push({ email: m.email, isOwner: false });
      }
    }
    return list;
  }, [currentUserEmail, members]);

  const handleInvite = async (resend = false, emailOverride?: string) => {
    const email = (emailOverride ?? inviteEmail).trim().toLowerCase();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({ variant: 'destructive', title: 'Enter a valid email address' });
      return;
    }
    setIsInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session expired. Please sign in again.');
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email, role: 'editor', resend }),
      });
      // Tolerate a non-JSON body so we never throw the raw "Internal Server Error".
      const json = await res.json().catch(() => ({ ok: false, error: 'bad_response' }));

      if (json.code === 'already_member') {
        toast({ title: 'Already a collaborator', description: `${email} is already in your workspace.` });
        return;
      }
      if (json.code === 'already_invited') {
        setResendEmail(email); // opens the "resend?" dialog
        return;
      }
      if (json.code === 'seat_limit') {
        setUpgradeMsg(
          `Your plan includes ${json.seats} member${json.seats === 1 ? '' : 's'}, and every seat is taken.`,
        );
        return;
      }
      if (!res.ok || !json.ok) throw new Error(json.detail || json.error || 'Could not send invitation.');

      toast({ title: resend ? 'Invitation resent' : 'Invitation sent', description: `We emailed an invite to ${email}.` });
      setInviteEmail('');
      setResendEmail(null);
      refreshMembers();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not send invite', description: e instanceof Error ? e.message : 'Please try again.' });
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!space) return <div>Space not found.</div>;

  const lastUpdatedDistance = formatDistanceToNow(new Date(space.lastUpdated), { addSuffix: true });
  const fonts = ['Default', 'Cursive', 'Fixed Width', 'Handwriting', 'HK Grotesk', 'Modern', 'Open Sans', 'Poppins', 'Sans-serif', 'Serif'];

  return (
    <>
      <div className="flex flex-col bg-muted/40 h-full">
        <header className="flex h-16 shrink-0 items-center border-b bg-card px-3 sm:px-6">
          {/* Hamburger (phones only) opens the space sidebar drawer - DocSend style */}
          <MobileSidebarToggle />
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {/* Search hides on phones - the icons alone already fill the bar */}
            <div className="relative hidden w-64 sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-9 bg-muted border-none h-9"
                value={spaceSearchQuery}
                onChange={(e) => setSpaceSearchQuery(e.target.value)}
              />
            </div>
            <WorkspaceSwitcher />
            <AccountManagerButton />
            <NotificationBell />
            <UserNav />
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">

              {/* Cover Image */}
              <div
                className="relative h-64 w-full bg-muted group/cover rounded-none cursor-pointer"
                onClick={() => !isImageUploading && coverImageInputRef.current?.click()}
              >
                {space.coverImage && (
                  <Image
                    src={space.coverImage}
                    layout="fill"
                    objectFit="cover"
                    alt="Space Cover Image"
                    data-ai-hint="abstract texture"
                    className="rounded-none"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="outline" className="bg-background/80 hover:bg-background" disabled={isImageUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isImageUploading ? 'Uploading...' : 'Change Cover'}
                  </Button>
                </div>
                <input
                  type="file"
                  ref={coverImageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'coverImage')}
                />
              </div>

              {/* Logo */}
              <div className="relative px-8">
                <div
                  className="absolute -top-16 left-8 z-10 h-32 w-32 bg-card flex items-center justify-center border-4 border-card group/logo rounded-md overflow-hidden cursor-pointer"
                  onClick={() => !isImageUploading && logoInputRef.current?.click()}
                >
                  {space.logo ? (
                    <Image src={space.logo} layout="fill" objectFit="cover" alt="Space Logo" />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="outline" size="sm" className="bg-background/80 hover:bg-background text-xs" disabled={isImageUploading}>
                      <Upload className="mr-1 h-3 w-3" /> Change
                    </Button>
                  </div>
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                </div>
              </div>

              <div className="w-full bg-card shadow-sm rounded-none">
                <div className="pt-20 pb-4 px-4 sm:px-8">
                  {/* Wraps on phones: Preview/Share drop below the title like DocSend */}
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="flex-1 space-y-2">
                      {isEditingTitle ? (
                        <Popover open={isEditingTitle} onOpenChange={setIsEditingTitle}>
                          <PopoverTrigger asChild>
                            <h1 className="text-2xl font-bold cursor-pointer" style={{ color: editingTitleColor }}>{title}</h1>
                          </PopoverTrigger>
                          <PopoverContent className="w-[360px] max-w-[calc(100vw-2rem)]">
                            <div className="space-y-4">
                              <Input value={editingTitleValue} onChange={(e) => setEditingTitleValue(e.target.value)} autoFocus />
                              <p className="text-sm font-medium">Customize title</p>
                              <div className="flex gap-2">
                                <Select defaultValue="default">
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Font" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fonts.map(font => <SelectItem key={font} value={font.toLowerCase()}>{font}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[80px]">
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: editingTitleColor }} />
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                      </div>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent>
                                    <ColorPicker color={editingTitleColor} onChange={setEditingTitleColor} />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
                                <Button onClick={handleTitleSave}>Save</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <h1 className="text-2xl font-bold cursor-pointer" style={{ color: editingTitleColor }} onClick={() => setIsEditingTitle(true)}>{title}</h1>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {isEditingSubtitle ? (
                          <Popover open={isEditingSubtitle} onOpenChange={setIsEditingSubtitle}>
                            <PopoverTrigger asChild>
                              <p className="cursor-pointer" style={{ color: editingSubtitleColor }}>{subtitle || 'Subtitle'}</p>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] max-w-[calc(100vw-2rem)]">
                              <div className="space-y-4">
                                <Input value={editingSubtitleValue} onChange={(e) => setEditingSubtitleValue(e.target.value)} autoFocus />
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" onClick={() => setIsEditingSubtitle(false)}>Cancel</Button>
                                  <Button onClick={handleSubtitleSave}>Save</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <p className="cursor-pointer" style={{ color: editingSubtitleColor }} onClick={() => setIsEditingSubtitle(true)}>
                            {subtitle || 'Subtitle'}
                          </p>
                        )}
                        <span>·</span>
                        <span>Last updated {lastUpdatedDistance}</span>
                        <Badge
                          variant={space.isEnabled ? 'default' : 'secondary'}
                          className={space.isEnabled ? 'bg-green-100 text-green-800 hover:bg-green-100/80' : 'bg-muted text-muted-foreground'}
                        >
                          Active
                        </Badge>
                      </div>

                      <div className="flex items-center mt-4">
                        <TooltipProvider>
                          <div className="flex items-center -space-x-2">
                            {collaborators.map((c) => (
                              <Tooltip key={c.email}>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-7 w-7 ring-2 ring-white cursor-default">
                                    <AvatarFallback className={cn('text-white text-xs', c.isOwner ? 'bg-blue-600' : 'bg-orange-500')}>
                                      {(c.email[0] ?? '?').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent><p>{c.email}{c.isOwner ? ' (owner)' : ''}</p></TooltipContent>
                              </Tooltip>
                            ))}
                            {/* Manage collaborators - sits attached to the end of the stack. */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="ml-2 h-7 w-7 rounded-full border border-dashed flex items-center justify-center hover:bg-green-100/50 hover:border-green-600 group"
                                  onClick={() => setIsCollaboratorDialogOpen(true)}
                                >
                                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Manage collaborators</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Space Options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[450px] max-w-[calc(100vw-2rem)] p-4">
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-1">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Manage space</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={handleDownloadSpace} disabled={isDownloadingSpace}>
                                  {isDownloadingSpace
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : <Download className="mr-2 h-4 w-4" />}
                                  <span>{isDownloadingSpace ? 'Preparing zip...' : 'Download space'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setIsDuplicateDialogOpen(true)}><CopyIcon className="mr-2 h-4 w-4" /><span>Duplicate space</span></DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Visitor Q&amp;A</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={handleToggleQuestions}>
                                  <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center">
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      <span>{questionsEnabled === false ? 'Turn on visitor questions' : 'Turn off visitor questions'}</span>
                                    </div>
                                    <Badge variant="outline" className={questionsEnabled === false ? 'text-muted-foreground' : 'border-green-200 text-green-700'}>
                                      {questionsEnabled === false ? 'OFF' : 'ON'}
                                    </Badge>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </div>
                            <div className="flex-1 space-y-1">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Insights and reporting</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={handleExportVisits}><BarChart2 className="mr-2 h-4 w-4" /><span>Export visits</span></DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleDownloadIndex}><Download className="mr-2 h-4 w-4" /><span>Download index</span></DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setIsAboutDialogOpen(true)}><Info className="mr-2 h-4 w-4" /><span>About this space</span></DropdownMenuItem>
                              </DropdownMenuGroup>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Preview - opens the public visitor view in a new tab,
                          so the owner sees the space exactly as a recipient
                          would (cover image, logo, gated files, watermark, etc).
                          ?preview=true is included so the visitor page can
                          optionally skip the gate flow for the owner's own
                          preview if it wants to in future. */}
                      <Button variant="outline" asChild>
                        <Link href={`/spaces/${spaceId}/view?preview=true`} target="_blank" rel="noopener noreferrer">
                          Preview
                        </Link>
                      </Button>
                      <Button onClick={() => setIsShareDialogOpen(true)}>Share</Button>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-8 sm:px-8">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.id} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight className="h-4 w-4" />}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm text-muted-foreground"
                          onClick={() => setBreadcrumbs(breadcrumbs.slice(0, index + 1))}
                        >
                          {crumb.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">{children}</div>
                </div>
              </div>
            </div>

            <footer className="w-full px-8 py-4 text-xs text-muted-foreground flex justify-between items-center border-t bg-background mt-auto">
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path></svg>
                <Link href="#">Legal</Link>
                <Link href="#">Cookies & CCPA preferences</Link>
                <Link href="#">Contact Us</Link>
              </div>
              <span>© {new Date().getFullYear()} VentureThrust</span>
            </footer>
          </main>
        </div>
      </div>

      {space && (
        <ShareSpaceDialog isOpen={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} space={space} />
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this space?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the space "{space.title}" and all of its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSpace} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCollaboratorDialogOpen} onOpenChange={setIsCollaboratorDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Collaborators</DialogTitle>
            <DialogDescription>Invite and manage who has access to this space.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-6 py-4">
            <div className="col-span-1 flex flex-col gap-4">
              <h3 className="font-semibold">Invite People</h3>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !isInviting) handleInvite(); }}
                    disabled={isInviting}
                  />
                  <Button onClick={() => handleInvite()} disabled={isInviting || !inviteEmail.trim()}>
                    {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">They&apos;ll get an email invitation. When they accept, they join your workspace and can see all your spaces.</p>
            </div>
            <div className="col-span-2">
              <h3 className="font-semibold mb-4">Existing Members</h3>
              <ScrollArea className="h-72">
                {members.length === 0 ? (
                  <div className="flex h-60 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <Users className="mb-2 h-8 w-8 opacity-40" />
                    <p>No collaborators yet.</p>
                    <p className="text-xs">Invite someone and they&apos;ll appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {members.map((member) => {
                      const initial = (member.email[0] ?? '?').toUpperCase();
                      return (
                        <div key={member.email} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-blue-600 text-white text-sm">{initial}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{member.email}</p>
                              <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          {member.status === 'pending' ? (
                            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
                              <Clock className="h-3 w-3" /> Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                              Joined
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Space</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p>Duplicating this Space will create a new Space with all of the content from this Space except:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Content in the Trash</li>
                  <li>Content you don&apos;t have access to</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-space-title">New Space Title</Label>
            <Input id="new-space-title" value={newSpaceTitle} onChange={(e) => setNewSpaceTitle(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)} disabled={isDuplicating}>Cancel</Button>
            <Button onClick={handleDuplicateSpace} disabled={isDuplicating}>
              {isDuplicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDuplicating ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend-invite confirmation (shown when the email already has a pending invite) */}
      <AlertDialog open={!!resendEmail} onOpenChange={(o) => { if (!o) setResendEmail(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invitation already sent</AlertDialogTitle>
            <AlertDialogDescription>
              An invitation to <strong>{resendEmail}</strong> is still pending. Do you want to resend it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResendEmail(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { const e = resendEmail; setResendEmail(null); if (e) handleInvite(true, e); }}
            >
              Resend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeDialog
        open={!!upgradeMsg}
        onOpenChange={(o) => { if (!o) setUpgradeMsg(null); }}
        title="Member limit reached"
        description={upgradeMsg ?? ''}
      />
    </>
  );
}