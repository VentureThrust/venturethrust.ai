/**
 * Server-side helper: is a workspace owner's plan currently active?
 *
 * Used by the public link resolvers so that when an owner's subscription lapses,
 * every link they shared stops working for recipients. Fails OPEN on any lookup
 * error so a transient DB hiccup never locks out a paying customer's viewers.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { isPlanActive } from './plan';

export async function isOwnerPlanActive(
  admin: SupabaseClient,
  ownerId: string | null | undefined,
): Promise<boolean> {
  if (!ownerId) return true;
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('plan, plan_expires_at, is_admin')
      .eq('id', ownerId)
      .maybeSingle();
    if (error || !data) return true;
    const row = data as { plan?: string | null; plan_expires_at?: string | null; is_admin?: boolean };
    if (row.is_admin) return true;
    return isPlanActive(row.plan ?? null, row.plan_expires_at ?? null);
  } catch {
    return true;
  }
}

/** Resolve the owner (created_by) of a space. Returns null if unknown. */
export async function getSpaceOwner(
  admin: SupabaseClient,
  spaceId: string | null | undefined,
): Promise<string | null> {
  if (!spaceId) return null;
  try {
    const { data } = await admin.from('spaces').select('created_by').eq('id', spaceId).maybeSingle();
    return (data as { created_by?: string | null } | null)?.created_by ?? null;
  } catch {
    return null;
  }
}

/** Given a space id, is that space's owner's plan active? Convenience wrapper. */
export async function isSpaceOwnerPlanActive(
  admin: SupabaseClient,
  spaceId: string | null | undefined,
): Promise<boolean> {
  if (!spaceId) return true;
  try {
    const { data } = await admin.from('spaces').select('created_by').eq('id', spaceId).maybeSingle();
    const ownerId = (data as { created_by?: string | null } | null)?.created_by ?? null;
    return isOwnerPlanActive(admin, ownerId);
  } catch {
    return true;
  }
}
