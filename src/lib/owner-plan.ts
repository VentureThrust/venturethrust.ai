/**
 * Server-side helper: is a workspace owner's plan currently active?
 *
 * Used by the public link resolvers so that when an owner's subscription lapses,
 * every link they shared stops working for recipients. Fails OPEN on any lookup
 * error so a transient DB hiccup never locks out a paying customer's viewers.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { isPlanActive } from './plan';

/**
 * Both lookups here sit in front of every public link open, one after the
 * other, and together they were the largest part of the wait before a document
 * appeared. A space's owner never changes and a plan changes rarely, so the
 * answers are held briefly per server instance.
 *
 * The cost of the cache is that a lapsed plan keeps working for up to a minute
 * on an instance that already answered. That is the right trade against making
 * every reader wait two round trips.
 */
const TTL_MS = 60_000;
const ownerCache = new Map<string, { v: string | null; at: number }>();
const planCache = new Map<string, { v: boolean; at: number }>();

function cached<T>(m: Map<string, { v: T; at: number }>, k: string): T | undefined {
  const hit = m.get(k);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL_MS) { m.delete(k); return undefined; }
  return hit.v;
}

export async function isOwnerPlanActive(
  admin: SupabaseClient,
  ownerId: string | null | undefined,
): Promise<boolean> {
  if (!ownerId) return true;
  const hit = cached(planCache, ownerId);
  if (hit !== undefined) return hit;
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('plan, plan_expires_at, is_admin')
      .eq('id', ownerId)
      .maybeSingle();
    if (error || !data) return true;
    const row = data as { plan?: string | null; plan_expires_at?: string | null; is_admin?: boolean };
    const active = row.is_admin ? true : isPlanActive(row.plan ?? null, row.plan_expires_at ?? null);
    planCache.set(ownerId, { v: active, at: Date.now() });
    return active;
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
  const hit = cached(ownerCache, spaceId);
  if (hit !== undefined) return hit;
  try {
    const { data } = await admin.from('spaces').select('created_by').eq('id', spaceId).maybeSingle();
    const owner = (data as { created_by?: string | null } | null)?.created_by ?? null;
    ownerCache.set(spaceId, { v: owner, at: Date.now() });
    return owner;
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
