'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export interface User {
  email: string;
  /** Full display name (or email prefix when no name is set). */
  name: string;
  /** First word of the name - used for the compact header pill. */
  firstName: string;
  plan: 'vdr_only' | 'ai_only' | 'vdr_ai' | null;
  planStatus: string | null;
  planExpiresAt: string | null;
  isAdmin: boolean;
  avatarUrl: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/** Once per browser session, ping the server so it can email the owner if this
 *  is a newly created account. The server holds the real "already announced"
 *  flag; this guard just avoids repeating the call on every auth event. */
let signupAnnounced = false;
async function announceSignupOnce(accessToken?: string) {
  if (signupAnnounced || !accessToken) return;
  signupAnnounced = true;
  try {
    await fetch('/api/notify/new-user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      keepalive: true,
    });
  } catch {
    /* notifications must never affect the app */
  }
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUser = async (sessionArg?: Session | null) => {
      try {
        await loadUserInner(sessionArg);
      } catch (err) {
        // NEVER leave the app stuck on the loading spinner - a failed profile
        // fetch (network blip etc.) must still resolve the auth state.
        console.warn('[use-user] loadUser failed:', err);
        if (active) setLoading(false);
      }
    };

    const loadUserInner = async (sessionArg?: Session | null) => {
      const session = sessionArg ?? (await supabase.auth.getSession()).data.session;

      if (!session?.user) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Fetch the plan plus its billing window. Falls back to plan-only on the
      // older schema where the billing columns have not been added yet, so the
      // app keeps working before the payments migration is run.
      let plan: User['plan'] = null;
      let planStatus: string | null = null;
      let planExpiresAt: string | null = null;
      let isAdmin = false;

      const full = await supabase
        .from('profiles')
        .select('plan, plan_status, plan_expires_at, is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (full.error) {
        // The full select can fail when an optional column (e.g. plan_status) is
        // absent. Still read plan AND is_admin here, so admins are recognized and
        // the plan gate lets them in instead of bouncing them to choose-plan.
        const basic = await supabase
          .from('profiles')
          .select('plan, is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        plan = (basic.data?.plan as User['plan']) ?? null;
        isAdmin = (basic.data as { is_admin?: boolean } | null)?.is_admin === true;
      } else if (full.data) {
        plan = (full.data.plan as User['plan']) ?? null;
        planStatus = (full.data.plan_status as string | null) ?? null;
        planExpiresAt = (full.data.plan_expires_at as string | null) ?? null;
        isAdmin = (full.data as { is_admin?: boolean }).is_admin === true;
      }

      const meta = (session.user.user_metadata ?? {}) as { full_name?: string; avatar_url?: string };
      const fullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
      const emailPrefix = session.user.email?.split('@')[0] ?? '';
      const displayName = fullName || emailPrefix;

      if (!active) return;

      // Tell the owner about a brand new account, once. The API decides
      // whether this account has been announced already; a repeat sign-in is a
      // no-op. Fire-and-forget: never blocks or breaks the app.
      void announceSignupOnce(session.access_token);

      setUser({
        email: session.user.email ?? '',
        name: displayName,
        firstName: displayName ? displayName.split(/\s+/)[0] : '',
        plan,
        planStatus,
        planExpiresAt,
        isAdmin,
        avatarUrl: typeof meta.avatar_url === 'string' ? meta.avatar_url : '',
      });
      setLoading(false);
    };

    loadUser();

    // Keep the cached user fresh: when the profile name/avatar is updated in
    // Settings, Supabase emits USER_UPDATED; sign-in and token refresh also fire
    // here. Refreshing on these means the header name/avatar update live without
    // a page reload.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (active) setUser(null);
        return;
      }
      // DEADLOCK FIX: supabase-js holds an internal auth lock while this
      // callback runs. Awaiting a DB query here (loadUser -> profiles select)
      // re-enters that lock and hangs forever - which is exactly what happened
      // when landing on /dashboard#access_token=… from a confirmation link:
      // SIGNED_IN fired during init, the profiles query deadlocked, `loading`
      // never resolved, and the app spun forever. Deferring to the next tick
      // lets the callback return (releasing the lock) before we query.
      setTimeout(() => loadUser(session), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
