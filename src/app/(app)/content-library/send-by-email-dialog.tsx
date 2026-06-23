'use client';

/**
 * SendByEmailDialog - "Send to investors" for a deck (file).
 *
 * Paste a list of recipient emails plus a message. For each email we create a
 * dedicated share_links row (recipient_email set, email gate OFF) so the
 * recipient opens the deck DIRECTLY, with no email prompt, like a Google Drive
 * link, while every open is still attributed to that exact recipient. Then we
 * ask the server to email each recipient their personal link.
 *
 * Fully additive: this does not touch the existing gated "Create link" flow.
 */

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEXTAREA_CLASS =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function SendByEmailDialog({
  fileId,
  open,
  onOpenChange,
  onSent,
}: {
  fileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}) {
  const { toast } = useToast();
  const [emailsRaw, setEmailsRaw] = useState('');
  const [message, setMessage] = useState('');
  const [watermark, setWatermark] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emails = useMemo(() => {
    const set = new Set<string>();
    for (const part of emailsRaw.split(/[\s,;]+/)) {
      const e = part.trim().toLowerCase();
      if (e && EMAIL_RE.test(e)) set.add(e);
    }
    return Array.from(set);
  }, [emailsRaw]);

  const invalidCount = useMemo(() => {
    let n = 0;
    for (const part of emailsRaw.split(/[\s,;]+/)) {
      const e = part.trim();
      if (e && !EMAIL_RE.test(e.toLowerCase())) n++;
    }
    return n;
  }, [emailsRaw]);

  const reset = () => {
    setEmailsRaw('');
    setMessage('');
    setWatermark(true);
    setAllowDownload(false);
    setError(null);
  };

  const handleSend = async () => {
    if (sending || emails.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setError('Please sign in again.');
        setSending(false);
        return;
      }

      // Scope the recipient links to the user's Content Library space, exactly
      // like the gated "Create link" flow does.
      const { data: clSpace } = await supabase
        .from('spaces')
        .select('id')
        .eq('created_by', userId)
        .eq('title', 'CONTENT_LIBRARY')
        .maybeSingle();
      const spaceId = (clSpace?.id as string | undefined) ?? null;

      const newToken = () =>
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '')
          : `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const rows = emails.map((email) => ({
        space_id: spaceId,
        file_id: fileId,
        created_by: userId,
        token: newToken(),
        link_name: `Email to ${email}`,
        email_required: false,
        password_hash: null,
        expires_at: null,
        watermark,
        watermark_text: watermark ? '{{email}}' : null,
        allow_download: allowDownload,
        is_active: true,
        recipient_email: email,
        sent_message: message.trim() || null,
      }));

      const { data: inserted, error: insErr } = await supabase
        .from('share_links')
        .insert(rows)
        .select('id');

      if (insErr) {
        if (
          insErr.code === '42703' ||
          insErr.code === 'PGRST204' ||
          /column/i.test(insErr.message ?? '')
        ) {
          setError(
            'This feature needs a one-time database update. Run sql/share_links_send_by_email.sql in Supabase, then try again.',
          );
        } else {
          setError(`Could not create the links: ${insErr.message}`);
        }
        setSending(false);
        return;
      }

      const ids = (inserted ?? []).map((r) => (r as { id: string }).id);
      const res = await fetch('/api/share-links/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds: ids }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j.error === 'EMAIL_NOT_CONFIGURED') {
          setError('Email sending is not set up on the server yet. The links were created but not emailed.');
        } else {
          setError(j.error ? `Links created, but sending failed: ${j.error}` : 'Links created, but sending failed.');
        }
        onSent?.();
        setSending(false);
        return;
      }

      const n = (j.sent as number) ?? ids.length;
      toast({ title: `Sent to ${n} ${n === 1 ? 'investor' : 'investors'}` });
      onSent?.();
      reset();
      onOpenChange(false);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!sending) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Send to investors by email</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Investor emails</Label>
            <textarea
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              rows={4}
              placeholder="Paste emails, separated by commas, spaces, or new lines"
              className={TEXTAREA_CLASS}
            />
            <p className="text-xs text-muted-foreground">
              {emails.length} valid {emails.length === 1 ? 'email' : 'emails'}
              {invalidCount > 0 ? `, ${invalidCount} ignored` : ''}. Each investor gets their own private link that opens the deck directly, with no email prompt.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Message <span className="font-normal italic text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Hi, sharing our deck for your review."
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox id="sbe-watermark" checked={watermark} onCheckedChange={(c) => setWatermark(Boolean(c))} className="mt-0.5" />
            <label htmlFor="sbe-watermark" className="text-sm font-medium cursor-pointer">
              Stamp each investor&apos;s email as a watermark
            </label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="sbe-download" checked={allowDownload} onCheckedChange={(c) => setAllowDownload(Boolean(c))} className="mt-0.5" />
            <label htmlFor="sbe-download" className="text-sm font-medium cursor-pointer">
              Allow downloads
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <p className="text-xs text-amber-600 min-h-[1rem]">{error}</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending || emails.length === 0}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sending ? 'Sending...' : `Send${emails.length ? ` (${emails.length})` : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
