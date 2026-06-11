'use client';

/**
 * Space Analytics page - three modes via state:
 *
 *   1. Overview      → header + stat cards + weekly chart + LiveViewers + files
 *   2. Session       → SessionDetailView for the clicked session
 *   3. File drilldown→ FileAnalyticsDrilldown (per-page PDF / video heatmap)
 *
 * Premium dashboard look: white cards on a quiet background, one blue accent
 * (#4285F4), green reserved for live, tabular numbers, micro uppercase labels.
 */

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2, Package, ChevronRight,
  Users, Clock, Eye, Files, BarChart3,
} from 'lucide-react';
import type { FileVisitEntry } from '@/app/spaces/[spaceId]/view/page';
import {
  LiveViewers,
  type ViewerSession,
  type FileWithVisits,
  formatDuration,
} from './_components/live-viewers';
import { SessionDetailView } from './_components/session-detail';
import { FileAnalyticsDrilldown } from './_components/file-analytics-drilldown';
import { getFileTypeStyle } from '@/lib/file-icons';
import { cn } from '@/lib/utils';

const BLUE = '#4285F4';

type FileWithVisitsLocal = {
  id: string;
  name: string;
  type?: string;
  visits: FileVisitEntry[] | null;
};

// ─── Stat cards ───────────────────────────────────────────────────────────────

function StatCards({
  uniqueVisitors,
  totalSessions,
  totalSeconds,
  filesEngaged,
  totalFiles,
}: {
  uniqueVisitors: number;
  totalSessions: number;
  totalSeconds: number;
  filesEngaged: number;
  totalFiles: number;
}) {
  const avg = totalSessions > 0 ? Math.floor(totalSeconds / totalSessions) : 0;
  const stats = [
    {
      icon: Users,
      label: 'Unique visitors',
      value: String(uniqueVisitors),
      sub: `across ${totalSessions} session${totalSessions === 1 ? '' : 's'}`,
    },
    {
      icon: Eye,
      label: 'Sessions',
      value: String(totalSessions),
      sub: avg > 0 ? `avg ${formatDuration(avg)} each` : 'no time recorded yet',
    },
    {
      icon: Clock,
      label: 'Total time',
      value: totalSeconds > 0 ? formatDuration(totalSeconds) : '0s',
      sub: 'all visitors combined',
    },
    {
      icon: Files,
      label: 'Files engaged',
      value: String(filesEngaged),
      sub: `of ${totalFiles} file${totalFiles === 1 ? '' : 's'} in this space`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {s.label}
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F0F5FF]">
              <s.icon className="h-3.5 w-3.5" style={{ color: BLUE }} />
            </span>
          </div>
          <div className="mt-3 text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-gray-900">
            {s.value}
          </div>
          <p className="mt-2 text-xs text-gray-400">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Visits this week (pure CSS bar chart from session timestamps) ───────────

function WeekChart({ sessions }: { sessions: { started_at: string }[] }) {
  const days = useMemo(() => {
    const out: { label: string; date: string; count: number; today: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
        date: d.toDateString(),
        count: 0,
        today: i === 0,
      });
    }
    for (const s of sessions) {
      const ds = new Date(s.started_at).toDateString();
      const hit = out.find((o) => o.date === ds);
      if (hit) hit.count += 1;
    }
    return out;
  }, [sessions]);

  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Visits this week</p>
          <p className="mt-0.5 text-xs text-gray-400">Sessions started in the last 7 days</p>
        </div>
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-gray-900">{total}</span>
      </div>
      <div className="mt-5 flex h-28 items-end gap-3">
        {days.map((d) => (
          <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className={cn('text-[11px] tabular-nums', d.count > 0 ? 'text-gray-500' : 'text-transparent')}>
              {d.count}
            </span>
            <div
              className="w-full max-w-[42px] rounded-md transition-all"
              style={{
                height: `${Math.max(d.count > 0 ? 14 : 4, (d.count / max) * 100)}%`,
                background: d.count > 0 ? BLUE : '#F3F4F6',
                opacity: d.count > 0 ? (d.today ? 1 : 0.55) : 1,
              }}
            />
            <span className={cn('text-[11px]', d.today ? 'font-semibold text-gray-900' : 'text-gray-400')}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpaceAnalyticsPage() {
  const params = useParams();
  const spaceId = params.spaceId as string;

  const [spaceName, setSpaceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasFiles, setHasFiles] = useState(false);
  const [files, setFiles] = useState<FileWithVisitsLocal[]>([]);
  const [sessionMeta, setSessionMeta] = useState<{ visitor_email: string | null; started_at: string; last_heartbeat: string; ended_at: string | null }[]>([]);

  const [drillSession, setDrillSession] = useState<ViewerSession | null>(null);
  const [drillFile, setDrillFile] = useState<{ id: string; name: string; type: string } | null>(null);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const load = async (silent = false) => {
      if (!silent) setIsLoading(true);

      // Read sessions via a service-role endpoint (with an ownership check) so
      // the owner sees ANONYMOUS visitors' sessions regardless of read RLS.
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token ?? '';

      const [{ data: space }, { data: filesData, error: filesError }, sessionsRes] =
        await Promise.all([
          supabase.from('spaces').select('name, title').eq('id', spaceId).single(),
          supabase.from('files').select('id, name, type, visits').eq('space_id', spaceId),
          fetch(`/api/track/sessions?spaceId=${encodeURIComponent(spaceId)}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : { ok: false, sessions: [] }))
            .catch(() => ({ ok: false, sessions: [] })),
        ]);

      if (cancelled) return;
      setSpaceName(space?.name || space?.title || 'Untitled Space');

      if (filesError) {
        console.error('Error loading file analytics:', filesError);
        if (!silent) setIsLoading(false);
        return;
      }

      setFiles((filesData || []) as FileWithVisitsLocal[]);
      setHasFiles((filesData || []).length > 0);
      setSessionMeta((sessionsRes?.sessions ?? []) as typeof sessionMeta);

      if (!silent) setIsLoading(false);
    };

    load();

    const scheduleReload = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => load(true), 800);
    };

    // Realtime: silently re-load so Visitors, Recent sessions and Deep file
    // analytics all refresh live (debounced to coalesce bursts).
    const channel = supabase
      .channel(`space_analytics:${spaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'viewer_sessions',
        filter: `space_id=eq.${spaceId}`,
      }, scheduleReload)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'file_page_views',
        filter: `space_id=eq.${spaceId}`,
      }, scheduleReload)
      .subscribe();

    // Safety-net polling - keeps everything fresh even if realtime misses.
    const poll = setInterval(() => load(true), 12000);

    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, [spaceId]);

  // Aggregate stats from session + file data.
  const stats = useMemo(() => {
    const visitorSet = new Set<string>();
    let totalSeconds = 0;
    for (const s of sessionMeta) {
      visitorSet.add(s.visitor_email ?? 'anonymous');
      const start = new Date(s.started_at).getTime();
      const end = s.ended_at
        ? new Date(s.ended_at).getTime()
        : new Date(s.last_heartbeat).getTime();
      totalSeconds += Math.max(0, Math.floor((end - start) / 1000));
    }
    const filesEngaged = files.filter(f => (f.visits ?? []).length > 0).length;
    return {
      uniqueVisitors: visitorSet.size,
      totalSessions: sessionMeta.length,
      totalSeconds,
      filesEngaged,
    };
  }, [sessionMeta, files]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Mode: File drilldown (deepest) ──
  if (drillFile) {
    return (
      <div className="w-full">
        <FileAnalyticsDrilldown
          fileId={drillFile.id}
          fileName={drillFile.name}
          fileType={drillFile.type ?? ''}
          onClose={() => setDrillFile(null)}
        />
      </div>
    );
  }

  // ── Mode: Session detail ──
  if (drillSession) {
    return (
      <div className="w-full">
        <SessionDetailView
          session={drillSession}
          files={files as FileWithVisits[]}
          onBack={() => setDrillSession(null)}
          onSelectFile={setDrillFile}
        />
      </div>
    );
  }

  // ── Mode: Overview ──
  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col gap-6 pb-10">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
            {spaceName}
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-gray-900">Analytics</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Updating live
        </span>
      </header>

      {/* Stat cards */}
      <StatCards
        uniqueVisitors={stats.uniqueVisitors}
        totalSessions={stats.totalSessions}
        totalSeconds={stats.totalSeconds}
        filesEngaged={stats.filesEngaged}
        totalFiles={files.length}
      />

      {/* Weekly visits chart */}
      <WeekChart sessions={sessionMeta} />

      {/* Live + sessions + visitors */}
      <LiveViewers spaceId={spaceId} onSelectSession={setDrillSession} />

      {/* Per-file drilldown launcher */}
      {!hasFiles ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white py-14 text-muted-foreground">
          <Package className="h-10 w-10 text-gray-300" />
          <p className="text-sm">No files in this space yet.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900">File engagement</h2>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                Open any file for per page time on PDFs or a playback heatmap on videos.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              {files.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {files.map(file => {
              const { Icon, bg, text } = getFileTypeStyle(file.name);
              const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
              const isPdf = ext === 'pdf' || file.type?.includes('pdf');
              const isVideo =
                ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext) ||
                file.type?.startsWith('video/');
              const supported = isPdf || isVideo;
              const opens = (file.visits ?? []).length;
              return (
                <button
                  key={file.id}
                  onClick={() => supported && setDrillFile({ id: file.id, name: file.name, type: file.type ?? '' })}
                  disabled={!supported}
                  className={cn(
                    'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors',
                    supported && 'cursor-pointer hover:bg-gray-50',
                    !supported && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg)}>
                    <Icon className={cn('h-4 w-4', text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {opens > 0 ? `${opens} open${opens === 1 ? '' : 's'}` : 'No opens yet'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {isPdf ? 'PDF' : isVideo ? 'Video' : ext || 'File'}
                  </span>
                  {supported && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
