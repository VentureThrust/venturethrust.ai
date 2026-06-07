'use client';

/**
 * Space Q&A page - owner sees visitor questions and replies to them.
 *
 * Data source: space_questions table (created earlier this conversation).
 * Realtime subscription pushes new questions / answer updates immediately.
 *
 * When the owner sends an answer:
 *   1. Updates the row with answer + answered_at
 *   2. If the asker has a profile on our platform, insert an alert into
 *      alerts table so their bell + welcome-back popup fires
 *   3. POSTs to /api/notify-question-answer to email the asker (fire-and-forget)
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Plus,
  ChevronDown,
  MessageSquare,
  Send,
  Loader2,
  Mail,
  FileText,
  Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type DbQuestion = {
  id: string;
  space_id: string;
  file_id: string | null;
  file_name: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  question: string;
  answer: string | null;
  asked_at: string;
  answered_at: string | null;
};

export default function QnaPage() {
  const params = useParams();
  const spaceId = params.spaceId as string;
  const { toast } = useToast();

  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [allowingQuestions, setAllowingQuestions] = useState(true);

  // Reply dialog state
  const [replyingTo, setReplyingTo] = useState<DbQuestion | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // ── Initial fetch + realtime subscription ────────────────────────────
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('space_questions')
        .select('*')
        .eq('space_id', spaceId)
        .order('asked_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.warn('[space_questions] table may not exist yet:', error.message);
      } else if (data) {
        setQuestions(data as DbQuestion[]);
      }
      setIsLoading(false);
    };

    load();

    // Realtime: new questions appear instantly, answers update without reload
    const channel = supabase
      .channel(`space_questions:${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'space_questions',
          filter: `space_id=eq.${spaceId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setQuestions((prev) => [payload.new as DbQuestion, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === (payload.new as DbQuestion).id ? (payload.new as DbQuestion) : q
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id;
            if (oldId) setQuestions((prev) => prev.filter((q) => q.id !== oldId));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [spaceId]);

  const handleDelete = async (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    const { error } = await supabase.from('space_questions').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
    }
  };

  const openReply = (q: DbQuestion) => {
    setReplyingTo(q);
    setReplyText(q.answer ?? '');
  };

  const closeReply = () => {
    setReplyingTo(null);
    setReplyText('');
    setIsSubmittingReply(false);
  };

  // ── Send the reply ─────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!replyingTo) return;
    if (!replyText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Answer is empty',
        description: 'Please write something before sending.',
      });
      return;
    }
    setIsSubmittingReply(true);

    const answerText = replyText.trim();
    const answeredAt = new Date().toISOString();

    try {
      // 1. Save answer
      const { error: updErr } = await supabase
        .from('space_questions')
        .update({
          answer: answerText,
          answered_at: answeredAt,
        })
        .eq('id', replyingTo.id);
      if (updErr) throw updErr;

      // 1b. Optimistic local update so the badge flips from "Pending"
      // to "Replied" immediately - we don't wait for the Realtime UPDATE
      // event to round-trip back (Realtime can be slow or disabled on the
      // table; either way the UI shouldn't appear stuck after a successful
      // save). If Realtime does eventually fire, it just sets the same
      // row again - effectively a no-op.
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === replyingTo.id
            ? { ...q, answer: answerText, answered_at: answeredAt }
            : q
        )
      );

      // Resolve the current user (owner / answerer) up front so we can
      // both build the alert text AND skip self-notifications.
      const { data: { user: answerer } } = await supabase.auth.getUser();
      const answererEmail = answerer?.email?.toLowerCase() ?? null;
      const askerEmail = replyingTo.visitor_email?.toLowerCase() ?? null;
      const isSelfAnswer = !!answererEmail && answererEmail === askerEmail;

      // 2. In-app alert + email - but NEVER notify yourself. If the asker's
      // email matches the answerer's, the owner was just testing with their
      // own email; sending "you answered your own question" is noise.
      if (replyingTo.visitor_email && !isSelfAnswer) {
        try {
          const { data: askerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', replyingTo.visitor_email)
            .maybeSingle();

          const fromName = answerer?.email?.split('@')[0] ?? 'The space owner';

          if (askerProfile?.id) {
            await supabase.from('alerts').insert({
              user_id: askerProfile.id,
              space_id: spaceId,
              type: 'question_answered',
              message: `${fromName} answered your question: "${replyingTo.question.slice(0, 80)}${
                replyingTo.question.length > 80 ? '…' : ''
              }"`,
            });
          }
        } catch (alertErr) {
          console.warn('[alerts] in-app notification failed:', alertErr);
        }

        // 3. Send email (fire-and-forget; API route handles missing config gracefully).
        //    The email body intentionally does NOT include the answer - it
        //    includes a "View answer" button that deep-links to /answer/[id],
        //    where the recipient signs in/up before seeing the reply.
        try {
          await fetch('/api/notify-question-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: replyingTo.visitor_email,
              toName: replyingTo.visitor_name ?? null,
              question: replyingTo.question,
              answer: answerText,
              spaceId,
              questionId: replyingTo.id,
            }),
          });
        } catch (emailErr) {
          console.warn('[email] notification failed (non-blocking):', emailErr);
        }
      }

      toast({
        title: isSelfAnswer ? 'Answer saved' : 'Reply sent',
        description: isSelfAnswer
          ? 'Saved your own answer (no email sent - that\'s your address).'
          : replyingTo.visitor_email
            ? `Your answer was sent to ${replyingTo.visitor_email}.`
            : 'Answer saved.',
      });
      closeReply();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reply.';
      toast({ variant: 'destructive', title: 'Reply failed', description: msg });
      setIsSubmittingReply(false);
    }
  };

  const pendingCount = useMemo(() => questions.filter((q) => !q.answer).length, [questions]);
  const repliedCount = useMemo(() => questions.filter((q) => q.answer).length, [questions]);

  return (
    <>
      {/* ── Header row ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">Q&A</h1>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              {pendingCount} pending
            </Badge>
          )}
          {repliedCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {repliedCount} replied
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {allowingQuestions ? 'Allowing visitor questions' : 'Questions disabled'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setAllowingQuestions(true)}>On</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAllowingQuestions(false)}>Off</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Questions list ─────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 border rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <div className="border rounded-lg h-48 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquare className="h-10 w-10" />
            <h3 className="text-lg font-semibold">No questions yet</h3>
            <p className="text-sm">Questions from visitors will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const askerName = q.visitor_name || q.visitor_email?.split('@')[0] || 'Anonymous';
            const isReplied = !!q.answer;
            return (
              <div
                key={q.id}
                className={`rounded-lg border bg-white p-5 ${
                  isReplied ? 'border-gray-200' : 'border-orange-200 bg-orange-50/30'
                }`}
              >
                {/* Asker info */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
                        {(askerName[0] || '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{askerName}</p>
                      {q.visitor_email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {q.visitor_email}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(q.asked_at), { addSuffix: true })}
                        </span>
                        {q.file_name && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {q.file_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isReplied ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Replied
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Pending</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openReply(q)}>
                          {isReplied ? 'Edit reply' : 'Reply'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(q.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Question */}
                <div className="rounded-md bg-gray-50 p-3 mb-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Question
                  </p>
                  <p className="text-sm whitespace-pre-line">{q.question}</p>
                </div>

                {/* Answer or Reply CTA */}
                {isReplied ? (
                  <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
                    <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-1">
                      Your answer{' '}
                      <span className="font-normal text-blue-600 normal-case">
                        - sent{' '}
                        {q.answered_at &&
                          formatDistanceToNow(new Date(q.answered_at), { addSuffix: true })}
                      </span>
                    </p>
                    <p className="text-sm whitespace-pre-line">{q.answer}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-2 text-blue-700"
                      onClick={() => openReply(q)}
                    >
                      Edit reply
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => openReply(q)} className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    Send reply
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reply dialog ────────────────────────────────── */}
      <Dialog open={!!replyingTo} onOpenChange={(o) => !o && closeReply()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {replyingTo?.answer ? 'Edit your reply' : 'Reply to question'}
            </DialogTitle>
            <DialogDescription>
              {replyingTo?.visitor_email ? (
                <>
                  Your answer will be sent to <span className="font-medium">{replyingTo.visitor_email}</span> by
                  email, and shown in their notifications if they have an account here.
                </>
              ) : (
                'Your answer will be saved. The visitor did not provide a contact email.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-md bg-gray-50 border p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                {replyingTo?.visitor_name ?? 'Visitor'} asked
              </p>
              <p className="text-sm whitespace-pre-line">{replyingTo?.question}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reply">Your answer</Label>
              <Textarea
                id="reply"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a clear, helpful reply…"
                className="min-h-[140px]"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeReply} disabled={isSubmittingReply}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} disabled={isSubmittingReply || !replyText.trim()}>
              {isSubmittingReply ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add FAQ dialog (owner pre-emptively writes Q+A) ─── */}
      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Answer your own question</DialogTitle>
            <DialogDescription>
              Write a question and answer to address common topics. It&apos;ll be published to space visitors as part of your FAQ.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <AddOwnFaqFields spaceId={spaceId} onSaved={() => setIsAddQuestionOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Add-FAQ form (extracted for clarity) ───────────────────────────────────

function AddOwnFaqFields({ spaceId, onSaved }: { spaceId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!q.trim() || !a.trim()) {
      toast({ variant: 'destructive', title: 'Both fields required' });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ownerEmail = user?.email ?? null;
    const ownerName = ownerEmail?.split('@')[0] ?? 'Owner';

    const { error } = await supabase.from('space_questions').insert({
      space_id: spaceId,
      visitor_name: ownerName,
      visitor_email: ownerEmail,
      question: q.trim(),
      answer: a.trim(),
      answered_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
      return;
    }
    toast({ title: 'FAQ added' });
    setQ('');
    setA('');
    onSaved();
  };

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What's the question visitors keep asking?"
          className="min-h-[80px]"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Keep it clear, concise, and helpful."
          className="min-h-[120px]"
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onSaved} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save and publish
        </Button>
      </DialogFooter>
    </>
  );
}
