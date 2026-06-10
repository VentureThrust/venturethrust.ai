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
// The 1 rupee Access plan uses a deliberately short cycle so plan expiry and the
// downgrade back to /choose-role can be watched in a few minutes, not a month.
// Bump this up (e.g. to 24 * 60 * 60 * 1000 for a day) once testing is done.
const ACCESS_TEST_CYCLE_MS = 15 * 60 * 1000; // 15 minutes

// Paid VDR plans. `amount` is INR. `cycleMs` is how long the plan stays active
// after payment before it must be renewed. 'vdr-access' is a one-rupee entry
// plan (it replaced the free trial) on a short test cycle, so plan expiry and
// the downgrade back to /choose-role can be tested without waiting.
export const PAID_PLANS: Record<
  string,
  { amount: number; planKey: string; name: string; cycleMs: number }
> = {
  'vdr-access': { amount: 1, planKey: 'vdr_only', name: 'Access', cycleMs: ACCESS_TEST_CYCLE_MS },
  'vdr-starter': { amount: 999, planKey: 'vdr_only', name: 'Starter', cycleMs: BILLING_CYCLE_MS },
  'vdr-growth': { amount: 2499, planKey: 'vdr_only', name: 'Growth', cycleMs: BILLING_CYCLE_MS },
  'vdr-business': { amount: 5999, planKey: 'vdr_only', name: 'Business', cycleMs: BILLING_CYCLE_MS },
};

/** How long a paid plan stays active before renewal. Falls back to the default. */
export function planCycleMs(planId: string): number {
  return PAID_PLANS[planId]?.cycleMs ?? BILLING_CYCLE_MS;
}
