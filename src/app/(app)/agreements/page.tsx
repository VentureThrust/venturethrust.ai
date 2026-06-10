
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileLock, Upload, MoreHorizontal, Eye, Edit, Trash2, Replace, FileSignature, ChevronDown, FileText, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useMemo, useState } from 'react';
import { useFolders, type File } from '@/lib/folder-provider';
import { supabase } from '@/lib/supabaseClient';
import { getFileType } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AGREEMENT_TEMPLATES, buildTemplateFile, type AgreementTemplate } from '@/lib/agreement-templates';
import { AgreementsIllustration } from '@/components/illustrations';
import { ProductTour } from '@/components/product-tour';
import SignatureCanvas from 'react-signature-canvas';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
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


const FileViewer = dynamic(
  () => import('@/components/file-viewer').then((mod) => mod.FileViewer),
  { ssr: false }
);


const readFileAsDataURL = (file: globalThis.File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export default function AgreementsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { folders, addFilesToFolder, updateFile, deleteFile, ensureAgreementsFolder } = useFolders();
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const [renamingFile, setRenamingFile] = useState<File | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingFile, setDeletingFile] = useState<File | null>(null);

  // "Use template" picker dialog + which template is currently being generated.
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  // Disclosing-Party signature step (shown after picking a template).
  const [signTemplate, setSignTemplate] = useState<AgreementTemplate | null>(null);
  const [signMode, setSignMode] = useState<'type' | 'draw'>('type');
  const [typedSig, setTypedSig] = useState('');
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Agreements live inside a real folder named "Agreements" in the user's
  // Content Library space. List them by reading that folder's files
  // directly (was previously filtering by `id.startsWith('agreement_')`,
  // which broke when we moved to UUID-based ids for proper DB persistence).
  const agreements = useMemo(() => {
    const folder = folders.find(f => f.name === 'Agreements' && f.type === 'personal');
    return folder?.files ?? [];
  }, [folders]);

  // Shared persistence flow used by both manual upload and "Use template":
  // get/create the Agreements folder, upload the PDF to Storage, register the
  // file row, then open it in the editor. Throws on failure (caller toasts).
  // `agreementFields` lets templates pre-place signature fields on the doc.
  const uploadAgreementFileAndEdit = async (
    pdfFile: globalThis.File,
    agreementFields: File['agreementFields'] = [],
  ) => {
    // 1. Get/create the user's Agreements folder (real DB row, real UUID).
    const agreementsFolderId = await ensureAgreementsFolder();
    if (!agreementsFolderId) {
      throw new Error('Could not initialise Agreements folder. Please sign in again.');
    }

    // 2. Upload the PDF to Supabase Storage. Path is namespaced by user so
    //    multiple users don't collide; UUID prefix on the filename keeps two
    //    uploads of "NDA.pdf" from overwriting each other.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');
    const fileId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `agr-${Date.now()}`;
    const storagePath = `${user.id}/agreements/${fileId}-${pdfFile.name}`;
    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, pdfFile, { upsert: false, contentType: 'application/pdf' });
    if (uploadErr) throw uploadErr;

    // 3. Generate a signed URL for in-app preview. Long expiry (1 week) is
    //    fine because the URL itself isn't published to recipients - they get
    //    a share link, which has its own resolver.
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    // 4. Insert the file row + register it in the in-memory folder tree so the
    //    editor can find it via findDocument(fileId).
    const newFile: File = {
      id: fileId,
      name: pdfFile.name,
      type: getFileType(pdfFile) as File['type'],
      createdAt: new Date().toISOString(),
      views: 0,
      storagePath,
      contentUrl: signed?.signedUrl,
      agreementFields,
    };
    await addFilesToFolder(agreementsFolderId, [newFile]);

    // 5. Navigate to the editor. The editor reads from useFolders() so the
    //    file is immediately available.
    router.push(`/agreements/edit?fileId=${fileId}`);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    // Reset the input so the same file can be selected again later.
    event.target.value = '';

    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PDF file for agreements.',
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadAgreementFileAndEdit(file);
    } catch (err) {
      console.error('[agreements] upload failed:', err);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Templates ──────────────────────────────────────────────────────────
  // "Use template": generate a sample agreement PDF from standard boilerplate,
  // persist it like an upload, and open it in the editor to customise + place
  // signature fields.
  const handleSelectTemplate = async (
    template: AgreementTemplate,
    signature?: { type: 'typed' | 'drawn'; value: string },
  ) => {
    setGeneratingId(template.id);
    try {
      // Pre-fill the Disclosing Party with the owner's name + signature so the
      // recipient sees who is disclosing - they only sign the Receiving Party.
      const { data: { user } } = await supabase.auth.getUser();
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const discloserName =
        (typeof meta.full_name === 'string' && meta.full_name.trim()) ? meta.full_name.trim()
        : (typeof meta.name === 'string' && meta.name.trim()) ? meta.name.trim()
        : (user?.email ? user.email.split('@')[0] : '');
      const { file: pdfFile, fields } = await buildTemplateFile(template, {
        discloser: { name: discloserName, signature },
      });
      await uploadAgreementFileAndEdit(pdfFile, fields);
      setSignTemplate(null);
      setTemplatePickerOpen(false);
    } catch (err) {
      console.error('[agreements] template generation failed:', err);
      toast({
        variant: 'destructive',
        title: 'Could not create template',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setGeneratingId(null);
    }
  };

  // Capture the owner's signature (typed or drawn), then generate the agreement.
  const handleConfirmSignature = async () => {
    if (!signTemplate) return;
    let signature: { type: 'typed' | 'drawn'; value: string } | undefined;
    if (signMode === 'draw') {
      const canvas = sigCanvasRef.current;
      if (canvas && !canvas.isEmpty()) {
        signature = { type: 'drawn', value: canvas.toDataURL('image/png') };
      }
    } else if (typedSig.trim()) {
      signature = { type: 'typed', value: typedSig.trim() };
    }
    await handleSelectTemplate(signTemplate, signature);
  };

  // "Download template": build the PDF and save it to the visitor's machine
  // without persisting it - handy for editing offline in Word/Acrobat.
  const handleDownloadTemplate = async (template: AgreementTemplate) => {
    setDownloadingId(template.id);
    try {
      const { file: pdfFile } = await buildTemplateFile(template);
      const url = URL.createObjectURL(pdfFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFile.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({
        title: 'Template downloaded',
        description: `"${template.label}" was saved to your downloads.`,
      });
    } catch (err) {
      console.error('[agreements] template download failed:', err);
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setDownloadingId(null);
    }
  };
  
  const handlePreviewFile = (file: File) => {
    setViewingFile(file);
    setIsFileViewerOpen(true);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleRenameClick = (file: File) => {
    setRenamingFile(file);
    setNewName(file.name);
  };

  const handleRenameSave = () => {
    if (!renamingFile || !newName.trim()) return;

    updateFile(renamingFile.id, { name: newName.trim() });
    
    toast({
        title: "Agreement Renamed",
        description: `"${renamingFile.name}" was renamed to "${newName.trim()}".`
    });
    setRenamingFile(null);
    setNewName('');
  };

  const handleDeleteClick = (file: File) => {
    setDeletingFile(file);
  };

  const handleDeleteConfirm = () => {
    if (!deletingFile) return;
    // Find the real Agreements folder UUID so deleteFile can locate the
    // file in the in-memory tree (was hardcoded to 'personal-root' which
    // never matched any real folder).
    const agreementsFolder = folders.find(
      f => f.name === 'Agreements' && f.type === 'personal',
    );
    if (!agreementsFolder) {
      toast({ variant: 'destructive', title: 'Could not locate Agreements folder.' });
      return;
    }
    deleteFile(agreementsFolder.id, deletingFile.id);

    toast({
        title: "Agreement Archived",
        description: `"${deletingFile.name}" has been moved to the trash.`
    });
    setDeletingFile(null);
  };


  const handleViewSignatures = (file: File) => {
    router.push(`/content-library?fileId=${file.id}`);
  };

  return (
    <>
    <div className="flex flex-col gap-6">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="application/pdf"
      />
      <ProductTour
        tourKey="tour-agreements"
        steps={[
          {
            title: 'Gate content with signatures',
            description: 'Upload or generate an NDA (or any agreement) that viewers must sign before they can open your documents.',
          },
          {
            selector: '[data-tour="agreements-upload"]',
            title: 'Add an agreement',
            description: 'Upload your own document or start from a ready-made template, then place signature fields.',
          },
        ]}
      />
      {/* ─── Header: title left, Upload dropdown right ───────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Agreements</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" data-tour="agreements-upload">
              Upload
              <ChevronDown className="ml-1.5 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={triggerFileUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload agreement
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTemplatePickerOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Use template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadTemplate(AGREEMENT_TEMPLATES[0])}>
              <Download className="mr-2 h-4 w-4" />
              Download template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {agreements.length > 0 ? (
        <section>
            <div className="mb-5">
                <h2 className="text-xl font-semibold tracking-tight">My Agreements</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your signable documents.</p>
            </div>
            <div className="border-t border-gray-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>NAME</TableHead>
                            <TableHead className="text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agreements.map(agreement => (
                            <TableRow key={agreement.id}>
                                <TableCell className="font-medium">{agreement.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleViewSignatures(agreement)}>View signatures</Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handlePreviewFile(agreement)}>
                                                <Eye className="mr-2 h-4 w-4" /> Preview
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleViewSignatures(agreement)}>
                                                <FileSignature className="mr-2 h-4 w-4" /> View Signatures
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onClick={triggerFileUpload}>
                                                <Replace className="mr-2 h-4 w-4" /> Replace with new upload
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRenameClick(agreement)}>
                                                <Edit className="mr-2 h-4 w-4" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(agreement)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Archive
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
      ) : (
        // ─── Empty state - DocSend-style centered text + 3 action buttons ──
        <div className="flex flex-1 items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-2xl text-center px-6">
            <div className="mx-auto mb-6 w-44">
              <AgreementsIllustration />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              Need to protect sensitive content?
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Set up a legally-binding agreement that viewers must sign before
              accessing your content. You can upload an NDA or any other gating
              document. Want to learn more? Visit our{' '}
              <Link href="#" className="text-blue-600 hover:underline font-medium">
                Help page
              </Link>
              .
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={triggerFileUpload}
                className="border-gray-300"
              >
                Upload agreement
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setTemplatePickerOpen(true)}
                className="border-gray-300"
              >
                Use template
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleDownloadTemplate(AGREEMENT_TEMPLATES[0])}
                disabled={downloadingId === AGREEMENT_TEMPLATES[0].id}
                className="border-gray-300"
              >
                {downloadingId === AGREEMENT_TEMPLATES[0].id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
                ) : (
                  'Download template'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    <FileViewer
        file={viewingFile}
        open={isFileViewerOpen}
        onOpenChange={setIsFileViewerOpen}
      />
    {/* ─── Template picker ─────────────────────────────────────────────── */}
    <Dialog
      open={templatePickerOpen}
      onOpenChange={(o) => { if (!generatingId) setTemplatePickerOpen(o); }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start from a template</DialogTitle>
          <DialogDescription>
            Pick a ready-made agreement to customise. We&apos;ll open it in the
            editor so you can edit the text and place signature fields.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          {AGREEMENT_TEMPLATES.map((tpl) => {
            const isGenerating = generatingId === tpl.id;
            const isDownloading = downloadingId === tpl.id;
            const busy = !!generatingId || !!downloadingId;
            return (
              <div
                key={tpl.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:border-gray-400"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{tpl.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tpl.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setTemplatePickerOpen(false);
                        setTypedSig('');
                        setSignMode('type');
                        setSignTemplate(tpl);
                      }}
                      disabled={busy}
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      {isGenerating ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                      ) : (
                        'Use template'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadTemplate(tpl)}
                      disabled={busy}
                    >
                      {isDownloading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
                      ) : (
                        <><Download className="mr-2 h-4 w-4" /> Download</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Bracketed values like <span className="font-medium">[Party A Name]</span> and{' '}
          <span className="font-medium">[State]</span> are placeholders, replace them with
          your details. These are starting templates, not legal advice.
        </p>
      </DialogContent>
    </Dialog>

    {/* ── Disclosing-Party signature step (after picking a template) ── */}
    <Dialog open={!!signTemplate} onOpenChange={(o) => { if (!generatingId && !o) setSignTemplate(null); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign as the Disclosing Party</DialogTitle>
          <DialogDescription>
            You&apos;re the disclosing party. Sign once, your name and today&apos;s date are filled in
            automatically. The recipient signs the Receiving Party section when they open the file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="inline-flex rounded-md border p-0.5">
            <Button type="button" size="sm" variant={signMode === 'type' ? 'default' : 'ghost'} className="h-8" onClick={() => setSignMode('type')}>Type</Button>
            <Button type="button" size="sm" variant={signMode === 'draw' ? 'default' : 'ghost'} className="h-8" onClick={() => setSignMode('draw')}>Draw</Button>
          </div>
          {signMode === 'type' ? (
            <div className="space-y-2">
              <Input value={typedSig} onChange={(e) => setTypedSig(e.target.value)} placeholder="Type your full name" autoFocus />
              {typedSig.trim() && (
                <div className="rounded-md border bg-gray-50 px-3 py-3 text-3xl italic text-gray-800">{typedSig}</div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border bg-white">
              <SignatureCanvas ref={sigCanvasRef} penColor="#111827" canvasProps={{ className: 'w-full h-40 touch-none' }} />
              <div className="flex justify-end border-t p-1.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => sigCanvasRef.current?.clear()}>Clear</Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setSignTemplate(null)} disabled={!!generatingId}>Cancel</Button>
          <Button onClick={handleConfirmSignature} disabled={!!generatingId} className="bg-gray-900 text-white hover:bg-gray-800">
            {generatingId ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>) : 'Create agreement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!renamingFile} onOpenChange={(isOpen) => !isOpen && setRenamingFile(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Agreement</DialogTitle>
                <DialogDescription>
                    Enter a new name for &quot;{renamingFile?.name}&quot;.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="new-name">New name</Label>
                <Input
                    id="new-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSave()}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setRenamingFile(null)}>Cancel</Button>
                <Button onClick={handleRenameSave}>Save</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <AlertDialog open={!!deletingFile} onOpenChange={(isOpen) => !isOpen && setDeletingFile(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to archive this agreement?</AlertDialogTitle>
            <AlertDialogDescription>
                This will move &quot;{deletingFile?.name}&quot; to the trash. This action can be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                Archive
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
