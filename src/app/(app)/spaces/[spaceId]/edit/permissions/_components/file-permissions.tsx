'use client';

/**
 * Per-FILE permissions panel (Phase 1 - authoring).
 *
 * Rendered by the permissions page when it is opened with `?itemId=<fileId>`.
 * Everything set here is scoped to that single file and saved to the
 * `file_permissions` table. It stacks on top of the space/link settings -
 * a file can only become MORE restricted, never less.
 *
 * Enforcement in the visitor viewer is Phase 2.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getEffectiveOwnerId } from '@/lib/workspace';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  ShieldCheck, FileText, Lock, Calendar as CalendarIcon, Clock, Download,
  Loader2, ArrowLeft, ExternalLink,
} from 'lucide-react';

type AgreementOption = { id: string; name: string };

const splitEmails = (s: string): string[] =>
  Array.from(new Set(
    s.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')),
  ));

function Row({ icon: Icon, title, desc, control, children }: {
  icon: React.ElementType; title: string; desc: string;
  control?: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <div className="py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </div>
        {control}
      </div>
      {children && <div className="mt-4 pl-12">{children}</div>}
    </div>
  );
}

export function FilePermissions({ spaceId, itemId }: { spaceId: string; itemId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState('this file');
  const [agreements, setAgreements] = useState<AgreementOption[]>([]);
  const ownerIdRef = useRef<string | null>(null);

  // Settings
  const [requireAgreement, setRequireAgreement] = useState(false);
  const [agreementFileId, setAgreementFileId] = useState<string | null>(null);
  const [watermarkOn, setWatermarkOn] = useState(false);
  const [watermarkText, setWatermarkText] = useState('{{email}}');
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkOpacity, setWatermarkOpacity] = useState('30');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [allowList, setAllowList] = useState('');
  const [blockList, setBlockList] = useState('');
  const [allowDownloading, setAllowDownloading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const ownerId = await getEffectiveOwnerId();
      ownerIdRef.current = ownerId;

      // File name (for the header)
      const { data: fileRow } = await supabase.from('files').select('name').eq('id', itemId).maybeSingle();
      if (!cancelled && fileRow?.name) setFileName(fileRow.name as string);

      // The owner's agreements = every file in their "Agreements" folder
      // (exactly what the Agreements page lists), regardless of placed fields.
      if (ownerId) {
        const { data: agrFolder } = await supabase
          .from('folders')
          .select('id')
          .eq('user_id', ownerId)
          .eq('name', 'Agreements')
          .is('parent_id', null)
          .limit(1)
          .maybeSingle();
        if (agrFolder?.id) {
          const { data: agr } = await supabase
            .from('files')
            .select('id, name')
            .eq('folder_id', agrFolder.id)
            .order('created_at', { ascending: false });
          if (!cancelled) {
            setAgreements((agr ?? []).map((r: any) => ({
              id: r.id as string,
              name: (r.name as string) ?? 'Untitled agreement',
            })));
          }
        } else if (!cancelled) {
          setAgreements([]);
        }
      }

      // Existing permissions for this file (table may not exist yet → ignore).
      const { data: perm, error } = await supabase
        .from('file_permissions')
        .select('*')
        .eq('file_id', itemId)
        .maybeSingle();
      if (!cancelled && perm && !error) {
        const p = perm as any;
        setRequireAgreement(!!p.require_agreement);
        setAgreementFileId(p.agreement_file_id ?? null);
        if (p.watermark_text) { setWatermarkOn(true); setWatermarkText(p.watermark_text); }
        if (p.watermark_position) setWatermarkPosition(p.watermark_position);
        if (p.watermark_opacity != null) setWatermarkOpacity(String(p.watermark_opacity));
        if (p.expires_at) { const d = new Date(p.expires_at); if (!isNaN(d.getTime())) setExpiresAt(d); }
        if (Array.isArray(p.allow_emails)) setAllowList(p.allow_emails.join('\n'));
        if (Array.isArray(p.block_emails)) setBlockList(p.block_emails.join('\n'));
        setAllowDownloading(p.allow_downloading !== false);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [itemId]);

  const handleSave = async () => {
    const ownerId = ownerIdRef.current ?? (await getEffectiveOwnerId());
    if (!ownerId) { toast({ variant: 'destructive', title: 'Not signed in' }); return; }
    if (requireAgreement && !agreementFileId) {
      toast({ variant: 'destructive', title: 'Pick an agreement', description: 'Choose which agreement viewers must sign, or turn the toggle off.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('file_permissions').upsert({
      file_id: itemId,
      space_id: spaceId,
      user_id: ownerId,
      require_agreement: requireAgreement,
      agreement_file_id: requireAgreement ? agreementFileId : null,
      watermark_text: watermarkOn ? watermarkText : null,
      watermark_position: watermarkPosition,
      watermark_opacity: Number(watermarkOpacity) || 30,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      allow_emails: splitEmails(allowList),
      block_emails: splitEmails(blockList),
      allow_downloading: allowDownloading,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'file_id' });
    setSaving(false);
    if (error) {
      console.error('[file_permissions] save failed:', error);
      toast({ variant: 'destructive', title: 'Save failed', description: error.message || 'Did you run the file_permissions migration?' });
      return;
    }
    toast({ title: 'File permissions saved', description: `Settings apply to "${fileName}" only.` });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="max-w-2xl pr-6">
        <Link href={`/spaces/${spaceId}/edit`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to space
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">File permissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These apply to <strong className="text-foreground">{fileName}</strong> only - on top of the space&apos;s settings.
          A file can only be made <em>more</em> restricted.
        </p>

        <div className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
          {/* Require agreement */}
          <Row
            icon={ShieldCheck}
            title="Require an agreement"
            desc="Viewers must e-sign an agreement before this file opens."
            control={<Switch checked={requireAgreement} onCheckedChange={setRequireAgreement} />}
          >
            {requireAgreement && (
              <div className="space-y-2.5">
                {agreements.length > 0 ? (
                  <Select value={agreementFileId ?? undefined} onValueChange={setAgreementFileId}>
                    <SelectTrigger><SelectValue placeholder="Select an agreement…" /></SelectTrigger>
                    <SelectContent>
                      {agreements.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">You don&apos;t have any agreements yet.</p>
                )}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Want to use a new agreement for this file? Go to the{' '}
                  <Link href="/agreements" className="font-medium text-foreground underline underline-offset-4 inline-flex items-center gap-1">
                    Agreements section <ExternalLink className="h-3 w-3" />
                  </Link>
                  , create the agreement there, then come back and select it here. Once selected, viewers must sign it before this file opens.
                </p>
              </div>
            )}
          </Row>

          {/* Watermark */}
          <Row
            icon={FileText}
            title="Watermark"
            desc="Overlay dynamic text (email, IP, date) across every page."
            control={<Switch checked={watermarkOn} onCheckedChange={setWatermarkOn} />}
          >
            {watermarkOn && (
              <div className="space-y-3">
                <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="{{email}}" />
                <div className="flex flex-wrap gap-2">
                  {['{{email}}', '{{ip-address}}', '{{date}}', '{{time}}'].map((t) => (
                    <Button key={t} type="button" variant="secondary" size="sm" className="text-xs"
                      onClick={() => setWatermarkText((p) => `${p} ${t}`.trim())}>{t}</Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Position</Label>
                    <Select value={watermarkPosition} onValueChange={setWatermarkPosition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom-right">Bottom right</SelectItem>
                        <SelectItem value="tiled">Tiled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Opacity</Label>
                    <Select value={watermarkOpacity} onValueChange={setWatermarkOpacity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </Row>

          {/* Allow / block */}
          <Row
            icon={Lock}
            title="Allowed / blocked viewers"
            desc="Restrict by email. Allow-list empty = anyone (except blocked)."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Allowed emails</Label>
                <Textarea value={allowList} onChange={(e) => setAllowList(e.target.value)} placeholder="one@email.com&#10;two@email.com" className="min-h-[88px] text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Blocked emails</Label>
                <Textarea value={blockList} onChange={(e) => setBlockList(e.target.value)} placeholder="spam@email.com" className="min-h-[88px] text-sm" />
              </div>
            </div>
          </Row>

          {/* Expiration */}
          <Row
            icon={CalendarIcon}
            title="Expiration"
            desc="Stop access to this file after a date & time."
            control={<Switch checked={!!expiresAt} onCheckedChange={(c) => setExpiresAt(c ? (() => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(23, 59, 0, 0); return d; })() : undefined)} />}
          >
            {expiresAt && (
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('justify-start text-left font-normal')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />{format(expiresAt, 'M/d/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={expiresAt}
                      onSelect={(d) => { if (!d) return; const m = new Date(d); m.setHours(expiresAt.getHours(), expiresAt.getMinutes(), 0, 0); setExpiresAt(m); }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                  </PopoverContent>
                </Popover>
                <div className="relative w-32">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input type="time" className="pl-8" value={format(expiresAt, 'HH:mm')}
                    onChange={(e) => { const [h, m] = e.target.value.split(':').map(Number); if (isNaN(h) || isNaN(m)) return; const d = new Date(expiresAt); d.setHours(h, m, 0, 0); setExpiresAt(d); }} />
                </div>
              </div>
            )}
          </Row>

          {/* Downloads */}
          <Row
            icon={Download}
            title="Allow downloading"
            desc="Let viewers download the original file."
            control={<Switch checked={allowDownloading} onCheckedChange={setAllowDownloading} />}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" asChild><Link href={`/spaces/${spaceId}/edit`}>Cancel</Link></Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gray-900 text-white hover:bg-gray-800">
            {saving ? 'Saving…' : 'Save file permissions'}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
