import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroWalkthrough } from '@/components/landing/hero-walkthrough';
import { LinkSettingsDemo } from '@/components/landing/link-settings-demo';
import { FEATURES } from '@/lib/features';
import { ArrowRight, Check, Clock } from 'lucide-react';

export const metadata = {
  title: 'Features · VentureThrust',
  description:
    'Secure links, page-level analytics, NDAs and e-signatures, dynamic watermarks, file requests, and a full audit trail. Everything you need to share documents and close the deal.',
};

const BLUE = '#4285F4';

// Static analytics visual for the Track deep-dive.
function AnalyticsMock() {
  const viewers = [
    { who: 'priya@sequoiacap.in', time: '6:48', pct: 92 },
    { who: 'rahul@blume.vc', time: '4:32', pct: 71 },
    { who: 'ankit@matrixpartners.in', time: '2:10', pct: 38 },
  ];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Visits, Pitch Deck.pdf</p>
        <span className="text-[11px] text-gray-400">Last 7 days</span>
      </div>
      <div className="mt-4 space-y-4">
        {viewers.map((v) => (
          <div key={v.who}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-gray-800">{v.who}</span>
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="h-3 w-3" /> {v.time}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
              <div className="h-full rounded-full" style={{ width: `${v.pct}%`, background: BLUE }} />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">Read {v.pct}% of the deck</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Feature({
  eyebrow,
  title,
  body,
  points,
  visual,
  flip,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section className="border-t border-gray-200 py-20 sm:py-24">
      <div className="container mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20">
        <div className={flip ? 'lg:order-2' : ''}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-gray-600">{body}</p>
          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] text-gray-700">
                <Check className="mt-1 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className={flip ? 'lg:order-1' : ''}>{visual}</div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="container mx-auto max-w-4xl px-6 pb-10 pt-16 text-center sm:pt-20">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>
          Features
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Everything you need to share documents and win the room
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Secure links, page-by-page tracking, NDAs and e-signatures, dynamic watermarks, file requests, and a complete
          audit trail, all in one data room.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: BLUE }}
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* See it in action */}
      <section className="container mx-auto max-w-5xl px-6 pb-16">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">See it in action</h2>
          <p className="mt-1 text-sm text-gray-500">
            From template to tracked views. Click through every step.
          </p>
        </div>
        <HeroWalkthrough />
      </section>

      {/* Full feature grid */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Every feature, in one place
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep dive: Share (interactive demo) */}
      <Feature
        eyebrow="Share & control"
        title="One link, and you stay in control"
        body="Stop emailing attachments you can never take back. Share a single link and decide who can view, for how long, and on what terms. Try the controls on the right."
        points={[
          'Require an email or passcode before viewing',
          'Set expiry dates and revoke access any time',
          'Allow / block specific people, and watermark every page',
        ]}
        visual={<LinkSettingsDemo />}
      />

      {/* Deep dive: Track */}
      <Feature
        eyebrow="Track"
        title="Know exactly who read what"
        body="Every visit is tracked page by page, so you know who read the whole document and who stopped on page three. Follow up with the people who are actually engaged, while their interest is high."
        points={[
          'Who opened what, when, and from where',
          'Time spent on every page of every document',
          'Live view of who is inside your room right now',
        ]}
        visual={<AnalyticsMock />}
        flip
      />

      {/* CTA */}
      <section className="border-t border-gray-200 py-20 text-center sm:py-24">
        <div className="container mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Start your data room in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">7-day free trial. No card required.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: BLUE }}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
