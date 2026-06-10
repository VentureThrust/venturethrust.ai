'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabaseClient';
import { getEffectiveOwnerId } from '@/lib/workspace';
import { isPlanActive } from '@/lib/plan';

/**
 * Entitlement gate for the authenticated app shells.
 *
 * Rule: a user may only use the product once they have selected a plan. Without
 * this, anyone who signs up but never finishes the plan step (or who simply
 * navigates straight to /dashboard) could use the whole app for free. The plan
 * step was previously enforced only by where signup redirected, so logging back
 * in or deep-linking bypassed it entirely.
 *
 * The ONE exception is a guest who is working inside someone else's workspace (a
 * pure invitee). Their access rides on the workspace owner's plan, so they are
 * never asked to pick one. We detect that by comparing the effective workspace
 * owner id to the signed-in user id: if they differ, the user is a guest.
 *
 * Mounted just inside <UserProvider> in both authenticated layouts so that, for
 * a user who is about to be bounced, none of the data providers below even run.
 *
 * Note: this is an ENTITLEMENT gate, not a data-security boundary. Per-user data
 * isolation is enforced separately by Supabase RLS; this only governs whether a
 * user is allowed into the product without choosing a plan.
 */
export function PlanGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<'checking' | 'allowed'>('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (loading) return; // wait until the session + plan have loaded

      // Not signed in: the app shell is not for them.
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      // Admins (the owner / support team) never need a plan.
      if (user.isAdmin) {
        if (!cancelled) setState('allowed');
        return;
      }

      // Active (non-expired) plan: allowed straight through (no extra lookups).
      if (isPlanActive(user.plan, user.planExpiresAt)) {
        if (!cancelled) setState('allowed');
        return;
      }

      // No plan, or a lapsed one. Allowed ONLY if they are working inside
      // another owner's workspace (a guest rides on the owner's plan).
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      const ownerId = await getEffectiveOwnerId();
      if (cancelled) return;

      if (uid && ownerId && ownerId !== uid) {
        setState('allowed'); // guest riding on the owner's paid workspace
      } else {
        router.replace('/choose-role'); // owner without an active plan: pick one first
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading, router, pathname]);

  if (state !== 'allowed') {
    // Neutral full-screen hold so protected content never flashes before the
    // gate decides (and before a no-plan user is redirected).
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
