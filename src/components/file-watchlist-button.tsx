'use client';

/**
 * FileWatchlistButton - "Add to Watchlist" for a single shared deck (file
 * link). Rendered ONLY for logged-in Investor plan accounts; every other
 * visitor sees nothing. Same dialog as the space version: optional note for
 * the account manager + quarterly report opt-in. Adding always assigns the
 * account manager.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';

export function FileWatchlistButton({
  fileId,
  startupName,
}: {
  fileId: string;
  /** Shown in the dialog and stored as the watchlist row name (deck name). */
  startupName?: string;
}) {
  const { toast } = useToast();

  const [visible, setVisible] = useState(false);
  const [watched, setWatched] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [quarterly, setQuarterly] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!fileId) return;
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;
        const { data: prof } = await supabase
          .from('profiles')
          .select('is_investor')
          .eq('id', uid)
          .maybeSingle();
        if (!active || (prof as { is_investor?: boolean } | null)?.is_investor !== true) return;
        setVisible(true);

        const { data: watchRow } = await supabase
          .from('dw_watchlist')
          .select('id')
          .eq('investor_id', uid)
          .eq('file_id', fileId)
          .maybeSingle();
        if (active && watchRow) setWatched(true);
      } catch {
        /* stay hidden */
      }
    })();
    return () => { active = false; };
  }, [fileId]);

  const submit = async () => {
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/deal-watch/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          fileId,
          startupName: startupName || undefined,
          assign: true,
          note: note.trim() || undefined,
          quarterlyReport: quarterly,
        }),
      });
      if (res.ok) {
        setWatched(true);
        setDialogOpen(false);
        toast({
          title: 'Added to your watchlist',
          description: quarterly
            ? 'Your account manager will watch it and send you a quarterly report.'
            : 'You will hear from us the day this startup opens a round.',
        });
      } else {
        toast({ variant: 'destructive', title: 'Could not add to watchlist. Try again.' });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!visible || !fileId) return null;

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        disabled={watched}
        onClick={() => { if (!watched) setDialogOpen(true); }}
      >
        <Star className={`mr-2 h-4 w-4 ${watched ? 'fill-current' : ''}`} />
        {watched ? 'On your watchlist' : 'Add to Watchlist'}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!busy) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{startupName ? `Watch ${startupName}` : 'Add to your watchlist'}</DialogTitle>
            <DialogDescription>
              We will alert you the moment this startup hits a real milestone, with what changed
              since you passed. Nothing else, unless you ask.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label htmlFor="dw-file-note" className="text-sm font-medium">
              Note for your account manager <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="dw-file-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Example: Passed because it was too early. I want to see paying customers and a full time team."
            />
          </div>

          <div className="flex items-start gap-2 py-1">
            <Checkbox
              id="dw-file-quarterly"
              checked={quarterly}
              onCheckedChange={(c) => setQuarterly(Boolean(c))}
              className="mt-0.5"
            />
            <label htmlFor="dw-file-quarterly" className="cursor-pointer text-sm">
              Also send me a quarterly report on this startup
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={submit}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to watchlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
