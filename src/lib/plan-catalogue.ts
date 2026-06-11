/**
 * Plan catalogue (client-safe) - the tiers shown on the billing page, with a
 * rank used to decide what counts as an upgrade. Ids match the keys in
 * PAID_PLANS (lib/cashfree.ts) and payments.plan_id, so the same id flows
 * through checkout. Prices here are for display only; the amount actually
 * charged is looked up server-side from PAID_PLANS.
 */

export type PlanTier = {
  id: string;
  name: string;
  price: number; // INR per month, for display
  rank: number; // higher rank = higher plan; used to detect upgrades
  tagline: string;
  features: string[];
  popular?: boolean;
  note?: string; // small line under the price (e.g. the Access test-cycle notice)
  showInGrid: boolean; // false = a current-plan label only, not offered in the grid
};

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'vdr-access',
    name: 'Access',
    price: 1,
    rank: 0,
    tagline: 'Unlock the secure data room for one rupee.',
    note: 'Test plan: full access for 15 minutes after purchase.',
    features: ['2 team members', '25 GB storage', 'All Starter features'],
    showInGrid: false,
  },
  {
    id: 'vdr-starter',
    name: 'Starter',
    price: 999,
    rank: 1,
    tagline: 'For founders sharing a deck or data room.',
    features: [
      '2 team members',
      '25 GB storage',
      'Unlimited spaces',
      'Secure links, gates & expiry',
      'View & page-time analytics',
      'File requests & Q&A',
    ],
    showInGrid: true,
  },
  {
    id: 'vdr-growth',
    name: 'Growth',
    price: 2499,
    rank: 2,
    popular: true,
    tagline: 'For teams running real deals.',
    features: [
      '5 team members',
      '100 GB storage',
      'Everything in Starter, plus:',
      'Custom branding & domain',
      'NDA + e-signatures',
      'Dynamic watermark (email / IP)',
      'Audit log & advanced analytics',
    ],
    showInGrid: true,
  },
  {
    id: 'vdr-business',
    name: 'Business',
    price: 5999,
    rank: 3,
    tagline: 'For firms managing many rooms.',
    features: [
      '15 team members',
      '500 GB storage',
      'Everything in Growth, plus:',
      'Group & granular permissions',
      'SSO',
      'Bulk operations',
      'Priority support',
    ],
    showInGrid: true,
  },
];

export const tierById = (id: string | null | undefined): PlanTier | null =>
  PLAN_TIERS.find((t) => t.id === id) ?? null;
