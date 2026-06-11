/**
 * Plan catalogue (client-safe) - the tiers shown on the plan and billing pages,
 * with a rank used to decide what counts as an upgrade, plus the enforced
 * limits (seats + storage). Ids match the keys in PAID_PLANS (lib/cashfree.ts)
 * and payments.plan_id, so the same id flows through checkout. Prices here are
 * for display only; the amount actually charged is looked up server-side from
 * PAID_PLANS.
 *
 * `seats` is the TOTAL number of members allowed, including the account holder
 * (so seats - 1 collaborators can be invited). `storageGb` is the storage cap.
 */

export type PlanTier = {
  id: string;
  name: string;
  price: number; // INR per month, for display
  rank: number; // higher rank = higher plan; used to detect upgrades
  seats: number; // total members allowed, including the account holder
  storageGb: number; // storage cap in GB
  tagline: string;
  features: string[];
  popular?: boolean;
  note?: string; // small line under the price (e.g. the free-plan notice)
  showInGrid: boolean; // false = a current-plan label only, not offered in the grid
};

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'vdr-free',
    name: 'Free',
    price: 0,
    rank: 0,
    seats: 1,
    storageGb: 1,
    tagline: 'Full access while we are in early access.',
    note: 'No card required.',
    features: [
      '1 member',
      '1 GB storage',
      'Secure data room',
      'Secure links, gates & expiry',
      'File requests & Q&A',
    ],
    showInGrid: false,
  },
  {
    id: 'vdr-starter',
    name: 'Starter',
    price: 999,
    rank: 1,
    seats: 1,
    storageGb: 5,
    tagline: 'For founders sharing a deck or data room.',
    features: [
      '1 member',
      '5 GB storage',
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
    seats: 2,
    storageGb: 25,
    popular: true,
    tagline: 'For teams running real deals.',
    features: [
      '2 members',
      '25 GB storage',
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
    seats: 3,
    storageGb: 100,
    tagline: 'For firms managing many rooms.',
    features: [
      '3 members',
      '100 GB storage',
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
