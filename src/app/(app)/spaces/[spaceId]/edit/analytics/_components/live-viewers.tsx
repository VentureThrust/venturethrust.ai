'use client';

/**
 * LiveViewers - editorial-style analytics overview.
 *
 * Three sections stacked top-to-bottom, separated by horizontal rules
 * (NO card wrappers - the user explicitly didn't want "AI template"
 * card-heavy layout):
 *
 *   1. Currently active viewers (real-time + heartbeat)
 *   2. Recent visitor sessions (first 5 + see-more)
 *   3. Visitors grouped by email - click a visitor expands to their
 *      sessions. Click a session calls `onSelectSession` so the parent
 *      can swap the overview for a dedicated session-detail view.
 *
 * Color-coded throughout - green for live, indigo/purple/red etc. for
 * file types via @/lib/file-icons.
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye, Laptop, FileText, Users as UsersIcon,
  Smartphone, Tablet, MapPin, ChevronDown, ChevronRight,
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

// ─── Device icon ──────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string | null }) {
  const d = (device ?? '').toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return <Smartphone className="h-3.5 w-3.5" />;
  if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="h-3.5 w-3.5" />;
  return <Laptop className="h-3.5 w-3.5" />;
}

// ─── Section header - replaces <CardHeader>/<CardTitle>/<CardDescription> ─────

function SectionHeader({
  icon: Icon,
  title,
  count,
  description,
  iconClassName,
  accessory,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  count?: number;
  description?: React.ReactNode;
  iconClassName?: string;
  accessory?: React.ReactNode;
}) {
  return (
    <div className="pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Icon className={cn('h-5 w-5', iconClassName ?? 'text-muted-foreground')} />
          <h2 className="text-xl font-medium tracking-tight">{title}</h2>
          {count !== undefined && (
            <Badge variant="secondary" className="ml-1 text-sm font-medium">
              {count}
            </Badge>
          )}
        </div>
        {accessory}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
      )}
    </div>
  );
}

// ─── Visitor row (inside the Visitors section) ───────────────────────────────

function VisitorRow({
  email,
  sessions,
  onSelectSession,
}: {
  email: string;
  sessions: ViewerSession[];
  onSelectSession: (session: ViewerSession) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lastSession = sessions[0];
  const lastDuration = sessionDuration(lastSession);
  const displayEmail = email === 'anonymous' ? 'Anonymous' : email;
  const initial = displayEmail[0].toUpperCase();

  return (
    <>
      {/* Visitor summary row (clickable to expand session list) */}
      <div
        className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors -mx-2 px-2 rounded-md"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-sm bg-blue-100 text-blue-700 font-semibold">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold text-base leading-tight truncate">{displayEmail}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="text-base text-muted-foreground whitespace-nowrap min-w-[140px] text-right">
          {formatDistanceToNow(new Date(lastSession.started_at), { addSuffix: true })}
        </div>
        <div className="font-mono text-base tabular-nums whitespace-nowrap min-w-[80px] text-right">
          {formatDuration(lastDuration)}
        </div>
        <div className="w-6 text-right">
          {expanded
            ? <ChevronDown className="h-5 w-5 text-muted-foreground" />
            : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>

      {/* Sessions list - each one opens the dedicated session view on click */}
      {expanded && (
        <div className="bg-muted/20 -mx-2 px-2">
          {sessions.map((s, idx) => {
            const dur = sessionDuration(s);
            const isLast = idx === sessions.length - 1;
            return (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-4 py-3 pl-14 pr-2 cursor-pointer hover:bg-muted/40 transition-colors',
                  !isLast && 'border-b border-gray-100'
                )}
                onClick={() => onSelectSession(s)}
              >
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium flex-1 truncate">
                  {format(new Date(s.started_at), 'MMM d, h:mm a')}
                </span>
                <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[120px] text-right">
                  {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
                </span>
                <span className="font-mono text-sm tabular-nums whitespace-nowrap min-w-[80px] text-right">
                  {formatDuration(dur)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Thin divider between visitors */}
      <div className="border-b border-gray-200" />
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LiveViewers({
  spaceId,
  onSelectSession,
}: {
  spaceId: string;
  /** Files prop kept for backward-compat; no longer used here since session
   *  drilldown moved to the dedicated SessionDetailView. */
  files?: FileWithVisits[];
  /** Fires when the owner clicks a specific session row - parent swaps the
   *  analytics overview for a dedicated session view. */
  onSelectSession: (session: ViewerSession) => void;
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
      <div className="py-10 text-center text-muted-foreground text-sm">
        Loading session data…
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── 1. Currently active ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-3 flex-wrap pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {active.length > 0 && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              )}
              <span className={cn('relative inline-flex h-3 w-3 rounded-full',
                active.length > 0 ? 'bg-green-500' : 'bg-gray-300')} />
            </span>
            <h2 className="text-xl font-medium tracking-tight">
              {active.length > 0
                ? `${active.length} viewer${active.length > 1 ? 's' : ''} currently inside`
                : 'No viewers right now'}
            </h2>
          </div>
          <Badge variant="outline" className="text-xs gap-1 border-green-300 text-green-700 bg-green-50">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            LIVE
          </Badge>
        </div>
        <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />
        {active.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">
            Heartbeats fire every 5 seconds. When someone opens this space&apos;s share link, they&apos;ll show up here in real time.
          </p>
        )}
        {active.length > 0 && (
          <div className="divide-y divide-gray-100">
            {active.map(s => {
              const elapsed = Math.floor((now - new Date(s.started_at).getTime()) / 1000);
              return (
                <div key={s.id} className="flex items-center gap-3 py-4">
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-600 text-white text-sm font-semibold">
                        {(s.visitor_email ?? 'A')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base truncate">{s.visitor_email ?? 'Anonymous viewer'}</span>
                      <Badge variant="outline" className="text-xs py-0 h-5 border-green-300 text-green-700 bg-white">Active</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      {s.current_file_name ? (() => {
                        const { Icon, text } = getFileTypeStyle(s.current_file_name);
                        return (
                          <span className="flex items-center gap-1.5 truncate min-w-0">
                            <Icon className={cn('h-4 w-4 shrink-0', text)} />
                            Viewing: <span className="font-medium text-foreground ml-1">{s.current_file_name}</span>
                          </span>
                        );
                      })() : (
                        <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Browsing space</span>
                      )}
                      {s.location && (
                        <span className="flex items-center gap-1.5 shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-rose-500" />{s.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-base tabular-nums text-green-700">{formatDuration(elapsed)}</div>
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-0.5">
                      <DeviceIcon device={s.device} />{s.device ?? 'Unknown'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 2. Recent visitor sessions ──────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={UsersIcon}
          iconClassName="text-blue-600"
          title="Recent visitor sessions"
          count={past.length}
          description="Click any row to open the full session and see which files were opened."
        />
        <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />
        {past.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-sm">No completed visits yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_1fr] gap-4 py-3 text-sm text-muted-foreground uppercase tracking-wider font-semibold border-b border-gray-100">
              <div>Visitor</div>
              <div>Last file</div>
              <div>Duration</div>
              <div>Device</div>
              <div>Location</div>
              <div className="text-right">When</div>
            </div>
            <div className="divide-y divide-gray-100">
              {displayedSessions.map(s => {
                const duration = sessionDuration(s);
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_1fr] gap-4 py-4 items-center hover:bg-muted/30 transition-colors cursor-pointer -mx-2 px-2 rounded-md"
                    onClick={() => onSelectSession(s)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                          {(s.visitor_email ?? 'A')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium text-sm">{s.visitor_email ?? 'Anonymous'}</span>
                    </div>
                    <div className="min-w-0">
                      {s.current_file_name ? (() => {
                        const { Icon, text } = getFileTypeStyle(s.current_file_name);
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={cn('h-4 w-4 shrink-0', text)} />
                            <span className="truncate text-sm" title={s.current_file_name}>{s.current_file_name}</span>
                          </div>
                        );
                      })() : <span className="text-sm text-muted-foreground">-</span>}
                    </div>
                    <div className="font-mono text-sm tabular-nums">{formatDuration(duration)}</div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <DeviceIcon device={s.device} />{s.device ?? '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {s.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                          <span className="truncate" title={s.location}>{s.location}</span>
                        </span>
                      ) : '-'}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{format(new Date(s.started_at), 'MMM d, h:mm a')}</div>
                      <div className="text-xs">
                        {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {past.length > INITIAL_SESSION_COUNT && (
              <div className="mt-4 pt-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllSessions(p => !p)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllSessions ? 'rotate-180' : ''}`} />
                  {showAllSessions ? 'Show less' : `See ${hiddenCount} more session${hiddenCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── 3. Visitors - grouped by email ──────────────────────────────── */}
      {visitorGroups.length > 0 && (
        <section>
          <SectionHeader
            icon={UsersIcon}
            iconClassName="text-purple-600"
            title="Visitors"
            count={visitorGroups.length}
            description="Click a visitor to expand their sessions. Click a session to see which files were opened and how long was spent on each."
          />
          <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-6 py-3 text-sm text-muted-foreground uppercase tracking-wider font-semibold border-b border-gray-100">
            <div>Visitor</div>
            <div className="text-right min-w-[140px]">Last visited</div>
            <div className="text-right min-w-[80px]">Time (last visit)</div>
            <div className="w-6" />
          </div>
          {visitorGroups.map(([email, ss]) => (
            <VisitorRow key={email} email={email} sessions={ss} onSelectSession={onSelectSession} />
          ))}
        </section>
      )}

    </div>
  );
}
