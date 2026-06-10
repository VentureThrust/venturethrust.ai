'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface User {
  email: string;
  firstName: string;
  plan: 'vdr_only' | 'ai_only' | 'vdr_ai' | null;
  planStatus: string | null;
  planExpiresAt: string | null;
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

      const full = await supabase
        .from('profiles')
        .select('plan, plan_status, plan_expires_at')
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
      }

      setUser({
        email: session.user.email ?? '',
        firstName: session.user.email?.split('@')[0] ?? '',
        plan,
        planStatus,
        planExpiresAt,
        avatarUrl:
          'https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
