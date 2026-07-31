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
  Star, FileText, Eye, ShieldCheck, ArrowRight, Headset,
  Mail, Phone, Loader2, FileBarChart, UserCheck,
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

const BLUE = '#4285F4';
const CRIMSON = '#8B1A1A';

export function InvestorDashboard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<WatchRow[]>([]);
  const [briefs, setBriefs] = useState<AlertRow[]>([]);
  const [updatesReviewed, setUpdatesReviewed] = useState(0);
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
          supabase
            .from('dw_update_events')
            .select('id', { count: 'exact', head: true }),
        ]);

        if (!active) return;
        setRows((watch.data ?? []) as WatchRow[]);
        setBriefs((alerts.data ?? []) as AlertRow[]);
        setUpdatesReviewed(events.count ?? 0);
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
    {
      label: 'Startups watched',
      value: rows.length,
      icon: Star,
      fg: '#B45309',
      bg: 'linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%)',
    },
    {
      label: 'Briefs waiting',
      value: briefs.length,
      icon: FileText,
      fg: CRIMSON,
      bg: 'linear-gradient(135deg,#FEE2E2 0%,#FECACA 100%)',
    },
    {
      label: 'Updates reviewed',
      value: updatesReviewed,
      icon: Eye,
      fg: '#1D4ED8',
      bg: 'linear-gradient(135deg,#DBEAFE 0%,#BFDBFE 100%)',
    },
    {
      label: 'Quarterly reports on',
      value: quarterlyCount,
      icon: FileBarChart,
      fg: '#047857',
      bg: 'linear-gradient(135deg,#D1FAE5 0%,#A7F3D0 100%)',
    },
  ];

  return (
    <div className="px-4 pb-16 pt-8 sm:px-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <span
          className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ background: '#EEF3FD', color: BLUE }}
        >
          Deal Watch
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Welcome back, <span style={{ color: BLUE }}>{firstName}</span>
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">
          {rows.length > 0
            ? `We are watching ${rows.length} ${rows.length === 1 ? 'startup' : 'startups'} for you. You hear from us only when one of them moves.`
            : 'Add a startup to your watchlist and we will monitor it for you.'}
        </p>
      </div>

      {/* ── Stat row ───────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <div
              className="mb-3 grid h-11 w-11 place-items-center rounded-xl"
              style={{ background: s.bg }}
            >
              <s.icon className="h-5 w-5" style={{ color: s.fg }} />
            </div>
            <p className="text-3xl font-bold tracking-tight text-gray-900">{s.value}</p>
            <p className="mt-0.5 text-[13px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Priority briefs ────────────────────────────────────────────── */}
      {briefs.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2.5">
            <span
              className="rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ background: CRIMSON }}
            >
              Priority
            </span>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {briefs.length === 1 ? 'One startup moved' : `${briefs.length} startups moved`}
            </h2>
          </div>
          <div className="space-y-3">
            {briefs.map((b) => (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border bg-white"
                style={{ borderColor: '#F3C9C9' }}
              >
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg,#FEE2E2 0%,#FCA5A5 100%)' }}
                  >
                    <FileText className="h-5 w-5" style={{ color: CRIMSON }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-gray-900">
                      {b.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })} · from your account manager
                    </p>
                  </div>
                  {b.space_id && (
                    <Link
                      href={`/spaces/${b.space_id}/view`}
                      target="_blank"
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: CRIMSON }}
                    >
                      Open the room <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Watchlist ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: 'linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%)' }}
              >
                <Star className="h-4 w-4" style={{ color: '#B45309' }} />
              </div>
              <h2 className="text-base font-bold tracking-tight text-gray-900">Your watchlist</h2>
            </div>
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: BLUE }}
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Star className="mx-auto mb-3 h-9 w-9 text-gray-300" />
              <p className="text-[15px] font-semibold text-gray-900">Nothing watched yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                Open any deck a founder shared with you and click Add to Watchlist.
              </p>
              <button
                onClick={() => router.push('/dashboard/shared-with-me')}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
                style={{ background: BLUE }}
              >
                See what has been shared with me <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {rows.map((r) => (
                <div key={r.id} className="flex items-start gap-3.5 px-5 py-4">
                  <div
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ background: '#FFF8E6' }}
                  >
                    <Star className="h-4 w-4" style={{ color: '#F4B400' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-gray-900">
                        {r.startup_name || 'Unnamed startup'}
                      </p>
                      {r.quarterly_report && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Quarterly on
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        <UserCheck className="h-3 w-3" /> Managed
                      </span>
                    </div>
                    {r.note && (
                      <p className="mt-1 line-clamp-2 text-[13px] italic leading-relaxed text-gray-500">
                        &ldquo;{r.note}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-gray-400">
                      Added {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Account manager */}
          <section
            className="overflow-hidden rounded-2xl text-white"
            style={{ background: 'linear-gradient(150deg,#0D1B3E 0%,#1E3A6E 100%)' }}
          >
            <div className="p-5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                  <Headset className="h-4 w-4 text-white" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-200">
                  Your account manager
                </p>
              </div>
              <p className="mt-3 text-lg font-bold">{DW_MANAGER_INFO.name}</p>
              <p className="text-[13px] leading-relaxed text-blue-100">
                Reads every update your watched startups make, so you only hear what matters.
              </p>
              <div className="mt-4 space-y-2 text-[13px]">
                <a
                  href={`mailto:${DW_MANAGER_INFO.email}`}
                  className="flex items-center gap-2 text-blue-100 transition-colors hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" /> {DW_MANAGER_INFO.email}
                </a>
                <a
                  href={`tel:${DW_MANAGER_INFO.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 text-blue-100 transition-colors hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5" /> {DW_MANAGER_INFO.phone}
                </a>
              </div>
              <Link
                href="/account-manager"
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-[#0D1B3E] transition-opacity hover:opacity-90"
              >
                Message your manager <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* The silence receipt */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: 'linear-gradient(135deg,#D1FAE5 0%,#A7F3D0 100%)' }}
              >
                <ShieldCheck className="h-4 w-4" style={{ color: '#047857' }} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                This month
              </p>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-800">
              <span className="font-bold text-gray-900">{updatesReviewed} document updates</span>{' '}
              reviewed across your watched startups.{' '}
              <span className="font-bold text-gray-900">{briefs.length}</span> reached you.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
              Everything else was checked and filtered out. Silence is deliberate: it means nothing
              crossed the bar you set.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
