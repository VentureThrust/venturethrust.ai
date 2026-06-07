'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface User {
  email: string;
  firstName: string;
  plan: 'vdr_only' | 'ai_only' | 'vdr_ai' | null;
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      setUser({
        email: session.user.email ?? '',
        firstName: session.user.email?.split('@')[0] ?? '',
        plan: profile?.plan ?? null,
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
