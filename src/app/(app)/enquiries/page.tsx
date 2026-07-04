'use client';

/**
 * Enquiries - the manager's inbox for Talk to sales / Get a demo call /
 * Contact us submissions (contact_submissions). Owner only.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Inbox, Loader2, Mail, Phone, Archive, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Enquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  topic: string;
  message: string;
  status: string;
};

const TOPIC_STYLE: Record<string, string> = {
  sales: 'bg-blue-50 text-blue-700',
  support: 'bg-amber-50 text-amber-700',
  general: 'bg-gray-100 text-gray-600',
};

export default function EnquiriesPage() {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const isManager = (user?.email ?? '').toLowerCase() === DW_MANAGER_EMAIL;

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/deal-watch/enquiries', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setRows(j.enquiries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && isManager) load();
    if (!userLoading && !isManager) setLoading(false);
  }, [userLoading, isManager, load]);

  const setStatus = async (id: string, status: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/deal-watch/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } else {
      toast({ variant: 'destructive', title: 'Could not update. Try again.' });
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center text-muted-foreground">
        <Inbox className="mx-auto mb-4 h-10 w-10" />
        <p className="text-lg font-semibold text-foreground">Enquiries</p>
        <p className="mt-1 text-sm">Only the account manager can view this page.</p>
      </div>
    );
  }

  const visible = rows.filter((r) => (showArchived ? true : r.status !== 'archived'));
  const newCount = rows.filter((r) => r.status === 'new').length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF] text-[#4285F4]">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enquiries</h1>
            <p className="text-sm text-muted-foreground">
              Everything sent through Talk to sales, Get a demo call, and Contact us.
              {newCount > 0 ? ` ${newCount} new.` : ''}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowArchived((v) => !v)}>
          <Archive className="mr-1.5 h-4 w-4" />
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-muted-foreground">
          No enquiries yet. When someone submits Talk to sales or Get a demo call, it lands here.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((r) => (
            <div
              key={r.id}
              className={cn(
                'rounded-2xl border bg-white p-5',
                r.status === 'new' ? 'border-[#4285F4] ring-1 ring-[#4285F4]/30' : 'border-gray-200',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{r.name}</span>
                {r.company && <span className="text-sm text-muted-foreground">· {r.company}</span>}
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', TOPIC_STYLE[r.topic] ?? TOPIC_STYLE.general)}>
                  {r.topic}
                </span>
                {r.status === 'new' && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
                )}
                {r.status === 'replied' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                    <CheckCircle2 className="h-3 w-3" />Replied
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm text-gray-800">{r.message}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" asChild onClick={() => { if (r.status === 'new') void setStatus(r.id, 'read'); }}>
                  <a href={`mailto:${r.email}?subject=${encodeURIComponent('Re: your VentureThrust enquiry')}`}>
                    <Mail className="mr-1.5 h-4 w-4" />Reply to {r.email}
                  </a>
                </Button>
                {r.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${r.phone.replace(/\s/g, '')}`}>
                      <Phone className="mr-1.5 h-4 w-4" />{r.phone}
                    </a>
                  </Button>
                )}
                {r.status !== 'replied' && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'replied')}>
                    Mark replied
                  </Button>
                )}
                {r.status !== 'archived' ? (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'archived')}>
                    Archive
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'read')}>
                    Unarchive
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
