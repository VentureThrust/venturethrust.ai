'use client';

/**
 * BookDemoButton - "Book a demo" beside Download on a shared document.
 *
 * Rendered only where share_links.show_demo_cta is set, which is our own
 * marketing links and nothing else. A founder sharing their pitch deck through
 * VentureThrust must never watch us solicit the investor reading it.
 *
 * Name and email are the only required fields. Every extra required field on a
 * form like this costs conversions, and the rest can be asked on the call.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarCheck, Loader2, Check } from 'lucide-react';

export function BookDemoButton({
  shareLinkId,
  fileId,
  documentName,
}: {
  shareLinkId?: string | null;
  fileId?: string | null;
  documentName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firm, setFirm] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError('Your name and email, and we will do the rest.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, firm, role, phone, message,
          shareLinkId, fileId, documentName,
          sourceUrl: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });
      if (res.ok) {
        setDone(true);
      } else if (res.status === 429) {
        setError('That went through more than once. Check your inbox in a minute.');
      } else {
        setError('That did not send. Try again, or write to omprakash@venturethrust.com.');
      }
    } catch {
      setError('That did not send. Try again, or write to omprakash@venturethrust.com.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="whitespace-nowrap"
      >
        <CalendarCheck className="mr-2 h-4 w-4" />
        Book a demo
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (busy) return;
          setOpen(o);
          // Reset a moment after closing so the success state does not flash
          // away while the dialog is still animating out.
          if (!o && done) setTimeout(() => { setDone(false); setError(null); }, 200);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {done ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#0D1B3E]">
                <Check className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-lg">Thank you, {name.split(' ')[0]}</DialogTitle>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Omprakash will write to you at {email}, usually the same day. Fifteen
                minutes, whenever suits you.
              </p>
              <Button className="mt-5" onClick={() => setOpen(false)}>Close</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>See it working</DialogTitle>
                <DialogDescription>
                  Fifteen minutes on a call, whenever suits you. Leave your name and email
                  and we will come back the same day.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="dr-name">Name</Label>
                  <Input id="dr-name" value={name} onChange={(e) => setName(e.target.value)}
                         placeholder="Jane Whitfield" autoComplete="name" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dr-email">Email</Label>
                  <Input id="dr-email" type="email" value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="jane@fund.com" autoComplete="email" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dr-firm">
                    Firm <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="dr-firm" value={firm} onChange={(e) => setFirm(e.target.value)}
                         placeholder="Whitfield Capital" autoComplete="organization" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dr-role">
                    Role <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="dr-role" value={role} onChange={(e) => setRole(e.target.value)}
                         placeholder="Angel investor" />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="dr-phone">
                    Phone <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="dr-phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                         placeholder="+1 415 555 0134" autoComplete="tel" />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="dr-msg">
                    Anything you want covered{' '}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea id="dr-msg" rows={3} maxLength={2000} value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="I have three companies I passed on last year that I would want watched." />
                </div>
              </div>

              {error && <p className="text-sm font-medium text-destructive">{error}</p>}

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={busy} onClick={submit}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Request a demo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
