import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  ArrowRight,
  Check,
  Inbox,
  Star,
  Headset,
  BellOff,
  TrendingUp,
  EyeOff,
} from 'lucide-react';

export const metadata = {
  title: 'Never lose a deal you have already seen · Deal Watch by VentureThrust',
  description:
    'Every investor has an anti portfolio: startups they saw early, passed on, and watched someone else fund. Deal Watch keeps quiet track of every startup you have seen, with a human account manager who pings you only when one makes real progress.',
  keywords: [
    'deal flow tracking',
    'anti portfolio',
    'track startups you passed on',
    'missed deals venture capital',
    'deal flow management tool',
    'startup watchlist for investors',
    'VC deal tracking',
    'never lose a deal',
  ],
  alternates: { canonical: '/never-lose-a-deal' },
};

const BLUE = '#4285F4';

const STEPS = [
  {
    icon: Inbox,
    title: 'Every deck lands in one place',
    desc: 'Founders send you their decks and data rooms as VentureThrust links. Everything you have ever been shown sits in one Shared with me feed, opened or not.',
  },
  {
    icon: Star,
    title: 'One click puts a startup on watch',
    desc: 'Too early today does not mean wrong forever. Add any startup to your private watchlist and forget about it. Nobody sees your interest.',
  },
  {
    icon: Headset,
    title: 'A human follows every update',
    desc: 'Your account manager, a real person, reviews every change the founder makes: new numbers, new decks, new traction. Not an algorithm guessing at relevance.',
  },
  {
    icon: BellOff,
    title: 'You hear about it only when it matters',
    desc: 'No digest emails, no notification noise. You get one message when a watched startup makes real progress: they crossed the line you cared about, take another look.',
  },
];

const OBJECTIONS = [
  'No new dashboard to check. Your manager checks it for you.',
  'Founders never see that you are watching them.',
  'Works with the deal flow you already receive, no process change.',
  'Cancel any time. Your watchlist is yours.',
];

export default function NeverLoseADealPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="container mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
          Deal Watch, for investors and VCs
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.1]">
          Never lose a deal you have already seen.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
          Passing is part of the job. Forgetting is the expensive part. A startup you saw at the
          idea stage can come back two years later as the round everyone fights for, and the
          difference between being in and reading about it is one follow up you never made.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/#investor-plans"
            className="inline-flex h-12 items-center justify-center rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: BLUE }}
          >
            See investor plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            Talk to us
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">Free for 7 days. We set up your watchlist personally.</p>
      </section>

      {/* The anti portfolio */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
              <TrendingUp className="h-6 w-6" style={{ color: BLUE }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Every investor has an anti portfolio
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
                The famous funds publish theirs openly: the companies they saw early and passed on
                that went on to define entire markets. A few crore invested at the moment a startup
                turned the corner becomes a thousand crore outcome. The information was in their
                inbox the whole time. What was missing was not judgment. It was a system that
                watched the deals they had already seen and spoke up at the right moment.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
                Deal Watch is that system, with a human in the loop instead of another dashboard
                you will never open.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            How Deal Watch works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF]">
                  <s.icon className="h-5 w-5" style={{ color: BLUE }} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiet by design */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" style={{ color: BLUE }} />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
                Quiet by design
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Zero automated notifications. Ever.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600">
              Software that pings you about every logo change gets muted in a week. On Deal Watch,
              founder updates go to your account manager, a real person, who reads them and decides
              if they are worth your attention. Most are not. The one that is reaches you with
              context: you saw this startup, here is what changed, take another look.
            </p>
          </div>
          <ul className="space-y-3">
            {OBJECTIONS.map((o, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-4 text-[15px] text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your next fund returner may already be in your inbox.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-600">
            Deal Watch starts at $149 per month, including your own account manager. Free for 7
            days, and we set everything up for you personally.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#investor-plans"
              className="inline-flex h-12 items-center justify-center rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: BLUE }}
            >
              See investor plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
