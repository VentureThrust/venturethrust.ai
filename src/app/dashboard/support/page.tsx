'use client';

/**
 * Support Inbox - the owner's live view of escalated support chats. Admin-only
 * (profiles.is_admin). Lists conversations and shows each one's messages in
 * real time (Supabase Realtime); the owner replies via POST /api/support/message,
 * which the user sees instantly in their support widget.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Send, MessageSquare } from 'lucide-react';

type Conv = {
  id: string;
  user_email: string | null;
  status: string;
  summary: string | null;
  last_message_at: string;
};
type Msg = { id: string; sender: string; body: string; created_at: string };

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    awaiting_human: 'bg-amber-100 text-amber-800',
    live: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = { awaiting_human: 'New', live: 'Live', closed: 'Closed' };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', styles[status] ?? 'bg-gray-100 text-gray-600')}>
      {labels[status] ?? status}
    </span>
  );
}

export default function SupportInboxPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadConvs = async () => {
    const { data } = await supabase
      .from('support_conversations')
      .select('id, user_email, status, summary, last_message_at')
      .order('last_message_at', { ascending: false });
    setConvs((data as Conv[]) ?? []);
  };

  // Admin check + initial conversation list.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
      const admin = !!(prof && (prof as { is_admin?: boolean }).is_admin);
      setIsAdmin(admin);
      if (admin) await loadConvs();
    })();
  }, []);

  // Live-refresh the conversation list.
  useEffect(() => {
    if (isAdmin !== true) return;
    const ch = supabase
      .channel('support-inbox-convs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, () => {
        loadConvs();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAdmin]);

  // Load + subscribe to the active conversation's messages.
  useEffect(() => {
    if (!activeId) {
      setMsgs([]);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('id, sender, body, created_at')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      if (active) setMsgs((data as Msg[]) ?? []);
    })();
    const ch = supabase
      .channel(`support-inbox-msg:${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [activeId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const post = async (extra: Record<string, unknown>) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token || !activeId) return;
    await fetch('/api/support/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversationId: activeId, ...extra }),
    });
  };

  const sendReply = async () => {
    const t = reply.trim();
    if (!t || !activeId || sending) return;
    setSending(true);
    try {
      await post({ body: t });
      setReply('');
    } catch {
      /* retry */
    }
    setSending(false);
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">This page is for support admins only.</div>;
  }

  const active = convs.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border bg-white">
      {/* Conversation list */}
      <aside className="w-72 shrink-0 overflow-y-auto border-r">
        <div className="border-b px-4 py-3 text-lg font-semibold">Support inbox</div>
        {convs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn('w-full border-b px-4 py-3 text-left transition-colors hover:bg-gray-50', activeId === c.id && 'bg-gray-50')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.user_email ?? 'User'}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.summary}</p>
            </button>
          ))
        )}
      </aside>

      {/* Active conversation */}
      <section className="flex flex-1 flex-col">
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto h-8 w-8" />
              <p className="mt-2 text-sm">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{active.user_email ?? 'User'}</div>
                <div className="truncate text-xs text-muted-foreground">{active.summary}</div>
              </div>
              {active.status !== 'closed' && (
                <Button variant="outline" size="sm" onClick={() => post({ action: 'close' })}>
                  Close
                </Button>
              )}
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m) => {
                if (m.sender === 'system') {
                  return (
                    <div key={m.id} className="text-center text-xs text-muted-foreground">
                      {m.body}
                    </div>
                  );
                }
                const owner = m.sender === 'owner';
                return (
                  <div key={m.id} className={owner ? 'flex justify-end' : 'flex flex-col items-start'}>
                    {!owner && (
                      <span className="mb-0.5 ml-1 text-[11px] font-medium text-muted-foreground">
                        {m.sender === 'ai' ? 'Assistant' : (active.user_email ?? 'User')}
                      </span>
                    )}
                    <div
                      className={
                        owner
                          ? 'max-w-[75%] rounded-2xl bg-gray-900 px-3 py-2 text-sm text-white'
                          : 'max-w-[75%] whitespace-pre-wrap rounded-2xl border bg-white px-3 py-2 text-sm'
                      }
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>

            {active.status !== 'closed' && (
              <div className="flex items-center gap-2 border-t p-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Reply to the user..."
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} className="h-10 bg-gray-900 text-white hover:bg-gray-800">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
