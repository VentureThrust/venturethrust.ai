'use client';

/**
 * SendByEmailDialog - "Send to investors" for a deck (file) OR a space.
 *
 * Paste (or bulk-import from Excel/CSV) a list of recipient emails plus a
 * message. For each email we create a dedicated share_links row
 * (recipient_email set, email gate OFF) so the recipient opens the deck or
 * space DIRECTLY, with no email prompt, like a Google Drive link, while every
 * open is still attributed to that exact recipient. Then the server emails
 * each recipient their personal link.
 *
 * Modes (pass exactly one):
 *   fileId  - single content-library deck; link renders just that file.
 *   spaceId - a whole space; link opens the space view with no email gate,
 *             and the space's own watermark/permission settings apply.
 *
 * Fully additive: the existing gated "Create link" / "Share space" flows are
 * untouched.
 */

import { useMemo, useRef, useState } from 'react';
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
import { Loader2, Send, Upload } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 200;
const TEXTAREA_CLASS =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** Pull every email address out of arbitrary text (CSV cells, lines, etc.). */
function extractEmails(text: string): string[] {
  const found = text.match(/[^\s,;<>"']+@[^\s,;<>"']+\.[^\s,;<>"']+/g) ?? [];
  return found.map((e) => e.trim().toLowerCase()).filter((e) => EMAIL_RE.test(e));
}

export function SendByEmailDialog({
  fileId,
  spaceId,
  open,
  onOpenChange,
  onSent,
}: {
  fileId?: string;
  spaceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}) {
  const { toast } = useToast();
  const isSpace = !!spaceId && !fileId;
  const [emailsRaw, setEmailsRaw] = useState('');
  const [message, setMessage] = useState('');
  const [watermark, setWatermark] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const emails = useMemo(() => {
    const set = new Set<string>(extractEmails(emailsRaw));
    return Array.from(set).slice(0, MAX_RECIPIENTS);
  }, [emailsRaw]);

  const reset = () => {
    setEmailsRaw('');
    setMessage('');
    setWatermark(true);
    setAllowDownload(false);
    setError(null);
  };

  // ── Bulk import: .xlsx / .xls / .csv / .txt ──────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setImporting(true);
    setError(null);
    try {
      let text = '';
      if (/\.(xlsx|xls)$/i.test(f.name)) {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
        for (const sheetName of wb.SheetNames) {
          text += '\n' + XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
        }
      } else {
        text = await f.text();
      }
      const found = extractEmails(text);
      if (found.length === 0) {
        setError('No email addresses found in that file.');
      } else {
        setEmailsRaw((prev) => (prev.trim() ? prev.trim() + '\n' : '') + found.join('\n'));
        toast({ title: `Imported ${found.length} ${found.length === 1 ? 'email' : 'emails'}` });
      }
    } catch {
      setError('Could not read that file. Use .xlsx, .csv, or .txt.');
    } finally {
      setImporting(false);
    }
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

      // File links are scoped to the user's Content Library space (same as the
      // gated Create link flow); space links use the real space id directly.
      let linkSpaceId: string | null = spaceId ?? null;
      if (!isSpace) {
        const { data: clSpace } = await supabase
          .from('spaces')
          .select('id')
          .eq('created_by', userId)
          .eq('title', 'CONTENT_LIBRARY')
          .maybeSingle();
        linkSpaceId = (clSpace?.id as string | undefined) ?? null;
      }

      const newToken = () =>
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '')
          : `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const rows = emails.map((email) => ({
        space_id: linkSpaceId,
        file_id: fileId ?? null,
        created_by: userId,
        token: newToken(),
        link_name: `Email to ${email}`,
        email_required: false,
        password_hash: null,
        expires_at: null,
        watermark: isSpace ? false : watermark,
        watermark_text: !isSpace && watermark ? '{{email}}' : null,
        allow_download: isSpace ? false : allowDownload,
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
          <DialogTitle className="text-xl font-semibold">
            {isSpace ? 'Send this space to investors' : 'Send to investors by email'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Investor emails</Label>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={importing}
                onClick={() => importInputRef.current?.click()}
              >
                {importing
                  ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                Import Excel or CSV
              </Button>
            </div>
            <textarea
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              rows={4}
              placeholder="Paste emails, separated by commas, spaces, or new lines"
              className={TEXTAREA_CLASS}
            />
            <p className="text-xs text-muted-foreground">
              {emails.length} valid {emails.length === 1 ? 'email' : 'emails'} (max {MAX_RECIPIENTS} per send).
              Each investor gets their own private link that opens
              {isSpace ? ' the space' : ' the deck'} directly, with no email prompt.
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
              placeholder={isSpace
                ? 'Hi, sharing our data room for your review.'
                : 'Hi, sharing our deck for your review.'}
              className={TEXTAREA_CLASS}
            />
          </div>

          {!isSpace && (
            <>
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
            </>
          )}
          {isSpace && (
            <p className="text-xs text-muted-foreground">
              The space&apos;s own watermark and permission settings apply to these links.
            </p>
          )}
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
