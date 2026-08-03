'use client';

/**
 * InvestorDashboard - what an Investor plan account sees at /dashboard.
 *
 * Deliberately NOT the founder dashboard: an investor who bought Deal Watch
 * should land on their watchlist, their briefs and their account manager,
 * never on "My Data Room". Colour is used to encode meaning: crimson for a
 * priority brief that needs attention, blue for the watch itself, green for
 * the deliberate silence.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { DW_MANAGER_INFO } from '@/lib/deal-watch';
import {
  Star, ShieldCheck, ArrowRight, Headset,
  Mail, Phone, Loader2, UserCheck,
} from 'lucide-react';

type WatchRow = {
  id: string;
  startup_name: string | null;
  space_id: string | null;
  note: string | null;
  quarterly_report: boolean;
  created_at: string;
};

type AlertRow = {
  id: string;
  space_id: string | null;
  message: string;
  created_at: string;
};

// Restraint is the whole aesthetic here. One deep ink, one crimson accent for
// what needs attention, hairlines instead of filled tiles. No gradient chips.
const INK = '#0F1729';
const NAVY = '#0D1B3E';
const ACCENT = '#1E3A6E';
const CRIMSON = '#8B1E2D';

/**
 * Alert messages arrive as "Priority brief ready: <Startup> has crossed ...".
 * The row shows the startup as the headline and the finding underneath, so a
 * scan of the dashboard reads as a list of names rather than a paragraph.
 * Anything that does not match the shape falls back to the whole message.
 */
const BRIEF_RE = /^Priority brief ready:\s*([^.]+?)\s+(?:has|is)\s+(.*)$/i;

function briefStartup(message: string): string {
  const m = message.match(BRIEF_RE);
  if (!m) return message;
  // Trim the startup name off the front of the clause it shares with the verb.
  const words = m[1].trim().split(/\s+/);
  return words.slice(0, 4).join(' ');
}

function briefDetail(message: string): string {
  const m = message.match(BRIEF_RE);
  return m ? m[2].trim().replace(/\.$/, '') : '';
}

export function InvestorDashboard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<WatchRow[]>([]);
  const [briefs, setBriefs] = useState<AlertRow[]>([]);
  const [updatesReviewed, setUpdatesReviewed] = useState(0);
  const [reportsSent, setReportsSent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;

        const [watch, alerts, events] = await Promise.all([
          supabase
            .from('dw_watchlist')
            .select('id, startup_name, space_id, note, quarterly_report, created_at')
            .eq('investor_id', uid)
            .order('created_at', { ascending: false }),
          supabase
            .from('alerts')
            .select('id, space_id, message, created_at')
            .eq('user_id', uid)
            .eq('type', 'dw_update')
            .order('created_at', { ascending: false })
            .limit(5),
          // dw_update_events is RLS scoped to the founder, so the investor
          // cannot count it directly. The service role route does it for us,
          // restricted to this investor's own watched spaces.
          fetch('/api/deal-watch/stats', {
            headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
          }).then((r) => r.json()).catch(() => ({ ok: false })),
        ]);

        if (!active) return;
        setRows((watch.data ?? []) as WatchRow[]);
        setBriefs((alerts.data ?? []) as AlertRow[]);
        if (events?.ok) {
          setUpdatesReviewed(events.updatesReviewed ?? 0);
          setReportsSent(events.reportsSent ?? 0);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const quarterlyCount = useMemo(() => rows.filter((r) => r.quarterly_report).length, [rows]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: 'Startups watched', value: rows.length },
    { label: 'Reports sent to you', value: reportsSent },
    { label: 'Updates reviewed', value: updatesReviewed },
    { label: 'Quarterly reports on', value: quarterlyCount },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          Deal Watch
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]" style={{ color: INK }}>
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500">
          {rows.length > 0
            ? `We are watching ${rows.length} ${rows.length === 1 ? 'startup' : 'startups'} for you. You hear from us only when one of them moves.`
            : 'Add a startup to your watchlist and we will monitor it for you.'}
        </p>
      </div>

      {/* ── Stat band: label above, number below, hairline divided. ────── */}
      <div className="mb-14 grid grid-cols-2 divide-x divide-y divide-gray-200 border-y border-gray-200 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-7 first:pl-0 sm:px-7">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              {s.label}
            </p>
            <p className="mt-3 text-[38px] font-semibold leading-none tracking-tight tabular-nums" style={{ color: NAVY }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Priority briefs ────────────────────────────────────────────── */}
      {briefs.length > 0 && (
        <section className="mb-14">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: CRIMSON }}>
              Priority
            </span>
            <span className="h-px flex-1" style={{ background: '#E8EAED' }} />
            <span className="text-[13px] text-gray-400">
              {briefs.length === 1 ? '1 startup moved' : `${briefs.length} startups moved`}
            </span>
          </div>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {briefs.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-x-6 gap-y-4 py-6">
                {/* A thin crimson rule, not a chip. Editorial, not SaaS. */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="h-9 w-[3px] shrink-0 rounded-full" style={{ background: CRIMSON }} />
                  <div className="min-w-0">
                    {/* Startup name is the headline. The finding is the subline,
                        on one line, and the full brief is one click away. */}
                    <p className="truncate text-[15.5px] font-semibold" style={{ color: INK }}>
                      {briefStartup(b.message)}
                    </p>
                    <p className="truncate text-[12.5px] text-gray-400">
                      {briefDetail(b.message)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {/* The brief lives in Reports; the data room is one step further. */}
                  <Link
                    href="/reports"
                    className="inline-flex h-10 items-center gap-2 rounded-md px-5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: CRIMSON }}
                  >
                    Read the brief <ArrowRight className="h-4 w-4" />
                  </Link>
                  {b.space_id && (
                    <Link
                      href={`/spaces/${b.space_id}/view?open=deck`}
                      className="inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-[13.5px] font-semibold text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
                    >
                      Data room
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[1fr_320px]">
        {/* ── Watchlist ────────────────────────────────────────────────── */}
        <section>
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Your watchlist
            </h2>
            <span className="h-px flex-1" style={{ background: '#E8EAED' }} />
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors hover:opacity-70"
              style={{ color: ACCENT }}
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {rows.length === 0 ? (
            <div className="border-y border-gray-200 py-20 text-center">
              <Star className="mx-auto mb-3 h-8 w-8 text-gray-300" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold" style={{ color: INK }}>Nothing watched yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-gray-500">
                Open any deck a founder shared with you and click Add to Watchlist.
              </p>
              <button
                onClick={() => router.push('/dashboard/shared-with-me')}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-md px-5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: NAVY }}
              >
                See what has been shared with me <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {rows.map((r) => (
                <div
                  key={r.id}
                  onClick={() => { if (r.space_id) router.push(`/spaces/${r.space_id}/view?open=deck`); }}
                  className={`group flex items-center gap-4 py-4 transition-colors hover:bg-gray-50/70 ${r.space_id ? 'cursor-pointer' : ''}`}
                >
                  <Star className="h-4 w-4 shrink-0" style={{ color: '#C7A24B' }} strokeWidth={2} />
                  {/* Name only. Everything else is one click away. */}
                  <p className="min-w-0 flex-1 truncate text-[15.5px] font-semibold" style={{ color: INK }}
                     title={r.note ?? undefined}>
                    {r.startup_name || 'Unnamed startup'}
                  </p>
                  {r.quarterly_report && (
                    <span className="hidden shrink-0 rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:inline">
                      Quarterly
                    </span>
                  )}
                  <span className="hidden w-24 shrink-0 text-[12.5px] text-gray-400 md:block">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="space-y-12">
          {/* Account manager: one solid deep-navy panel, flat, hairline inside. */}
          <section className="overflow-hidden rounded-xl" style={{ background: NAVY }}>
            <div className="p-7">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#8FA6CE' }}>
                Your account manager
              </p>
              <div className="mt-5 flex items-center gap-3.5">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-white/15">
                  <Headset className="h-5 w-5 text-white" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[16px] font-semibold leading-tight text-white">{DW_MANAGER_INFO.name}</p>
                  <p className="text-[12px]" style={{ color: '#8FA6CE' }}>Deal Watch, VentureThrust</p>
                </div>
              </div>
              <p className="mt-5 text-[13px] leading-relaxed" style={{ color: '#C6D2E8' }}>
                Reads every update your watched startups make, so you only hear what matters.
              </p>
              <div className="my-5 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="space-y-2.5 text-[13px]">
                <a
                  href={`mailto:${DW_MANAGER_INFO.email}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                  style={{ color: '#C6D2E8' }}
                >
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} /> {DW_MANAGER_INFO.email}
                </a>
                <a
                  href={`tel:${DW_MANAGER_INFO.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                  style={{ color: '#C6D2E8' }}
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> {DW_MANAGER_INFO.phone}
                </a>
              </div>
              <Link
                href="/account-manager"
                className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-[13.5px] font-semibold transition-opacity hover:opacity-90"
                style={{ color: NAVY }}
              >
                Message your manager <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* The silence receipt */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                This month
              </p>
            </div>
            <p className="text-[15px] leading-relaxed" style={{ color: INK }}>
              <span className="font-semibold">{updatesReviewed} document updates</span>{' '}
              reviewed across your watched startups.{' '}
              <span className="font-semibold">{briefs.length}</span> reached you.
            </p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-gray-500">
              Everything else was checked and filtered out. Silence is deliberate: it means nothing
              crossed the bar you set.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
