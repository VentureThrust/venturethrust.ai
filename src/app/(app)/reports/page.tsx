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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  FileText, Loader2, Download, X, ShieldCheck, Star,
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
const INK = '#0F1729';
const ACCENT = '#1E3A6E';

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

  // Release the blob if the page unmounts with a report still open.
  const urlRef = useRef<string | null>(null);
  useEffect(() => { urlRef.current = url; }, [url]);
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const closeViewer = () => {
    setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setOpen(null);
  };

  // The PDF is fetched and rendered from a blob URL rather than straight from
  // the signed storage URL. frame-src in the CSP allows 'self' and blob: but
  // not the Supabase host, so an iframe pointed at storage is blocked by the
  // browser. Same approach the content library preview uses. The blob also
  // makes Download instant and gives the file its real name.
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
      const file = await fetch(json.url as string);
      if (!file.ok) throw new Error('fetch failed');
      const blobUrl = URL.createObjectURL(await file.blob());

      setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return blobUrl; });
      setOpen(r);
      if (!r.opened_at) {
        setReports((prev) => prev.map((x) =>
          x.id === r.id ? { ...x, opened_at: new Date().toISOString() } : x));
      }
    } catch {
      toast({ variant: 'destructive', title: 'Could not open the report. Try again.' });
    } finally {
      setOpening(null);
    }
  };

  const download = () => {
    if (!url || !open) return;
    setDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${open.title}.pdf`;
      a.click();
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
      <div className="flex items-end justify-between gap-3 pb-6">
        <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: INK }}>Reports</h1>
        <span className="text-[13px] text-gray-400">
          {reports.length} {reports.length === 1 ? 'report' : 'reports'}
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-y border-gray-200 py-24 text-center">
          <FileText className="mb-4 h-9 w-9 text-gray-300" strokeWidth={1.5} />
          <p className="text-[15px] font-semibold" style={{ color: INK }}>No reports yet</p>
          <p className="mt-1.5 max-w-md text-[13.5px] text-gray-500">
            Your account manager writes to you when a watched startup moves, not on a schedule.
          </p>
        </div>
      ) : (
        <div>
          {grouped.map(([startup, list]) => (
            <section key={startup} className="mb-10">
              <div className="mb-1 flex items-baseline gap-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {startup}
                </h2>
                <span className="h-px flex-1" style={{ background: '#E8EAED' }} />
              </div>
              <div className="divide-y divide-gray-200 border-b border-gray-200">
                {list.map((r) => (
                  <div
                    key={r.id}
                    className="group flex items-center gap-4 py-3.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                         style={{ background: r.kind === 'priority' ? '#FBEAED' : '#EAEFF8' }}>
                      <FileText className="h-4 w-4"
                                style={{ color: r.kind === 'priority' ? CRIMSON : NAVY }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => openReport(r)}
                          disabled={opening === r.id}
                          className="truncate text-[15px] font-medium hover:underline"
                          style={{ color: INK }}
                        >
                          {r.title}
                        </button>
                        {!r.opened_at && (
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ACCENT }} title="Not opened yet" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                         style={{ color: r.kind === 'priority' ? CRIMSON : ACCENT }}>
                        {r.kind === 'priority' ? 'Priority brief' : 'Quarterly'}
                        {r.period ? <span className="text-gray-400"> · {r.period}</span> : null}
                      </p>
                    </div>
                    <span className="hidden w-28 shrink-0 text-[13px] text-gray-400 sm:block">
                      {format(new Date(r.sent_at), 'd MMM yyyy')}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => openReport(r)}
                            disabled={opening === r.id} className="shrink-0">
                      {opening === r.id
                        ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        : null}
                      Open report
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* The silence receipt */}
      {silent.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Watched, nothing to report
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {silent.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-[12.5px] font-medium text-gray-600"
              >
                <Star className="h-3 w-3" style={{ color: '#C7A24B' }} /> {n}
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
