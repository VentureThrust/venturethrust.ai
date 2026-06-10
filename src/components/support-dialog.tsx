'use client';

/**
 * SupportDialog - the in-app support panel opened by the sidebar "Support"
 * button. Phase 1: self-serve quick answers (a conversational help center in
 * static form) plus a contact form that posts to /api/support (emails the team
 * via Zoho and logs to support_tickets). Phase 2 will add a Claude-powered
 * assistant as the instant first line on this same panel.
 */

import { useState } from 'react';
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
import { LifeBuoy, Loader2, Check, ChevronDown } from 'lucide-react';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I share a document or data room?',
    a: 'Create a Space (your data room), add files or folders, then share a secure link. You can gate it with an NDA, a password, or an expiry date, and control who is allowed to open it.',
  },
  {
    q: 'Can I see who viewed my documents?',
    a: 'Yes. Open a space and go to Analytics to see views, time spent on each page, and exactly who opened what, in real time.',
  },
  {
    q: 'How do plans and billing work?',
    a: 'Pick a plan on the plan page. Paid plans are billed securely through Cashfree and stay active for the billing cycle, after which you renew to keep access.',
  },
  {
    q: 'Is my data secure?',
    a: 'Files are private by default and isolated per account. You can add NDA or password gates, dynamic watermarks (email and IP), and screenshot deterrents on shared views.',
  },
];

const CATEGORIES = ['General question', 'Billing & plans', 'Technical issue', 'Account', 'Feature request'];

export function SupportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState('');

  const reset = () => {
    setCategory(CATEGORIES[0]);
    setSubject('');
    setMessage('');
    setSending(false);
    setSent(false);
    setError(null);
  };

  const submit = async () => {
    if (message.trim().length < 5) {
      setError('Please describe your issue in a few words.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      setSentToEmail(data.session?.user?.email ?? '');
      if (!token) {
        setError('Please log in again to contact support.');
        setSending(false);
        return;
      }
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, category, message }),
      });
      if (!res.ok) {
        setError('Could not send right now. Please try again in a moment.');
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Could not send right now. Please try again in a moment.');
    }
    setSending(false);
  };

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
                <DialogTitle>How can we help?</DialogTitle>
              </div>
              <DialogDescription>
                Check the quick answers below, or send us a message. We are here 24/7 and reply to your account email.
              </DialogDescription>
            </DialogHeader>

            {/* Quick answers (self-serve) */}
            <div className="space-y-2">
              {FAQS.map((f, i) => (
                <details key={i} className="group rounded-lg border border-gray-200 px-3 py-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                    {f.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>

            {/* Contact form */}
            <div className="mt-2 space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Still need a hand? Send us a message.</p>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button onClick={submit} disabled={sending} className="w-full bg-gray-900 text-white hover:bg-gray-800">
                {sending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  'Send message'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
