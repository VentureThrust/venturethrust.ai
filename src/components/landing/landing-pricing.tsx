'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PLAN_TIERS, formatPlanPrice } from '@/lib/plan-catalogue';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContactSalesButton } from '@/components/contact-sales-dialog';

const BLUE = '#4285F4';

// Investor plans shown under the "For investors and VCs" audience toggle.
// Two plans while Deal Watch is in its pilot: a 7 day free trial and the
// full Investor plan. (The trial card is temporary and will be removed.)
const INVESTOR_PLANS = [
  {
    id: 'investor-trial',
    name: 'Investor Trial',
    priceLabel: 'Free',
    period: 'for 7 days',
    tagline: 'Try Deal Watch with no commitment.',
    features: [
      'Every deck and data room shared with you, in one place',
      'Private watchlist of startups you have seen',
      'Your own human account manager',
      'Founder update monitoring on watched startups',
    ],
    cta: 'Start free trial',
    contactSales: false,
    featured: false,
  },
  {
    id: 'vdr-investor',
    name: 'Investor',
    priceLabel: '$149',
    period: '/mo',
    tagline: 'Deal Watch plus your own account manager.',
    features: [
      'Everything in Business',
      'Deal Watch watchlist across all your deal flow',
      'A human account manager who follows every founder update',
      'You are pinged only when a startup makes real progress',
      'Priority support',
    ],
    cta: 'Talk to us',
    contactSales: true,
    featured: true,
  },
];

/** Public pricing section on the landing page. Reads the shared plan catalogue
 *  so it never drifts from the real plans; CTAs send visitors to sign up.
 *  An audience toggle switches between founder plans and investor plans
 *  (the #investor-plans URL hash opens the investor view directly). */
export function LandingPricing() {
  const [annual, setAnnual] = useState(false);
  const [audience, setAudience] = useState<'founders' | 'investors'>('founders');

  // Deep link: /#investor-plans opens the investor plans directly.
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === '#investor-plans') setAudience('investors');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <section id="pricing" className="border-t border-gray-200 bg-gray-50">
      <div id="investor-plans" className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {audience === 'founders'
              ? 'Simple plans that scale with your raise'
              : 'Plans for investors and VCs'}
          </h2>
          <p className="mt-4 text-base text-gray-600">
            {audience === 'founders'
              ? 'Start free for 7 days. Upgrade when you grow. Prices in USD.'
              : 'Never lose a deal you have already seen. Prices in USD.'}
          </p>
        </div>

        {/* Audience toggle - founders vs investors */}
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex rounded-full border border-gray-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setAudience('founders')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                audience === 'founders' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              For founders
            </button>
            <button
              type="button"
              onClick={() => setAudience('investors')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                audience === 'investors' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              For investors and VCs
            </button>
          </div>
        </div>

        {audience === 'founders' ? (
          <>
            {/* Billing period - radio group (DocSend style) */}
            <div className="mt-8 flex items-center justify-center gap-8">
              <button type="button" onClick={() => setAnnual(false)} className="flex items-center gap-2.5">
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', !annual ? 'border-gray-900' : 'border-gray-400')}>
                  {!annual && <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />}
                </span>
                <span className={cn('text-base', !annual ? 'font-medium text-gray-900' : 'text-gray-600')}>Billed monthly</span>
              </button>
              <button type="button" onClick={() => setAnnual(true)} className="flex items-center gap-2.5">
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', annual ? 'border-gray-900' : 'border-gray-400')}>
                  {annual && <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />}
                </span>
                <span className={cn('text-base', annual ? 'font-medium text-gray-900' : 'text-gray-600')}>
                  Billed yearly <span className="text-[#34A853]">(1 month free)</span>
                </span>
              </button>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PLAN_TIERS.map((t) => {
                const featured = !!t.popular;
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'relative flex flex-col rounded-2xl border bg-white p-6',
                      featured ? 'border-[#4285F4] shadow-md ring-1 ring-[#4285F4]' : 'border-gray-200',
                    )}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-6 rounded-full bg-[#4285F4] px-3 py-1 text-xs font-semibold text-white">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{t.name}</h3>
                    <p className="mt-1 min-h-[36px] text-sm text-muted-foreground">{t.tagline}</p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
                      {t.price === 0 ? (
                        <span className="text-3xl font-bold">Free</span>
                      ) : (
                        <>
                          {t.compareAt && (
                            <span className="text-base font-medium text-muted-foreground/70 line-through">
                              ${(annual ? t.compareAt * 12 : t.compareAt).toLocaleString('en-US')}
                            </span>
                          )}
                          <span className="text-3xl font-bold">{formatPlanPrice(t, false, annual)}</span>
                          <span className="text-muted-foreground">{annual ? '/year' : '/mo'}</span>
                          {t.compareAt && (
                            <span className="rounded-full bg-[#34A853]/10 px-2 py-0.5 text-xs font-semibold text-[#34A853]">
                              {Math.round((1 - (annual ? t.priceYear : t.price) / (annual ? t.compareAt * 12 : t.compareAt)) * 100)}% off
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {t.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                          <span className={cn(f.endsWith(':') && 'font-medium text-foreground')}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={cn(
                        'mt-6 inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                        featured
                          ? 'bg-[#4285F4] text-white hover:bg-[#3367d6]'
                          : 'border border-gray-300 text-gray-900 hover:bg-gray-50',
                      )}
                    >
                      {t.price === 0 ? 'Start free trial' : `Choose ${t.name}`}
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Need more seats, SSO, or a custom plan?{' '}
              <ContactSalesButton
                className="font-medium underline underline-offset-4"
                style={{ color: BLUE }}
              >
                Talk to sales
              </ContactSalesButton>
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
              {INVESTOR_PLANS.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'relative flex flex-col rounded-2xl border bg-white p-6',
                    p.featured ? 'border-[#4285F4] shadow-md ring-1 ring-[#4285F4]' : 'border-gray-200',
                  )}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#4285F4] px-3 py-1 text-xs font-semibold text-white">
                      Deal Watch
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                  <p className="mt-1 min-h-[36px] text-sm text-muted-foreground">{p.tagline}</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
                    {p.id === 'vdr-investor' && (
                      <span className="text-base font-medium text-muted-foreground/70 line-through">$299</span>
                    )}
                    <span className="text-3xl font-bold">{p.priceLabel}</span>
                    <span className="text-muted-foreground">{p.period}</span>
                    {p.id === 'vdr-investor' && (
                      <span className="rounded-full bg-[#34A853]/10 px-2 py-0.5 text-xs font-semibold text-[#34A853]">
                        50% off
                      </span>
                    )}
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {p.contactSales ? (
                    <ContactSalesButton
                      className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#4285F4] text-sm font-semibold text-white transition-colors hover:bg-[#3367d6]"
                    >
                      {p.cta}
                    </ContactSalesButton>
                  ) : (
                    <Link
                      href="/signup"
                      className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                    >
                      {p.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              We set up your watchlist and account manager personally.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
