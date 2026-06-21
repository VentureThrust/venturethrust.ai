'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PLAN_TIERS, formatPlanPrice } from '@/lib/plan-catalogue';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContactSalesButton } from '@/components/contact-sales-dialog';

const BLUE = '#4285F4';

/** Public pricing section on the landing page. Reads the shared plan catalogue
 *  so it never drifts from the real plans; CTAs send visitors to sign up. */
export function LandingPricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <section id="pricing" className="border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple plans that scale with your raise
          </h2>
          <p className="mt-4 text-base text-gray-600">
            Start free for 7 days. Upgrade when you grow. Prices in USD.
          </p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={cn('text-sm font-medium', !annual ? 'text-gray-900' : 'text-gray-500')}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((a) => !a)}
            className={cn('relative h-6 w-11 rounded-full transition-colors', annual ? 'bg-[#4285F4]' : 'bg-gray-300')}
          >
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform', annual ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
          <span className={cn('text-sm font-medium', annual ? 'text-gray-900' : 'text-gray-500')}>
            Annual <span className="text-[#34A853]">(1 month free)</span>
          </span>
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
                <div className="mt-3 flex items-baseline gap-1">
                  {t.price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{formatPlanPrice(t, false, annual)}</span>
                      <span className="text-muted-foreground">{annual ? '/year' : '/mo'}</span>
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
      </div>
    </section>
  );
}
