'use client';

/**
 * AccountManagerButton - header shortcut to the investor's account manager,
 * shown to Investor plan accounts only (everyone else renders nothing).
 * Sits in the top bar next to the notification bell.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Headset } from 'lucide-react';

export function AccountManagerButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;
        const { data } = await supabase
          .from('profiles')
          .select('is_investor')
          .eq('id', uid)
          .maybeSingle();
        if (active && (data as { is_investor?: boolean } | null)?.is_investor === true) {
          setVisible(true);
        }
      } catch { /* stay hidden */ }
    })();
    return () => { active = false; };
  }, []);

  if (!visible) return null;

  return (
    <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
      <Link href="/account-manager" title="Your account manager">
        <Headset className="h-5 w-5" />
        <span className="hidden md:inline">Account Manager</span>
      </Link>
    </Button>
  );
}
