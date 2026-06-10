'use client';

/**
 * SupportDialog - the in-app support panel opened by the sidebar "Support"
 * button. Two tabs:
 *   - "Ask AI": a Claude-powered assistant (POST /api/support/chat) that answers
 *     instantly, 24/7, grounded in product knowledge. Escalates to a human.
 *   - "Send a message": a ticket form (POST /api/support) that emails the team
 *     via Zoho and logs to support_tickets.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { LifeBuoy, Loader2, Check, Send, Sparkles } from 'lucide-react';

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const CATEGORIES = ['General question', 'Billing & plans', 'Technical issue', 'Account', 'Feature request'];
const SUGGESTIONS = ['How do I share a data room?', 'Can I see who viewed my documents?', 'How does billing work?'];

export function SupportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [mode, setMode] = useState<'ai' | 'contact'>('ai');

  // AI chat state
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Ticket state
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState('');

  const reset = () => {
    setMode('ai');
    setChat([]);
    setInput('');
    setThinking(false);
    setChatError(null);
    setCategory(CATEGORIES[0]);
    setSubject('');
    setMessage('');
    setSending(false);
    setSent(false);
    setTicketError(null);
  };

  // Keep the chat scrolled to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, thinking]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setChatError(null);
    const next: ChatMsg[] = [...chat, { role: 'user', content: q }];
    setChat(next);
    setInput('');
    setThinking(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setChatError('Please log in again to use the assistant.');
        setThinking(false);
        return;
      }
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.reply) {
        setChatError(
          json?.error === 'not_configured'
            ? 'The assistant is not configured yet. Please use "Talk to a human" below.'
            : 'The assistant is unavailable right now. Please use "Talk to a human" below.',
        );
        setThinking(false);
        return;
      }
      setChat((c) => [...c, { role: 'assistant', content: String(json.reply) }]);
    } catch {
      setChatError('Something went wrong. Please try again.');
    }
    setThinking(false);
  };

  const submitTicket = async () => {
    if (message.trim().length < 5) {
      setTicketError('Please describe your issue in a few words.');
      return;
    }
    setSending(true);
    setTicketError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      setSentToEmail(data.session?.user?.email ?? '');
      if (!token) {
        setTicketError('Please log in again to contact support.');
        setSending(false);
        return;
      }
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, category, message }),
      });
      if (!res.ok) {
        setTicketError('Could not send right now. Please try again in a moment.');
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setTicketError('Could not send right now. Please try again in a moment.');
    }
    setSending(false);
  };

  const tabClass = (active: boolean) =>
    cn(
      'flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors',
      active ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Message sent</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks! We received your request and will reply{sentToEmail ? ` to ${sentToEmail}` : ''}.
              We monitor support around the clock and will get back to you as soon as possible.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-5 w-full bg-gray-900 text-white hover:bg-gray-800">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-gray-700" />
                <DialogTitle>Support</DialogTitle>
              </div>
              <DialogDescription>
                We are here 24/7. Ask the assistant for an instant answer, or send us a message.
              </DialogDescription>
            </DialogHeader>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
              <button type="button" onClick={() => setMode('ai')} className={tabClass(mode === 'ai')}>
                <Sparkles className="h-4 w-4" /> Ask AI
              </button>
              <button type="button" onClick={() => setMode('contact')} className={tabClass(mode === 'contact')}>
                Send a message
              </button>
            </div>

            {mode === 'ai' ? (
              <div className="mt-3 flex flex-col">
                <div
                  ref={scrollRef}
                  className="h-72 space-y-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/60 p-3"
                >
                  {chat.length === 0 && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <p>
                          Hi! I am the VentureThrust assistant. Ask me about data rooms, sharing,
                          analytics, security, or plans.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => send(s)}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chat.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div
                        className={
                          m.role === 'user'
                            ? 'max-w-[85%] rounded-2xl bg-gray-900 px-3 py-2 text-sm text-white'
                            : 'max-w-[85%] whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-foreground'
                        }
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                    </div>
                  )}
                </div>
                {chatError && <p className="mt-2 text-sm text-red-600">{chatError}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder="Ask a question..."
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button
                    onClick={() => send(input)}
                    disabled={thinking || !input.trim()}
                    className="h-10 bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('contact')}
                  className="mt-3 self-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Talk to a human instead
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send us a message and we will reply to your account email, usually as soon as possible.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sup-cat" className="text-xs">Topic</Label>
                    <select
                      id="sup-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sup-subj" className="text-xs">Subject (optional)</Label>
                    <input
                      id="sup-subj"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={160}
                      placeholder="Short summary"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sup-msg" className="text-xs">Message</Label>
                  <textarea
                    id="sup-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={4000}
                    placeholder="Tell us what is going on, and we will help."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                {ticketError && <p className="text-sm text-red-600">{ticketError}</p>}
                <Button onClick={submitTicket} disabled={sending} className="w-full bg-gray-900 text-white hover:bg-gray-800">
                  {sending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    'Send message'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
