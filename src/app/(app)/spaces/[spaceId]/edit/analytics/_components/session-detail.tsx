'use client';

/**
 * SessionDetailView - dedicated full-page view of one viewer session.
 *
 * Opens when the owner clicks a session row anywhere in the analytics
 * overview. Shows:
 *   - Header: visitor, when, total duration, device, location
 *   - Files opened during this session, sorted by time spent (descending),
 *     with colored file-type icons. Each file is clickable - clicking a
 *     PDF/video opens the per-page (or playback) analytics drilldown.
 *
 * Editorial layout - no card wrappers, horizontal rules separate sections.
 */

import { ArrowLeft, Clock, Laptop, MapPin, Smartphone, Tablet } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getFileTypeStyle } from '@/lib/file-icons';
import {
  formatDuration,
  sessionDuration,
  getSessionFiles,
  type ViewerSession,
  type FileWithVisits,
} from './live-viewers';

function DeviceIcon({ device }: { device: string | null }) {
  const d = (device ?? '').toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return <Smartphone className="h-4 w-4" />;
  if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}

export function SessionDetailView({
  session,
  files,
  onBack,
  onSelectFile,
}: {
  session: ViewerSession;
  files: FileWithVisits[];
  onBack: () => void;
  /** Fires when the owner clicks a PDF/video - parent renders the
   *  per-page / heatmap drilldown for that file. */
  onSelectFile: (file: { id: string; name: string; type: string }) => void;
}) {
  const sessionFiles = getSessionFiles(session, files);
  const total = sessionDuration(session);
  const displayEmail = session.visitor_email ?? 'Anonymous';
  const initial = displayEmail[0].toUpperCase();

  return (
    <div className="space-y-8">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit -ml-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to analytics
      </button>

      {/* Header - visitor identity + session timestamp */}
      <header>
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{displayEmail}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Session on {format(new Date(session.started_at), 'EEEE, MMMM d, yyyy · h:mm a')}
              <span className="mx-2">·</span>
              {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-y-4">
          <Stat
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            label="Total time"
            value={<span className="font-mono tabular-nums text-base font-semibold">{formatDuration(total)}</span>}
          />
          <Stat
            icon={<DeviceIcon device={session.device} />}
            label="Device"
            value={session.device ?? 'Unknown'}
          />
          <Stat
            icon={<MapPin className="h-4 w-4 text-rose-500" />}
            label="Location"
            value={session.location ?? '-'}
          />
          <Stat
            icon={<span className="text-base">📂</span>}
            label="Files opened"
            value={String(sessionFiles.length)}
          />
        </div>
      </header>

      <div className="border-t border-gray-200" />

      {/* Files section */}
      <section>
        <div className="pb-4">
          <h2 className="text-xl font-semibold tracking-tight">Files opened in this session</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Sorted by time spent, most-engaged file first.
            Click a PDF or video to see per-page / playback analytics.
          </p>
        </div>

        <div className="border-t border-gray-200" />

        {sessionFiles.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-sm">
            No file activity recorded for this session.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_auto] gap-6 py-3 text-sm text-muted-foreground uppercase tracking-wider font-semibold border-b border-gray-100">
              <div>File</div>
              <div className="text-right min-w-[80px]">Opened</div>
              <div className="text-right min-w-[100px]">Time spent</div>
            </div>
            <div className="divide-y divide-gray-100">
              {sessionFiles.map(f => {
                const { Icon, bg, text } = getFileTypeStyle(f.fileName);
                const ext = f.fileName.toLowerCase().split('.').pop() ?? '';
                const isPdf = ext === 'pdf' || (f.fileType ?? '').includes('pdf');
                const isVideo =
                  ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext) ||
                  (f.fileType ?? '').startsWith('video/');
                const drillable = isPdf || isVideo;

                return (
                  <button
                    key={f.fileId}
                    onClick={() => drillable && onSelectFile({ id: f.fileId, name: f.fileName, type: f.fileType })}
                    disabled={!drillable}
                    className={cn(
                      'grid grid-cols-[1fr_auto_auto] gap-6 py-4 items-center w-full text-left -mx-2 px-2 rounded-md transition-colors',
                      drillable && 'hover:bg-muted/30 cursor-pointer',
                      !drillable && 'cursor-default',
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('h-10 w-10 rounded-md flex items-center justify-center shrink-0', bg)}>
                        <Icon className={cn('h-5 w-5', text)} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-base truncate">{f.fileName}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                          {isPdf ? 'PDF · click for page analytics'
                            : isVideo ? 'Video · click for playback heatmap'
                            : ext || 'File'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground min-w-[80px]">
                      {f.openCount}×
                    </div>
                    <div className="text-right font-mono text-base font-semibold tabular-nums min-w-[100px]">
                      {formatDuration(f.timeSpent)}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        {icon}
        {label}
      </div>
      <div className="text-base">{value}</div>
    </div>
  );
}
