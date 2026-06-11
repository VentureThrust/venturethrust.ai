/**
 * Plan limits (seats + storage), resolved per user. Server-safe: plan-catalogue
 * holds no secrets, and the resolver only uses a Supabase client you pass in
 * (use the service-role client so it can read payments/profiles).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { tierById } from './plan-catalogue';

export function limitsForTier(tierId: string | null) {
  const t = tierById(tierId);
  return {
    tier: t,
    seats: t?.seats ?? 1,
    spaces: t?.spaces ?? null,
    visitorsPerSpace: t?.visitorsPerSpace ?? null,
    storageGb: t?.storageGb ?? 1,
    storageBytes: (t?.storageGb ?? 1) * 1024 * 1024 * 1024,
  };
}

/**
 * The user's current plan tier id, from their latest PAID payment; falls back
 * to the free tier when the profile is on the free plan, else null.
 */
export async function resolveUserTierId(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: pay } = await admin
    .from('payments')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'PAID')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pay?.plan_id) return pay.plan_id as string;

  const { data: prof } = await admin
    .from('profiles')
    .select('plan_status')
    .eq('id', userId)
    .maybeSingle();
  if ((prof as { plan_status?: string } | null)?.plan_status === 'free') return 'vdr-free';
  return null;
}
