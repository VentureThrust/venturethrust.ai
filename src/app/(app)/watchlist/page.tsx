'use client';

/**
 * Watchlist - the INVESTOR's list of startups they follow (Investor plan only).
 * Full-width, table-style layout consistent with the rest of the app.
 * Rows come straight from dw_watchlist under RLS (own rows only).
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Star, Loader2, UserCheck, ExternalLink, FileBarChart } from 'lucide-react';
import Link from 'next/link';

type Row = {
  id: string;
  startup_name: string | null;
  space_id: string | null;
  file_id: string | null;
  manager_id: string | null;
  note: string | null;
  quarterly_report: boolean;
  created_at: string;
};

export default function WatchlistPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('dw_watchlist')
      .select('id, startup_name, space_id, file_id, manager_id, note, quarterly_report, created_at')
      .order('created_at', { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (row: Row) => {
    setAssigningId(row.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/deal-watch/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          spaceId: row.space_id ?? undefined,
          fileId: row.file_id ?? undefined,
          startupName: row.startup_name ?? undefined,
          assign: true,
        }),
      });
      if (res.ok) {
        toast({ title: 'Assigned to your account manager' });
        void load();
      } else {
        toast({ variant: 'destructive', title: 'Could not assign. Try again.' });
      }
    } finally {
      setAssigningId(null);
    }
  };

  const toggleQuarterly = async (row: Row) => {
    setTogglingId(row.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/deal-watch/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          spaceId: row.space_id ?? undefined,
          fileId: row.file_id ?? undefined,
          startupName: row.startup_name ?? undefined,
          quarterlyReport: !row.quarterly_report,
        }),
      });
      if (res.ok) {
        toast({
          title: row.quarterly_report
            ? 'Quarterly reports turned off'
            : 'Quarterly reports turned on',
          description: row.quarterly_report
            ? 'You will only hear from us when this startup opens a round.'
            : 'Your account manager will send you a quarterly report on this startup.',
        });
        void load();
      } else {
        toast({ variant: 'destructive', title: 'Could not update. Try again.' });
      }
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Startups you follow. We alert you the day one opens a round. Quarterly reports
            arrive only where you turned them on.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {rows.length} {rows.length === 1 ? 'startup' : 'startups'}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-b border-gray-200 py-24 text-center">
          <Star className="mb-4 h-10 w-10 text-gray-300" />
          <p className="text-base font-semibold text-foreground">Your watchlist is empty</p>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            When a founder shares a deck or data room with you, open it and click Add to Watchlist.
            It will appear here and your account manager can start following it.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard/shared-with-me">See what has been shared with me</Link>
          </Button>
        </div>
      ) : (
        <div>
          {/* Column header */}
          <div className="flex items-center gap-4 border-b border-gray-200 px-2 py-2">
            <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Startup</span>
            <span className="hidden w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:block">Added</span>
            <span className="hidden w-36 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:block">Reports</span>
            <span className="w-56 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monitoring</span>
          </div>

          <div className="divide-y divide-gray-200 border-b border-gray-200">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-2 py-4 hover:bg-gray-50">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FFF8E6]">
                    <Star className="h-4 w-4 text-[#F4B400]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.startup_name || 'Unnamed startup'}</p>
                    {r.note ? (
                      <p className="truncate text-xs italic text-muted-foreground" title={r.note}>
                        {r.note}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground sm:hidden">
                        Added {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <span className="hidden w-40 text-sm text-muted-foreground sm:block">
                  {format(new Date(r.created_at), 'MMM d, yyyy')}
                </span>
                <div className="hidden w-36 md:block">
                  <Button
                    size="sm"
                    variant={r.quarterly_report ? 'outline' : 'ghost'}
                    className={r.quarterly_report ? '' : 'text-muted-foreground'}
                    onClick={() => toggleQuarterly(r)}
                    disabled={togglingId === r.id}
                    title={r.quarterly_report
                      ? 'You get a quarterly report on this startup. Click to turn off.'
                      : 'Click to request a quarterly report on this startup.'}
                  >
                    {togglingId === r.id
                      ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      : <FileBarChart className="mr-1.5 h-4 w-4" />}
                    {r.quarterly_report ? 'Quarterly on' : 'Quarterly off'}
                  </Button>
                </div>
                <div className="flex w-56 items-center justify-end gap-2">
                  {r.manager_id ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <UserCheck className="h-3.5 w-3.5" />
                      Managed for you
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => assign(r)}
                      disabled={assigningId === r.id}
                    >
                      {assigningId === r.id
                        ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        : <UserCheck className="mr-1.5 h-4 w-4" />}
                      Assign to manager
                    </Button>
                  )}
                  {r.space_id && (
                    <Button size="sm" variant="ghost" asChild title="Open the data room">
                      <Link href={`/spaces/${r.space_id}/view`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
