'use client';

/**
 * StorageMeter - a small "X of Y GB used" bar for the signed-in user. Usage is
 * the sum of their files' sizes; the cap comes from their plan tier. Turns
 * amber near full and red when almost out. Drop it anywhere (Billing, dashboard).
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getStorageUsageBytes, getStorageCapBytes, formatGib } from '@/lib/storage-usage';
import { cn } from '@/lib/utils';
import { HardDrive } from 'lucide-react';

export function StorageMeter({ className }: { className?: string }) {
  const [usage, setUsage] = useState<number | null>(null);
  const [cap, setCap] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [u, c] = await Promise.all([
        getStorageUsageBytes(user.id),
        getStorageCapBytes(user.id),
      ]);
      if (active) {
        setUsage(u);
        setCap(c);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (usage === null || cap === null) {
    return (
      <div className={cn('rounded-2xl border bg-white p-4 shadow-sm', className)}>
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
        <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-gray-100" />
      </div>
    );
  }

  const pct = cap > 0 ? Math.min(100, (usage / cap) * 100) : 0;
  const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-[#4285F4]';
  const free = Math.max(0, cap - usage);

  return (
    <div className={cn('rounded-2xl border bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <HardDrive className="h-4 w-4 text-muted-foreground" /> Storage
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-gray-900">{formatGib(usage)}</span> of {formatGib(cap)} used
        </div>
      </div>
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {pct >= 95 ? 'Almost full - upgrade for more space.' : `${formatGib(free)} free`}
      </p>
    </div>
  );
}
