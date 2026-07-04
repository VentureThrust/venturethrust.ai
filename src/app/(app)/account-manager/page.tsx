'use client';

/**
 * Account Manager - the INVESTOR's direct line to their human account manager
 * (Investor plan only). Sends the message to the manager by email + in-app.
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Headset, Loader2, Send, Mail, Phone, MessageCircle } from 'lucide-react';

// The assigned account manager (every investor gets one automatically).
const MANAGER = {
  name: 'Omprakash Borkar',
  email: 'omprakash@venturethrust.com',
  phone: '+91 8530329552',
};

const TEXTAREA_CLASS =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function AccountManagerPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [talkBusy, setTalkBusy] = useState(false);

  // One-tap "talk to me now" ping: notifies the manager instantly
  // (in-app alert + email) so he can reach out right away.
  const talkNow = async () => {
    if (talkBusy) return;
    setTalkBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/deal-watch/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: 'I would like to talk to you now. Please reach out.' }),
      });
      if (res.ok) {
        toast({
          title: 'Your manager has been notified',
          description: 'Omprakash will reach out to you right away.',
        });
      } else {
        toast({ variant: 'destructive', title: 'Could not notify. Please try again.' });
      }
    } finally {
      setTalkBusy(false);
    }
  };

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

      <div className="grid gap-6 md:grid-cols-[1fr,290px]">
        {/* Message box */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-semibold">Send a message</p>
          <div className="mt-4 space-y-3">
            <textarea
              rows={6}
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

        {/* Manager card - who your manager is, and one tap to talk now. */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#4285F4] text-2xl font-semibold text-white">
            O
          </div>
          <p className="mt-3 text-sm font-semibold">{MANAGER.name}</p>
          <p className="text-xs text-muted-foreground">Your account manager</p>
          <div className="mt-4 space-y-2 text-left">
            <a
              href={`mailto:${MANAGER.email}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-[#4285F4]" />
              <span className="truncate">{MANAGER.email}</span>
            </a>
            <a
              href={`tel:${MANAGER.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#4285F4]" />
              {MANAGER.phone}
            </a>
          </div>
          <Button className="mt-4 w-full" onClick={talkNow} disabled={talkBusy}>
            {talkBusy
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <MessageCircle className="mr-2 h-4 w-4" />}
            Talk to manager
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            One tap notifies your manager to reach out right away.
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your manager reviews every update from startups on your watchlist and only pings you
        when something genuinely matters, so your inbox stays quiet.
      </p>
    </div>
  );
}
