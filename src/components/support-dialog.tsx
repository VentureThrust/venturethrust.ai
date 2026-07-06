'use client';

/**
 * SupportDialog - in-app support, opened from the sidebar "Support" button.
 *   - "Ask AI": Claude-powered assistant (POST /api/support/chat), grounded in
 *     the support_kb knowledge base, with a "Talk to a human" handoff.
 *   - "Message the team": start a conversation with the team directly.
 * Either path escalates to a LIVE conversation (POST /api/support/escalate) that
 * the owner answers from the Support Inbox; the owner's replies stream back in
 * via Supabase Realtime. Messages are sent through POST /api/support/message.
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
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { LifeBuoy, Loader2, Send, Sparkles, User } from 'lucide-react';

type ChatMsg = { role: 'user' | 'assistant'; content: string };
type LiveMsg = { id: string; sender: string; body: string };

const SUGGESTIONS = ['How do I share a data room?', 'Can I see who viewed my documents?', 'How does billing work?'];

export function SupportDialog({
  open,
  onOpenChange,
  directHuman = false,
  heading,
  agentLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Skip the AI assistant and connect straight to a live human chat. */
  directHuman?: boolean;
  /** Dialog title override (e.g. "Your account manager"). */
  heading?: string;
  /** Label shown over the human's replies (default "Support"). */
  agentLabel?: string;
}) {
  const [mode, setMode] = useState<'ai' | 'contact' | 'live'>('ai');
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);

  // AI chat
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const aiScrollRef = useRef<HTMLDivElement | null>(null);

  // Contact
  const [contactMsg, setContactMsg] = useState('');

  // Live conversation
  const [convId, setConvId] = useState<string | null>(null);
  const [live, setLive] = useState<LiveMsg[]>([]);
  const [liveInput, setLiveInput] = useState('');
  const [liveSending, setLiveSending] = useState(false);
  const liveScrollRef = useRef<HTMLDivElement | null>(null);

  const reset = () => {
    setMode('ai');
    setHandoffError(null);
    setEscalating(false);
    setChat([]);
    setInput('');
    setThinking(false);
    setChatError(null);
    setContactMsg('');
    setConvId(null);
    setLive([]);
    setLiveInput('');
    setLiveSending(false);
  };

  useEffect(() => {
    const el = aiScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, thinking]);
  useEffect(() => {
    const el = liveScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [live]);

  // Load history + subscribe to the live conversation.
  useEffect(() => {
    if (mode !== 'live' || !convId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('id, sender, body')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (active && data) setLive(data as LiveMsg[]);
    })();
    const channel = supabase
      .channel(`support:${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as LiveMsg;
          setLive((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [mode, convId]);

  const sendAi = async (text: string) => {
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
            ? 'The assistant is not set up yet. Tap "Talk to a human" below.'
            : 'The assistant is unavailable. Tap "Talk to a human" below.',
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

  // Direct-to-human mode (Talk to manager): connect the live chat the moment
  // the dialog opens, no AI step. The escalate route already notifies the
  // admin by bell alert and email.
  useEffect(() => {
    if (!open || !directHuman) return;
    if (mode === 'live' || convId || escalating) return;
    escalate('Account manager chat: the investor tapped Talk to manager.', []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, directHuman]);

  const escalate = async (summary: string, transcript: ChatMsg[]) => {
    if (escalating) return;
    setEscalating(true);
    setHandoffError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setHandoffError('Please log in again.');
        setEscalating(false);
        return;
      }
      const res = await fetch('/api/support/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ summary, transcript }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.conversationId) {
        setHandoffError(
          json?.error === 'not_ready'
            ? 'Live chat is not set up yet. Please email omprakash@venturethrust.com.'
            : 'Could not connect you to the team. Please try again.',
        );
        setEscalating(false);
        return;
      }
      setConvId(json.conversationId);
      setLive([]);
      setMode('live');
    } catch {
      setHandoffError('Could not connect you. Please try again.');
    }
    setEscalating(false);
  };

  const sendLive = async () => {
    const t = liveInput.trim();
    if (!t || !convId || liveSending) return;
    setLiveSending(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setLiveSending(false);
        return;
      }
      await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: convId, body: t }),
      });
      setLiveInput(''); // the Realtime subscription appends it when it lands
    } catch {
      /* user can retry */
    }
    setLiveSending(false);
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
        // Manager chats survive a close: reopening resumes the conversation.
        if (!o && !directHuman) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-gray-700" />
            <DialogTitle>{heading ?? 'Support'}</DialogTitle>
          </div>
          <DialogDescription>
            {mode === 'live'
              ? `You are connected. Replies from ${agentLabel ?? 'support'} appear here live, and we also email you.`
              : directHuman
                ? 'Connecting you to a live chat...'
                : 'We are here 24/7. Ask the assistant for an instant answer, or message the team.'}
          </DialogDescription>
        </DialogHeader>

        {directHuman && mode !== 'live' ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3">
            {handoffError ? (
              <>
                <p className="max-w-xs text-center text-sm text-muted-foreground">{handoffError}</p>
                <Button
                  onClick={() => escalate('Account manager chat: the investor tapped Talk to manager.', [])}
                  disabled={escalating}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  {escalating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Try again
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Opening your chat...</p>
              </>
            )}
          </div>
        ) : mode === 'live' ? (
          <div className="flex flex-col">
            <div ref={liveScrollRef} className="h-80 space-y-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/60 p-3">
              <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Connected. A teammate will reply here as soon as possible, and you will also get an email. You can keep typing.
              </div>
              {live.map((m) => {
                if (m.sender === 'system') {
                  return (
                    <div key={m.id} className="text-center text-xs text-muted-foreground">
                      {m.body}
                    </div>
                  );
                }
                const mine = m.sender === 'user';
                return (
                  <div key={m.id} className={mine ? 'flex justify-end' : 'flex flex-col items-start'}>
                    {!mine && (
                      <span className="mb-0.5 ml-1 text-[11px] font-medium text-muted-foreground">
                        {m.sender === 'owner' ? (agentLabel ?? 'Support') : 'Assistant'}
                      </span>
                    )}
                    <div
                      className={
                        mine
                          ? 'max-w-[85%] rounded-2xl bg-gray-900 px-3 py-2 text-sm text-white'
                          : 'max-w-[85%] whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-foreground'
                      }
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={liveInput}
                onChange={(e) => setLiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendLive();
                  }
                }}
                placeholder="Type your message..."
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              />
              <Button onClick={sendLive} disabled={liveSending || !liveInput.trim()} className="h-10 bg-gray-900 text-white hover:bg-gray-800">
                {liveSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
              <button type="button" onClick={() => setMode('ai')} className={tabClass(mode === 'ai')}>
                <Sparkles className="h-4 w-4" /> Ask AI
              </button>
              <button type="button" onClick={() => setMode('contact')} className={tabClass(mode === 'contact')}>
                <User className="h-4 w-4" /> Message the team
              </button>
            </div>

            {mode === 'ai' ? (
              <div className="mt-3 flex flex-col">
                <div ref={aiScrollRef} className="h-72 space-y-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                  {chat.length === 0 && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <p>
                          Hi! I am the VentureThrust assistant. Ask me about data rooms, sharing, analytics,
                          security, or plans.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => sendAi(s)}
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
                {handoffError && <p className="mt-2 text-sm text-red-600">{handoffError}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendAi(input);
                      }
                    }}
                    placeholder="Ask a question..."
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button onClick={() => sendAi(input)} disabled={thinking || !input.trim()} className="h-10 bg-gray-900 text-white hover:bg-gray-800">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    escalate(chat.filter((m) => m.role === 'user').slice(-1)[0]?.content ?? 'I would like to talk to a person.', chat)
                  }
                  disabled={escalating}
                  className="mt-3 w-full"
                >
                  {escalating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
                  ) : (
                    'Talk to a human'
                  )}
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tell us what you need. This starts a live chat with the team, and we will also email you.
                </p>
                <textarea
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  rows={5}
                  maxLength={4000}
                  placeholder="Describe your question or issue..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {handoffError && <p className="text-sm text-red-600">{handoffError}</p>}
                <Button
                  onClick={() => {
                    const t = contactMsg.trim();
                    if (t.length < 3) {
                      setHandoffError('Please describe your issue in a few words.');
                      return;
                    }
                    escalate(t, [{ role: 'user', content: t }]);
                  }}
                  disabled={escalating}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                >
                  {escalating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
                  ) : (
                    'Start chat with the team'
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
