'use client';

/**
 * FileAnalyticsDrilldown - per-file deep analytics panel.
 *
 * - PDFs: a bar chart of time spent on each page (aggregated across all
 *   visitors). The page with the longest engagement bar is the most-read.
 * - Videos: a per-second "watched" heatmap with markers for replays and
 *   forward seeks. Lets the owner see exactly which segments were rewatched.
 *
 * All data refreshes in real time via Supabase Realtime: when a visitor
 * scrolls a PDF or seeks in a video, the bars/heatmap update within a second.
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Play, Rewind, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PageView = {
  id: string;
  file_id: string;
  visitor_email: string | null;
  page_number: number;
  seconds_viewed: number;
  viewed_at: string;
};

type PlaybackEvent = {
  id: string;
  file_id: string;
  visitor_email: string | null;
  event_type: 'play' | 'pause' | 'seek' | 'replay' | 'segment' | 'ended';
  position_seconds: number | null;
  range_start: number | null;
  range_end: number | null;
  occurred_at: string;
};

function formatSeconds(s: number): string {
  if (s < 60) return `${s.toFixed(0)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  return `${m}m ${rem}s`;
}

function categorize(fileName: string, fileType: string): 'pdf' | 'video' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf' || fileType?.includes('pdf')) return 'pdf';
  if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
  if (fileType?.startsWith('video/')) return 'video';
  return 'other';
}

interface FileAnalyticsDrilldownProps {
  fileId: string;
  fileName: string;
  fileType: string;
  /** Total video duration in seconds, if known (helps scale the heatmap). */
  videoDurationSeconds?: number;
  onClose: () => void;
}

export function FileAnalyticsDrilldown({
  fileId,
  fileName,
  fileType,
  videoDurationSeconds,
  onClose,
}: FileAnalyticsDrilldownProps) {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [playback, setPlayback] = useState<PlaybackEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const category = categorize(fileName, fileType);

  // ── Initial fetch + Realtime subscriptions ────────────────────────────────
  useEffect(() => {
    if (!fileId) return;

    let cancelled = false;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    const setup = async () => {
      // PDF page views
      if (category === 'pdf') {
        const { data } = await supabase
          .from('file_page_views')
          .select('*')
          .eq('file_id', fileId)
          .order('viewed_at', { ascending: false });
        if (!cancelled && data) setPageViews(data as PageView[]);

        const ch = supabase
          .channel(`file_page_views:${fileId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'file_page_views',
              filter: `file_id=eq.${fileId}`,
            },
            (payload) => {
              setPageViews((prev) => [payload.new as PageView, ...prev]);
            }
          )
          .subscribe();
        channels.push(ch);
      }

      // Video playback events
      if (category === 'video') {
        const { data } = await supabase
          .from('file_playback_events')
          .select('*')
          .eq('file_id', fileId)
          .order('occurred_at', { ascending: false });
        if (!cancelled && data) setPlayback(data as PlaybackEvent[]);

        const ch = supabase
          .channel(`file_playback_events:${fileId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'file_playback_events',
              filter: `file_id=eq.${fileId}`,
            },
            (payload) => {
              setPlayback((prev) => [payload.new as PlaybackEvent, ...prev]);
            }
          )
          .subscribe();
        channels.push(ch);
      }

      if (!cancelled) setIsLoading(false);
    };

    setup();

    return () => {
      cancelled = true;
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [fileId, category]);

  // ── PDF aggregation: total seconds + viewer count per page ───────────────
  const pdfStats = useMemo(() => {
    if (category !== 'pdf') return null;
    const byPage = new Map<number, { totalSeconds: number; viewers: Set<string> }>();
    let maxSecondsAcrossPages = 0;

    pageViews.forEach((pv) => {
      const cur = byPage.get(pv.page_number) ?? { totalSeconds: 0, viewers: new Set() };
      cur.totalSeconds += pv.seconds_viewed;
      cur.viewers.add(pv.visitor_email ?? 'anonymous');
      byPage.set(pv.page_number, cur);
      if (cur.totalSeconds > maxSecondsAcrossPages) maxSecondsAcrossPages = cur.totalSeconds;
    });

    const rows = Array.from(byPage.entries())
      .map(([page, v]) => ({
        page,
        totalSeconds: v.totalSeconds,
        viewerCount: v.viewers.size,
        relativeWidth: maxSecondsAcrossPages > 0 ? (v.totalSeconds / maxSecondsAcrossPages) * 100 : 0,
      }))
      .sort((a, b) => a.page - b.page);

    const totalSecondsAllPages = rows.reduce((sum, r) => sum + r.totalSeconds, 0);
    const topPage = rows.length > 0 ? rows.reduce((m, r) => (r.totalSeconds > m.totalSeconds ? r : m), rows[0]) : null;
    return { rows, totalSecondsAllPages, topPage };
  }, [pageViews, category]);

  // ── Video aggregation: build per-second heatmap + replay markers ─────────
  const videoStats = useMemo(() => {
    if (category !== 'video') return null;

    const segments = playback.filter((e) => e.event_type === 'segment');
    const replays = playback.filter((e) => e.event_type === 'replay');
    const ended = playback.filter((e) => e.event_type === 'ended');

    // Discover duration: prefer prop, else use max position seen
    let maxSeen = videoDurationSeconds ?? 0;
    for (const e of playback) {
      const pos = e.position_seconds ?? e.range_end ?? 0;
      if (pos > maxSeen) maxSeen = pos;
    }
    const duration = Math.max(maxSeen, 1);

    // Build a per-second watch-count array
    const buckets = Math.min(Math.ceil(duration), 600); // cap at 600 buckets
    const bucketSize = duration / buckets;
    const watchedPerBucket = new Array<number>(buckets).fill(0);

    segments.forEach((s) => {
      if (s.range_start == null || s.range_end == null) return;
      const startB = Math.max(0, Math.floor(s.range_start / bucketSize));
      const endB = Math.min(buckets, Math.ceil(s.range_end / bucketSize));
      for (let i = startB; i < endB; i++) watchedPerBucket[i] += 1;
    });

    const maxWatchCount = Math.max(1, ...watchedPerBucket);

    const totalWatchedSeconds = segments.reduce((sum, s) => {
      if (s.range_start == null || s.range_end == null) return sum;
      return sum + Math.max(0, s.range_end - s.range_start);
    }, 0);

    const uniqueViewers = new Set(playback.map((e) => e.visitor_email ?? 'anonymous')).size;
    const playCount = playback.filter((e) => e.event_type === 'play').length;

    return {
      duration,
      buckets,
      watchedPerBucket,
      maxWatchCount,
      replays,
      totalWatchedSeconds,
      uniqueViewers,
      playCount,
      completedCount: ended.length,
    };
  }, [playback, category, videoDurationSeconds]);

  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-md shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{fileName}</CardTitle>
              <CardDescription>
                Deep analytics -{' '}
                {category === 'pdf' && 'per-page engagement, updated in real time.'}
                {category === 'video' && 'playback heatmap with replays, updated in real time.'}
                {category === 'other' && 'no deep analytics for this file type.'}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : category === 'pdf' ? (
          <PdfPageBars stats={pdfStats!} />
        ) : category === 'video' ? (
          <VideoHeatmap stats={videoStats!} />
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            This file type does not support page-level or playback analytics.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PDF Per-page Bar Chart ──────────────────────────────────────────────────

type PdfPageRow = {
  page: number;
  totalSeconds: number;
  viewerCount: number;
  relativeWidth: number;
};
type PdfStats = {
  rows: PdfPageRow[];
  totalSecondsAllPages: number;
  topPage: PdfPageRow | null;
};

function PdfPageBars({ stats }: { stats: PdfStats }) {
  if (stats.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No page-view data yet. As soon as a visitor scrolls through this PDF, bars will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 pb-3 border-b">
        <Stat label="Total reading time" value={formatSeconds(stats.totalSecondsAllPages)} />
        <Stat label="Pages with engagement" value={`${stats.rows.length}`} />
        <Stat
          label="Most-read page"
          value={
            stats.topPage
              ? `Page ${stats.topPage.page} · ${formatSeconds(stats.topPage.totalSeconds)}`
              : '-'
          }
        />
      </div>

      <div className="space-y-1.5">
        {stats.rows.map((r) => (
          <div key={r.page} className="flex items-center gap-3">
            <div className="w-16 shrink-0 text-xs font-mono text-muted-foreground">
              Page {r.page}
            </div>
            <div className="flex-1 relative h-7 bg-gray-100 rounded">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded transition-all"
                style={{ width: `${Math.max(2, r.relativeWidth)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                <span className="font-medium text-white drop-shadow-sm">
                  {formatSeconds(r.totalSeconds)}
                </span>
                <span className="text-muted-foreground">
                  {r.viewerCount} viewer{r.viewerCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Video Heatmap + Replay Markers ──────────────────────────────────────────

type VideoStats = {
  duration: number;
  buckets: number;
  watchedPerBucket: number[];
  maxWatchCount: number;
  replays: PlaybackEvent[];
  totalWatchedSeconds: number;
  uniqueViewers: number;
  playCount: number;
  completedCount: number;
};

function VideoHeatmap({ stats }: { stats: VideoStats }) {
  if (stats.playCount === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No playback events yet. As soon as a visitor plays this video, the heatmap and replay markers appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 pb-3 border-b">
        <Stat label="Unique viewers" value={`${stats.uniqueViewers}`} />
        <Stat label="Total play sessions" value={`${stats.playCount}`} />
        <Stat label="Total watch time" value={formatSeconds(stats.totalWatchedSeconds)} />
        <Stat label="Completed views" value={`${stats.completedCount}`} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Playback heatmap
          </span>
          <span className="text-xs text-muted-foreground">
            0:00 to {formatSeconds(stats.duration)}
          </span>
        </div>

        {/* Heatmap row: each bucket's height/color shows replay frequency */}
        <div className="relative">
          <div className="flex items-end h-20 bg-gray-50 rounded border border-gray-200 overflow-hidden">
            {stats.watchedPerBucket.map((count, i) => {
              const intensity = count / stats.maxWatchCount;
              const heightPct = Math.max(8, intensity * 100);
              const bg = count === 0
                ? 'bg-gray-200'
                : intensity > 0.66
                  ? 'bg-red-500'
                  : intensity > 0.33
                    ? 'bg-orange-400'
                    : 'bg-blue-400';
              return (
                <div
                  key={i}
                  className={`flex-1 ${bg} transition-all`}
                  style={{ height: `${heightPct}%` }}
                  title={`Watched ${count}× · ${formatSeconds((i / stats.buckets) * stats.duration)}`}
                />
              );
            })}
          </div>

          {/* Replay markers - arrows pointing where visitors jumped backward */}
          {stats.replays.length > 0 && (
            <div className="relative h-6 mt-1">
              {stats.replays.map((r) => {
                if (r.range_start == null || r.range_end == null) return null;
                const fromPct = (r.range_start / stats.duration) * 100;
                const toPct = (r.range_end / stats.duration) * 100;
                return (
                  <div
                    key={r.id}
                    className="absolute top-0"
                    style={{ left: `${toPct}%`, width: `${Math.abs(fromPct - toPct)}%` }}
                    title={`Replay: jumped from ${formatSeconds(r.range_start)} back to ${formatSeconds(r.range_end)}`}
                  >
                    <Rewind className="h-3 w-3 text-purple-600" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-blue-400 rounded-sm" />Watched</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-orange-400 rounded-sm" />Watched 2×+</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-red-500 rounded-sm" />Hot zone</span>
            <span className="flex items-center gap-1"><Rewind className="h-3 w-3 text-purple-600" />Replay</span>
          </div>
          <span>Updates live</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}
