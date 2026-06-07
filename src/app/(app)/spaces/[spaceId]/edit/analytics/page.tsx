'use client';

/**
 * Space Analytics page - three modes via state:
 *
 *   1. Overview      → header + stats strip + LiveViewers + file analytics list
 *   2. Session       → SessionDetailView for the clicked session
 *   3. File drilldown→ FileAnalyticsDrilldown (per-page PDF / video heatmap)
 *
 * Editorial layout - no card wrappers, horizontal rule separators.
 */

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2, Package, BarChart3, ChevronRight,
  Users, Clock, Eye, Files,
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

type FileWithVisitsLocal = {
  id: string;
  name: string;
  type?: string;
  visits: FileVisitEntry[] | null;
};

// ─── Stats strip (no cards - labels + big numbers separated by lines) ─────────

function StatsStrip({
  uniqueVisitors,
  totalSessions,
  totalSeconds,
  filesEngaged,
}: {
  uniqueVisitors: number;
  totalSessions: number;
  totalSeconds: number;
  filesEngaged: number;
}) {
  const stats = [
    {
      icon: <Users className="h-4 w-4 text-blue-600" />,
      label: 'Unique visitors',
      value: uniqueVisitors,
    },
    {
      icon: <Eye className="h-4 w-4 text-green-600" />,
      label: 'Sessions',
      value: totalSessions,
    },
    {
      icon: <Clock className="h-4 w-4 text-amber-600" />,
      label: 'Total time',
      value: totalSeconds > 0 ? formatDuration(totalSeconds) : '0s',
    },
    {
      icon: <Files className="h-4 w-4 text-purple-600" />,
      label: 'Files engaged',
      value: filesEngaged,
    },
  ];

  return (
    // -mx-4 sm:-mx-6 pulls the strip out past the page padding so the
    // top/bottom borders go fully edge-to-edge (no gap on the sides).
    // Numbers are font-semibold (was bold) to match the lighter heading.
    <div className="-mx-4 sm:-mx-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200 border-y border-gray-200 py-6">
      {stats.map((s, i) => (
        <div key={i} className="px-6">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {s.icon}
            {s.label}
          </div>
          <div className="text-3xl font-semibold tracking-tight mt-2 tabular-nums">{s.value}</div>
        </div>
      ))}
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
    //   - viewer_sessions → visitor enters / heart-beats / leaves
    //   - file_page_views → a visitor flips a page (instant, not just on the
    //     next heartbeat) so per-file engagement updates immediately.
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

    // Safety-net polling - guarantees the Visitors list, sessions and Deep file
    // analytics refresh within ~12s even if a realtime event is missed (RLS,
    // connection hiccup, or free-tier limits). Realtime makes it instant; this
    // makes it reliable.
    const poll = setInterval(() => load(true), 12000);

    // Also re-load when the tab regains focus (owner switches back to it).
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
    <div className="w-full flex flex-col gap-10">
      {/* Header - title + space context. font-medium (not bold) reads as
          editorial / refined; tight tracking gives it presence without the
          heavy "chunky" look the user flagged on the previous bold version. */}
      <header>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-[0.15em]">
          {spaceName}
        </p>
        <h1 className="text-[2.25rem] leading-[1.1] font-medium tracking-tight mt-2">Analytics</h1>
      </header>

      {/* Stats strip - high-density summary, no card boxes */}
      <StatsStrip
        uniqueVisitors={stats.uniqueVisitors}
        totalSessions={stats.totalSessions}
        totalSeconds={stats.totalSeconds}
        filesEngaged={stats.filesEngaged}
      />

      {!hasFiles ? (
        <>
          <LiveViewers spaceId={spaceId} onSelectSession={setDrillSession} />
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <Package className="h-12 w-12" />
            <p className="text-sm">No files in this space yet.</p>
          </div>
        </>
      ) : (
        <>
          <LiveViewers spaceId={spaceId} onSelectSession={setDrillSession} />

          {/* Per-file drilldown launcher */}
          <section>
            <div className="pb-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-medium tracking-tight">Deep file analytics</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
                Click any file to see per-page time for PDFs or a playback heatmap for videos.
                Updates in real time as visitors browse.
              </p>
            </div>
            <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />
            <div className="divide-y divide-gray-100">
              {files.map(file => {
                const { Icon, bg, text } = getFileTypeStyle(file.name);
                const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
                const isPdf = ext === 'pdf' || file.type?.includes('pdf');
                const isVideo =
                  ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext) ||
                  file.type?.startsWith('video/');
                const supported = isPdf || isVideo;
                return (
                  <button
                    key={file.id}
                    onClick={() => supported && setDrillFile({ id: file.id, name: file.name, type: file.type ?? '' })}
                    disabled={!supported}
                    className={cn(
                      'w-full flex items-center gap-3 py-4 text-left -mx-2 px-2 rounded-md transition-colors',
                      supported && 'hover:bg-muted/30 cursor-pointer',
                      !supported && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <div className={cn('h-10 w-10 rounded-md flex items-center justify-center shrink-0', bg)}>
                      <Icon className={cn('h-5 w-5', text)} />
                    </div>
                    <span className="flex-1 text-base truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {isPdf ? 'PDF' : isVideo ? 'Video' : ext || 'File'}
                    </span>
                    {supported && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
