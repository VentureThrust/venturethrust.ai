/**
 * Storage usage + cap helpers (client-safe).
 *
 * Usage is the sum of files.size_bytes for a user; the cap comes from their
 * plan tier (latest paid payment, else the free plan). Used to block uploads
 * that would exceed the plan's storage allowance.
 */

import { supabase } from './supabaseClient';
import { tierById } from './plan-catalogue';

const GiB = 1024 * 1024 * 1024;

/** Bytes this user has stored (sum of files.size_bytes for their user_id). */
export async function getStorageUsageBytes(userId: string): Promise<number> {
  const { data } = await supabase.from('files').select('size_bytes').eq('user_id', userId);
  return (data ?? []).reduce(
    (sum, r) => sum + Number((r as { size_bytes?: number | string }).size_bytes ?? 0),
    0,
  );
}

/** This user's storage cap in bytes, from their plan tier. */
export async function getStorageCapBytes(userId: string): Promise<number> {
  const { data: pay } = await supabase
    .from('payments')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'PAID')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  let tierId = (pay as { plan_id?: string } | null)?.plan_id ?? null;
  if (!tierId) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('plan_status')
      .eq('id', userId)
      .maybeSingle();
    if ((prof as { plan_status?: string } | null)?.plan_status === 'free') tierId = 'vdr-free';
  }
  const t = tierById(tierId);
  return (t?.storageGb ?? 1) * GiB;
}

/** Would `incomingBytes` more fit within the user's storage cap? */
export async function checkStorageRoom(
  userId: string,
  incomingBytes: number,
): Promise<{ ok: boolean; usageBytes: number; capBytes: number }> {
  const [usageBytes, capBytes] = await Promise.all([
    getStorageUsageBytes(userId),
    getStorageCapBytes(userId),
  ]);
  return { ok: usageBytes + incomingBytes <= capBytes, usageBytes, capBytes };
}

/** Human-friendly size, e.g. "2 GB", "5.4 GB", "320 MB". */
export function formatGib(bytes: number): string {
  const gib = bytes / GiB;
  if (gib >= 1) return `${gib.toFixed(gib >= 10 ? 0 : 1)} GB`;
  const mib = bytes / (1024 * 1024);
  return `${Math.max(0, mib).toFixed(mib >= 10 ? 0 : 1)} MB`;
}
