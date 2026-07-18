'use client';

/**
 * Deal Watch - the ACCOUNT MANAGER's dashboard (owner only).
 *
 * Two feeds:
 *   1. Assignments - which investor put which startup on their watchlist.
 *   2. Updates     - watched founders' file uploads/updates, newest first,
 *                    with one-click open (view logged as the investor).
 *
 * Access: only the account manager (DW_MANAGER_EMAIL). Everyone else gets a
 * plain notice; the API refuses them independently anyway.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Radar,
  Loader2,
  FilePlus2,
  FilePen,
  FileX2,
  ExternalLink,
  UserPlus,
} from 'lucide-react';

type Assignment = {
  id: string;
  startupName: string;
  investorEmail: string;
  founderEmail: string;
  assigned: boolean;
  note: string | null;
  quarterlyReport: boolean;
  spaceId: string | null;
  fileId: string | null;
  createdAt: string;
};

type UpdateEvent = {
  id: string;
  startupName: string;
  founderEmail: string;
  fileId: string | null;
  fileName: string;
  eventType: 'file_added' | 'file_updated' | 'file_deleted';
  createdAt: string;
};

const EVENT_META = {
  file_added: { label: 'New file', Icon: FilePlus2, cls: 'bg-green-50 text-green-700' },
  file_updated: { label: 'Updated', Icon: FilePen, cls: 'bg-blue-50 text-blue-700' },
  file_deleted: { label: 'Removed', Icon: FileX2, cls: 'bg-red-50 text-red-600' },
} as const;

export default function DealWatchPage() {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [events, setEvents] = useState<UpdateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  // Activate-investor tool (one click instead of SQL).
  const [activateEmail, setActivateEmail] = useState('');
  const [activating, setActivating] = useState(false);
  // Custom offer (quote) builder.
  const [offerEmail, setOfferEmail] = useState('');
  const [offerSeats, setOfferSeats] = useState('1');
  const [offerDiscount, setOfferDiscount] = useState('10');
  const [offerPaddleCode, setOfferPaddleCode] = useState('');
  const [creatingOffer, setCreatingOffer] = useState(false);

  const offerSeatsN = Math.min(Math.max(Math.round(Number(offerSeats) || 1), 1), 20);
  const offerDiscN = Math.min(Math.max(Number(offerDiscount) || 0, 0), 90);
  const offerUsd = Math.round(149 * offerSeatsN * (1 - offerDiscN / 100));
  const offerInr = Math.round(12499 * offerSeatsN * (1 - offerDiscN / 100));

  const isManager = (user?.email ?? '').toLowerCase() === DW_MANAGER_EMAIL;

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/deal-watch/manager', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setAssignments(j.assignments ?? []);
        setEvents(j.events ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && isManager) load();
    if (!userLoading && !isManager) setLoading(false);
  }, [userLoading, isManager, load]);

  const handleOpen = async (ev: UpdateEvent) => {
    if (!ev.fileId || openingId) return;
    setOpeningId(ev.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/deal-watch/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ fileId: ev.fileId }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) {
        window.open(j.url as string, '_blank', 'noopener');
      } else {
        toast({ variant: 'destructive', title: 'Could not open the file' });
      }
    } finally {
      setOpeningId(null);
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
        <Radar className="mx-auto mb-4 h-10 w-10" />
        <p className="text-lg font-semibold text-foreground">Deal Watch</p>
        <p className="mt-1 text-sm">Only the account manager can view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF] text-[#4285F4]">
            <Radar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deal Watch</h1>
            <p className="text-sm text-muted-foreground">
              Startups your investors are watching, and every update their founders make.
            </p>
          </div>
        </div>
      </div>

      {/* ── Activate an investor ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold">Activate an investor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          After a sales conversation, enter the investor&apos;s account email. This turns on their
          Investor features and 30 days of access. Run it again any time to extend. They must have
          signed up first.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            type="email"
            value={activateEmail}
            onChange={(e) => setActivateEmail(e.target.value)}
            placeholder="investor@fund.com"
            className="w-full sm:w-80"
          />
          <Button
            disabled={activating || !activateEmail.trim()}
            onClick={async () => {
              setActivating(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/deal-watch/activate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                  },
                  body: JSON.stringify({ email: activateEmail.trim() }),
                });
                const j = await res.json().catch(() => ({}));
                if (res.ok && j.ok) {
                  toast({
                    title: 'Investor activated',
                    description: `${j.email} now has Investor access for ${j.days} days.`,
                  });
                  setActivateEmail('');
                } else if (j.error === 'NO_ACCOUNT') {
                  toast({
                    variant: 'destructive',
                    title: 'No account with this email',
                    description: 'Ask the investor to sign up first, then activate them here.',
                  });
                } else {
                  toast({ variant: 'destructive', title: 'Activation failed', description: j.error ?? 'Try again.' });
                }
              } finally {
                setActivating(false);
              }
            }}
          >
            {activating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Activate
          </Button>
        </div>
      </section>

      {/* ── Create a custom offer (enterprise-style quote) ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold">Create a custom offer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          After a demo call, quote the plan you discussed: seats and discount. The investor sees a
          Made for you card on their plan page and pays in one click. Payment activates them
          automatically.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="email"
            value={offerEmail}
            onChange={(e) => setOfferEmail(e.target.value)}
            placeholder="investor@fund.com"
          />
          <Input
            type="number"
            min={1}
            max={20}
            value={offerSeats}
            onChange={(e) => setOfferSeats(e.target.value)}
            placeholder="Seats"
            title="Seats"
          />
          <Input
            type="number"
            min={0}
            max={90}
            value={offerDiscount}
            onChange={(e) => setOfferDiscount(e.target.value)}
            placeholder="Discount %"
            title="Discount percent"
          />
          <Input
            value={offerPaddleCode}
            onChange={(e) => setOfferPaddleCode(e.target.value)}
            placeholder="Paddle discount code (intl only)"
            title="Optional Paddle discount code applied for non-India checkout"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            They will see: <span className="font-semibold text-foreground">${offerUsd}/mo</span>
            {' '}(₹{offerInr.toLocaleString('en-IN')} in India)
            {offerDiscN > 0 ? `, ${offerDiscN}% off the standard price` : ''}
          </p>
          <Button
            disabled={creatingOffer || !offerEmail.trim()}
            onClick={async () => {
              setCreatingOffer(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/deal-watch/offer', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                  },
                  body: JSON.stringify({
                    email: offerEmail.trim(),
                    seats: offerSeatsN,
                    discountPct: offerDiscN,
                    paddleDiscountCode: offerPaddleCode.trim() || undefined,
                  }),
                });
                const j = await res.json().catch(() => ({}));
                if (res.ok && j.ok) {
                  toast({
                    title: 'Offer created',
                    description: `${j.email} will see the ${j.seats}-seat plan at $${j.priceUsd}/mo on their plan page.`,
                  });
                  setOfferEmail('');
                } else {
                  toast({ variant: 'destructive', title: 'Could not create the offer', description: j.error ?? 'Try again.' });
                }
              } finally {
                setCreatingOffer(false);
              }
            }}
          >
            {creatingOffer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Create offer
          </Button>
        </div>
      </section>

      {/* ── Updates feed ── */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <h2 className="text-base font-semibold">Founder updates</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {events.length}
          </span>
        </div>
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-muted-foreground">
            No updates yet. When a watched founder uploads or updates a file, it appears here.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {events.map((ev) => {
              const meta = EVENT_META[ev.eventType] ?? EVENT_META.file_added;
              return (
                <div key={ev.id} className="flex items-center gap-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
                    <meta.Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {ev.startupName}
                      <span className="font-normal text-muted-foreground"> updated </span>
                      {ev.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ev.founderEmail} • {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {ev.fileId && ev.eventType !== 'file_deleted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpen(ev)}
                      disabled={openingId === ev.id}
                    >
                      {openingId === ev.id
                        ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        : <ExternalLink className="mr-1.5 h-4 w-4" />}
                      Open file
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Opening a file records the view under the investor&apos;s email in the founder&apos;s analytics.
        </p>
      </section>

      {/* ── Assignments ── */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <h2 className="text-base font-semibold">Assignments</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {assignments.length}
          </span>
        </div>
        {assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-muted-foreground">
            No assignments yet. When an investor assigns a startup to you, it appears here.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-4 py-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F0F5FF] text-[#4285F4]">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.startupName}</p>
                  <p className="text-xs text-muted-foreground">
                    Watched by {a.investorEmail}
                    {a.founderEmail ? ` • founder ${a.founderEmail}` : ''}
                    {' • '}
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                  {a.note && (
                    <p className="mt-1 border-l-2 border-gray-200 pl-2 text-xs italic text-gray-600">
                      &ldquo;{a.note}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.quarterlyReport && (
                    <span className="rounded-full bg-[#F0F5FF] px-2.5 py-1 text-xs font-semibold text-[#4285F4]">
                      Quarterly requested
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      a.assigned ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {a.assigned ? 'Assigned to you' : 'Watch only'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
