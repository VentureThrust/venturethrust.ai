// SAVE TO: src/components/share-space-dialog.tsx
// Full replacement of the existing file.

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import {
  FileLock, Link as LinkIcon, Copy, Lock, Mail,
  Calendar, Key, ShieldQuestion, Droplets, PenSquare,
  Clock, Loader2, CheckCircle2, ExternalLink, UserPlus, XCircle, Send,
} from 'lucide-react';
import { type Space } from '@/lib/spaces-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareSettings {
  linkName: string;
  requireEmail: boolean;
  expiration: { enabled: boolean; date?: Date };
  password: { enabled: boolean; value?: string };
  allowBlockList: { enabled: boolean; type?: 'allow' | 'block'; emails?: string[] };
  watermark: { enabled: boolean; text?: string; position?: string; rotation?: string; opacity?: string };
  requireSignature: boolean;
  requireNDA: boolean;
  ndaText?: string;
}

const DEFAULT_NDA_TEXT =
  'By accessing this data room, I agree to keep all documents and information contained within it strictly confidential, to use them solely for the purpose of evaluating a potential transaction, and not to share, copy, or distribute them to any third party without the owner\'s written consent.';

interface ShareSpaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  space: Space;
  onShareSettingsUpdate?: (settings: ShareSettings) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

// Hashing happens server-side via /api/share-links/hash-password because:
//   1. bcrypt isn't available in browsers (we use bcryptjs server-side)
//   2. The server can salt + use a strong adaptive algorithm (bcrypt cost 10)
//   3. We can rate-limit + auth-gate it so attackers can't compute hashes for free
// SHA-256 (the old approach) is fast and unsalted - trivially defeated by
// rainbow tables. bcrypt with per-hash salt makes that attack infeasible.
async function hashPasswordViaServer(plain: string): Promise<string | null> {
  try {
    // Forward the current Supabase session token so the API can verify auth
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;

    const res = await fetch('/api/share-links/hash-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: plain }),
    });
    if (!res.ok) return null;
    const { hash } = await res.json();
    return typeof hash === 'string' ? hash : null;
  } catch (err) {
    console.error('[share dialog] hash-password failed:', err);
    return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ControlButton = ({
  icon, title, subtitle, children,
}: {
  icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode;
}) => {
  const Icon = icon;
  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="flex items-start gap-4">
        <Icon className="h-6 w-6 text-muted-foreground mt-1" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShareSpaceDialog({
  isOpen, onOpenChange, space, onShareSettingsUpdate,
}: ShareSpaceDialogProps) {
  const { toast } = useToast();

  // Link state
  const [existingLinkId, setExistingLinkId] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [isFetchingLink, setIsFetchingLink] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const savedRef = useRef<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<ShareSettings>({
    linkName: space.name ?? space.title ?? 'Untitled Space',
    requireEmail: true,
    expiration: { enabled: false },
    password: { enabled: false },
    allowBlockList: { enabled: false, type: 'allow', emails: [] },
    watermark: { enabled: false, text: '{{email}}', position: 'center', rotation: 'diagonal', opacity: '50' },
    requireSignature: false,
    requireNDA: false,
    ndaText: DEFAULT_NDA_TEXT,
  });
  const [isNdaOpen, setIsNdaOpen] = useState(false);

  const [isWatermarkOpen, setIsWatermarkOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [emailsInput, setEmailsInput] = useState('');

  // ── Invite a VentureThrust user to this space ──────────────────────────────
  // Lighter than adding a workspace collaborator: it notifies an existing
  // VentureThrust user and drops the space into their "Shared with me". The
  // live check tells the owner whether the email has an account before sending.
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteExists, setInviteExists] = useState<'idle' | 'checking' | 'yes' | 'no' | 'self'>('idle');
  const [inviteSending, setInviteSending] = useState(false);

  useEffect(() => {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setInviteExists('idle'); return; }
    let cancelled = false;
    setInviteExists('checking');
    const t = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/users/exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
          body: JSON.stringify({ email }),
        });
        const json = await res.json().catch(() => ({ ok: false }));
        if (cancelled) return;
        if (!json.ok) { setInviteExists('idle'); return; }
        setInviteExists(json.isSelf ? 'self' : json.exists ? 'yes' : 'no');
      } catch { if (!cancelled) setInviteExists('idle'); }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [inviteEmail]);

  const handleSendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setInviteSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/spaces/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ spaceId: space.id, email, token }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!json.ok) {
        const msg = json.error === 'cannot_invite_self' ? 'You cannot invite yourself.'
          : json.error === 'forbidden' ? 'You can only invite people to your own space.'
          : json.error === 'invalid_email' ? 'That email looks invalid.'
          : 'Could not send the invite. Please try again.';
        toast({ variant: 'destructive', title: 'Invite failed', description: msg });
        return;
      }
      if (!json.hasAccount) {
        setInviteExists('no');
        toast({
          variant: 'destructive',
          title: 'No VentureThrust account',
          description: 'This invite is only for VentureThrust users. Use Copy link to share by email instead.',
        });
        return;
      }
      toast({ title: 'Invite sent', description: `${email} was notified. The data room is now in their Shared with me.` });
      setInviteEmail('');
      setInviteExists('idle');
    } catch {
      toast({ variant: 'destructive', title: 'Something went wrong', description: 'Please try again.' });
    } finally {
      setInviteSending(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────
  // Save stays dimmed until every toggled-on setting that needs a value has
  // one. `today` (local midnight) is the earliest selectable expiry so a
  // link can't be set to expire in the past (today itself is allowed).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Password is satisfied by a freshly-typed value OR an existing saved one.
  const needsPassword =
    settings.password.enabled && !passwordValue.trim() && !settings.password.value?.trim();
  const needsExpiryDate = settings.expiration.enabled && !expirationDate;
  const isIncomplete = needsPassword || needsExpiryDate;
  const incompleteHint = needsPassword
    ? 'Enter a password to continue.'
    : needsExpiryDate
      ? 'Pick an expiration date to continue.'
      : '';

  // ── Dirty tracking: dim "Copy link" until the settings are saved ───────
  // Any change to the savable settings marks the link "unsaved", so the copied
  // URL always reflects what is actually enforced. Cleared on load and on save.
  const stateKey = JSON.stringify({
    settings,
    passwordValue,
    expirationDate: expirationDate ? expirationDate.toISOString() : null,
    emailsInput,
  });
  useEffect(() => {
    if (isFetchingLink) return; // wait until the link has loaded
    if (savedRef.current === null) {
      savedRef.current = stateKey; // establish the saved baseline after load
      setDirty(false);
      return;
    }
    setDirty(stateKey !== savedRef.current);
  }, [stateKey, isFetchingLink]);

  // ── On open: load or prepare link ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setIsSaved(false);
    savedRef.current = null;
    setDirty(false);

    const loadExisting = async () => {
      setIsFetchingLink(true);

      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('space_id', space.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        // Populate from existing link - all fields, with graceful fallbacks
        // when newer columns don't exist yet.
        setExistingLinkId(data.id);
        setToken(data.token);

        const dbEmails: string[] = Array.isArray(data.allow_block_emails)
          ? data.allow_block_emails
          : [];

        setSettings(prev => ({
          ...prev,
          linkName: data.link_name ?? prev.linkName,
          requireEmail: data.email_required ?? true,
          password: { enabled: !!data.password_hash, value: undefined },
          expiration: {
            enabled: !!data.expires_at,
            date: data.expires_at ? new Date(data.expires_at) : undefined,
          },
          watermark: {
            enabled: data.watermark ?? false,
            text: data.watermark_text ?? prev.watermark.text,
            position: data.watermark_position ?? prev.watermark.position,
            opacity: data.watermark_opacity ?? prev.watermark.opacity,
            rotation: data.watermark_rotation ?? prev.watermark.rotation,
          },
          requireSignature: data.require_signature ?? false,
          requireNDA: data.require_nda ?? false,
          ndaText: data.nda_text ?? DEFAULT_NDA_TEXT,
          allowBlockList: {
            enabled: !!data.allow_block_type,
            type: (data.allow_block_type as 'allow' | 'block') ?? 'allow',
            emails: dbEmails,
          },
        }));
        if (data.expires_at) setExpirationDate(new Date(data.expires_at));
        setEmailsInput(dbEmails.join(', '));
      } else {
        // Fresh link - generate token now, save on click
        setExistingLinkId(null);
        setToken(generateToken());
        setEmailsInput('');
      }

      setIsFetchingLink(false);
    };

    loadExisting();
  }, [isOpen, space.id]);

  const fullLink =
    typeof window !== 'undefined' && token
      ? `${window.location.origin}/shared/${token}`
      : '';

  // ── Copy link ──────────────────────────────────────────────────────────────
  const copyLink = () => {
    if (!fullLink) return;
    navigator.clipboard.writeText(fullLink);
    toast({ title: 'Link copied!', description: 'Share this link with your recipients.' });
  };

  // ── Save / Upsert to Supabase ──────────────────────────────────────────────
  const handleSave = async () => {
    if (isIncomplete) return; // guard - button is also disabled
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Resolve password hash - server bcrypt, never SHA-256 client-side
      let passwordHash: string | null = null;
      if (settings.password.enabled) {
        const pw = passwordValue || settings.password.value;
        if (pw) {
          passwordHash = await hashPasswordViaServer(pw);
          if (!passwordHash) {
            toast({
              variant: 'destructive',
              title: 'Password could not be set',
              description: 'Could not hash the password securely. Please try again.',
            });
            setIsSaving(false);
            return;
          }
        } else if (existingLinkId) {
          // Keep existing hash - fetch it
          const { data } = await supabase
            .from('share_links')
            .select('password_hash')
            .eq('id', existingLinkId)
            .single();
          passwordHash = data?.password_hash ?? null;
        }
      }

      const expiryDate = settings.expiration.enabled ? expirationDate : undefined;

      // Parse emails from input (handles edits after open)
      const parsedEmails = emailsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const basePayload = {
        space_id: space.id,
        file_id: null,
        created_by: user.id,
        token,
        link_name: settings.linkName,
        email_required: settings.requireEmail,
        password_hash: passwordHash,
        expires_at: expiryDate ? expiryDate.toISOString() : null,
        watermark: settings.watermark.enabled,
        allow_download: true,
        is_active: true,
      };

      // Extended fields - only present if user has run the schema migration.
      // If columns don't exist yet, we retry below without them.
      const extendedPayload = {
        ...basePayload,
        require_signature: settings.requireSignature,
        require_nda: settings.requireNDA,
        nda_text: settings.requireNDA ? (settings.ndaText?.trim() || DEFAULT_NDA_TEXT) : null,
        allow_block_type: settings.allowBlockList.enabled ? settings.allowBlockList.type : null,
        allow_block_emails: settings.allowBlockList.enabled ? parsedEmails : null,
        watermark_text: settings.watermark.enabled ? settings.watermark.text : null,
        watermark_position: settings.watermark.enabled ? settings.watermark.position : null,
        watermark_opacity: settings.watermark.enabled ? settings.watermark.opacity : null,
        watermark_rotation: settings.watermark.enabled ? settings.watermark.rotation : null,
      };

      // Try full payload first; if extended columns are missing, retry with the
      // base payload only (and warn the user once).
      const writeWith = async (payload: typeof extendedPayload | typeof basePayload) => {
        if (existingLinkId) {
          return supabase.from('share_links').update(payload).eq('id', existingLinkId);
        } else {
          const res = await supabase.from('share_links').insert(payload).select().single();
          if (res.data && !res.error) setExistingLinkId(res.data.id);
          return res;
        }
      };

      let { error } = await writeWith(extendedPayload);
      if (error && (error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        console.warn('[share_links] some extended columns are missing - saving base fields only. Run the schema migration to enable all features.');
        ({ error } = await writeWith(basePayload));
        toast({
          title: 'Some settings could not be saved',
          description: 'Run the share_links migration SQL to enable Signature/NDA/Allow-Block/Watermark settings.',
        });
      }

      if (error) throw error;

      if (onShareSettingsUpdate) onShareSettingsUpdate(settings);

      setIsSaved(true);
      savedRef.current = stateKey; // current settings are now the saved baseline
      setDirty(false);
      toast({ title: 'Link saved!', description: 'Your secure share link is now active.' });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error saving link', description: err?.message ?? 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">Share "{space.name ?? space.title}"</DialogTitle>
          <DialogDescription>
            Create and manage secure links to your space. All enabled security features will be enforced when someone visits the link.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6">
          <div className="py-4 space-y-4">

            {/* Link name */}
            <div className="space-y-2">
              <Label htmlFor="link-name">Link name <span className="text-muted-foreground text-xs">(not visible to visitors)</span></Label>
              <Input
                id="link-name"
                value={settings.linkName}
                onChange={(e) => setSettings(prev => ({ ...prev, linkName: e.target.value }))}
              />
            </div>

            {/* Link row */}
            <div className="flex items-center gap-2">
              {isFetchingLink ? (
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Preparing link…</span>
                </div>
              ) : (
                <Input id="link" value={fullLink} readOnly className="bg-muted flex-1 font-mono text-sm" />
              )}
              <Button size="sm" className="shrink-0" onClick={copyLink} disabled={!fullLink || isFetchingLink || dirty}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </Button>
              <Button size="sm" variant="outline" className="shrink-0" asChild>
                <Link href={`/spaces/${space.id}/edit/permissions`}>
                  <PenSquare className="h-4 w-4 mr-2" />
                  Edit permissions
                </Link>
              </Button>
              {fullLink && (
                <Button size="sm" variant="ghost" className="shrink-0 px-2" asChild>
                  <a href={fullLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* Saved indicator */}
            {isSaved && !dirty && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                <CheckCircle2 className="h-4 w-4" />
                Link is live. Anyone with the link can now access the space (subject to your security settings below).
              </div>
            )}
            {dirty && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                You have unsaved changes. Click “Save Settings” below, then copy your link.
              </div>
            )}
          </div>

          {/* ─── Invite a VentureThrust user ───────────────────────────────
              Only for existing VentureThrust users: they get an in-app
              notification and the space shows up in their Shared with me. For
              non-users, the owner shares the link by email instead. */}
          <div className="rounded-lg border p-4 space-y-3 bg-blue-50/30 mb-2">
            <div className="flex items-start gap-3">
              <UserPlus className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">Invite a VentureThrust user</h3>
                <p className="text-xs text-muted-foreground">
                  Notify an existing VentureThrust user in-app. The space appears in their Shared with me.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSendInvite}
                disabled={inviteSending || inviteExists !== 'yes' || !existingLinkId || dirty}
                className="shrink-0"
              >
                {inviteSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Invite</>}
              </Button>
            </div>
            {(!existingLinkId || dirty) && (
              <p className="text-xs text-amber-600">Save your link first, then invite.</p>
            )}
            {inviteExists === 'checking' && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking VentureThrust…
              </p>
            )}
            {inviteExists === 'yes' && (
              <p className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" /> VentureThrust user found. They will be notified.
              </p>
            )}
            {inviteExists === 'self' && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600">
                <XCircle className="h-3 w-3" /> That is your own email.
              </p>
            )}
            {inviteExists === 'no' && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                <span>
                  This email does not have a VentureThrust account. This invite is only for VentureThrust
                  users. Use Copy link above to share it by email instead.
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="py-6 flex flex-col md:flex-row gap-6">

            {/* ─── Left: Security Settings ──────────────────────────────── */}
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-semibold">Security Settings</h3>

              {/* Require email */}
              <ControlButton icon={Mail} title="Require email" subtitle="Visitors must enter an email to view">
                <Switch
                  checked={settings.requireEmail}
                  onCheckedChange={(c) => setSettings(prev => ({ ...prev, requireEmail: c }))}
                />
              </ControlButton>

              {/* Expiration */}
              <ControlButton icon={Calendar} title="Expiration" subtitle="Disable link on a specific date">
                <div className="flex items-center gap-2">
                  {settings.expiration.enabled && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-xs">
                          <Clock className="h-3 w-3" />
                          {expirationDate ? expirationDate.toLocaleDateString() : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={expirationDate}
                          onSelect={setExpirationDate}
                          disabled={{ before: today }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <Switch
                    checked={settings.expiration.enabled}
                    onCheckedChange={(c) => {
                      setSettings(prev => ({ ...prev, expiration: { ...prev.expiration, enabled: c } }));
                      if (!c) setExpirationDate(undefined);
                    }}
                  />
                </div>
              </ControlButton>

              {/* Password */}
              <ControlButton icon={Key} title="Password" subtitle="Require a password to view">
                <div className="flex items-center gap-2">
                  {settings.password.enabled && (
                    <Input
                      type="password"
                      placeholder="Enter password"
                      className="w-36 h-8 text-sm"
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                    />
                  )}
                  <Switch
                    checked={settings.password.enabled}
                    onCheckedChange={(c) => {
                      setSettings(prev => ({ ...prev, password: { ...prev.password, enabled: c } }));
                      if (!c) setPasswordValue('');
                    }}
                  />
                </div>
              </ControlButton>

              {/* Allow/block list */}
              <ControlButton icon={Lock} title="Allow / block list" subtitle="Restrict access to specific emails">
                <div className="flex items-center gap-2">
                  {settings.allowBlockList.enabled && (
                    <Select
                      value={settings.allowBlockList.type}
                      onValueChange={(v: 'allow' | 'block') =>
                        setSettings(prev => ({ ...prev, allowBlockList: { ...prev.allowBlockList, type: v } }))
                      }
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="block">Block</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Switch
                    checked={settings.allowBlockList.enabled}
                    onCheckedChange={(c) =>
                      setSettings(prev => ({ ...prev, allowBlockList: { ...prev.allowBlockList, enabled: c } }))
                    }
                  />
                </div>
              </ControlButton>

              {/* Watermark - toggling ON automatically opens the settings popup */}
              <ControlButton icon={Droplets} title="Watermark" subtitle="Display visitor info on content">
                <div className="flex items-center gap-2">
                  {settings.watermark.enabled && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setIsWatermarkOpen(true)}>
                      Edit
                    </Button>
                  )}
                  <Switch
                    checked={settings.watermark.enabled}
                    onCheckedChange={(c) => {
                      setSettings(prev => ({ ...prev, watermark: { ...prev.watermark, enabled: c } }));
                      if (c) {
                        // Defer to next tick so the Switch's focus is released
                        // before the nested Dialog opens (prevents Radix aria-hidden conflict)
                        setTimeout(() => setIsWatermarkOpen(true), 0);
                      }
                    }}
                  />
                </div>
              </ControlButton>
            </div>

            {/* ─── Right: Advanced ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Advanced</h3>

              <ControlButton icon={PenSquare} title="Require Signature" subtitle="Visitors must sign their name to enter">
                <Switch
                  checked={settings.requireSignature}
                  onCheckedChange={(c) => setSettings(prev => ({ ...prev, requireSignature: c }))}
                />
              </ControlButton>

              <ControlButton icon={ShieldQuestion} title="Require NDA" subtitle="Visitors must accept an NDA before viewing">
                <div className="flex items-center gap-2">
                  {settings.requireNDA && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setIsNdaOpen(true)}>
                      Edit NDA
                    </Button>
                  )}
                  <Switch
                    checked={settings.requireNDA}
                    onCheckedChange={(c) => setSettings(prev => ({ ...prev, requireNDA: c }))}
                  />
                </div>
              </ControlButton>

              {/* Allow/block email list input */}
              {settings.allowBlockList.enabled && (
                <div className="p-4 border rounded-lg space-y-2">
                  <Label className="text-sm">
                    {settings.allowBlockList.type === 'allow' ? 'Allowed emails' : 'Blocked emails'}
                    <span className="text-muted-foreground font-normal ml-1">(comma separated)</span>
                  </Label>
                  <Input
                    placeholder="alice@company.com, bob@firm.com"
                    value={emailsInput}
                    onChange={(e) => {
                      setEmailsInput(e.target.value);
                      const emails = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                      setSettings(prev => ({
                        ...prev,
                        allowBlockList: { ...prev.allowBlockList, emails },
                      }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.allowBlockList.type === 'allow'
                      ? 'Only these emails can access the link.'
                      : 'These emails will be denied access.'}
                  </p>
                </div>
              )}

              {/* Security Summary card - always visible (watermark settings now in popup) */}
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border rounded-lg flex-grow">
                <FileLock className="h-10 w-10 mb-3 opacity-50" />
                <h4 className="font-semibold text-sm">Security Summary</h4>
                <div className="text-xs mt-2 space-y-1">
                  {settings.requireEmail && <span className="block">✓ Email required</span>}
                  {settings.password.enabled && <span className="block">✓ Password protected</span>}
                  {settings.expiration.enabled && <span className="block">✓ Expires {expirationDate?.toLocaleDateString() ?? '…'}</span>}
                  {settings.watermark.enabled && <span className="block">✓ Watermark: {settings.watermark.text}</span>}
                  {settings.allowBlockList.enabled && (
                    <span className="block">✓ {settings.allowBlockList.type === 'allow' ? 'Allow' : 'Block'} list - {settings.allowBlockList.emails?.length ?? 0} email(s)</span>
                  )}
                  {settings.requireSignature && <span className="block">✓ Signature required</span>}
                  {settings.requireNDA && <span className="block">✓ NDA required</span>}
                  {!settings.requireEmail && !settings.password.enabled && !settings.expiration.enabled && !settings.watermark.enabled && !settings.allowBlockList.enabled && !settings.requireSignature && !settings.requireNDA && (
                    <span className="block">No additional security enabled</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted sm:justify-between items-center gap-3">
          <p className="text-xs text-amber-600 min-h-[1rem] order-last sm:order-first">{incompleteHint}</p>
          <div className="flex items-center gap-3">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving || isFetchingLink || isIncomplete}>
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
            ) : (
              'Save Settings'
            )}
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* ═══ WATERMARK SETTINGS POPUP ═══════════════════════════════════════
          Opens automatically when the watermark toggle is turned ON, or via
          the "Edit" link next to the toggle. Visitor info (email, IP, date)
          gets substituted at view time via the {{var}} placeholders.
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={isWatermarkOpen}
        onOpenChange={(open) => {
          setIsWatermarkOpen(open);
          // If user closes the popup without entering any text, treat as cancel
          // and turn the watermark toggle back off (they didn't configure it).
          if (!open && !settings.watermark.text) {
            setSettings(prev => ({ ...prev, watermark: { ...prev.watermark, enabled: false } }));
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Watermark Settings
            </DialogTitle>
            <DialogDescription>
              Watermarks are dynamic - each visitor sees their own info (email, IP, date) overlaid on the content.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-1 flex-1 space-y-5 overflow-y-auto px-1 py-2">
            {/* Text input */}
            <div className="space-y-2">
              <Label htmlFor="watermark-text">Watermark text</Label>
              <Input
                id="watermark-text"
                value={settings.watermark.text}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, watermark: { ...prev.watermark, text: e.target.value } }))
                }
                placeholder="e.g. {{email}} - Confidential"
              />
              <p className="text-xs text-muted-foreground">
                Click a variable below to insert it. Variables are replaced with the visitor's actual info.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['{{email}}', '{{ip-address}}', '{{date}}', '{{time}}'].map(v => (
                  <Button
                    key={v}
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7"
                    onClick={() =>
                      setSettings(prev => ({
                        ...prev,
                        watermark: {
                          ...prev.watermark,
                          text: (prev.watermark.text ? prev.watermark.text + ' ' : '') + v,
                        },
                      }))
                    }
                  >
                    + {v}
                  </Button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={settings.watermark.position}
                onValueChange={(v) =>
                  setSettings(prev => ({ ...prev, watermark: { ...prev.watermark, position: v } }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right', 'tiled'].map(p => (
                    <SelectItem key={p} value={p}>
                      {p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label>Opacity</Label>
              <Select
                value={settings.watermark.opacity}
                onValueChange={(v) =>
                  setSettings(prev => ({ ...prev, watermark: { ...prev.watermark, opacity: v } }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100% - No transparency</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="15">15% - Subtle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label>Rotation</Label>
              <Select
                value={settings.watermark.rotation}
                onValueChange={(v) =>
                  setSettings(prev => ({ ...prev, watermark: { ...prev.watermark, rotation: v } }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (horizontal)</SelectItem>
                  <SelectItem value="diagonal">Diagonal (-45°)</SelectItem>
                  <SelectItem value="vertical">Vertical (-90°)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative h-24 rounded-md border bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <span
                  className="absolute font-semibold text-gray-700 select-none pointer-events-none whitespace-nowrap"
                  style={{
                    opacity: (parseInt(settings.watermark.opacity ?? '50', 10)) / 100,
                    transform: settings.watermark.rotation === 'diagonal'
                      ? 'rotate(-45deg)'
                      : settings.watermark.rotation === 'vertical'
                      ? 'rotate(-90deg)'
                      : 'none',
                    top: settings.watermark.position?.startsWith('top')
                      ? '8px'
                      : settings.watermark.position?.startsWith('bottom')
                      ? 'auto'
                      : '50%',
                    bottom: settings.watermark.position?.startsWith('bottom') ? '8px' : 'auto',
                    left: settings.watermark.position?.endsWith('left')
                      ? '8px'
                      : settings.watermark.position?.endsWith('right')
                      ? 'auto'
                      : '50%',
                    right: settings.watermark.position?.endsWith('right') ? '8px' : 'auto',
                    transformOrigin: 'center',
                    translate: settings.watermark.position === 'center' ||
                                settings.watermark.position === 'top-center' ||
                                settings.watermark.position === 'bottom-center'
                      ? '-50% -50%'
                      : '0 -50%',
                  }}
                >
                  {(settings.watermark.text ?? '')
                    .replace(/\{\{email\}\}/g, 'visitor@example.com')
                    .replace(/\{\{ip-address\}\}/g, '203.0.113.42')
                    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
                    .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString())}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWatermarkOpen(false);
                setSettings(prev => ({ ...prev, watermark: { ...prev.watermark, enabled: false } }));
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsWatermarkOpen(false)}
              disabled={!settings.watermark.text?.trim()}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ NDA TEXT EDITOR ════════════════════════════════════════════════
          Opens from the "Edit NDA" link. Visitors must read and accept this
          exact text (via the NDA gate in /shared/[token]) before they can view
          the space. Defaults to a sensible confidentiality undertaking.
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isNdaOpen} onOpenChange={setIsNdaOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldQuestion className="h-5 w-5 text-blue-500" />
              Non-disclosure agreement
            </DialogTitle>
            <DialogDescription>
              Visitors must read and accept this before they can open the space. Edit the wording to suit your deal.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1 py-2">
            <Label htmlFor="nda-text">NDA text</Label>
            <Textarea
              id="nda-text"
              rows={9}
              value={settings.ndaText ?? ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ndaText: e.target.value }))}
              placeholder={DEFAULT_NDA_TEXT}
              className="text-sm leading-relaxed"
            />
            <div className="flex justify-between">
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs text-muted-foreground"
                onClick={() => setSettings(prev => ({ ...prev, ndaText: DEFAULT_NDA_TEXT }))}
              >
                Reset to default
              </Button>
              <span className="text-xs text-muted-foreground">{(settings.ndaText ?? '').length} characters</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNdaOpen(false);
                setSettings(prev => ({ ...prev, requireNDA: false }));
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsNdaOpen(false)} disabled={!settings.ndaText?.trim()}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}