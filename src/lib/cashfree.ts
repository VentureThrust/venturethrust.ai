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

// Paid VDR plans. `amount` is INR. 'vdr-access' is a one-rupee entry plan that
// replaced the free trial, so every plan now goes through a real payment (and
// therefore gets a real 30-day expiry stamped on success).
export const PAID_PLANS: Record<string, { amount: number; planKey: string; name: string }> = {
  'vdr-access': { amount: 1, planKey: 'vdr_only', name: 'Access' },
  'vdr-starter': { amount: 999, planKey: 'vdr_only', name: 'Starter' },
  'vdr-growth': { amount: 2499, planKey: 'vdr_only', name: 'Growth' },
  'vdr-business': { amount: 5999, planKey: 'vdr_only', name: 'Business' },
};

/** One billing cycle, in milliseconds (30 days). Used to set plan_expires_at. */
export const BILLING_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
