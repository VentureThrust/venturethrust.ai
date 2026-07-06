'use client';

/**
 * Workspace Audit Log - EVERYTHING that happened across all of the owner's
 * spaces, in one chronological feed:
 *
 *   - viewer_sessions → visitor entered / viewed a file
 *   - files           → file uploaded
 *   - questions       → question asked / answered
 *   - audit_logs      → owner actions (rename, delete, link created, ...)
 *
 * RLS scopes every query to the caller's accessible spaces, so no space
 * filter is needed. Refreshes silently every 10 seconds. Each row carries
 * the space it happened in; filter and CSV export included.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
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
  History,
  Layers,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFileTypeStyle } from '@/lib/file-icons';

type EventKind = 'session_start' | 'file_uploaded' | 'question_asked' | 'question_answered' | 'owner_action';

type AuditEvent = {
  id: string;
  kind: EventKind;
  at: Date;
  actorEmail: string;
  spaceName?: string;
  resourceName?: string;
  detail?: string;
  label?: string;
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  file_deleted: 'File deleted',
  folder_deleted: 'Folder deleted',
  space_deleted: 'Space deleted',
  item_renamed: 'Renamed',
  link_created: 'Link created',
  file_updated: 'File updated',
  file_request_created: 'File request created',
};

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
    case 'owner_action':
      return { Icon: FileText, iconClass: 'text-gray-700', label: 'Owner action' };
  }
}

function dayLabel(d: Date): string {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d');
}

function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export default function WorkspaceAuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<EventKind | 'all'>('all');

  const load = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      // Space names first, so every event can carry where it happened.
      const { data: spaceRows } = await supabase.from('spaces').select('id, name, title');
      const spaceName = new Map<string, string>();
      (spaceRows ?? []).forEach((s) => {
        spaceName.set(s.id as string, (s.name as string) || (s.title as string) || 'Untitled space');
      });
      const nameOf = (sid: unknown) => (sid ? spaceName.get(String(sid)) : undefined);

      const [{ data: sessions }, { data: files }, { data: questions }, { data: ownerActions }] = await Promise.all([
        supabase
          .from('viewer_sessions')
          .select('id, space_id, visitor_email, started_at, current_file_name')
          .order('started_at', { ascending: false })
          .limit(300),
        supabase
          .from('files')
          .select('id, space_id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('questions')
          .select('id, space_id, visitor_email, body, file_name, created_at, answered_at, answer_body')
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('audit_logs')
          .select('id, space_id, actor_email, action, resource_name, detail, created_at')
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

      const merged: AuditEvent[] = [];

      for (const s of (sessions ?? []) as Array<Record<string, unknown>>) {
        merged.push({
          id: `session:${s.id}`,
          kind: 'session_start',
          at: new Date(String(s.started_at)),
          actorEmail: (s.visitor_email as string) ?? 'Anonymous',
          spaceName: nameOf(s.space_id),
          resourceName: (s.current_file_name as string) ?? undefined,
        });
      }
      for (const f of (files ?? []) as Array<Record<string, unknown>>) {
        merged.push({
          id: `file:${f.id}`,
          kind: 'file_uploaded',
          at: new Date(String(f.created_at)),
          actorEmail: 'Owner',
          spaceName: nameOf(f.space_id),
          resourceName: (f.name as string) ?? undefined,
        });
      }
      for (const q of (questions ?? []) as Array<Record<string, unknown>>) {
        merged.push({
          id: `question:${q.id}`,
          kind: 'question_asked',
          at: new Date(String(q.created_at)),
          actorEmail: (q.visitor_email as string) ?? 'Anonymous',
          spaceName: nameOf(q.space_id),
          resourceName: (q.file_name as string) ?? undefined,
          detail: (q.body as string) ?? undefined,
        });
        if (q.answered_at) {
          merged.push({
            id: `answer:${q.id}`,
            kind: 'question_answered',
            at: new Date(String(q.answered_at)),
            actorEmail: 'Owner',
            spaceName: nameOf(q.space_id),
            resourceName: (q.file_name as string) ?? undefined,
            detail: (q.answer_body as string) ?? undefined,
          });
        }
      }
      for (const a of (ownerActions ?? []) as Array<Record<string, unknown>>) {
        merged.push({
          id: `audit:${a.id}`,
          kind: 'owner_action',
          at: new Date(String(a.created_at)),
          actorEmail: 'Owner',
          spaceName: nameOf(a.space_id),
          resourceName: (a.resource_name as string) ?? undefined,
          detail: (a.detail as string) ?? undefined,
          label: AUDIT_ACTION_LABELS[a.action as string] ?? (a.action as string),
        });
      }

      merged.sort((a, b) => b.at.getTime() - a.at.getTime());
      setEvents(merged);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep the feed fresh without realtime plumbing: silent refresh every 10s.
  useEffect(() => {
    const t = setInterval(() => { void load(true); }, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = useMemo(
    () => (kindFilter === 'all' ? events : events.filter((e) => e.kind === kindFilter)),
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

  const handleDownload = () => {
    const rows = [
      ['Timestamp', 'Activity', 'Actor', 'Space', 'Resource', 'Detail'],
      ...filtered.map((e) => {
        const { label } = eventMeta(e.kind);
        return [
          e.at.toISOString(),
          e.label ?? label,
          e.actorEmail,
          e.spaceName ?? '',
          e.resourceName ?? '',
          (e.detail ?? '').replace(/\n/g, ' '),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Everything that happened across all your spaces: visits, uploads, questions, and your own actions.
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
              <DropdownMenuItem onClick={() => setKindFilter('owner_action')}>Owner actions</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History className="mb-4 h-10 w-10 text-gray-300" />
          <p className="text-base font-semibold">No activity yet</p>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            Visits, uploads, questions, and your own actions across every space will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pb-3">
                {group.label}
              </h2>
              <div className="-mx-4 sm:-mx-6 border-t border-gray-200" />
              <div className="divide-y divide-gray-100">
                {group.events.map((e) => <EventRow key={e.id} event={e} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: AuditEvent }) {
  const { Icon, iconClass, label } = eventMeta(event.kind);
  const actor = event.actorEmail;
  const initial = (actor === 'Owner' ? 'O' : actor[0] ?? '?').toUpperCase();
  const isOwner = actor === 'Owner';

  return (
    <div className="grid grid-cols-[100px_1fr_auto] items-center gap-6 py-4">
      <div className="text-sm">
        <div className="font-mono font-semibold tabular-nums">{format(event.at, 'h:mm a')}</div>
        <div className="text-xs text-muted-foreground mt-0.5" title={format(event.at, 'PPpp')}>
          {formatDistanceToNow(event.at, { addSuffix: true })}
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('h-9 w-9 rounded-md bg-muted/60 flex items-center justify-center shrink-0', iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium">{event.label ?? label}</span>
            {event.spaceName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 shrink-0">
                <Layers className="h-3 w-3" />
                {event.spaceName}
              </span>
            )}
          </div>
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
          <div className="text-xs text-muted-foreground">{isOwner ? 'Owner' : 'Visitor'}</div>
        </div>
      </div>
    </div>
  );
}
