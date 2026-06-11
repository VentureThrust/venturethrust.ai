/**
 * Client-side usage-limit helpers. Resolve the signed-in user's plan tier so
 * the UI can enforce caps (spaces, etc.) before writing. The cap a space falls
 * under is the workspace owner's plan; client code can only resolve its own
 * user's plan, so callers should only enforce when the user IS the owner.
 */

import { supabase } from './supabaseClient';
import { tierById, type PlanTier } from './plan-catalogue';

/** Current user's plan tier id: latest paid payment, else free, else null. */
export async function resolveMyTierId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: pay } = await supabase
    .from('payments')
    .select('plan_id')
    .eq('user_id', user.id)
    .eq('status', 'PAID')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  let tierId = (pay as { plan_id?: string } | null)?.plan_id ?? null;
  if (!tierId) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('plan_status')
      .eq('id', user.id)
      .maybeSingle();
    if ((prof as { plan_status?: string } | null)?.plan_status === 'free') tierId = 'vdr-free';
  }
  return tierId;
}

export async function getMyPlanTier(): Promise<PlanTier | null> {
  return tierById(await resolveMyTierId());
}
