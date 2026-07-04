'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FileRequestsIllustration } from '@/components/illustrations';
import { ProductTour } from '@/components/product-tour';
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Clock,
  Copy,
  Link as LinkIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  Share2,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FolderSelectionDialog } from '@/components/folder-selection-dialog';
import { useLayout } from '../layout-context';
import { useFileRequests, type FileRequest } from '@/lib/file-requests-provider';
import { supabase } from '@/lib/supabaseClient';
export type { FileRequest };

function FileRequestsPageContent() {
  // Safe usage of useLayout with error handling
  let layoutContext;
  try {
    layoutContext = useLayout();
  } catch (error) {
    console.warn('Layout context not available, using fallback');
    layoutContext = { setFileRequestCount: () => {} };
  }
  
  const { setFileRequestCount } = layoutContext;
  const { fileRequests, setFileRequests, addFileRequest, updateFileRequest } = useFileRequests();
  // Latest requests in a ref so the count-poller reads current tokens without
  // re-subscribing on every list change.
  const fileRequestsRef = useRef(fileRequests);
  fileRequestsRef.current = fileRequests;
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);

  const updateFileRequestCount = useCallback(
    (requests: FileRequest[]) => {
      const totalFiles = requests.reduce((sum, req) => sum + req.files, 0);
      setFileRequestCount(totalFiles);
    },
    [setFileRequestCount]
  );

  useEffect(() => {
    setIsClient(true);
    updateFileRequestCount(fileRequests);
  }, [fileRequests, updateFileRequestCount]);

  const [editingRequest, setEditingRequest] = useState<FileRequest | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState('');
  const [passcode, setPasscode] = useState('');
  const [passcodeEnabled, setPasscodeEnabled] = useState(false);
  const [expiryTime, setExpiryTime] = useState('');
  const [uploadLocation, setUploadLocation] = useState<{ id: string; name: string, type: 'folder' | 'space' }>({ id: 'personal-root', name: 'My Content', type: 'folder' });

  const { toast } = useToast();

  useEffect(() => {
    if (!isClient) return;
    const folderId = searchParams.get('folder');
    const folderName = searchParams.get('folderName');
    if (folderId && folderName) {
      handleOpenSheet(null, { id: folderId, name: folderName, type: 'folder' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isClient]);

  // ── Live upload counts ───────────────────────────────────────────────────
  // Uploaders/files are written to the DB (file_request_uploads) by anonymous
  // uploaders on the public /request/[token] page - the local store never sees
  // them, so they'd otherwise stay 0. Poll the counts API and merge the real
  // numbers onto the displayed requests (matched by token). Only touches state
  // when a count actually changed, so there's no render / localStorage loop.
  useEffect(() => {
    let cancelled = false;
    const refreshCounts = async () => {
      const tokens = Array.from(new Set(
        fileRequestsRef.current.map((r) => r.link.split('/').pop() ?? '').filter(Boolean),
      ));
      if (tokens.length === 0) return;
      try {
        const res = await fetch('/api/file-requests/counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok || cancelled) return;
        const counts: Record<string, { files: number; uploaders: number }> = json.counts ?? {};
        setFileRequests((prev) => {
          let changed = false;
          const next = prev.map((req) => {
            const token = req.link.split('/').pop() ?? '';
            const c = counts[token];
            if (c && (c.files !== req.files || c.uploaders !== req.uploaders)) {
              changed = true;
              return { ...req, files: c.files, uploaders: c.uploaders };
            }
            return req;
          });
          return changed ? next : prev;
        });
      } catch {
        /* network hiccup - retry next tick */
      }
    };
    refreshCounts();
    const id = setInterval(refreshCounts, 12000);
    const onFocus = () => refreshCounts();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('focus', onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setDate(undefined);
    setAccount('');
    setPasscode('');
    setPasscodeEnabled(false);
    setExpiryTime('');
    setEditingRequest(null);
    setUploadLocation({ id: 'personal-root', name: 'My Content', type: 'folder' });
  };

  const handleOpenSheet = (
    request: FileRequest | null = null,
    folder?: { id: string; name: string, type: 'folder' | 'space' } | null
  ) => {
    if (request) {
      setEditingRequest(request);
      setTitle(request.title);
      setMessage(request.message);
      setDate(request.expiresAt ? new Date(request.expiresAt) : undefined);
      setUploadLocation(request.uploadLocation);
    } else if (folder) {
      resetForm();
      setUploadLocation(folder);
    } else {
      resetForm();
    }
    setIsSheetOpen(true);
  };

  const handleCreateOrUpdateRequest = async () => {
    if (!title) {
      toast({
        variant: 'destructive',
        title: 'Title is required',
        description: 'Please enter a title for your file request.',
      });
      return;
    }

    // Passcode toggled on but left empty - guard (button is also disabled).
    if (passcodeEnabled && !passcode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Passcode is required',
        description: 'Enter a passcode or turn off passcode protection.',
      });
      return;
    }

    // ── Persist to Supabase first (so the link works across browsers) ──
    let publicLink = '';
    let dbToken: string | null = null; // captured so the local store can use the SAME token
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to create a file request.');

      // Build a URL-safe random token for the public link
      const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const arr = new Uint8Array(20);
        crypto.getRandomValues(arr);
        return Array.from(arr, (b) => chars[b % chars.length]).join('');
      };

      // Combine date + time picked in the UI
      let expiresAtIso: string | null = null;
      if (date) {
        const merged = new Date(date);
        if (expiryTime) {
          const [hh, mm] = expiryTime.split(':').map((v) => Number(v));
          if (!Number.isNaN(hh) && !Number.isNaN(mm)) merged.setHours(hh, mm, 0, 0);
        }
        expiresAtIso = merged.toISOString();
      }

      if (editingRequest) {
        // Best-effort update of an existing DB row by matching token in link
        const tokenFromLink = editingRequest.link.split('/').pop() ?? '';
        await supabase
          .from('file_requests')
          .update({
            title,
            message,
            account_name: account || null,
            target_folder_id: uploadLocation.id,
            target_folder_name: uploadLocation.name,
            target_type: uploadLocation.type,
            target_space_id: uploadLocation.type === 'space' ? uploadLocation.id : null,
            expires_at: expiresAtIso,
          })
          .eq('token', tokenFromLink);
      } else {
        const token = generateToken();
        const { error: insErr } = await supabase.from('file_requests').insert({
          token,
          title,
          message,
          account_name: account || null,
          created_by: user.id,
          target_folder_id: uploadLocation.id,
          target_folder_name: uploadLocation.name,
          target_type: uploadLocation.type,
          target_space_id: uploadLocation.type === 'space' ? uploadLocation.id : null,
          expires_at: expiresAtIso,
          require_email: true,
          is_active: true,
        });
        if (insErr) {
          // Surface the real failure so the user knows the link won't work
          console.error('[file_requests] insert failed:', insErr);
          toast({
            variant: 'destructive',
            title: 'Could not save file request',
            description: insErr.message || 'Run the file_requests migration SQL and try again. The link will not work until this is resolved.',
          });
        } else {
          dbToken = token;
          publicLink = `${window.location.origin}/request/${token}`;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save the request.';
      toast({ variant: 'destructive', title: 'Save failed', description: msg });
    }

    // ── Mirror in the local provider so the table shows the row instantly ──
    if (editingRequest) {
      updateFileRequest({
        id: editingRequest.id,
        title,
        message,
        expiresAt: date,
        uploadLocation,
      });
      toast({ title: 'File request updated!', description: 'Your changes have been saved.' });
    } else {
      // CRITICAL: pass the DB-generated token's link so the local store row
      // matches the row in Supabase. Without this, the link the user later
      // copies from the file requests list wouldn't match any DB row → 404.
      const newRequest = addFileRequest({
        title,
        message,
        expiresAt: date,
        uploadLocation,
        link: dbToken ? `/request/${dbToken}` : undefined,
      });
      if (newRequest) {
        // Only open the link dialog if we have a working DB-backed link
        if (publicLink) {
          setGeneratedLink(publicLink);
          setIsLinkDialogOpen(true);
        } else {
          // DB save failed - don't show a broken link
          toast({
            variant: 'destructive',
            title: 'Link not generated',
            description: 'The file request was saved locally but the share link will not work. Please retry.',
          });
        }
      }
    }

    resetForm();
    setIsSheetOpen(false);
  };

  const handleDeleteRequest = (requestId: string) => {
    setFileRequests((prev) => prev.filter((req) => req.id !== requestId));
    toast({
      title: 'File request deleted.',
      description: 'The file request has been removed from your list.',
    });
  };

  const handleToggleEnable = (requestId: string) => {
    const request = fileRequests.find(r => r.id === requestId);
    if (request) {
        updateFileRequest({ id: requestId, isEnabled: !request.isEnabled });
        toast({
          title: !request.isEnabled ? 'Link Enabled' : 'Link Disabled',
          description: `The file request link has been ${
            !request.isEnabled ? 'enabled' : 'disabled'
          }.`,
        });
    }
  };

  const copyLinkToClipboard = (link: string) => {
    const fullLink =
      (typeof window !== 'undefined' ? window.location.origin : '') + link;
    navigator.clipboard.writeText(fullLink);
    toast({
      title: 'Copied to clipboard!',
      description: 'The link has been copied to your clipboard.',
    });
  };

  const handleSelectFolder = (folder: { id: string; name: string }) => {
    setUploadLocation({ ...folder, type: 'folder' });
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProductTour
        tourKey="tour-file-requests"
        steps={[
          {
            title: 'Collect files securely',
            description: 'Send a request link and people can upload documents straight into your data room, even without an account.',
          },
          {
            selector: '[data-tour="fr-create"]',
            title: 'Create a file request',
            description: 'Click here to create a request. Choose a destination folder, set an optional passcode or expiry, then share the link.',
          },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">File Requests</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Request files to Space</Button>
          <Sheet
            open={isSheetOpen}
            onOpenChange={(isOpen) => {
              setIsSheetOpen(isOpen);
              if (!isOpen) resetForm();
            }}
          >
            <SheetTrigger asChild>
              <Button data-tour="fr-create" onClick={() => handleOpenSheet()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create File Request
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl bg-white text-black p-0 flex flex-col">
              <SheetHeader className="px-6 pt-6 pb-4">
                <SheetTitle className="text-2xl font-bold">
                  {editingRequest ? 'Edit file request' : 'Create file request'}
                </SheetTitle>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="px-6 pb-6 space-y-5">
                  {/* ── Account ─────────────────────────────────────────── */}
                  <div className="space-y-2">
                    <Label htmlFor="account" className="font-semibold text-sm">
                      Account
                    </Label>
                    <Input
                      id="account"
                      placeholder="Enter a company name or other group you'd like to track"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground leading-snug">
                      Accounts can be used to group viewers by their organization or company. All viewer activity, across all documents, will be aggregated at the account level.
                    </p>
                  </div>

                  {/* ── Request title ───────────────────────────────────── */}
                  <div className="space-y-2">
                    <Label htmlFor="request-title" className="font-semibold text-sm">
                      Request title{' '}
                      <span className="font-normal text-muted-foreground">
                        (Visible to viewers)
                      </span>
                    </Label>
                    <Input
                      id="request-title"
                      placeholder="Explain what the request is for"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* ── Message ─────────────────────────────────────────── */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-semibold text-sm">
                      Message{' '}
                      <span className="font-normal text-muted-foreground">
                        (Optional; visible to viewers)
                      </span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Add any extra details about the request"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={200}
                      className="min-h-[88px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/200
                    </p>
                  </div>

                  {/* ── Folder for uploaded files ───────────────────────── */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">
                      Folder for uploaded files
                    </Label>
                    <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
                      <p className={cn(
                        'text-sm',
                        uploadLocation.id ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {uploadLocation.id ? uploadLocation.name : 'None Selected'}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => setIsFolderSelectorOpen(true)}
                      >
                        Select folder...
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Received files will be added to this folder in your content library
                    </p>
                  </div>

                  {/* ── Require email - always on, visually locked ──────── */}
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox id="require-email" checked disabled />
                    <Label htmlFor="require-email" className="font-normal text-sm text-muted-foreground cursor-not-allowed">
                      Require email to access
                    </Label>
                  </div>

                  {/* ── Expires ─────────────────────────────────────────── */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="expires"
                      className="mt-2"
                      checked={!!date}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const d = new Date();
                          d.setDate(d.getDate() + 7); // default to 7 days out
                          setDate(d);
                          setExpiryTime(format(d, 'HH:mm'));
                        } else {
                          setDate(undefined);
                          setExpiryTime('');
                        }
                      }}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <Label htmlFor="expires" className="font-normal text-sm w-20">
                        Expires
                      </Label>
                      <div className="flex gap-2 flex-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'flex-1 justify-start text-left font-normal',
                                !date && 'text-muted-foreground'
                              )}
                              disabled={!date}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, 'M/d/yyyy') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={(d) => {
                                setDate(d);
                                if (d) setExpiryTime(format(d, 'HH:mm'));
                              }}
                              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="relative w-28">
                          <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            type="time"
                            className="pl-8 pr-2"
                            disabled={!date}
                            value={expiryTime}
                            onChange={(e) => setExpiryTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Passcode ────────────────────────────────────────── */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="passcode"
                      className="mt-2"
                      checked={passcodeEnabled}
                      onCheckedChange={(checked) => {
                        setPasscodeEnabled(Boolean(checked));
                        if (!checked) setPasscode('');
                      }}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <Label htmlFor="passcode" className="font-normal text-sm w-20">
                        Passcode
                      </Label>
                      <Input
                        id="passcode-input"
                        type="text"
                        className="flex-1"
                        placeholder="Set a passcode"
                        disabled={!passcodeEnabled}
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* ── Footer: Cancel + Create ─────────────────────────────── */}
              <SheetFooter className="px-6 py-4 border-t mt-auto flex flex-row items-center justify-between gap-2 sm:gap-2">
                <p className="text-xs text-amber-600 min-h-[1rem]">
                  {!title.trim()
                    ? 'Enter a title to continue.'
                    : passcodeEnabled && !passcode.trim()
                      ? 'Set a passcode to continue.'
                      : ''}
                </p>
                <div className="flex flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSheetOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrUpdateRequest}
                  disabled={!title.trim() || (passcodeEnabled && !passcode.trim())}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  {editingRequest ? 'Save changes' : 'Create file request'}
                </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <FolderSelectionDialog
        open={isFolderSelectorOpen}
        onOpenChange={setIsFolderSelectorOpen}
        onSelectFolder={handleSelectFolder}
      />

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              File request created
            </DialogTitle>
            <DialogDescription>
              Anyone with the link can upload to this file request.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" defaultValue={generatedLink} readOnly />
            </div>
            <Button
              type="submit"
              size="sm"
              className="px-3"
              onClick={() => navigator.clipboard.writeText(generatedLink)}
            >
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsLinkDialogOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight">My Requests</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your active and past file requests.</p>
        </div>
        <div className="border-t border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>REQUEST NAME</TableHead>
                <TableHead>UPLOAD LOCATION</TableHead>
                <TableHead className="text-center">UPLOADERS</TableHead>
                <TableHead className="text-center">FILES</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fileRequests.length > 0 ? (
                fileRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={request.isEnabled ? request.link : '#'}
                        target="_blank"
                        className={cn(
                          'hover:underline',
                          !request.isEnabled &&
                            'cursor-not-allowed text-muted-foreground'
                        )}
                        onClick={(e) => {
                          if (!request.isEnabled) e.preventDefault();
                        }}
                      >
                        {request.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/content-library?folderId=${request.uploadLocation.id}`} className="hover:underline">
                        {request.uploadLocation.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {request.uploaders}
                    </TableCell>
                    <TableCell className="text-center">
                      {request.files}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={request.isEnabled}
                          onCheckedChange={() => handleToggleEnable(request.id)}
                          aria-label="Toggle link"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLinkToClipboard(request.link)}
                          disabled={!request.isEnabled}
                        >
                          <Share2 className="mr-2 h-3 w-3" />
                          Share
                        </Button>
                        {/* modal={false}: stops the menu from adding its own
                            body scroll-lock / aria-hidden, which otherwise
                            collides with the Sheet opened from "Edit" and
                            leaves the whole page frozen (pointer-events:none
                            + aria-hidden stuck on the app wrapper). */}
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                // Defer so the menu fully closes (and restores
                                // focus) BEFORE the Sheet mounts - prevents the
                                // Radix focus-lock collision that freezes the page.
                                setTimeout(() => handleOpenSheet(request), 0);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit file
                              request
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-96 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-44">
                        <FileRequestsIllustration />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        No file requests yet
                      </h2>
                      <p>
                        Create a file request to securely receive documents from anyone, even if they don&apos;t have an account.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function FileRequestsPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <FileRequestsPageContent />
    </Suspense>
  );
}

export default FileRequestsPageWithSuspense;