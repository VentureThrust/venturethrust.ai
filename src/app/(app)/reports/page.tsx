'use client';

/**
 * Reports - every brief the account manager has sent this investor.
 *
 * Grouped by startup, newest first. Clicking a row opens the PDF in place
 * with a download button. Startups on the watchlist that have produced no
 * report are listed at the bottom, because the absence is the point: the
 * investor is paying to be told nothing until something moves.
 *
 * Investor plan only. Reports come from dw_reports under RLS (own rows).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  FileText, Loader2, Download, X, ShieldCheck, ArrowUpRight, Star,
} from 'lucide-react';

type Report = {
  id: string;
  startup_name: string;
  kind: 'priority' | 'quarterly';
  title: string;
  period: string | null;
  summary: string | null;
  sent_at: string;
  opened_at: string | null;
};

type Watched = { startup_name: string | null };

const CRIMSON = '#8B1E2D';
const NAVY = '#0D1B3E';

export default function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [watched, setWatched] = useState<Watched[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState<Report | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    const [{ data: rep }, { data: wl }] = await Promise.all([
      supabase
        .from('dw_reports')
        .select('id, startup_name, kind, title, period, summary, sent_at, opened_at')
        .order('sent_at', { ascending: false }),
      supabase.from('dw_watchlist').select('startup_name'),
    ]);
    setReports((rep ?? []) as Report[]);
    setWatched((wl ?? []) as Watched[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeViewer(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeViewer = () => { setOpen(null); setUrl(null); };

  const openReport = async (r: Report) => {
    setOpening(r.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/deal-watch/report?id=${encodeURIComponent(r.id)}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!json.ok) {
        toast({ variant: 'destructive', title: 'Could not open the report. Try again.' });
        return;
      }
      setOpen(r);
      setUrl(json.url as string);
      if (!r.opened_at) {
        setReports((prev) => prev.map((x) =>
          x.id === r.id ? { ...x, opened_at: new Date().toISOString() } : x));
      }
    } finally {
      setOpening(null);
    }
  };

  // Fetched as a blob so the file saves with its real name instead of the
  // signed URL's storage key.
  const download = async () => {
    if (!url || !open) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${open.title}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      toast({ variant: 'destructive', title: 'Download failed. Try again.' });
    } finally {
      setDownloading(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports) {
      const list = map.get(r.startup_name) ?? [];
      list.push(r);
      map.set(r.startup_name, list);
    }
    return [...map.entries()];
  }, [reports]);

  const silent = useMemo(() => {
    const withReports = new Set(reports.map((r) => r.startup_name));
    return watched
      .map((w) => w.startup_name)
      .filter((n): n is string => !!n && !withReports.has(n));
  }, [reports, watched]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Everything your account manager has sent you. A priority brief arrives when a startup
            crosses the conditions in your own note. A quarterly arrives only where you asked for one.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {reports.length} {reports.length === 1 ? 'report' : 'reports'}
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-b border-gray-200 py-24 text-center">
          <FileText className="mb-4 h-10 w-10 text-gray-300" />
          <p className="text-base font-semibold text-foreground">No reports yet</p>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            That is the normal state. Your account manager writes to you when one of your watched
            startups moves, not on a schedule.
          </p>
        </div>
      ) : (
        <div className="mt-2">
          {grouped.map(([startup, list]) => (
            <section key={startup} className="mb-2">
              <div className="flex items-baseline justify-between px-1 pb-1.5 pt-5">
                <h2 className="text-[15px] font-bold tracking-tight text-gray-900">{startup}</h2>
                <span className="text-xs text-muted-foreground">
                  {list.length} {list.length === 1 ? 'report' : 'reports'}
                </span>
              </div>
              <div className="divide-y divide-gray-200 border-y border-gray-200">
                {list.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openReport(r)}
                    disabled={opening === r.id}
                    className="group flex w-full items-center gap-4 px-1 py-4 text-left transition-colors hover:bg-[#F7FAFF]"
                  >
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ background: r.kind === 'priority' ? '#FDEBEE' : '#EAF0FB' }}
                    >
                      {opening === r.id
                        ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        : <FileText className="h-4 w-4"
                            style={{ color: r.kind === 'priority' ? CRIMSON : NAVY }} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#4285F4]">
                          {r.title}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={r.kind === 'priority'
                            ? { background: '#FDEBEE', color: CRIMSON }
                            : { background: '#EAF0FB', color: NAVY }}
                        >
                          {r.kind === 'priority' ? 'Priority brief' : 'Quarterly'}
                        </span>
                        {!r.opened_at && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#4285F4]" title="Not opened yet" />
                        )}
                      </div>
                      {r.summary && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.summary}</p>
                      )}
                    </div>

                    <span className="hidden w-32 shrink-0 text-sm text-muted-foreground sm:block">
                      {r.period ?? ''}
                    </span>
                    <span className="hidden w-32 shrink-0 text-sm text-muted-foreground md:block">
                      {format(new Date(r.sent_at), 'd MMM yyyy')}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#4285F4]" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* The silence receipt */}
      {silent.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Watched, nothing to report
            </p>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            These are being monitored and have not crossed anything worth your time. You will hear
            the day that changes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {silent.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              >
                <Star className="h-3 w-3 text-[#F4B400]" /> {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Report viewer */}
      {open && url && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={closeViewer}
                className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{open.title}</p>
                <p className="truncate text-xs text-white/50">
                  {open.startup_name}
                  {open.period ? ` · ${open.period}` : ''}
                  {' · from your account manager'}
                </p>
              </div>
            </div>
            <button
              onClick={download}
              disabled={downloading}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-[#0D1B3E] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {downloading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              Download
            </button>
          </div>
          <iframe src={url} title={open.title} className="min-h-0 flex-1 bg-white" />
        </div>
      )}
    </div>
  );
}
