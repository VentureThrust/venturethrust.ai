/**
 * Client-safe plan helpers.
 *
 * No secrets live here (unlike src/lib/cashfree.ts, which is server only), so
 * this is safe to import into client components like the PlanGate.
 */

/**
 * Is the user's plan currently usable?
 *   - No plan at all                  -> not active.
 *   - Plan with no recorded expiry     -> active (legacy rows, or a free trial
 *                                         created before billing windows were
 *                                         stamped).
 *   - Plan with an expiry in the past  -> NOT active (lapsed; must renew).
 *   - Plan with an expiry in the future-> active.
 *
 * An unparseable expiry is treated as active so a bad value never locks a
 * paying user out of the product.
 */
export function isPlanActive(
  plan: string | null | undefined,
  planExpiresAt: string | null | undefined,
): boolean {
  if (!plan) return false;
  if (!planExpiresAt) return true;
  const expiry = new Date(planExpiresAt).getTime();
  if (Number.isNaN(expiry)) return true;
  return expiry > Date.now();
}
