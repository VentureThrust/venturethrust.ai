'use client';

/**
 * Account Manager - the INVESTOR's direct line to their human account manager
 * (Investor plan only). Sends the message to the manager by email + in-app.
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Headset, Loader2, Send } from 'lucide-react';

const TEXTAREA_CLASS =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function AccountManagerPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/deal-watch/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        setMessage('');
        toast({
          title: 'Message sent',
          description: 'Your account manager will get back to you shortly.',
        });
      } else {
        const j = await res.json().catch(() => ({}));
        toast({
          variant: 'destructive',
          title: j.error === 'INVESTOR_PLAN_REQUIRED'
            ? 'The account manager is part of the Investor plan.'
            : 'Could not send. Please try again.',
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF] text-[#4285F4]">
          <Headset className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your account manager</h1>
          <p className="text-sm text-muted-foreground">
            A real person who watches your deals and answers directly.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#4285F4] text-lg font-semibold text-white">
            O
          </div>
          <div>
            <p className="text-sm font-semibold">Omprakash Borkar</p>
            <p className="text-xs text-muted-foreground">
              Account manager, available around the clock
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about a startup on your watchlist, request a closer look, or anything else."
            className={TEXTAREA_CLASS}
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending || !message.trim()}>
              {sending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Send className="mr-2 h-4 w-4" />}
              Send message
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your manager reviews every update from startups on your watchlist and only pings you
        when something genuinely matters, so your inbox stays quiet.
      </p>
    </div>
  );
}
