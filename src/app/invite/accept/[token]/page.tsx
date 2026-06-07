'use client';

/**
 * Standalone "Accept your invitation" page (no app sidebar). The invitee lands
 * here after clicking the magic link in their email - Supabase has already
 * signed them in (detectSessionInUrl), so we just confirm and record the
 * workspace membership, then send them to the dashboard (now showing the
 * inviter's spaces).
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, MailCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setActiveWorkspace } from '@/lib/workspace';

type Info = {
  invitedEmail: string;
  role: string;
  status: string;
  ownerName: string;
  ownerId: string;
  expired: boolean;
};

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = (params.token as string) ?? '';

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  // Pick up the session created by the magic-link redirect.
  useEffect(() => {
    const apply = (session: { user?: { email?: string; id?: string }; access_token?: string } | null) => {
      setUserEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
      setAccessToken(session?.access_token ?? null);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => apply(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load invitation info.
  useEffect(() => {
    if (!token) { setError('missing_token'); setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/invite/info?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.ok) setError(json.error || 'not_found');
        else setInfo(json.invitation as Info);
      } catch {
        setError('network');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Already accepted (the link was clicked again after joining) → don't show
  // the invite screen again; take them straight to the shared workspace.
  useEffect(() => {
    if (info?.status === 'accepted') {
      // Make the shared workspace the active one before landing in it.
      if (userId && info.ownerId) setActiveWorkspace(userId, info.ownerId);
      const t = setTimeout(() => { window.location.href = '/spaces'; }, 700);
      return () => clearTimeout(t);
    }
  }, [info, userId]);

  const handleAccept = async () => {
    if (!accessToken) {
      toast({
        variant: 'destructive',
        title: 'Please open this link from your invitation email',
        description: 'That signs you in so we can add you to the workspace.',
      });
      return;
    }
    setAccepting(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'failed');
      // Switch the invitee INTO the workspace they just joined, so they land
      // there (not their own) - even if they already own a workspace.
      const ownerId = json.workspaceOwnerId || info?.ownerId;
      if (userId && ownerId) setActiveWorkspace(userId, ownerId);
      setDone(true);
      // Hard navigation so providers re-resolve the effective workspace owner
      // from scratch (the membership row now exists) and load the shared spaces.
      setTimeout(() => { window.location.href = '/spaces'; }, 1600);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Could not accept invitation',
        description: e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setAccepting(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4">
      <div className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-white text-sm">V</span>
        VentureThrust
      </div>
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return <Shell><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></Shell>;
  }

  if (error || !info) {
    return (
      <Shell>
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error === 'not_found'
            ? "This invitation link is invalid or has been revoked."
            : "We couldn't load this invitation. Please try the link from your email again."}
        </p>
      </Shell>
    );
  }

  if (done || info.status === 'accepted') {
    return (
      <Shell>
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h1 className="mt-4 text-xl font-semibold">You&apos;re in!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve joined <strong className="text-foreground">{info.ownerName}</strong>&apos;s workspace.
        </p>
        <Button className="mt-6 bg-gray-900 text-white hover:bg-gray-800" onClick={() => { window.location.href = '/spaces'; }}>
          Go to workspace
        </Button>
      </Shell>
    );
  }

  if (info.expired) {
    return (
      <Shell>
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold">This invitation has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask <strong className="text-foreground">{info.ownerName}</strong> to send you a new invite.
        </p>
      </Shell>
    );
  }

  // Signed in, but as a different email than the invite was sent to.
  const emailMismatch = userEmail && userEmail.toLowerCase() !== info.invitedEmail.toLowerCase();

  return (
    <Shell>
      <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <MailCheck className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="mt-4 text-xl font-semibold">Accept your invitation</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You (<span className="font-medium">{info.invitedEmail}</span>) have been invited to join{' '}
        <strong className="text-foreground">{info.ownerName}</strong>&apos;s workspace on VentureThrust.
        Click the button below to confirm your acceptance and gain access.
      </p>

      {emailMismatch && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          You&apos;re signed in as <strong>{userEmail}</strong>, but this invite was sent to{' '}
          <strong>{info.invitedEmail}</strong>. Open the link from that inbox to accept.
        </p>
      )}

      {!userEmail && (
        <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Open this link directly from your invitation email - that signs you in automatically.
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" onClick={() => router.push('/')}>Ignore</Button>
        <Button
          className="bg-gray-900 text-white hover:bg-gray-800"
          onClick={handleAccept}
          disabled={accepting || !accessToken || !!emailMismatch}
        >
          {accepting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…</>) : 'Accept invitation'}
        </Button>
      </div>
    </Shell>
  );
}
