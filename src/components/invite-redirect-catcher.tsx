'use client';

/**
 * When a workspace-invite magic link lands the user on the homepage (because
 * the deep `/invite/accept/[token]` redirect URL isn't allow-listed in Supabase
 * Auth), Supabase still signs them in via the URL hash. This catcher notices
 * THAT specific arrival and forwards them to the proper accept page.
 *
 * IMPORTANT: it must ONLY act on a genuine magic-link arrival - i.e. when the
 * URL carries auth tokens (`#access_token=…` / `?code=…`). It must NOT redirect
 * on a normal homepage visit, otherwise a signed-in user who simply opens the
 * landing page (and happens to have a pending invite) gets yanked away from it.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function InviteRedirectCatcher() {
  const router = useRouter();
  const handled = useRef(false);

  // Captured synchronously on the first render - before supabase-js clears the
  // auth hash from the URL. Only true when we actually arrived via an auth link.
  const [cameFromAuthLink] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    return (
      hash.includes('access_token') ||
      hash.includes('refresh_token') ||
      /[?&]code=/.test(search)
    );
  });

  useEffect(() => {
    // Normal landing-page visit → do nothing. The catcher is strictly for the
    // magic-link-bounced-to-homepage case.
    if (!cameFromAuthLink) return;

    const check = async (session: { access_token?: string } | null) => {
      if (handled.current || !session?.access_token) return;
      handled.current = true;
      try {
        const res = await fetch('/api/invite/pending', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.ok && json.token) {
          router.replace(`/invite/accept/${json.token}`);      // pending invite → accept page
        } else if (json.ok && json.isMember) {
          router.replace('/spaces');                            // already joined → workspace
        }
      } catch {
        /* ignore - they can still navigate manually */
      }
    };

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => check(session));
    return () => sub.subscription.unsubscribe();
  }, [cameFromAuthLink, router]);

  return null;
}
