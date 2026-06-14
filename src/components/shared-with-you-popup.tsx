'use client';

/**
 * SharedWithYouPopup - a gentle bottom-right nudge shown when the signed-in user
 * has data rooms shared with them that they have not opened yet (unread
 * 'space_shared' alerts). Non-modal on purpose, so it never fights the
 * WelcomeBackPopup or any open dialog for focus. Shown once per browser session.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAlerts } from '@/lib/alerts-provider';
import { Button } from '@/components/ui/button';
import { Inbox, X } from 'lucide-react';

export function SharedWithYouPopup() {
  const { alerts } = useAlerts();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const count = alerts.filter((a) => (a.type as string) === 'space_shared' && !a.read_at).length;

  useEffect(() => {
    if (count > 0 && typeof window !== 'undefined' && sessionStorage.getItem('vt_shared_popup_seen')) {
      setDismissed(true);
    }
  }, [count]);

  if (count === 0 || dismissed) return null;

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem('vt_shared_popup_seen', '1'); } catch { /* ignore */ }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-blue-200 bg-white p-4 shadow-xl">
      <button
        onClick={close}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Inbox className="h-5 w-5" />
        </div>
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-gray-900">
            {count === 1 ? 'A data room was shared with you' : `${count} data rooms were shared with you`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Open your Shared with me page to view {count === 1 ? 'it' : 'them'}.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => { close(); router.push('/dashboard/shared-with-me'); }}>
              View shared with me
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>Later</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
