'use client';

/**
 * Account Manager - the INVESTOR's direct line to their human account manager
 * (Investor plan only). Full-width sections with divider lines, consistent
 * with the rest of the app; no floating cards.
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DW_MANAGER_INFO } from '@/lib/deal-watch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SupportDialog } from '@/components/support-dialog';
import { Loader2, Send, Mail, Phone, MessageCircle } from 'lucide-react';

const TEXTAREA_CLASS =
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function AccountManagerPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  // One tap opens a LIVE chat with the manager. Connecting the chat
  // notifies him instantly (bell alert + email on his side), and replies
  // stream back here in real time.

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Your account manager</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A real person who watches your deals and answers directly.
        </p>
      </div>

      {/* Manager row - identity, contact, and the one-tap ping */}
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 py-6">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#4285F4] text-xl font-semibold text-white">
          {DW_MANAGER_INFO.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{DW_MANAGER_INFO.name}</p>
          <p className="text-sm text-muted-foreground">Account manager, available around the clock</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <a
              href={`mailto:${DW_MANAGER_INFO.email}`}
              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#4285F4]"
            >
              <Mail className="h-4 w-4 text-[#4285F4]" />
              {DW_MANAGER_INFO.email}
            </a>
            <a
              href={`tel:${DW_MANAGER_INFO.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#4285F4]"
            >
              <Phone className="h-4 w-4 text-[#4285F4]" />
              {DW_MANAGER_INFO.phone}
            </a>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <Button onClick={() => setIsChatOpen(true)} className="bg-gray-900 text-white hover:bg-gray-800">
            <MessageCircle className="mr-2 h-4 w-4" />
            Talk to manager
          </Button>
          <span className="text-xs text-muted-foreground">
            Opens a live chat. Your manager is notified the moment you connect.
          </span>
        </div>
      </div>

      {/* Message section */}
      <div className="border-b border-gray-200 py-6">
        <h2 className="text-base font-semibold">Send a message</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about a startup on your watchlist, request a closer look, or anything else.
        </p>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message"
          className={`${TEXTAREA_CLASS} mt-4`}
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={send} disabled={sending || !message.trim()}>
            {sending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Send className="mr-2 h-4 w-4" />}
            Send message
          </Button>
        </div>
      </div>

      <p className="py-4 text-xs text-muted-foreground">
        Your manager reviews every update from startups on your watchlist and only pings you when
        something genuinely matters, so your inbox stays quiet.
      </p>

      {/* Live chat with the manager (direct to human, no AI step). */}
      <SupportDialog
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        directHuman
        heading="Your account manager"
        agentLabel={DW_MANAGER_INFO.name.split(' ')[0]}
      />
    </div>
  );
}
