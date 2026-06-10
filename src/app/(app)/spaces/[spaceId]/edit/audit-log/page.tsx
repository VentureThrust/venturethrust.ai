'use client';

/**
 * Audit log - real-time chronological feed of everything that happens
 * in a space, merged from three Supabase tables:
 *
 *   - viewer_sessions  → "Visitor entered" / "Viewed [file]"
 *   - files            → "File uploaded"
 *   - questions        → "Question asked" (and answered_at → "Answered")
 *
 * Each table is subscribed via Supabase Realtime so the page stays in
 * sync without polling - events appear within a second of the underlying
 * row insert/update. Grouped into Today / Yesterday / older buckets.
 *
 * Replaces the previous mock data that was hardcoded with "Sharda Borkar"
 * and "Jackson Lee" - none of which existed.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Download,
  LogIn,
  Upload,
  FileText,
  HelpCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFileTypeStyle } from '@/lib/file-icons';

// ─── Event model ──────────────────────────────────────────────────────────────

type EventKind = 'session_start' | 'file_uploaded' | 'question_asked' | 'question_answered';

type AuditEvent = {
  id: string;
  kind: EventKind;
  at: Date;
  /** Who did it - visitor email (or "Anonymous") or owner email. */
  actorEmail: string;
  /** Optional resource the event happened on (file name, etc). */
  resourceName?: string;
  /** Optional description / question body. */
  detail?: string;
};

// ─── Icon + label per event kind ──────────────────────────────────────────────

function eventMeta(kind: EventKind): {
  Icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
} {
  switch (kind) {
    case 'session_start':
      return { Icon: LogIn, iconClass: 'text-green-600', label: 'Visitor entered space' };
    case 'file_uploaded':
      return { Icon: Upload, iconClass: 'text-blue-600', label: 'File uploaded' };
    case 'question_asked':
      return { Icon: HelpCircle, iconClass: 'text-amber-600', label: 'Question asked' };
    case 'question_answered':
      return { Icon: MessageSquare, iconClass: 'text-purple-600', label: 'Question answered' };
  }
}

// ─── Day bucket helpers ───────────────────────────────────────────────────────

function dayLabel(d: Date): string {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d');
}

function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const params = useParams();
  const spaceId = params.spaceId as string;

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<EventKind | 'all'>('all');

  // ── Initial load - merge three tables ────────────────────────────────────
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;

    const load = async () => {
      const [{ data: sessions }, { data: files }, { data: questions }] = await Promise.all([
        supabase
          .from('viewer_sessions')
          .select('id, visitor_email, started_at, current_file_name')
          .eq('space_id', spaceId)
          .order('started_at', { ascending: false }),
        supabase
          .from('files')
          .select('id, name, created_at')
          .eq('space_id', spaceId)
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('id, visitor_email, body, file_name, created_at, answered_at, answer_body')
          .eq('space_id', spaceId)
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;

      const merged: AuditEvent[] = [];

      for (const s of (sessions ?? []) as { id: string; visitor_email: string | null; started_at: string; current_file_name: string | null }[]) {
        merged.push({
          id: `session:${s.id}`,
          kind: 'session_start',
          at: new Date(s.started_at),
          actorEmail: s.visitor_email ?? 'Anonymous',
          resourceName: s.current_file_name ?? undefined,
        });
      }

      for (const f of (files ?? []) as { id: string; name: string; created_at: string }[]) {
        merged.push({
          id: `file:${f.id}`,
          kind: 'file_uploaded',
          at: new Date(f.created_at),
          actorEmail: 'Owner',
          resourceName: f.name,
        });
      }

      for (const q of (questions ?? []) as { id: string; visitor_email: string | null; body: string; file_name: string | null; created_at: string; answered_at: string | null; answer_body: string | null }[]) {
        merged.push({
          id: `question:${q.id}`,
          kind: 'question_asked',
          at: new Date(q.created_at),
          actorEmail: q.visitor_email ?? 'Anonymous',
          resourceName: q.file_name ?? undefined,
          detail: q.body,
        });
        if (q.answered_at) {
          merged.push({
            id: `answer:${q.id}`,
            kind: 'question_answered',
            at: new Date(q.answered_at),
            actorEmail: 'Owner',
            resourceName: q.file_name ?? undefined,
            detail: q.answer_body ?? undefined,
          });
        }
      }

      merged.sort((a, b) => b.at.getTime() - a.at.getTime());
      setEvents(merged);
      setIsLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [spaceId]);

  // ── Realtime subscription - three channels, one per table ─────────────────
  useEffect(() => {
    if (!spaceId) return;

    const sessionChan = supabase
      .channel(`audit:sessions:${spaceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'viewer_sessions',
        filter: `space_id=eq.${spaceId}`,
      }, payload => {
        const s = payload.new as { id: string; visitor_email: string | null; started_at: string; current_file_name: string | null };
        setEvents(prev => prependDistinct(prev, {
          id: `session:${s.id}`,
          kind: 'session_start',
          at: new Date(s.started_at),
          actorEmail: s.visitor_email ?? 'Anonymous',
          resourceName: s.current_file_name ?? undefined,
        }));
      })
      .subscribe();

    const fileChan = supabase
      .channel(`audit:files:${spaceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'files',
        filter: `space_id=eq.${spaceId}`,
      }, payload => {
        const f = payload.new as { id: string; name: string; created_at: string };
        setEvents(prev => prependDistinct(prev, {
          id: `file:${f.id}`,
          kind: 'file_uploaded',
          at: new Date(f.created_at),
          actorEmail: 'Owner',
          resourceName: f.name,
        }));
      })
      .subscribe();

    const questionChan = supabase
      .channel(`audit:questions:${spaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'questions',
        filter: `space_id=eq.${spaceId}`,
      }, payload => {
        const q = payload.new as { id: string; visitor_email: string | null; body: string; file_name: string | null; created_at: string; answered_at: string | null; answer_body: string | null };
        if (payload.eventType === 'INSERT') {
          setEvents(prev => prependDistinct(prev, {
            id: `question:${q.id}`,
            kind: 'question_asked',
            at: new Date(q.created_at),
            actorEmail: q.visitor_email ?? 'Anonymous',
            resourceName: q.file_name ?? undefined,
            detail: q.body,
          }));
        }
        if (payload.eventType === 'UPDATE' && q.answered_at) {
          setEvents(prev => prependDistinct(prev, {
            id: `answer:${q.id}`,
            kind: 'question_answered',
            at: new Date(q.answered_at!),
            actorEmail: 'Owner',
            resourceName: q.file_name ?? undefined,
            detail: q.answer_body ?? undefined,
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChan);
      supabase.removeChannel(fileChan);
      supabase.removeChannel(questionChan);
    };
  }, [spaceId]);

  // ── Filter + group by day ─────────────────────────────────────────────────
  const filtered = useMemo(
    () => kindFilter === 'all' ? events : events.filter(e => e.kind === kindFilter),
    [events, kindFilter],
  );

  const grouped = useMemo(() => {
    const buckets = new Map<string, { label: string; events: AuditEvent[] }>();
    for (const e of filtered) {
      const k = dayKey(e.at);
      if (!buckets.has(k)) buckets.set(k, { label: dayLabel(e.at), events: [] });
      buckets.get(k)!.events.push(e);
    }
    return Array.from(buckets.values());
  }, [filtered]);

  // ── Download CSV ──────────────────────────────────────────────────────────
  const handleDownload = () => {
    const rows = [
      ['Timestamp', 'Activity', 'Actor', 'Resource', 'Detail'],
      ...filtered.map(e => {
        const { label } = eventMeta(e.kind);
        return [
          e.at.toISOString(),
          label,
          e.actorEmail,
          e.resourceName ?? '',
          (e.detail ?? '').replace(/\n/g, ' '),
        ];
      }),
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${spaceId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Real-time activity in this space: visitor sessions, file uploads, questions. Updates live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {kindFilter === 'all' ? 'All activity' : eventMeta(kindFilter).label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setKindFilter('all')}>All activity</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKindFilter('session_start')}>Visitor sessions</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKindFilter('file_uploaded')}>File uploads</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKindFilter('question_asked')}>Questions asked</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setKindFilter('question_answered')}>Questions answered</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />

      {/* Loading / empty / list ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No activity recorded yet. Events will appear here in real time as visitors interact with this space.
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {grouped.map(group => (
            <section key={group.label}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pb-3">
                {group.label}
              </h2>
              <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />
              <div className="divide-y divide-gray-100">
                {group.events.map(e => <EventRow key={e.id} event={e} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single audit row ─────────────────────────────────────────────────────────

function EventRow({ event }: { event: AuditEvent }) {
  const { Icon, iconClass, label } = eventMeta(event.kind);
  const actor = event.actorEmail;
  const initial = (actor === 'Owner' ? 'O' : actor[0] ?? '?').toUpperCase();
  const isOwner = actor === 'Owner';

  return (
    <div className="grid grid-cols-[100px_1fr_auto] items-center gap-6 py-4">
      {/* Time + date */}
      <div className="text-sm">
        <div className="font-mono font-semibold tabular-nums">{format(event.at, 'h:mm a')}</div>
        <div className="text-xs text-muted-foreground mt-0.5" title={format(event.at, 'PPpp')}>
          {formatDistanceToNow(event.at, { addSuffix: true })}
        </div>
      </div>

      {/* Activity + resource */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('h-9 w-9 rounded-md bg-muted/60 flex items-center justify-center shrink-0', iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {event.resourceName && (() => {
            const isFileEvent = event.kind === 'file_uploaded';
            const { Icon: FileIcon, text: fileColor } = isFileEvent
              ? getFileTypeStyle(event.resourceName)
              : { Icon: FileText, text: 'text-muted-foreground' };
            return (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 min-w-0">
                <FileIcon className={cn('h-3.5 w-3.5 shrink-0', fileColor)} />
                <span className="truncate" title={event.resourceName}>{event.resourceName}</span>
              </div>
            );
          })()}
          {event.detail && !event.resourceName && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-md" title={event.detail}>
              {event.detail}
            </div>
          )}
        </div>
      </div>

      {/* Actor */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn(
            'text-xs font-semibold',
            isOwner ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-700',
          )}>
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="text-right">
          <div className="text-sm font-medium">{isOwner ? 'You' : actor}</div>
          <div className="text-xs text-muted-foreground">{isOwner ? 'Space owner' : 'Visitor'}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prependDistinct(list: AuditEvent[], next: AuditEvent): AuditEvent[] {
  if (list.some(e => e.id === next.id)) return list;
  return [next, ...list];
}
