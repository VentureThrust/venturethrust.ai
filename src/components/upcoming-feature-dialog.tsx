'use client';

/**
 * UpcomingFeatureDialog
 *
 * A reusable "Coming soon" modal with a pilot-waitlist form. Used to gate the
 * AI Due Diligence report while we run a closed pilot (we don't yet have enough
 * labeled data, and a wrong risk score would break user trust). Every
 * "generate report / run AI scan" trigger opens this instead of calling the
 * backend. Submissions POST to /api/pilot-signup (emails the team).
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, CheckCircle2, Rocket } from 'lucide-react';

interface UpcomingFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  defaultEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UpcomingFeatureDialog({
  open,
  onOpenChange,
  featureName = 'AI Due Diligence',
  defaultEmail = '',
}: UpcomingFeatureDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On open: prefill the email (if we have one) and clear prior state.
  useEffect(() => {
    if (open) {
      setEmail((prev) => prev || defaultEmail);
      setDone(false);
      setError(null);
    }
  }, [open, defaultEmail]);

  const emailValid = EMAIL_RE.test(email.trim());

  const submit = async () => {
    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/pilot-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          organization: organization.trim(),
          message: message.trim(),
          feature: featureName,
        }),
      });
      if (!res.ok) throw new Error('request_failed');
      setDone(true);
    } catch {
      setError('Could not submit right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">You&apos;re on the pilot list 🎉</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Thanks{name ? `, ${name.split(' ')[0]}` : ''}! We&apos;re onboarding a small group of
              due-diligence professionals first. We&apos;ll email <strong>{email}</strong> the
              moment your early access is ready.
            </p>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 border border-blue-200">
                  <Rocket className="h-3 w-3" /> Coming soon
                </span>
              </div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                {featureName} is launching soon
              </DialogTitle>
              <DialogDescription>
                Our AI engine is in a closed pilot. We&apos;re validating accuracy with a small
                group of professional investors and analysts first - so every report you generate
                is one you can trust. Join the pilot waitlist for early access.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="pilot-name">Name</Label>
                <Input
                  id="pilot-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pilot-email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pilot-email"
                  type="email"
                  placeholder="you@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pilot-org">Firm / Organization</Label>
                <Input
                  id="pilot-org"
                  placeholder="e.g. Acme Ventures"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pilot-msg">What kind of diligence do you do? (optional)</Label>
                <Textarea
                  id="pilot-msg"
                  rows={3}
                  placeholder="Tell us briefly about your use case…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Maybe later
              </Button>
              <Button
                className="sm:flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                onClick={submit}
                disabled={submitting || !emailValid}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Joining…
                  </>
                ) : (
                  'Join the pilot waitlist'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
