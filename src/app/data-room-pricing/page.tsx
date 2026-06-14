import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LandingPricing } from '@/components/landing/landing-pricing';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Data room pricing · VentureThrust',
  description:
    'Simple, affordable data room pricing. VentureThrust plans start at ₹999 a month with a 7-day free trial and no card required. See what every plan includes.',
  keywords: [
    'data room pricing',
    'virtual data room pricing',
    'data room cost',
    'affordable data room',
    'cheap data room',
    'VDR pricing',
  ],
  alternates: { canonical: '/data-room-pricing' },
};

const BLUE = '#4285F4';

export default function DataRoomPricingPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-4 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Pricing</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Simple, affordable data room pricing
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Plans start at ₹999 a month, with a 7-day free trial and no card required. No enterprise-only
          paywall on the features that matter.
        </p>
      </section>

      <LandingPricing />

      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-2xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Try it free for 7 days</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">No card required. Upgrade only when you are ready.</p>
          <Link href="/signup" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
