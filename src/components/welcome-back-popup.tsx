'use client';

/**
 * WelcomeBackPopup - shown ONCE per browser session on first dashboard mount
 * if the user has any unread `question_asked` alerts.
 *
 * The popup gives the owner two choices:
 *   - "View question" → navigates to the Q&A page of the most recent space
 *   - "Dismiss" → just closes the popup (alerts stay unread; bell icon still shows)
 *
 * Why session storage and not always-show?
 *   - Showing the popup on every page reload is annoying. We only want it once
 *     per "return visit" - defined as the first time the dashboard mounts in
 *     a fresh browser session. sessionStorage is cleared on tab close, so the
 *     next time the user opens the app, they get the popup again if questions
 *     are still pending.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAlerts, type Alert } from '@/lib/alerts-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SHOWN_KEY = 'vt_welcome_popup_shown';

export function WelcomeBackPopup() {
  const router = useRouter();
  const { alerts } = useAlerts();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Alert[]>([]);

  useEffect(() => {
    // Only consider showing once we have alerts data and haven't already shown
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SHOWN_KEY) === '1') return;

    const unreadQuestions = alerts.filter(
      (a) => a.type === 'question_asked' && !a.read_at
    );
    if (unreadQuestions.length === 0) return;

    // Mark shown right away so quick re-mounts don't flash a second popup
    sessionStorage.setItem(SHOWN_KEY, '1');
    setPending(unreadQuestions);
    setOpen(true);
  }, [alerts]);

  const mostRecent = pending[0];
  const totalCount = pending.length;
  const spaceId = (mostRecent?.space_id as string | undefined) ?? null;

  const handleView = () => {
    setOpen(false);
    if (spaceId) {
      router.push(`/spaces/${spaceId}/edit/qna`);
    }
  };

  if (!mostRecent) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle>
                {totalCount === 1
                  ? 'You have a new question'
                  : `You have ${totalCount} new questions`}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                Asked {formatDistanceToNow(new Date(mostRecent.created_at), { addSuffix: true })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            {mostRecent.message as string}
          </div>
          {totalCount > 1 && (
            <p className="text-xs text-muted-foreground mt-3">
              + {totalCount - 1} more question{totalCount - 1 !== 1 ? 's' : ''} waiting for you.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
          <Button onClick={handleView} disabled={!spaceId}>
            <Eye className="h-4 w-4 mr-2" />
            View question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
