'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface User {
  email: string;
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

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setLoading(false);
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
        const basic = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .maybeSingle();
        plan = (basic.data?.plan as User['plan']) ?? null;
      } else if (full.data) {
        plan = (full.data.plan as User['plan']) ?? null;
        planStatus = (full.data.plan_status as string | null) ?? null;
        planExpiresAt = (full.data.plan_expires_at as string | null) ?? null;
        isAdmin = (full.data as { is_admin?: boolean }).is_admin === true;
      }

      const meta = (session.user.user_metadata ?? {}) as { full_name?: string; avatar_url?: string };
      const fullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';

      setUser({
        email: session.user.email ?? '',
        firstName: fullName ? fullName.split(/\s+/)[0] : (session.user.email?.split('@')[0] ?? ''),
        plan,
        planStatus,
        planExpiresAt,
        isAdmin,
        avatarUrl: typeof meta.avatar_url === 'string' ? meta.avatar_url : '',
      });

      setLoading(false);
    };

    loadUser();
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
