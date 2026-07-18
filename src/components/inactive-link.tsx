'use client';

/**
 * Shown when a share link is inactive (disabled, expired, or the owner's plan
 * lapsed) - works for both space links (pass `token`) and single-file agreement
 * links (pass `fileId`). We never reveal the reason.
 *
 * The visitor is NEVER asked for their email up front: the message comes
 * first. If they are logged in we detect their address from the session and
 * use it for tracking and for the contact actions; if they are anonymous the
 * email is asked only inside the action they choose (the owner has to know
 * who to reply to). Actions POST to /api/share-links/contact-owner.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'options' | 'reactivate' | 'message' | 'sent';

export function InactiveLink({
  token,
  fileId,
  spaceId,
}: {
  token?: string;
  fileId?: string;
  spaceId?: string;
}) {
  const [step, setStep] = useState<Step>('options');
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentKind, setSentKind] = useState<'reactivate' | 'message'>('reactivate');
  const tracked = useRef(false);

  const effectiveEmail = (sessionEmail ?? email).trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail);

  async function post(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch('/api/share-links/contact-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fileId, spaceId, action, email: effectiveEmail, ...extra }),
    });
    return res.ok;
  }

  // Logged-in visitors are identified silently: their session email powers
  // the visit tracking and prefills the contact actions. No prompt.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const addr = session?.user?.email ?? null;
        if (!active || !addr) return;
        setSessionEmail(addr);
        if (!tracked.current) {
          tracked.current = true;
          fetch('/api/share-links/contact-owner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, fileId, spaceId, action: 'visit', email: addr }),
          }).catch(() => {});
        }
      } catch {
        /* anonymous visitor */
      }
    })();
    return () => { active = false; };
  }, [token, fileId, spaceId]);

  async function requestReactivation() {
    // Anonymous visitor: we need an address the sender can reply to.
    if (!validEmail) {
      setError('');
      setStep('reactivate');
      return;
    }
    setError('');
    setLoading(true);
    const ok = await post('reactivate');
    setLoading(false);
    if (ok) {
      setSentKind('reactivate');
      setStep('sent');
    } else {
      setError('Could not send right now. Please try again.');
    }
  }

  async function submitReactivate(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    const ok = await post('reactivate');
    setLoading(false);
    if (ok) {
      setSentKind('reactivate');
      setStep('sent');
    } else {
      setError('Could not send right now. Please try again.');
    }
  }

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setError('Please write a short message.');
      return;
    }
    setError('');
    setLoading(true);
    const ok = await post('message', { name: name.trim(), message: message.trim() });
    setLoading(false);
    if (ok) {
      setSentKind('message');
      setStep('sent');
    } else {
      setError('Could not send right now. Please try again.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        {step === 'options' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-full bg-amber-50 p-4 text-amber-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">This link is no longer active</CardTitle>
              <CardDescription className="text-base">
                Please ask the sender to reactivate this link or resend you the documents.
              </CardDescription>
            </CardHeader>
            <div className="space-y-3 px-6 pb-6">
              <Button
                onClick={requestReactivation}
                disabled={loading}
                className="h-11 w-full gap-2 bg-[#4285F4] text-white hover:bg-[#3367d6]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" /> Request reactivation
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setError('');
                  setStep('message');
                }}
                variant="outline"
                className="h-11 w-full gap-2"
              >
                <MessageSquare className="h-4 w-4" /> Send a message
              </Button>
              {sessionEmail && (
                <p className="text-center text-xs text-muted-foreground">
                  The sender will see your request came from {sessionEmail}.
                </p>
              )}
              {error && <p className="text-center text-sm text-red-600">{error}</p>}
            </div>
          </>
        )}

        {step === 'reactivate' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Request reactivation</CardTitle>
              <CardDescription className="text-base">
                Where can the sender reach you once the link is active again?
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <form onSubmit={submitReactivate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="react-email">Email</Label>
                  <Input
                    id="react-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setError('');
                      setStep('options');
                    }}
                    className="h-11"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 flex-1 bg-[#4285F4] text-white hover:bg-[#3367d6]"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send request'}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}

        {step === 'message' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Send a message</CardTitle>
              <CardDescription className="text-base">
                We will pass this to the sender so they can reply to you.
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <form onSubmit={submitMessage} className="space-y-4">
                {!sessionEmail && (
                  <div className="space-y-2">
                    <Label htmlFor="msg-email">Email</Label>
                    <Input
                      id="msg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="h-11"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg">Message</Label>
                  <textarea
                    id="msg"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Let the sender know what you need."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setError('');
                      setStep('options');
                    }}
                    className="h-11"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 flex-1 bg-[#4285F4] text-white hover:bg-[#3367d6]"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send message'}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}

        {step === 'sent' && (
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 w-fit rounded-full bg-green-50 p-4 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">
              {sentKind === 'reactivate' ? 'Request sent' : 'Message sent'}
            </CardTitle>
            <CardDescription className="text-base">
              {sentKind === 'reactivate'
                ? 'We have let the sender know you would like access. If they reactivate the link, you will be able to open it.'
                : 'Your message has been sent to the sender. They can reply to you by email.'}
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}
