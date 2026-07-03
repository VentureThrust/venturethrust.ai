'use client';

/**
 * Watchlist - the INVESTOR's list of startups they follow (Investor plan only).
 * Rows come straight from dw_watchlist under RLS (own rows only).
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Star, Loader2, UserCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Row = {
  id: string;
  startup_name: string | null;
  space_id: string | null;
  file_id: string | null;
  manager_id: string | null;
  created_at: string;
};

export default function WatchlistPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('dw_watchlist')
      .select('id, startup_name, space_id, file_id, manager_id, created_at')
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFF8E6] text-[#F4B400]">
          <Star className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-sm text-muted-foreground">
            Startups you follow. Assigned ones are monitored by your account manager.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <Star className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-foreground">Your watchlist is empty</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            When a founder shares a deck or data room with you, open it and click Add to Watchlist.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.startup_name || 'Unnamed startup'}</p>
                <p className="text-xs text-muted-foreground">
                  Added {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </p>
              </div>
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
                <Link href={`/spaces/${r.space_id}/view`} target="_blank">
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
