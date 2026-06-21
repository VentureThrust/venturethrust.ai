/**
 * Plan catalogue (client-safe) - the tiers shown on the plan and billing pages,
 * with a rank used to decide what counts as an upgrade, plus the enforced
 * usage limits. Ids match the keys in PAID_PLANS (lib/cashfree.ts) and
 * payments.plan_id. Prices here are display-only; the charged amount is looked
 * up server-side from PAID_PLANS.
 *
 * Limits: `seats` = total members incl. the account holder (seats - 1 can be
 * invited). `spaces` = max data rooms. `visitorsPerSpace` = max unique visitors
 * per space. `storageGb` = storage cap. A `null` limit means UNLIMITED.
 */

export type PlanTier = {
  id: string;
  name: string;
  price: number; // USD per month, shown to non-India visitors (Paddle charges this)
  priceInr: number; // INR per month, shown to India visitors (Cashfree charges this)
  priceYear: number; // USD per year (annual billing, one month free)
  rank: number; // higher rank = higher plan; used to detect upgrades
  seats: number; // total members allowed, including the account holder
  spaces: number | null; // max spaces; null = unlimited
  visitorsPerSpace: number | null; // max unique visitors per space; null = unlimited
  storageGb: number; // storage cap in GB
  tagline: string;
  features: string[];
  popular?: boolean;
  note?: string;
  showInGrid: boolean; // false = a current-plan label only, not offered in the grid
};

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'vdr-free',
    name: 'Free',
    price: 0,
    priceInr: 0,
    priceYear: 0,
    rank: 0,
    seats: 1,
    spaces: 2,
    visitorsPerSpace: 3,
    storageGb: 2,
    tagline: 'Try everything free for 7 days.',
    note: '7-day free trial. No card required.',
    features: [
      '1 member',
      '2 spaces',
      '3 visitors per space',
      '2 GB storage',
      'Secure links, gates & expiry',
      'File requests & Q&A',
    ],
    showInGrid: false,
  },
  {
    id: 'vdr-starter',
    name: 'Starter',
    price: 12,
    priceInr: 999,
    priceYear: 132,
    rank: 1,
    seats: 1,
    spaces: 5,
    visitorsPerSpace: 5,
    storageGb: 10,
    tagline: 'For founders sharing a deck or data room.',
    features: [
      '1 member',
      '5 spaces',
      '5 visitors per space',
      '10 GB storage',
      'Secure links, gates & expiry',
      'View & page-time analytics',
      'File requests & Q&A',
    ],
    showInGrid: true,
  },
  {
    id: 'vdr-growth',
    name: 'Growth',
    price: 29,
    priceInr: 2499,
    priceYear: 319,
    rank: 2,
    seats: 2,
    spaces: 20,
    visitorsPerSpace: 25,
    storageGb: 50,
    popular: true,
    tagline: 'For teams running real deals.',
    features: [
      '2 members',
      '20 spaces',
      '25 visitors per space',
      '50 GB storage',
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
    price: 69,
    priceInr: 5999,
    priceYear: 759,
    rank: 3,
    seats: 3,
    spaces: null,
    visitorsPerSpace: null,
    storageGb: 200,
    tagline: 'For firms managing many rooms.',
    features: [
      '3 members',
      'Unlimited spaces',
      'Unlimited visitors',
      '200 GB storage',
      'Everything in Growth, plus:',
      'Group & granular permissions',
      'SSO',
      'Bulk operations',
      'Priority support',
    ],
    showInGrid: true,
  },
];

export const tierById = (id: string | null | undefined): PlanTier | null => {
  // Yearly plan ids look like 'vdr-starter-year'; resolve them to the base tier.
  const base = (id ?? '').replace(/-(year|month|annual|monthly)$/i, '');
  return PLAN_TIERS.find((t) => t.id === id || t.id === base) ?? null;
};

/**
 * Display price string. Pricing is shown in USD to EVERYONE (India included);
 * payment is still routed by country at checkout (India -> Cashfree in INR, rest
 * of world -> Paddle in USD). The `india` arg is kept for call-site compatibility.
 */
export function formatPlanPrice(plan: PlanTier, _india: boolean, annual = false): string {
  const amt = annual ? plan.priceYear : plan.price;
  return `$${amt.toLocaleString('en-US')}`;
}
