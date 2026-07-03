/**
 * VentureThrust landing page.
 *
 * Modeled on DocSend's marketing site: a short page with one clear story.
 * Hero + product mock, a quiet capability strip, three alternating feature
 * sections, a security band, one closing CTA. White background, gray type,
 * a single blue accent (#4285F4). No gradients, no animated blobs, no icon
 * card grids. The "screenshots" are small hand built CSS mocks of the real
 * product so the page stays fast and always matches the brand.
 */

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { InviteRedirectCatcher } from '@/components/invite-redirect-catcher';
import { HeroWalkthrough } from '@/components/landing/hero-walkthrough';
import { LinkSettingsDemo } from '@/components/landing/link-settings-demo';
import { LandingPricing } from '@/components/landing/landing-pricing';
import {
  ArrowRight,
  Check,
  Clock,
  Lock,
  Globe2,
  ScanLine,
  History,
  FileSignature,
  EyeOff,
} from 'lucide-react';

const BLUE = '#4285F4';

// ── Small mock visuals for the feature sections ───────────────────────────────

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

function CollectMock() {
  const items = [
    { name: 'Audited Financials FY25', from: 'cfo@acme.in', state: 'Uploaded' },
    { name: 'Shareholder Agreement', from: 'legal@acme.in', state: 'Uploaded' },
    { name: 'GST Returns, last 4 quarters', from: 'Awaiting upload', state: 'Pending' },
  ];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">File request: Diligence checklist</p>
      <p className="text-xs text-gray-400">One link, files land in the right folder</p>
      <div className="mt-4 space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 ring-1 ring-gray-100">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-gray-800">{it.name}</p>
              <p className="text-[11px] text-gray-400">{it.from}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                it.state === 'Uploaded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {it.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature section scaffold ──────────────────────────────────────────────────

function Feature({
  id,
  eyebrow,
  title,
  body,
  points,
  visual,
  flip,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section id={id} className="border-t border-gray-200 py-20 sm:py-24">
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900">
      <InviteRedirectCatcher />
      <Header />

      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
            Share your documents.
            <br />
            Know exactly who read them.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
            Upload your pitch deck or any document and send it as one link instead of an
            attachment. You see who opened it, which pages they read, and for how long.
            Lock it with an email gate or a password, and take it back whenever you want.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="cta-glow h-12 px-7 text-base text-white hover:opacity-90" style={{ background: BLUE }}>
              <Link href="/signup">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-gray-400">
            For fundraising · B2B sales · M&amp;A · legal · recruiting
          </p>
        </div>

        <div id="how-it-works" className="mx-auto mt-12 max-w-5xl scroll-mt-24 sm:mt-14">
          <HeroWalkthrough />
        </div>
      </section>

      {/* Quiet capability strip */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-6 py-8 text-center sm:grid-cols-4">
          {['Secure links with gates', 'Page level analytics', 'NDA and eSignatures', 'File requests and Q&A'].map(
            (t) => (
              <p key={t} className="text-sm font-medium text-gray-500">
                {t}
              </p>
            ),
          )}
        </div>
      </section>

      <Feature
        id="features"
        eyebrow="Share"
        title="One link, and you stay in control"
        body="Stop emailing attachments you can never take back. Share a single link and decide who can view, for how long, and on what terms."
        points={[
          'Require an email or passcode before viewing',
          'Set expiry dates and revoke access any time',
          'Watermark pages with the viewer’s email',
        ]}
        visual={<LinkSettingsDemo />}
      />

      <Feature
        id="tracking"
        eyebrow="Track"
        title="See what happens after you hit send"
        body="Every visit is tracked page by page, so you know who read the whole document and who stopped on page three. Follow up with the people who are actually engaged, while their interest is high."
        points={[
          'Who opened what, when, and from where',
          'Time spent on every page of every document',
          'Live view of visitors inside your room right now',
        ]}
        visual={<AnalyticsMock />}
        flip
      />

      <Feature
        eyebrow="Collect"
        title="Bring documents and signatures back in"
        body="Diligence is two way. Request files with a link that drops uploads straight into the right folder, gate sensitive rooms behind an NDA, and answer questions inside the room."
        points={[
          'File requests with a simple public upload page',
          'NDA acceptance and eSignature before entry',
          'Built in Q&A, so nothing gets lost in email',
        ]}
        visual={<CollectMock />}
      />

      {/* Security band */}
      <section id="security" className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
              Security
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built like the documents matter
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Contracts, proposals, and financials deserve more than an email attachment.
              Every layer of VentureThrust assumes the contents are confidential.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, t: 'Encrypted', d: 'Encrypted in transit and at rest, with hashed link passcodes.' },
              { icon: Globe2, t: 'Access controls', d: 'Email gates, allow and block lists, expiry, and instant revoke.' },
              { icon: ScanLine, t: 'Watermarking', d: 'Dynamic watermarks tie every page to the person viewing it.' },
              { icon: FileSignature, t: 'NDA & e-sign', d: 'Require visitors to accept an NDA or sign before they can view.' },
              { icon: EyeOff, t: 'View-only protection', d: 'Right-click, copy, print, and screenshot deterrents, with per-link download control.' },
              { icon: History, t: 'Audit trail', d: 'A complete log of who entered, what they saw, and when.' },
            ].map((s) => (
              <div key={s.t}>
                <s.icon className="h-5 w-5 text-gray-900" />
                <h3 className="mt-3 text-base font-semibold text-gray-900">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <LandingPricing />

      {/* For investors: Deal Watch */}
      <section id="investors" className="border-t border-gray-200 bg-white">
        <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
                For investors
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Deal Watch
              </h2>
              <p className="mt-2 text-lg font-medium text-gray-700">
                Never lose a deal you have already seen.
              </p>
              <p className="mt-4 text-base text-gray-600">
                You pass on hundreds of startups that are simply too early. Some of them grow into
                exactly what you were looking for, and by then someone else has the deal. Deal Watch
                keeps quiet track of every startup you have seen, so the right ones come back to you.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Every deck and data room shared with you, in one place',
                  'Add any startup to your private watchlist in one click',
                  'A human account manager follows every founder update for you',
                  'You hear about a startup only when it makes real progress',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm font-medium text-gray-900">
                  Two plans for investors and VCs, including a free 7 day trial.
                </p>
                <a
                  href="#investor-plans"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#4285F4] text-sm font-semibold text-white transition-colors hover:bg-[#3367d6]"
                >
                  See investor plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <p className="mt-3 text-xs text-muted-foreground">
                  We set up your watchlist and account manager personally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your next deal deserves a better data room
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">
            Set up your room and share the first link in minutes.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-12 px-8 text-base text-white hover:opacity-90" style={{ background: BLUE }}>
              <Link href="/signup">
                Create your data room
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
