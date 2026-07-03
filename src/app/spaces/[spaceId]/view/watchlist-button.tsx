'use client';

/**
 * WatchlistButton - "Add to Watchlist" on the shared space view.
 *
 * Rendered ONLY for logged-in Investor plan accounts (everyone else sees
 * nothing at all). Clicking asks whether to assign the startup to the
 * investor's account manager, with a remembered "always assign" choice
 * (profiles.dw_auto_assign). Fully self-contained: resolves the space id from
 * the route and the startup name from the spaces row.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [autoAssign, setAutoAssign] = useState<boolean | null>(null);
  const [startupName, setStartupName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [remember, setRemember] = useState(false);
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
          .select('is_investor, dw_auto_assign')
          .eq('id', uid)
          .maybeSingle();
        if (!active || (prof as { is_investor?: boolean } | null)?.is_investor !== true) return;
        setVisible(true);
        setAutoAssign((prof as { dw_auto_assign?: boolean | null })?.dw_auto_assign ?? null);

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

  const submit = async (assign: boolean, rememberChoice: boolean | null) => {
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
          assign,
          autoAssignRemember: rememberChoice,
        }),
      });
      if (res.ok) {
        setWatched(true);
        setDialogOpen(false);
        toast({
          title: 'Added to your watchlist',
          description: assign
            ? 'Your account manager will follow every update from this startup.'
            : undefined,
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
        onClick={() => {
          if (watched) return;
          // Remembered "always assign": skip the dialog entirely.
          if (autoAssign === true) {
            void submit(true, null);
          } else {
            setDialogOpen(true);
          }
        }}
      >
        <Star className={`h-4 w-4 mr-2 ${watched ? 'fill-current' : ''}`} />
        {watched ? 'On your watchlist' : 'Add to Watchlist'}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!busy) setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to your account manager?</DialogTitle>
            <DialogDescription>
              Your account manager will follow every update
              {startupName ? ` from ${startupName}` : ' from this startup'} and tell you when
              something genuinely matters. You will not receive automatic notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 py-1">
            <Checkbox
              id="dw-remember"
              checked={remember}
              onCheckedChange={(c) => setRemember(Boolean(c))}
              className="mt-0.5"
            />
            <label htmlFor="dw-remember" className="cursor-pointer text-sm">
              Always assign new watchlist startups to my manager. Don&apos;t ask me again.
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => submit(false, remember ? false : null)}
            >
              Just watch
            </Button>
            <Button disabled={busy} onClick={() => submit(true, remember ? true : null)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign to manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
