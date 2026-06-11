'use client';

/**
 * LiveViewers - the analytics overview sections, redesigned as premium cards:
 *
 *   1. Live now            (realtime + heartbeat; green is reserved for live)
 *   2. Recent sessions     (table card, first 5 + see more)
 *   3. Visitors            (grouped by email; expand to sessions; click a
 *                           session and the parent opens SessionDetailView)
 *
 * White rounded cards, quiet gray chrome, one blue accent, tabular numbers.
 * All data logic (fetch, realtime channel, grouping) is unchanged.
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Eye, Laptop, Smartphone, Tablet, MapPin, ChevronDown, ChevronRight,
  Users as UsersIcon, Radio,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFileTypeStyle } from '@/lib/file-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewerSession = {
  id: string;
  space_id: string;
  visitor_email: string | null;
  device: string | null;
  location: string | null;
  current_file_id: string | null;
  current_file_name: string | null;
  started_at: string;
  last_heartbeat: string;
  ended_at: string | null;
  total_seconds: number | null;
};

type FileVisit = {
  email: string;
  device: string;
  timeSpent: number;
  openedAt: string;
};

export type FileWithVisits = {
  id: string;
  name: string;
  type?: string;
  visits: FileVisit[] | null;
};

const ACTIVE_WINDOW_MS = 15_000;
const INITIAL_SESSION_COUNT = 5;
const BLUE = '#4285F4';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function sessionDuration(s: ViewerSession): number {
  const end = s.ended_at
    ? new Date(s.ended_at).getTime()
    : new Date(s.last_heartbeat).getTime();
  return Math.max(0, Math.floor((end - new Date(s.started_at).getTime()) / 1000));
}

export type SessionFile = {
  fileId: string;
  fileName: string;
  fileType: string;
  timeSpent: number;
  openCount: number;
};

/** Files a visitor opened during one session: matches each file's visit log by
 *  the session's email + time window. Highest attention (most time) first. */
export function getSessionFiles(session: ViewerSession, files: FileWithVisits[]): SessionFile[] {
  const start = new Date(session.started_at).getTime();
  const end = session.ended_at
    ? new Date(session.ended_at).getTime()
    : new Date(session.last_heartbeat).getTime() + ACTIVE_WINDOW_MS;

  const result: SessionFile[] = [];
  for (const file of files) {
    const matches = (file.visits ?? []).filter(v => {
      const emailMatch =
        v.email === (session.visitor_email ?? 'anonymous') ||
        (session.visitor_email === null && (!v.email || v.email === 'anonymous'));
      if (!emailMatch) return false;
      const t = new Date(v.openedAt).getTime();
      return t >= start && t <= end;
    });
    if (matches.length > 0) {
      result.push({
        fileId: file.id,
        fileName: file.name,
        fileType: file.type ?? '',
        timeSpent: matches.reduce((s, v) => s + (v.timeSpent || 0), 0),
        openCount: matches.length,
      });
    }
  }
  return result.sort((a, b) => b.timeSpent - a.timeSpent);
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string | null }) {
  const d = (device ?? '').toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return <Smartphone className="h-3.5 w-3.5" />;
  if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="h-3.5 w-3.5" />;
  return <Laptop className="h-3.5 w-3.5" />;
}

function CountChip({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-gray-500">
      {n}
    </span>
  );
}

function CardHeader({
  icon: Icon,
  title,
  description,
  right,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
      </div>
      {right}
    </div>
  );
}

// ─── Visitor row (inside the Visitors card) ───────────────────────────────────

function VisitorRow({
  email,
  sessions,
  files,
  onSelectSession,
  onSelectFile,
}: {
  email: string;
  sessions: ViewerSession[];
  files: FileWithVisits[];
  onSelectSession: (session: ViewerSession) => void;
  onSelectFile?: (file: { id: string; name: string; type: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lastSession = sessions[0];
  const displayEmail = email === 'anonymous' ? 'Anonymous' : email;
  const initial = displayEmail[0].toUpperCase();
  const totalSeconds = sessions.reduce((sum, s) => sum + sessionDuration(s), 0);

  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50"
        onClick={() => setExpanded(p => !p)}
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-[#F0F5FF] text-sm font-semibold" style={{ color: BLUE }}>
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900">{displayEmail}</div>
          <div className="mt-0.5 text-xs text-gray-400">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {formatDuration(totalSeconds)} total
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <div className="text-xs text-gray-400">
            last visit {formatDistanceToNow(new Date(lastSession.started_at), { addSuffix: true })}
          </div>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-gray-300 transition-transform', expanded && 'rotate-180')}
        />
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4">
          {sessions.map((s) => {
            const dur = sessionDuration(s);
            const sessionFiles = getSessionFiles(s, files);
            const maxTime = Math.max(1, ...sessionFiles.map(f => f.timeSpent));
            return (
              <div key={s.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {/* Session header: when + duration; opens the full session view */}
                <div
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 transition-colors hover:bg-gray-50"
                  onClick={() => onSelectSession(s)}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BLUE }} />
                  <span className="flex-1 truncate text-[13px] font-semibold text-gray-800">
                    {format(new Date(s.started_at), 'MMM d, h:mm a')}
                  </span>
                  <span className="hidden text-xs text-gray-400 sm:block">
                    {sessionFiles.length} file{sessionFiles.length === 1 ? '' : 's'} viewed
                  </span>
                  <span className="text-[13px] font-medium tabular-nums text-gray-700">
                    {formatDuration(dur)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                </div>

                {/* What was viewed in this session, most attention first */}
                {sessionFiles.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">No file activity recorded in this visit.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {sessionFiles.map(f => {
                      const { Icon, text } = getFileTypeStyle(f.fileName);
                      const ext = f.fileName.toLowerCase().split('.').pop() ?? '';
                      const isPdf = ext === 'pdf' || (f.fileType ?? '').includes('pdf');
                      const isVideo =
                        ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext) ||
                        (f.fileType ?? '').startsWith('video/');
                      const drillable = (isPdf || isVideo) && !!onSelectFile;
                      return (
                        <button
                          key={f.fileId}
                          disabled={!drillable}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (drillable) onSelectFile!({ id: f.fileId, name: f.fileName, type: f.fileType });
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 px-4 py-2 text-left',
                            drillable ? 'cursor-pointer transition-colors hover:bg-gray-50' : 'cursor-default',
                          )}
                        >
                          <Icon className={cn('h-3.5 w-3.5 shrink-0', text)} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-[13px] font-medium text-gray-800">{f.fileName}</span>
                              <span className="shrink-0 text-[12px] tabular-nums text-gray-500">
                                {formatDuration(f.timeSpent)}
                              </span>
                            </div>
                            <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.max(6, (f.timeSpent / maxTime) * 100)}%`, background: BLUE }}
                              />
                            </div>
                          </div>
                          {isPdf && (
                            <span className="shrink-0 text-[10px] font-medium text-gray-400">
                              {drillable ? 'Pages' : 'PDF'}
                            </span>
                          )}
                          {drillable && <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LiveViewers({
  spaceId,
  files = [],
  onSelectSession,
  onSelectFile,
}: {
  spaceId: string;
  /** Space files with their visit logs - used to show, inside each visitor's
   *  expanded sessions, which files were viewed and for how long. */
  files?: FileWithVisits[];
  /** Fires when the owner clicks a specific session row - parent swaps the
   *  analytics overview for a dedicated session view. */
  onSelectSession: (session: ViewerSession) => void;
  /** Fires when a PDF/video inside a session breakdown is clicked - parent
   *  opens the per page / playback drilldown. */
  onSelectFile?: (file: { id: string; name: string; type: string }) => void;
}) {
  const [sessions, setSessions] = useState<ViewerSession[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!spaceId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setup = async () => {
      const { data, error } = await supabase
        .from('viewer_sessions')
        .select('*')
        .eq('space_id', spaceId)
        .order('started_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.warn('[viewer_sessions] table not available - live tracking offline.');
        setIsLoading(false);
        return;
      }

      setSessions((data ?? []) as ViewerSession[]);
      setIsLoading(false);

      channel = supabase
        .channel(`viewer_sessions:${spaceId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'viewer_sessions',
          filter: `space_id=eq.${spaceId}`,
        }, payload => {
          if (payload.eventType === 'INSERT') {
            setSessions(prev => [payload.new as ViewerSession, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev =>
              prev.map(s => s.id === (payload.new as ViewerSession).id
                ? (payload.new as ViewerSession) : s)
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id;
            if (oldId) setSessions(prev => prev.filter(s => s.id !== oldId));
          }
        })
        .subscribe();
    };

    setup();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [spaceId]);

  // Tick every second for live durations
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Split active vs past
  const { active, past } = useMemo(() => {
    const a: ViewerSession[] = [];
    const p: ViewerSession[] = [];
    for (const s of sessions) {
      const lastBeat = new Date(s.last_heartbeat).getTime();
      (!s.ended_at && now - lastBeat < ACTIVE_WINDOW_MS ? a : p).push(s);
    }
    return { active: a, past: p };
  }, [sessions, now]);

  // Group past sessions by email for the Visitors section
  const visitorGroups = useMemo(() => {
    const map = new Map<string, ViewerSession[]>();
    for (const s of past) {
      const key = s.visitor_email ?? 'anonymous';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    for (const [, ss] of map) {
      ss.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }
    return Array.from(map.entries()).sort(
      (a, b) => new Date(b[1][0].started_at).getTime() - new Date(a[1][0].started_at).getTime(),
    );
  }, [past]);

  const displayedSessions = showAllSessions ? past : past.slice(0, INITIAL_SESSION_COUNT);
  const hiddenCount = past.length - INITIAL_SESSION_COUNT;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-muted-foreground shadow-sm">
        Loading session data…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── 1. Live now ──────────────────────────────────────────────────── */}
      <section
        className={cn(
          'overflow-hidden rounded-xl border shadow-sm',
          active.length > 0 ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-white',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {active.length > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              )}
              <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full',
                active.length > 0 ? 'bg-green-500' : 'bg-gray-300')} />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              {active.length > 0
                ? `Live now · ${active.length} viewer${active.length > 1 ? 's' : ''}`
                : 'Live now'}
            </h2>
          </div>
          <span className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            active.length > 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400',
          )}>
            <Radio className="h-3 w-3" /> LIVE
          </span>
        </div>

        {active.length === 0 ? (
          <p className="border-t border-gray-100 px-5 py-4 text-sm text-gray-400">
            No one is inside right now. Visitors appear here the moment they open your link.
          </p>
        ) : (
          <div className="divide-y divide-green-100 border-t border-green-100">
            {active.map(s => {
              const elapsed = Math.floor((now - new Date(s.started_at).getTime()) / 1000);
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-green-600 text-sm font-semibold text-white">
                        {(s.visitor_email ?? 'A')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {s.visitor_email ?? 'Anonymous viewer'}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      {s.current_file_name ? (() => {
                        const { Icon, text } = getFileTypeStyle(s.current_file_name);
                        return (
                          <span className="flex min-w-0 items-center gap-1.5 truncate">
                            <Icon className={cn('h-3.5 w-3.5 shrink-0', text)} />
                            <span className="truncate">{s.current_file_name}</span>
                          </span>
                        );
                      })() : (
                        <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Browsing the space</span>
                      )}
                      {s.location && (
                        <span className="flex shrink-0 items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />{s.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums text-green-700">{formatDuration(elapsed)}</div>
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-gray-400">
                      <DeviceIcon device={s.device} />{s.device ?? 'Unknown'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 2. Recent sessions ───────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader
          icon={Eye}
          title="Recent sessions"
          description="Every visit, most recent first. Open one to see exactly what they viewed."
          right={<CountChip n={past.length} />}
        />
        {past.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            No completed visits yet. Share your link to start tracking.
          </p>
        ) : (
          <>
            <div className="hidden grid-cols-[1.5fr_1.2fr_0.7fr_0.8fr_1fr] gap-4 border-b border-gray-100 bg-gray-50/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 md:grid">
              <div>Visitor</div>
              <div>Last file</div>
              <div>Duration</div>
              <div>Device</div>
              <div className="text-right">When</div>
            </div>
            <div className="divide-y divide-gray-50">
              {displayedSessions.map(s => {
                const duration = sessionDuration(s);
                return (
                  <div
                    key={s.id}
                    className="grid cursor-pointer grid-cols-[1.5fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 md:grid-cols-[1.5fr_1.2fr_0.7fr_0.8fr_1fr] md:gap-4"
                    onClick={() => onSelectSession(s)}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-[#F0F5FF] text-xs font-semibold" style={{ color: BLUE }}>
                          {(s.visitor_email ?? 'A')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium text-gray-900">
                        {s.visitor_email ?? 'Anonymous'}
                      </span>
                    </div>
                    <div className="hidden min-w-0 md:block">
                      {s.current_file_name ? (() => {
                        const { Icon, text } = getFileTypeStyle(s.current_file_name);
                        return (
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Icon className={cn('h-3.5 w-3.5 shrink-0', text)} />
                            <span className="truncate text-[13px] text-gray-600" title={s.current_file_name}>
                              {s.current_file_name}
                            </span>
                          </div>
                        );
                      })() : <span className="text-[13px] text-gray-300">No file opened</span>}
                    </div>
                    <div className="hidden text-[13px] font-medium tabular-nums text-gray-700 md:block">
                      {formatDuration(duration)}
                    </div>
                    <div className="hidden items-center gap-1.5 text-[13px] text-gray-500 md:flex">
                      <DeviceIcon device={s.device} />{s.device ?? 'Unknown'}
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-gray-600">{format(new Date(s.started_at), 'MMM d, h:mm a')}</div>
                      <div className="text-[11px] text-gray-400">
                        {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {past.length > INITIAL_SESSION_COUNT && (
              <div className="border-t border-gray-100 py-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-gray-500 hover:text-gray-900"
                  onClick={() => setShowAllSessions(p => !p)}
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllSessions ? 'rotate-180' : ''}`} />
                  {showAllSessions ? 'Show less' : `See ${hiddenCount} more session${hiddenCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── 3. Visitors, grouped by email ────────────────────────────────── */}
      {visitorGroups.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader
            icon={UsersIcon}
            title="Visitors"
            description="Expand a visitor to see each visit, which files they opened, and where their attention went."
            right={<CountChip n={visitorGroups.length} />}
          />
          <div className="divide-y divide-gray-50">
            {visitorGroups.map(([email, ss]) => (
              <VisitorRow
                key={email}
                email={email}
                sessions={ss}
                files={files}
                onSelectSession={onSelectSession}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
