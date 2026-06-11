'use client';

/**
 * AuthSyncGuard - keeps the app in sync with the active login.
 *
 * The Supabase session is shared across every tab of a browser. If you sign in
 * as a different account in another tab (or sign out), this tab would keep
 * showing the old account until it is reloaded, which lets you act as the wrong
 * account by accident. This watches for the signed-in user id changing and
 * reloads the page so the UI always matches whoever is actually logged in.
 *
 * Mounted in the authenticated app shells only, so it never interferes with the
 * intentional sign-in navigation on the login/signup pages.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function AuthSyncGuard() {
  // undefined = baseline not captured yet; null = signed out; string = user id.
  const baselineRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active && baselineRef.current === undefined) {
        baselineRef.current = data.session?.user?.id ?? null;
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user?.id ?? null;

      // First time we learn who is logged in: just record it, do not reload.
      if (baselineRef.current === undefined) {
        baselineRef.current = current;
        return;
      }

      // The active account changed (switched or signed out) -> reload to match.
      if (current !== baselineRef.current) {
        baselineRef.current = current;
        window.location.reload();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
