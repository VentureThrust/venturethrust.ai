'use client';

/**
 * WatchlistButton - "Add to Watchlist" on the shared space view.
 *
 * Rendered ONLY for logged-in Investor plan accounts (everyone else sees
 * nothing at all). Clicking opens one dialog: an optional note for the
 * account manager plus an opt-in checkbox for quarterly reports on this
 * startup. Adding always assigns the account manager; the default promise
 * is silence until the startup opens a round.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

export function WatchlistButton() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = typeof params?.spaceId === 'string' ? params.spaceId : '';
  const { toast } = useToast();

  const [visible, setVisible] = useState(false);
  const [watched, setWatched] = useState(false);
  const [startupName, setStartupName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [quarterly, setQuarterly] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!spaceId) return;
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

        const [{ data: watchRow }, { data: spaceRow }] = await Promise.all([
          supabase
            .from('dw_watchlist')
            .select('id')
            .eq('investor_id', uid)
            .eq('space_id', spaceId)
            .maybeSingle(),
          supabase.from('spaces').select('name, title').eq('id', spaceId).maybeSingle(),
        ]);
        if (!active) return;
        if (watchRow) setWatched(true);
        const n = (spaceRow?.name as string) || (spaceRow?.title as string) || '';
        setStartupName(n);
      } catch {
        /* stay hidden */
      }
    })();
    return () => { active = false; };
  }, [spaceId]);

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
          spaceId,
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

  if (!visible || !spaceId) return null;

  return (
    <>
      <Button
        variant="outline"
        disabled={watched}
        onClick={() => { if (!watched) setDialogOpen(true); }}
      >
        <Star className={`h-4 w-4 mr-2 ${watched ? 'fill-current' : ''}`} />
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
            <label htmlFor="dw-note" className="text-sm font-medium">
              Note for your account manager <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="dw-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Example: Passed because it was too early. I want to see paying customers and a full time team."
            />
          </div>

          <div className="flex items-start gap-2 py-1">
            <Checkbox
              id="dw-quarterly"
              checked={quarterly}
              onCheckedChange={(c) => setQuarterly(Boolean(c))}
              className="mt-0.5"
            />
            <label htmlFor="dw-quarterly" className="cursor-pointer text-sm">
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
