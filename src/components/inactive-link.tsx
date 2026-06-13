'use client';

/**
 * Shown when a share link is inactive (disabled, expired, or the owner's plan
 * lapsed) - works for both space links (pass `token`) and single-file agreement
 * links (pass `fileId`). We never reveal the reason. Flow:
 *   1. Capture the visitor's email (tracked, so the owner can see who tried).
 *   2. Neutral "this link is inactive" with two actions:
 *        - Request reactivation  (one click, emails the owner)
 *        - Send a message        (name + message, emails the owner)
 * All actions POST to /api/share-links/contact-owner.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  MailCheck,
  RefreshCw,
  MessageSquare,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'email' | 'options' | 'message' | 'sent';

export function InactiveLink({
  token,
  fileId,
  spaceId,
}: {
  token?: string;
  fileId?: string;
  spaceId?: string;
}) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentKind, setSentKind] = useState<'reactivate' | 'message'>('reactivate');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function post(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch('/api/share-links/contact-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fileId, spaceId, action, email: email.trim(), ...extra }),
    });
    return res.ok;
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    await post('visit').catch(() => {}); // best-effort tracking
    setLoading(false);
    setStep('options');
  }

  async function requestReactivation() {
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
        {step === 'email' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-full bg-muted p-4 text-muted-foreground">
                <MailCheck className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">Enter your email to continue</CardTitle>
              <CardDescription className="text-base">
                Tell us where to reach you, then you can open this shared link.
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <form onSubmit={submitEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-[#4285F4] text-white hover:bg-[#3367d6]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                </Button>
              </form>
            </div>
          </>
        )}

        {step === 'options' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-full bg-amber-50 p-4 text-amber-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">This link is inactive</CardTitle>
              <CardDescription className="text-base">
                It is currently unavailable. You can ask the sender to reactivate it, or send them a
                message.
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
              {error && <p className="text-center text-sm text-red-600">{error}</p>}
            </div>
          </>
        )}

        {step === 'message' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Send a message</CardTitle>
              <CardDescription className="text-base">
                We will pass this to the sender, along with your email.
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <form onSubmit={submitMessage} className="space-y-4">
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
