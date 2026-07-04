'use client';

/**
 * SendByEmailDialog - "Send to investors" for a deck (file) OR a space.
 *
 * Styled like a real email compose window (Gmail-style): a To line where
 * every address becomes a removable chip, an underlined Subject row, a plain
 * writing area, and a Send button in the footer. Typing or pasting emails
 * (comma, space, or new-line separated) turns them into chips; Backspace
 * removes the last chip; an Excel/CSV import appends chips.
 *
 * For each recipient we create a dedicated share_links row (recipient_email
 * set, email gate OFF) so they open the deck or space DIRECTLY from their
 * inbox, no email prompt, while every view is attributed to that exact
 * address. The server then emails each recipient their personal link under
 * the sender's name.
 *
 * Modes (pass exactly one): fileId (single deck) or spaceId (whole space).
 */

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Upload, Mail, X } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 10;

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
  const [chips, setChips] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [watermark, setWatermark] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const emails = chips;

  const addFromText = (text: string) => {
    const found = extractEmails(text);
    if (found.length === 0) return;
    setChips((prev) => {
      const set = new Set(prev);
      for (const e of found) {
        if (set.size >= MAX_RECIPIENTS) break;
        set.add(e);
      }
      return Array.from(set);
    });
  };

  const commitDraft = () => {
    if (draft.trim()) {
      addFromText(draft);
      setDraft('');
    }
  };

  const removeChip = (email: string) =>
    setChips((prev) => prev.filter((e) => e !== email));

  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ' || e.key === ';') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const handleToPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    addFromText(e.clipboardData.getData('text'));
    setDraft('');
  };

  const reset = () => {
    setChips([]);
    setDraft('');
    setSubject('');
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
        addFromText(found.join('\n'));
        toast({ title: `Imported ${found.length} ${found.length === 1 ? 'email' : 'emails'}` });
      }
    } catch {
      setError('Could not read that file. Use .xlsx, .csv, or .txt.');
    } finally {
      setImporting(false);
    }
  };

  const handleSend = async () => {
    commitDraft();
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

      const baseRow = (email: string) => ({
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
      });

      // sent_subject is a newer column - retry without it on databases that
      // have not run that one-liner yet (the subject falls back server-side).
      let { data: inserted, error: insErr } = await supabase
        .from('share_links')
        .insert(emails.map((e) => ({ ...baseRow(e), sent_subject: subject.trim() || null })))
        .select('id');
      if (insErr && /sent_subject/i.test(insErr.message ?? '')) {
        ({ data: inserted, error: insErr } = await supabase
          .from('share_links')
          .insert(emails.map(baseRow))
          .select('id'));
      }

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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        {/* Compose header - like a new-message window */}
        <div className="flex items-center gap-2 border-b bg-gray-50 px-4 py-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <DialogTitle className="text-sm font-semibold">
            {isSpace ? 'New message · send this space' : 'New message · send this deck'}
          </DialogTitle>
        </div>

        {/* To row - chips like a real email client */}
        <div
          className="flex min-h-[52px] cursor-text flex-wrap items-center gap-1.5 border-b px-4 py-2"
          onClick={() => toInputRef.current?.focus()}
        >
          <span className="mr-1 text-sm text-muted-foreground">To</span>
          {chips.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 py-0.5 pl-2.5 pr-1 text-sm"
            >
              {e}
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); removeChip(e); }}
                className="rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                aria-label={`Remove ${e}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            ref={toInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleToKeyDown}
            onPaste={handleToPaste}
            onBlur={commitDraft}
            placeholder={chips.length === 0 ? 'Type or paste investor emails' : ''}
            className="min-w-[140px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {chips.length}/{MAX_RECIPIENTS}
          </span>
        </div>

        {/* Subject row - underlined, like a compose window */}
        <div className="border-b px-4">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="h-11 w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />
        </div>

        {/* Body */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={7}
          placeholder={isSpace
            ? 'Hi, sharing our data room for your review.'
            : 'Hi, sharing our deck for your review.'}
          className="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />

        {/* Options + notes */}
        <div className="space-y-2 border-t px-4 py-3">
          {!isSpace && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={watermark} onCheckedChange={(c) => setWatermark(Boolean(c))} />
                Watermark with each investor&apos;s email
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={allowDownload} onCheckedChange={(c) => setAllowDownload(Boolean(c))} />
                Allow downloads
              </label>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Each investor gets their own private link that opens
            {isSpace ? ' the space' : ' the deck'} directly, no email prompt, sent under your name
            with a Click here to view button.
            {isSpace ? ' The space’s own watermark and permission settings apply.' : ''}
          </p>
          {error && <p className="text-xs text-amber-600">{error}</p>}
        </div>

        {/* Footer - Send on the left like an email client */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
          <Button onClick={handleSend} disabled={sending || (emails.length === 0 && !draft.trim())}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {sending ? 'Sending...' : `Send${emails.length ? ` (${emails.length})` : ''}`}
          </Button>
          <div className="flex items-center gap-2">
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
              variant="ghost"
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
              title="Import emails from Excel or CSV"
            >
              {importing
                ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                : <Upload className="mr-1.5 h-4 w-4" />}
              Import Excel or CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={sending}>
              Discard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
