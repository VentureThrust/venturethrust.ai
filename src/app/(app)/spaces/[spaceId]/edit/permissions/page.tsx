//src\app\(app)\spaces\[spaceId]\edit\permissions\page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FilePermissions } from './_components/file-permissions';
import { useSpaces } from '@/lib/spaces-provider';
import type { Space } from '@/lib/spaces-provider';
import { supabase } from '@/lib/supabaseClient';
import {
  PlusCircle,
  Copy,
  MoreHorizontal,
  Lock,
  FileText,
  Mail,
  Calendar as CalendarIcon,
  Key,
  X,
  ShieldCheck,
  Clock,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { getFileType } from '@/lib/data';


const readFileAsDataURL = (file: globalThis.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


const SecurityOptionCard = ({
  icon,
  title,
  status,
  children,
  popoverContent,
  popoverOpen,
  onPopoverOpenChange
}: {
  icon: React.ElementType;
  title: string;
  status: string;
  children?: React.ReactNode;
  popoverContent?: React.ReactNode;
  popoverOpen?: boolean;
  onPopoverOpenChange?: (open: boolean) => void;
}) => {
  const Icon = icon;
  
  const content = (
      <Card
        className={cn(
            // rounded-md (~10px) instead of rounded-lg (~13px) for sharper,
            // more "fintech" feel per user feedback.
            "flex flex-col items-start gap-2 p-4 rounded-md transition-colors",
            popoverOpen ? "bg-accent border-primary" : "hover:bg-accent cursor-pointer"
        )}
        >
        <Icon className="h-6 w-6 text-muted-foreground" />
        <div className="flex flex-col">
            <span className="font-semibold">{title}</span>
            <span className="text-sm text-muted-foreground">{status}</span>
        </div>
        {children}
        </Card>
  );

  if (popoverContent) {
    return (
        <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
            <PopoverTrigger asChild>{content}</PopoverTrigger>
            {/* Popover positioning:
                - side="bottom" anchors below the card (the natural reading flow)
                - align="center" centres on the trigger
                - sideOffset gives a small gap so the arrow shadow doesn't kiss the card
                - collisionPadding tells Radix to keep ≥16px from any viewport edge,
                  auto-flipping to top / shifting horizontally as needed. Fixes the
                  rightmost card (Expiration) where the popover was clipping the screen. */}
            <PopoverContent
              className="w-80 max-w-[calc(100vw-2rem)] rounded-md"
              side="bottom"
              align="center"
              sideOffset={8}
              collisionPadding={16}
            >
                {popoverContent}
            </PopoverContent>
      </Popover>
    )
  }

  return content;
};


export default function SpacePermissionsPage() {
  // Per-FILE mode when opened from a file's "Edit permissions" (?itemId=<fileId>);
  // otherwise the space-level permissions below.
  const params = useParams();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');
  if (itemId) {
    return <FilePermissions spaceId={params.spaceId as string} itemId={itemId} />;
  }
  return <SpacePermissionsInner />;
}

function SpacePermissionsInner() {
  const params = useParams();
  const { findSpace, updateSpace } = useSpaces();
  const [space, setSpace] = useState<Space | null>(null);
  const [linkName, setLinkName] = useState('');
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  
  const [activePopover, setActivePopover] = useState<string | null>(null);
  
  // State for each setting
  const [requireEmail, setRequireEmail] = useState(true);
  const [verifyEmail, setVerifyEmail] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);

  const [expirationDate, setExpirationDate] = useState<Date | undefined>();

  const [password, setPassword] = useState('');
  
  // Watermark state
  const [isWatermarkOn, setIsWatermarkOn] = useState(false);
  const [watermarkText, setWatermarkText] = useState('{{ip-address}}');
  const [watermarkPosition, setWatermarkPosition] = useState('top-left');
  const [watermarkRotation, setWatermarkRotation] = useState('none');
  const [watermarkOpacity, setWatermarkOpacity] = useState('100');
  
  // NDA State
  const [requireNda, setRequireNda] = useState(false);
  const [ndaFile, setNdaFile] = useState<{name: string, url: string} | null>(null);
  const ndaInputRef = useRef<HTMLInputElement>(null);

  const spaceId = params.spaceId as string;
  const linkId = params.linkId as string;
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (spaceId) {
      const foundSpace = findSpace(spaceId);
      if (foundSpace) {
        setSpace(foundSpace);
        setLinkName("My Company's Example Account"); // Default value

        // Initialize state from space properties
        setRequireNda(foundSpace.nda?.required ?? false);
        setNdaFile(foundSpace.nda?.fileUrl ? { name: foundSpace.nda.fileName ?? 'agreement.pdf', url: foundSpace.nda.fileUrl } : null);
      }

      // Hydrate watermark + expiration from the DB. The in-memory Space
      // type doesn't carry these columns yet, so we read them directly.
      supabase
        .from('spaces')
        .select('watermark_text, expires_at')
        .eq('id', spaceId)
        .single()
        .then(({ data }) => {
          const row = data as { watermark_text?: string | null; expires_at?: string | null } | null;
          const wmText = row?.watermark_text;
          if (wmText && wmText.trim()) {
            setIsWatermarkOn(true);
            setWatermarkText(wmText);
          }
          if (row?.expires_at) {
            const d = new Date(row.expires_at);
            if (!isNaN(d.getTime())) setExpirationDate(d);
          }
        });
    }
  }, [spaceId, findSpace]);
  
  const handleNdaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF file for the agreement.',
        });
        return;
      }
      const fileUrl = await readFileAsDataURL(file);
      setNdaFile({ name: file.name, url: fileUrl });
      toast({ title: 'Agreement uploaded', description: file.name });
    }
  };


  const copyLink = () => {
    if (!space) return;
     const fullLink =
    typeof window !== 'undefined' ? `${window.location.origin}/space/${space.id}/${space.id}` : '';
    navigator.clipboard.writeText(fullLink);
    toast({
      title: 'Link copied!',
      description: 'The space link has been copied to your clipboard.',
    });
  };
  
  const addWatermarkVariable = (variable: string) => {
    setWatermarkText(prev => `${prev} ${variable}`);
  };
  
  const handleSaveWatermark = async () => {
    if (!space) {
      toast({ variant: 'destructive', title: 'Could not save watermark. Space not loaded.' });
      return;
    }
    // Persist the raw template (tokens unresolved) to the spaces table.
    // When the toggle is off, store NULL so the visitor view skips the
    // overlay entirely. The visitor's space view reads `watermark_text`
    // and replaces tokens at render time.
    const { error } = await supabase
      .from('spaces')
      .update({ watermark_text: isWatermarkOn ? watermarkText : null })
      .eq('id', space.id);
    if (error) {
      console.warn('[watermark] save failed:', error);
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
      return;
    }
    toast({ title: 'Watermark settings saved.' });
    setActivePopover(null);
  };

  const handleSave = async () => {
    if (!space) return;

    updateSpace({
        id: space.id,
        nda: {
            required: requireNda,
            fileName: ndaFile?.name,
            fileUrl: ndaFile?.url,
        }
    });

    // Persist expiration directly - the in-memory Space type doesn't
    // include `expires_at` so updateSpace can't carry it. Null = no
    // expiration. ISO 8601 string is what Postgres timestamp expects.
    const { error: expError } = await supabase
      .from('spaces')
      .update({ expires_at: expirationDate ? expirationDate.toISOString() : null })
      .eq('id', space.id);
    if (expError) {
      console.warn('[expiration] save failed:', expError);
      toast({ variant: 'destructive', title: 'Could not save expiration', description: expError.message });
      return;
    }

    toast({
        title: "Permissions saved",
        description: "Your link permissions have been updated."
    });
  }


  if (!isClient || !space) {
    return <div>Loading permissions...</div>;
  }
  
  const fullLink = `docsend.com/view/s/kdgk3tj6kbfzxj7h`; // This is a placeholder


  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="flex flex-col gap-6 pr-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
                 <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create new link
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Link name (not visible to visitors)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Input value={linkName} onChange={(e) => setLinkName(e.target.value)} />
                     <div className="flex w-full items-center space-x-2 sm:w-auto sm:shrink-0">
                        <Input
                        id="link"
                        value={fullLink}
                        readOnly
                        className="bg-muted min-w-0 flex-1 sm:w-96 sm:flex-none"
                        />
                        <Button size="sm" variant="outline" className="px-3" onClick={copyLink}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy link
                        </Button>
                         <DropdownMenu>
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
                                <DropdownMenuItem>
                                    Link Settings
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <SecurityOptionCard 
                    icon={Lock} 
                    title="Allow/block list" 
                    status="Off" 
                    popoverOpen={activePopover === 'allow-block'}
                    onPopoverOpenChange={(open) => setActivePopover(open ? 'allow-block' : null)}
                    popoverContent={
                        <div className="space-y-4">
                            <h4 className="font-semibold">Allow/Block List</h4>
                            <p className="text-sm text-muted-foreground">This feature is not yet available.</p>
                            <div className="flex justify-end">
                                <Button onClick={() => setActivePopover(null)}>Done</Button>
                            </div>
                        </div>
                    }
                />
                <SecurityOptionCard 
                    icon={FileText} 
                    title="Watermark" 
                    status={isWatermarkOn ? "On" : "Off"}
                    popoverOpen={activePopover === 'watermark'}
                    onPopoverOpenChange={(open) => setActivePopover(open ? 'watermark' : null)}
                    popoverContent={
                         <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Watermark</h4>
                                <div className="flex items-center space-x-2">
                                    <Switch id="watermark-enabled" checked={isWatermarkOn} onCheckedChange={setIsWatermarkOn} />
                                    <Label htmlFor="watermark-enabled">{isWatermarkOn ? "On" : "Off"}</Label>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActivePopover(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This watermark is dynamic. The text will change based on each visitor's information
                            </p>
                            <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} disabled={!isWatermarkOn} />
                            <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" size="sm" className="text-xs" onClick={() => addWatermarkVariable('{{email}}')} disabled={!isWatermarkOn}>{`{{email}}`}</Button>
                                <Button variant="secondary" size="sm" className="text-xs" onClick={() => addWatermarkVariable('{{ip-address}}')} disabled={!isWatermarkOn}>{`{{ip-address}}`}</Button>
                                <Button variant="secondary" size="sm" className="text-xs" onClick={() => addWatermarkVariable('{{date}}')} disabled={!isWatermarkOn}>{`{{date}}`}</Button>
                                <Button variant="secondary" size="sm" className="text-xs" onClick={() => addWatermarkVariable('{{time}}')} disabled={!isWatermarkOn}>{`{{time}}`}</Button>
                            </div>
                            <h5 className="font-semibold text-sm pt-2">Edit Watermark</h5>
                            <div className="space-y-2">
                                <Label>Position</Label>
                                 <Select value={watermarkPosition} onValueChange={setWatermarkPosition} disabled={!isWatermarkOn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top-left">Top Left</SelectItem>
                                        <SelectItem value="top-center">Top Center</SelectItem>
                                        <SelectItem value="top-right">Top Right</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                        <SelectItem value="bottom-center">Bottom Center</SelectItem>
                                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Rotation</Label>
                                 <Select value={watermarkRotation} onValueChange={setWatermarkRotation} disabled={!isWatermarkOn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Do not rotate</SelectItem>
                                        <SelectItem value="diagonal">Diagonal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Opacity</Label>
                                 <Select value={watermarkOpacity} onValueChange={setWatermarkOpacity} disabled={!isWatermarkOn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="100">No transparency</SelectItem>
                                        <SelectItem value="50">50%</SelectItem>
                                        <SelectItem value="25">25%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="flex justify-end gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setActivePopover(null)}>Cancel</Button>
                                <Button onClick={handleSaveWatermark}>Save</Button>
                             </div>
                        </div>
                    }
                />
                 <SecurityOptionCard
                  icon={ShieldCheck}
                  title="Require NDA"
                  status={requireNda ? 'On' : 'Off'}
                  popoverOpen={activePopover === 'nda'}
                  onPopoverOpenChange={(open) => setActivePopover(open ? 'nda' : null)}
                  popoverContent={
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Require NDA</h4>
                        <Switch id="nda-enabled" checked={requireNda} onCheckedChange={setRequireNda} />
                      </div>
                      <p className="text-sm text-muted-foreground">Visitors must agree to a non-disclosure agreement before viewing.</p>
                      
                      <div className="space-y-2">
                        <Label>Agreement Document (PDF)</Label>
                        <Input
                          type="file"
                          ref={ndaInputRef}
                          className="hidden"
                          accept=".pdf"
                          onChange={handleNdaUpload}
                        />
                        {ndaFile ? (
                          <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                            <span className="truncate">{ndaFile.name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNdaFile(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" className="w-full" onClick={() => ndaInputRef.current?.click()} disabled={!requireNda}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Agreement
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">or</div>
                      <Button variant="link" className="w-full h-auto p-0 text-sm" disabled={!requireNda}>Use a template</Button>
                      <Button variant="link" className="w-full h-auto p-0 text-sm" disabled={!requireNda}>Download template</Button>

                      <div className="flex justify-end">
                        <Button onClick={() => setActivePopover(null)}>Done</Button>
                      </div>
                    </div>
                  }
                />
                 <SecurityOptionCard 
                    icon={Mail} 
                    title="Require email" 
                    status={requireEmail ? "On" : "Off"} 
                    popoverOpen={activePopover === 'email'}
                    onPopoverOpenChange={(open) => setActivePopover(open ? 'email' : null)}
                    popoverContent={
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold">Require email</h4>
                                <Switch checked={requireEmail} onCheckedChange={setRequireEmail} />
                            </div>
                            <p className="text-sm text-muted-foreground">Visitors must enter an email to view.</p>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="verify-email" checked={verifyEmail} onCheckedChange={(checked) => setVerifyEmail(Boolean(checked))} disabled={!requireEmail} />
                                <Label htmlFor="verify-email">Verify email with a one-time code</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="allow-downloads" checked={allowDownloads} onCheckedChange={(checked) => setAllowDownloads(Boolean(checked))} disabled={!requireEmail} />
                                <Label htmlFor="allow-downloads">Allow downloading</Label>
                            </div>
                             <div className="flex justify-end">
                                <Button onClick={() => setActivePopover(null)}>Done</Button>
                            </div>
                        </div>
                    }
                />
                <SecurityOptionCard 
                    icon={CalendarIcon} 
                    title="Expiration" 
                    status={expirationDate ? format(expirationDate, 'MMM d') : "Off"}
                    popoverOpen={activePopover === 'expiration'}
                    onPopoverOpenChange={(open) => setActivePopover(open ? 'expiration' : null)}
                    popoverContent={
                        <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <h4 className="font-semibold">Expiration</h4>
                                <Switch checked={!!expirationDate} onCheckedChange={(checked) => setExpirationDate(checked ? new Date() : undefined)} />
                            </div>
                            <p className="text-sm text-muted-foreground">Set a date and time to disable the link.</p>
                             <Calendar
                                mode="single"
                                selected={expirationDate}
                                onSelect={(d) => {
                                  // Picking a date keeps the previously-selected
                                  // time-of-day if any, otherwise defaults to
                                  // end-of-day (23:59) - the most permissive
                                  // expiration interpretation.
                                  if (!d) return setExpirationDate(undefined);
                                  const merged = new Date(d);
                                  if (expirationDate) {
                                    merged.setHours(expirationDate.getHours(), expirationDate.getMinutes(), 0, 0);
                                  } else {
                                    merged.setHours(23, 59, 0, 0);
                                  }
                                  setExpirationDate(merged);
                                }}
                                disabled={!expirationDate}
                                className="rounded-md border"
                              />
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="time"
                                  className="pl-9"
                                  disabled={!expirationDate}
                                  value={expirationDate ? format(expirationDate, 'HH:mm') : ''}
                                  onChange={(e) => {
                                    // Merge the new HH:mm into the existing date.
                                    if (!expirationDate || !e.target.value) return;
                                    const [hours, minutes] = e.target.value.split(':').map(Number);
                                    if (isNaN(hours) || isNaN(minutes)) return;
                                    const merged = new Date(expirationDate);
                                    merged.setHours(hours, minutes, 0, 0);
                                    setExpirationDate(merged);
                                  }}
                                />
                              </div>
                            <div className="flex justify-end">
                                <Button onClick={() => setActivePopover(null)}>Done</Button>
                            </div>
                        </div>
                    }
                />
                <SecurityOptionCard 
                    icon={Key} 
                    title="Password" 
                    status={password ? "On" : "Off"}
                    popoverOpen={activePopover === 'password'}
                    onPopoverOpenChange={(open) => setActivePopover(open ? 'password' : null)}
                    popoverContent={
                        <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <h4 className="font-semibold">Password</h4>
                                <Switch checked={!!password} onCheckedChange={(checked) => setPassword(checked ? password || '' : '')} />
                            </div>
                            <p className="text-sm text-muted-foreground">Require a password to view the link.</p>
                            <Input
                                type="text"
                                placeholder="Enter a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={!password}
                            />
                            <div className="flex justify-end">
                                <Button onClick={() => setActivePopover(null)}>Done</Button>
                            </div>
                        </div>
                    }
                />
            </div>
            
            <div className="flex justify-end gap-2 mt-auto">
                <Button variant="ghost">Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
            </div>
        </div>
    </ScrollArea>
  );
}