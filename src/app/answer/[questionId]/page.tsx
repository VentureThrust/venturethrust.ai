'use client';

/**
 * /answer/[questionId] - gated answer view for question-answered emails.
 *
 * Flow:
 *   1. Read questionId from URL
 *   2. Check Supabase auth session
 *      - Not signed in → redirect to /login?next=/answer/{questionId}
 *      - Signed in → continue
 *   3. Fetch the question from space_questions
 *   4. Authorization check: user's auth email must match visitor_email on
 *      the row. If not, show "this answer wasn't sent to you" - protects
 *      against URL guessing or forwarded links being opened by the wrong person.
 *   5. Render the question + answer in a clean professional card layout.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Lock,
  Mail,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type QuestionRow = {
  id: string;
  space_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  question: string;
  answer: string | null;
  asked_at: string;
  answered_at: string | null;
  file_name: string | null;
};

type Step =
  | 'loading'
  | 'redirecting_to_login'
  | 'wrong_user'
  | 'not_found'
  | 'no_answer_yet'
  | 'ready';

export default function AnswerPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.questionId as string;

  const [step, setStep] = useState<Step>('loading');
  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) return;

    const load = async () => {
      // 1. Check auth
      const { data: authData } = await supabase.auth.getUser();
      const email = authData?.user?.email;
      if (!email) {
        // Send them to login with a return path back here
        setStep('redirecting_to_login');
        const next = encodeURIComponent(`/answer/${questionId}`);
        router.replace(`/login?next=${next}`);
        return;
      }
      setMyEmail(email);

      // 2. Fetch the question
      const { data, error } = await supabase
        .from('space_questions')
        .select('*')
        .eq('id', questionId)
        .maybeSingle();

      if (error || !data) {
        setStep('not_found');
        return;
      }

      // 3. Authorization: this answer is private to the asker
      const askerEmail = (data.visitor_email as string | null)?.toLowerCase().trim();
      const userEmail = email.toLowerCase().trim();
      if (askerEmail && askerEmail !== userEmail) {
        setStep('wrong_user');
        return;
      }

      setQuestion(data as QuestionRow);

      // 4. Has the question been answered yet?
      if (!data.answer) {
        setStep('no_answer_yet');
        return;
      }

      // 5. Fetch space name for context
      try {
        const { data: space } = await supabase
          .from('spaces')
          .select('name, title')
          .eq('id', data.space_id)
          .maybeSingle();
        if (space) setSpaceName((space.name as string) || (space.title as string) || null);
      } catch {
        /* non-fatal */
      }

      setStep('ready');
    };

    load();
  }, [questionId, router]);

  // ─── Render by step ──────────────────────────────────────────────────────

  if (step === 'loading' || step === 'redirecting_to_login') {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {step === 'redirecting_to_login' ? 'Taking you to sign in…' : 'Loading your answer…'}
          </p>
        </div>
      </Shell>
    );
  }

  if (step === 'wrong_user') {
    return (
      <Shell>
        <Card className="border-orange-200 bg-orange-50/40">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>This answer isn&apos;t for this account</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  The answer was sent to a different email address.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">You&apos;re signed in as:</span>
                <span className="font-mono">{myEmail}</span>
              </div>
              {question?.visitor_email && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Answer was sent to:</span>
                  <span className="font-mono">{question.visitor_email}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Sign out and sign back in with the email the answer was sent to, or contact the
              sender for help.
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push(`/login?next=/answer/${questionId}`);
              }}
            >
              Sign in with a different email
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (step === 'not_found') {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <CardTitle>Answer not found</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  This link doesn&apos;t point to a valid question. It may have been deleted by the sender.
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  if (step === 'no_answer_yet') {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Your question is still waiting for an answer</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Check back soon - we&apos;ll email you when the sender replies.
                </p>
              </div>
            </div>
          </CardHeader>
          {question && (
            <CardContent>
              <div className="rounded-md bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Your question
                </p>
                <p className="text-sm whitespace-pre-line">{question.question}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </Shell>
    );
  }

  // ─── Ready: show question + answer ──────────────────────────────────────

  return (
    <Shell>
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">You have an answer</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {spaceName ? (
                  <>
                    From the team at <span className="font-medium text-foreground">{spaceName}</span>
                    {question?.answered_at && (
                      <>
                        {' · '}answered{' '}
                        {formatDistanceToNow(new Date(question.answered_at), { addSuffix: true })}
                      </>
                    )}
                  </>
                ) : question?.answered_at ? (
                  <>
                    Answered {formatDistanceToNow(new Date(question.answered_at), { addSuffix: true })}
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Your question */}
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              Your question
            </p>
            <p className="text-sm whitespace-pre-line">{question?.question}</p>
            {question?.file_name && (
              <p className="text-xs text-muted-foreground mt-2">
                Asked while viewing{' '}
                <span className="font-medium">{question.file_name}</span>
              </p>
            )}
          </div>

          {/* Answer */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
            <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              Answer
            </p>
            <p className="text-base whitespace-pre-line leading-relaxed">{question?.answer}</p>
            {question?.answered_at && (
              <p className="text-xs text-blue-700/70 mt-3">
                Sent {format(new Date(question.answered_at), 'PPp')}
              </p>
            )}
          </div>

          {/* Next steps */}
          {spaceName && question?.space_id && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link href={`/spaces/${question.space_id}/view`}>
                  Return to {spaceName}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}

// ─── Layout shell ────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">VentureThrust</span>
        </div>
      </div>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">{children}</main>
    </div>
  );
}
