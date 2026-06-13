'use client';

/**
 * MissedVisitors - shown on the dashboard once the owner has access again. Lists
 * the people who tried to open a link while the owner's plan was expired (and
 * the link was therefore inactive). Reads expired_link_attempts via RLS, so an
 * owner only ever sees attempts on their own spaces. Renders nothing if empty.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserX } from 'lucide-react';

type Attempt = {
  id: string;
  visitor_email: string | null;
  created_at: string;
  space_id: string | null;
};

export function MissedVisitors() {
  const [rows, setRows] = useState<Attempt[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('expired_link_attempts')
        .select('id, visitor_email, created_at, space_id')
        .eq('owner_id', uid)
        .order('created_at', { ascending: false })
        .limit(25);
      if (active && data) setRows(data as Attempt[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const withEmail = rows.filter((r) => r.visitor_email);
  if (withEmail.length === 0) return null;

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-2 text-amber-900">
        <UserX className="h-5 w-5" />
        <h3 className="text-base font-semibold">People tried to open your spaces while your plan was paused</h3>
      </div>
      <p className="mt-1 text-sm text-amber-800">
        These visitors hit a link that was inactive because your plan had expired. Your links are active again now.
      </p>
      <ul className="mt-3 space-y-1.5">
        {withEmail.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate font-medium text-gray-900">{r.visitor_email}</span>
            <span className="shrink-0 text-xs text-gray-500">
              {new Date(r.created_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
