'use client';

/**
 * <GatesFlow> - Client Component for the interactive share-link gates.
 *
 * The server has already verified the link exists, is active, and isn't
 * expired before this component renders. So the heavy "is this link valid"
 * check is already done - this file is purely the multi-step UI.
 *
 * Security model:
 *   - The server's POST /api/share-links/validate is the source of truth
 *     for email allow/block list + password check. The form just submits
 *     credentials and reacts to OK/BLOCKED/INVALID_PASSWORD.
 *   - password_hash and allow_block_emails NEVER reach this component.
 *   - NDA + signature are UX-only gates (acceptance + name capture), logged
 *     via direct Supabase inserts into share_link_access_logs.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SharedFileView, type SharedFile } from './shared-file-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Mail,
  Lock,
  ShieldCheck,
  ShieldOff,
  Ban,
  FileSignature,
} from 'lucide-react';

interface LinkInfo {
  id: string;
  space_id: string;
  emailRequired: boolean;
  hasPassword: boolean;
  requireNda: boolean;
  requireSignature: boolean;
  ndaText: string | null;
  fileId: string | null;
  /** Send-by-email links: the address this link was sent to. The viewer is
   *  never asked for an email; all activity is attributed to this address. */
  recipientEmail?: string | null;
}

interface GatesFlowProps {
  link: LinkInfo;
  token: string;
}

type Step = 'email' | 'password' | 'blocked' | 'nda' | 'signature' | 'redirecting' | 'file';

const DEFAULT_NDA_TEXT = `This Non-Disclosure Agreement ("Agreement") governs your access to the confidential information contained within this shared space.

1. CONFIDENTIAL INFORMATION
All information, documents, data, and materials made available through this link are considered confidential and proprietary to the sender.

2. RESTRICTIONS
You agree:
• Not to disclose, share, or distribute any content to third parties without written consent.
• Not to copy, screenshot, screen-record, or otherwise reproduce the content for unauthorized purposes.
• To use the information solely for the evaluation purpose for which it was shared.

3. RETURN OR DESTRUCTION
Upon request from the sender, you will promptly destroy or return all copies of the confidential information in your possession.

4. ACKNOWLEDGEMENT
By accepting this NDA, you confirm that you have authority to bind yourself (or your organization) to these terms, and that you understand any breach may give rise to legal action.

This agreement is effective immediately upon acceptance.`;

function getDeviceInfo(): { device: string; os: string } {
  if (typeof navigator === 'undefined') return { device: 'Unknown', os: 'Unknown' };
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'Tablet';
  else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) device = 'Mobile';
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  return { device, os };
}

export function GatesFlow({ link, token }: GatesFlowProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Decide which step to show first based on the link's gate config
  const firstStep: Step = link.emailRequired
    ? 'email'
    : link.hasPassword
    ? 'password'
    : link.requireNda
    ? 'nda'
    : link.requireSignature
    ? 'signature'
    : 'redirecting';

  const [step, setStep] = useState<Step>(firstStep);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [fileView, setFileView] = useState<SharedFile | null>(null);
  const [fileVisitorEmail, setFileVisitorEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ranInitial = useRef(false);

  const SESSION_KEY = `shared_session_${token}`;

  // ── If first step is redirecting (no gates at all) - go through ────────
  useEffect(() => {
    if (ranInitial.current) return;
    ranInitial.current = true;
    if (firstStep === 'redirecting') {
      // Send-by-email links carry the recipient's address: attribute the
      // visit to it and stamp the session so the space view logs the right
      // email, all without ever prompting the visitor.
      const recipient = link.recipientEmail ?? null;
      // No gates: a file link opens the file directly; a space link redirects.
      if (link.fileId) {
        openFile(recipient);
      } else {
        if (recipient) {
          sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ passed: true, email: recipient, spaceId: link.space_id })
          );
        }
        // `via` carries the share token so the space viewer can load its
        // data server-side regardless of who (if anyone) is logged in.
        logAccess(recipient).finally(() =>
          router.replace(`/spaces/${link.space_id}/view?via=${encodeURIComponent(token)}`)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log every successful access to share_link_access_logs for the owner's audit trail
  const logAccess = async (visitorEmail: string | null, action: string = 'OPEN') => {
    const { device } = getDeviceInfo();
    try {
      await supabase.from('share_link_access_logs').insert({
        share_link_id: link.id,
        email: visitorEmail,
        action,
        file_id: null,
      });
    } catch (err) {
      console.warn('[share_link_access_logs] write failed:', err);
    }
    void device;
  };

  // Fetch the file (signed URL etc.) via the server validator - which re-checks
  // every gate - then render it inline. Used for file-scoped links.
  const openFile = async (visitorEmail: string | null) => {
    setStep('redirecting');
    try {
      const res = await fetch('/api/share-links/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: link.id, email: visitorEmail || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'OK' && data.file) {
        logAccess(visitorEmail);
        setFileVisitorEmail(visitorEmail || link.recipientEmail || null);
        setFileView(data.file as SharedFile);
        setStep('file');
      } else if (res.ok && data.status === 'OK' && !data.file) {
        // Gates passed but the server couldn't produce the file (missing DB row
        // or storage object) - an owner-side problem, so say so plainly instead
        // of telling the visitor to retry something that can never work.
        toast({
          variant: 'destructive',
          title: 'File unavailable',
          description: 'This file is no longer available. Please ask the sender to reshare it.',
        });
      } else {
        toast({ variant: 'destructive', title: 'Could not open the file', description: 'Please reopen the link and try again.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' });
    }
  };

  const finishAndRedirect = (visitorEmailArg: string | null) => {
    // Recipient links know who the viewer is even when no email gate ran.
    const visitorEmail = visitorEmailArg || link.recipientEmail || null;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ passed: true, email: visitorEmail, spaceId: link.space_id })
    );
    // File-scoped link: render just that one file instead of the space view.
    if (link.fileId) {
      openFile(visitorEmail);
      return;
    }
    setStep('redirecting');
    logAccess(visitorEmail).finally(() =>
      router.replace(`/spaces/${link.space_id}/view?via=${encodeURIComponent(token)}`)
    );
  };

  // Advance through remaining gates after email/password pass
  const advanceFromEmailPassword = (visitorEmail: string | null) => {
    if (link.requireNda) {
      setStep('nda');
      return;
    }
    if (link.requireSignature) {
      setStep('signature');
      return;
    }
    finishAndRedirect(visitorEmail);
  };

  // ── Email gate submit ──────────────────────────────────────────────────
  const handleEmailSubmit = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({ variant: 'destructive', title: 'Invalid email' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/share-links/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: link.id, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'OK') {
        // Email passed all server checks (allow/block etc.) and there's no password required
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, spaceId: link.space_id }));
        advanceFromEmailPassword(email);
        return;
      }
      if (data.error === 'BLOCKED') {
        setStep('blocked');
        return;
      }
      if (data.error === 'PASSWORD_REQUIRED') {
        // Email passed; now ask for password
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, spaceId: link.space_id }));
        setStep('password');
        return;
      }
      if (data.error === 'OWNER_INACTIVE') {
        toast({ variant: 'destructive', title: 'Link unavailable', description: 'This link is no longer active. Please contact the sender.' });
        return;
      }
      toast({ variant: 'destructive', title: 'Could not verify', description: data.error ?? 'Try again.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Password gate submit ───────────────────────────────────────────────
  const handlePasswordSubmit = async () => {
    if (!password) {
      toast({ variant: 'destructive', title: 'Password required' });
      return;
    }
    setIsSubmitting(true);
    try {
      const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
      const res = await fetch('/api/share-links/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: link.id,
          email: existing.email || email || undefined,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'OK') {
        advanceFromEmailPassword(existing.email || email || null);
        return;
      }
      if (data.error === 'INVALID_PASSWORD') {
        toast({ variant: 'destructive', title: 'Incorrect password' });
        return;
      }
      if (data.error === 'BLOCKED') {
        setStep('blocked');
        return;
      }
      if (data.error === 'OWNER_INACTIVE') {
        toast({ variant: 'destructive', title: 'Link unavailable', description: 'This link is no longer active. Please contact the sender.' });
        return;
      }
      toast({ variant: 'destructive', title: 'Could not verify', description: data.error ?? 'Try again.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── NDA gate ───────────────────────────────────────────────────────────
  const handleNdaAccept = async () => {
    if (!ndaAccepted) {
      toast({ variant: 'destructive', title: 'NDA not accepted' });
      return;
    }
    setIsSubmitting(true);
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    await logAccess(existing.email || null, 'NDA_ACCEPTED');
    if (link.requireSignature) {
      setStep('signature');
    } else {
      finishAndRedirect(existing.email || null);
    }
    setIsSubmitting(false);
  };

  // ── Signature gate ─────────────────────────────────────────────────────
  const handleSignatureSubmit = async () => {
    if (!signatureName.trim()) {
      toast({ variant: 'destructive', title: 'Signature required' });
      return;
    }
    setIsSubmitting(true);
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    await logAccess(existing.email || null, 'SIGNATURE_COLLECTED');
    finishAndRedirect(existing.email || null);
    setIsSubmitting(false);
  };

  // ─── UI states ────────────────────────────────────────────────────────

  if (step === 'file' && fileView) {
    return <SharedFileView file={fileView} token={token} visitorEmail={fileVisitorEmail} />;
  }

  if (step === 'redirecting') {
    return (
      <GateLayout>
        <CardHeader className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <CardDescription>Opening space…</CardDescription>
        </CardHeader>
      </GateLayout>
    );
  }

  if (step === 'email') {
    return (
      <GateLayout>
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Enter your email</CardTitle>
          <CardDescription>Enter your email to open this space.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleEmailSubmit()}
            />
          </div>
          <Button onClick={handleEmailSubmit} className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Continue
          </Button>
        </CardContent>
      </GateLayout>
    );
  }

  if (step === 'password') {
    return (
      <GateLayout>
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Enter the password</CardTitle>
          <CardDescription>Enter the password to open this space.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handlePasswordSubmit()}
            />
          </div>
          <Button onClick={handlePasswordSubmit} className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Open space
          </Button>
        </CardContent>
      </GateLayout>
    );
  }

  if (step === 'blocked') {
    return (
      <GateLayout>
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full w-fit mb-4">
            <Ban className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Access denied</CardTitle>
          <CardDescription>
            The email you provided does not have permission to view this space.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-center">
          <Button variant="outline" size="sm" onClick={() => { setEmail(''); setStep('email'); }}>
            Try a different email
          </Button>
        </CardContent>
      </GateLayout>
    );
  }

  if (step === 'nda') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
        <Card className="w-full max-w-2xl shadow-xl border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <ShieldOff className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Non-Disclosure Agreement</CardTitle>
                <CardDescription>Please read and accept before accessing this space.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-72 overflow-y-auto border rounded-md p-4 bg-muted/30 text-sm whitespace-pre-line">
              {link.ndaText || DEFAULT_NDA_TEXT}
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="nda-accept"
                checked={ndaAccepted}
                onCheckedChange={(c) => setNdaAccepted(Boolean(c))}
                className="mt-0.5"
              />
              <label htmlFor="nda-accept" className="text-sm cursor-pointer">
                I have read and agree to the terms of this Non-Disclosure Agreement.
              </label>
            </div>
            <Button onClick={handleNdaAccept} className="w-full" size="lg" disabled={isSubmitting || !ndaAccepted}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Accept &amp; Continue →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'signature') {
    return (
      <GateLayout>
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
            <FileSignature className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Sign to access</CardTitle>
          <CardDescription>Type your full legal name to acknowledge access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sig-name">Full legal name</Label>
            <Input
              id="sig-name"
              placeholder="Jane A. Doe"
              value={signatureName}
              autoFocus
              onChange={(e) => setSignatureName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleSignatureSubmit()}
              className="font-serif text-lg italic"
            />
            {signatureName.trim() && (
              <div className="border-2 border-dashed border-muted rounded-md p-4 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">Your signature preview:</p>
                <p className="font-serif text-2xl italic">{signatureName}</p>
              </div>
            )}
          </div>
          <Button
            onClick={handleSignatureSubmit}
            className="w-full"
            size="lg"
            disabled={isSubmitting || !signatureName.trim()}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Sign &amp; Enter Space
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By signing, you confirm your identity and accept that access is logged.
          </p>
        </CardContent>
      </GateLayout>
    );
  }

  return null;
}

// ─── Shared layout shell ─────────────────────────────────────────────────

function GateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-xl border-0">{children}</Card>
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Secured by VentureThrust
        </p>
      </div>
    </div>
  );
}
