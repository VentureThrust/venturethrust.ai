/**
 * Cashfree config + server-side plan catalogue.
 *
 * SERVER ONLY. Never import this into a client component: it reads the secret
 * key from the environment. The amounts here are the source of truth, so the
 * client can never tamper with what gets charged (it only sends a planId).
 */

export const CASHFREE_BASE =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

export function cashfreeHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': process.env.CASHFREE_APP_ID ?? '',
    'x-client-secret': process.env.CASHFREE_SECRET_KEY ?? '',
  };
}

/** Default billing cycle, in milliseconds (30 days). Used for plan_expires_at. */
export const BILLING_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

// Paid VDR plans. `amount` is INR. `cycleMs` is how long the plan stays active
// after payment before it must be renewed. (The free early-access plan is
// activated separately via /api/plan/activate-free and is not charged.)
export const PAID_PLANS: Record<
  string,
  { amount: number; planKey: string; name: string; cycleMs: number }
> = {
  'vdr-starter': { amount: 999, planKey: 'vdr_only', name: 'Starter', cycleMs: BILLING_CYCLE_MS },
  'vdr-growth': { amount: 2499, planKey: 'vdr_only', name: 'Growth', cycleMs: BILLING_CYCLE_MS },
  'vdr-business': { amount: 5999, planKey: 'vdr_only', name: 'Business', cycleMs: BILLING_CYCLE_MS },
  // TEST ONLY: ₹1, expires 5 minutes after payment. Remove before real launch.
  'vdr-test': { amount: 1, planKey: 'vdr_only', name: 'Test (5 min)', cycleMs: 5 * 60 * 1000 },
};

/** How long a paid plan stays active before renewal. Falls back to the default. */
export function planCycleMs(planId: string): number {
  return PAID_PLANS[planId]?.cycleMs ?? BILLING_CYCLE_MS;
}
