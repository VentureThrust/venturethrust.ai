'use client';

/**
 * NotificationBell - bell icon with red-dot indicator and dropdown list.
 *
 * Uses the existing AlertsProvider (Supabase Realtime subscription to the
 * `alerts` table). Shows the unread count as a red dot; opening the popover
 * displays the list of notifications, sorted newest first, and marks them
 * as read as they're displayed.
 *
 * Big events covered (inserted from elsewhere in the codebase):
 *   - 'space_viewed'  - a visitor opened your shared space
 *   - 'nda_signed'    - a visitor accepted the NDA
 *   - 'signature_collected' - a visitor signed for access
 *   - 'space_shared'  - you generated a new share link (optional)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Eye, FileSignature, ShieldOff, CheckCheck, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAlerts, type Alert } from '@/lib/alerts-provider';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function iconForType(type: string) {
  switch (type) {
    case 'space_viewed':
      return Eye;
    case 'nda_signed':
      return ShieldOff;
    case 'signature_collected':
      return FileSignature;
    case 'space_shared':
      return Share2;
    default:
      return Bell;
  }
}

function colorForType(type: string) {
  switch (type) {
    case 'space_viewed':
      return 'text-blue-600 bg-blue-50';
    case 'nda_signed':
      return 'text-purple-600 bg-purple-50';
    case 'signature_collected':
      return 'text-green-600 bg-green-50';
    case 'space_shared':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function NotificationBell() {
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // When the popover OPENS and there are unread items, mark them all as read
    // after a short delay so the user has a chance to see the highlighted state.
    if (next && unreadCount > 0) {
      setTimeout(() => {
        markAllAsRead?.();
      }, 1500);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative text-muted-foreground hover:text-foreground',
            unreadCount > 0 && 'text-foreground'
          )}
        >
          {/* The bell rings (rotates) only when there are unread notifications.
              When everything is read, it goes still. Animation is paused while
              the popover is open so it doesn't distract during reading. */}
          <Bell
            className={cn(
              'h-5 w-5 transition-colors',
              unreadCount > 0 && !open && 'animate-bell-ring text-orange-500'
            )}
          />
          {/* Red dot - only present when there are unread items. Pulsing scale
              + opacity loop draws the eye. Vanishes completely on read. */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 animate-red-dot-blink" />
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {alerts.length > 0 && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => markAllAsRead?.()}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You&apos;ll see activity here when visitors interact with your spaces.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <NotificationItem
                  key={alert.id}
                  alert={alert}
                  onClick={() => {
                    if (!alert.read_at) markAsRead(alert.id);
                    // A "shared a data room" notification jumps to Shared with me.
                    if ((alert.type as string) === 'space_shared') {
                      setOpen(false);
                      router.push('/dashboard/shared-with-me');
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ alert, onClick }: { alert: Alert; onClick: () => void }) {
  const Icon = iconForType(alert.type as string);
  const colors = colorForType(alert.type as string);
  const unread = !alert.read_at;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors',
        unread && 'bg-blue-50/50'
      )}
    >
      <div className={cn('p-2 rounded-full shrink-0', colors)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', unread ? 'font-medium' : 'text-muted-foreground')}>
          {alert.message as string}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </p>
      </div>
      {unread && (
        <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
      )}
    </button>
  );
}
