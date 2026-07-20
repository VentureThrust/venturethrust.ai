/**
 * /investors - the Deal Watch landing page (public marketing).
 *
 * The investor side of VentureThrust, told the way the product works:
 * misses hurt more than losses, nobody watches a startup after the pass,
 * Deal Watch watches. Design rules for this page: white background, gray
 * type, one blue accent, NO cards anywhere. Sections and rows are separated
 * by hairline borders only. Generous whitespace, big quiet type.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { DealWatchWalkthrough } from '@/components/landing/deal-watch-walkthrough';
import { ArrowRight } from 'lucide-react';

const BLUE = '#4285F4';

export const metadata: Metadata = {
  title: 'Deal Watch for investors | VentureThrust',
  description:
    'We watch the startups you passed on and show you they are rising before the market knows. One brief when it matters. Silence the rest of the time.',
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
      {children}
    </p>
  );
}

/** A CSS mock of the actual Deal Watch priority brief PDF: navy
 *  confidential bands, crimson round banner, serif type, the
 *  since-your-pass table, and the closing line. */
function ReportMock() {
  const rows = [
    ['Monthly recurring revenue', '₹4.2 L', '₹11.8 L', '+181%'],
    ['Repeat order rate', '34%', '61%', '+27 pts'],
    ['Customer acquisition cost', '₹9,400', '₹5,100', 'down 46%'],
    ['Chains under annual contract', '0', '3', '+3'],
  ];
  return (
    <div className="overflow-hidden rounded-md border border-gray-300 bg-white font-serif shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)]">
      <div className="bg-[#0F2440] py-1.5 text-center text-[8px] font-semibold tracking-[0.5em] text-[#C9A227]">
        CONFIDENTIAL
      </div>
      <div className="px-5 pb-5 pt-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#0F2440]">
          Deal Watch
        </p>
        <p className="mt-1 text-[17px] font-bold text-[#0F2440]">
          Priority Brief · BeanBridge
        </p>
        <p className="text-[9.5px] italic text-gray-500">
          Prepared for the watching investor · 16 Jul 2026
        </p>
        <div className="mt-3 bg-[#8B1A1A] px-3 py-1.5">
          <p className="text-[10px] font-semibold text-white">
            The milestone you were waiting for has happened.
          </p>
        </div>
        <div className="mt-3 bg-[#F5F1E6] px-3 py-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F2440]">
            Growth since your pass
          </p>
        </div>
        <table className="mt-2 w-full text-[9.5px]">
          <thead>
            <tr className="border-b border-gray-300 text-left text-[8px] uppercase tracking-wider text-gray-500">
              <th className="py-1 font-semibold">Metric</th>
              <th className="py-1 text-right font-semibold">Your pass</th>
              <th className="py-1 text-right font-semibold">Today</th>
              <th className="py-1 text-right font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-b border-gray-100">
                <td className="py-1.5 text-gray-800">{r[0]}</td>
                <td className="py-1.5 text-right text-gray-500">{r[1]}</td>
                <td className="py-1.5 text-right font-bold text-[#0F2440]">{r[2]}</td>
                <td className="py-1.5 text-right font-semibold text-green-800">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[8.5px] italic text-gray-500">
          All figures verified against the company&apos;s live documents. The arithmetic behind
          every number is shown inside.
        </p>
        <p className="mt-3 border-t border-gray-200 pt-2 text-center text-[10px] font-bold text-[#0F2440]">
          We explain. You decide.
        </p>
      </div>
      <div className="bg-[#0F2440] py-1.5 text-center text-[8px] font-semibold tracking-[0.5em] text-[#C9A227]">
        CONFIDENTIAL
      </div>
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-4xl px-6 pb-20 pt-20 sm:pt-28">
        <Eyebrow>Deal Watch, for investors</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold leading-[1.12] tracking-tight text-gray-900 sm:text-5xl">
          The next unicorn already pitched you.
          <br />
          We make sure you don&apos;t miss it twice.
        </h1>
        <p className="mt-4 max-w-2xl text-xl leading-relaxed text-gray-600">
          When your no means not now, put that startup on your watchlist. The moment it starts
          doing well, we tell you. Before the news, before everyone else.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 px-7 text-base text-white hover:opacity-90"
            style={{ background: BLUE }}
          >
            <Link href="/choose-role">
              Get Deal Watch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>
      </section>

      {/* ── What it looks like from your seat ────────────────────────────── */}
      <section className="container mx-auto max-w-5xl px-6 pb-20">
        <DealWatchWalkthrough />
      </section>

      {/* ── The cost of a miss, in three facts ───────────────────────────── */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 divide-y divide-gray-200 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            {
              big: '$2.3B',
              small: 'what passing on Uber cost Mark Cuban. He calls it his biggest miss ever.',
            },
            {
              big: '1 in 2',
              small:
                'recent tech unicorns struggled to raise early. The winners were rejected first.',
            },
            {
              big: '0',
              small: 'tools that keep watching a startup for you after you pass. Until this one.',
            },
          ].map((s) => (
            <div key={s.big} className="py-10 sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <p className="text-4xl font-bold tracking-tight" style={{ color: BLUE }}>
                {s.big}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why it happens ────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 py-20 sm:py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Misses hurt more than losses
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
            A loss costs one check. A miss costs the deal that pays for everything. It keeps
            happening for three reasons.
          </p>

          <div className="mt-12">
            {[
              {
                n: '01',
                h: 'Deal flow has outgrown any one person',
                b: 'You see hundreds of decks a year and invest in a handful. The interesting rest get a bookmark. Then the next hundred arrive.',
              },
              {
                n: '02',
                h: 'The timing trap',
                b: 'You check on Sunday. Nothing. They sign their biggest customer on Monday. You do not look again for months.',
              },
              {
                n: '03',
                h: 'Nobody watches after the no',
                b: 'You pass, and every system you have moves on with you. The next time you hear the name is the funding announcement. Too late.',
              },
            ].map((r) => (
              <div key={r.n} className="flex gap-6 border-t border-gray-200 py-8 sm:gap-10">
                <p className="w-10 shrink-0 pt-0.5 text-sm font-semibold" style={{ color: BLUE }}>
                  {r.n}
                </p>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{r.h}</h3>
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-600">{r.b}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="border-t border-gray-200 pt-8 text-[15px] leading-relaxed text-gray-600">
            Bessemer publish their misses and call it the Anti-Portfolio: Airbnb, Apple, Facebook,
            Tesla. Every investor has one. It grows one reasonable pass at a time.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-gray-200 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Pin it. Forget it. We take it from there.
          </h2>

          <div className="mt-12 grid items-start gap-14 lg:grid-cols-[1fr_380px]">
          <div>
            {[
              {
                n: '01',
                h: 'Pin the ones where your no means not now',
                b: 'One click on any deck shared with you. Add a note on what would change your mind: paying customers, a real team, a signed contract. That note drives everything we send you.',
              },
              {
                n: '02',
                h: 'Three layers watch, so you never have to',
                b: 'Software catches every update, the day it happens. AI reads what changed. A named human confirms it matters. Most updates die right there. That is the point.',
              },
              {
                n: '03',
                h: 'One brief, the day it matters',
                b: 'A revenue jump, a marquee customer, a round opening: you get a short brief on what changed since your pass, with verified numbers. Before the market knows.',
              },
            ].map((r) => (
              <div key={r.n} className="flex gap-6 border-t border-gray-200 py-8 sm:gap-10">
                <p className="w-10 shrink-0 pt-0.5 text-sm font-semibold" style={{ color: BLUE }}>
                  {r.n}
                </p>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{r.h}</h3>
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-600">{r.b}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mx-auto w-full max-w-sm lg:mx-0 lg:pt-2">
            <ReportMock />
            <p className="mt-3 text-center text-xs text-gray-400">
              The brief, as it lands. Sample with fictional numbers.
            </p>
          </div>
          </div>
        </div>
      </section>

      {/* ── The discipline ───────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <Eyebrow>The discipline</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Silence is part of the product
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
            Your attention is the most expensive thing you own. Deal Watch is built around not
            wasting it.
          </p>
          <div className="mt-10 divide-y divide-gray-200">
            {[
              [
                'Zero automated notifications',
                'No digests, no weekly emails, no feeds. If you hear from us, a human decided it was worth your time.',
              ],
              [
                'Quarterly reports only where you ask',
                'Turn on a quarterly report for any single startup: a short table, charts, a six line summary. Everything else stays quiet.',
              ],
              [
                'We never say invest',
                'Every brief shows what changed, with the arithmetic. It always ends the same way: We explain. You decide.',
              ],
              [
                'Watching is private',
                'Founders never see who has them on a watchlist. Your interest and your timing are yours alone.',
              ],
            ].map(([h, b]) => (
              <div key={h} className="grid gap-2 py-6 sm:grid-cols-[240px_1fr] sm:gap-10">
                <h3 className="text-[15px] font-semibold text-gray-900">{h}</h3>
                <p className="text-[15px] leading-relaxed text-gray-600">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it saves, what it can make ──────────────────────────────── */}
      <section className="border-t border-gray-200 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-gray-200">
            <div className="lg:pr-14">
              <Eyebrow>What it saves</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                The cost of an analyst, without the analyst
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
                An analyst costs lakhs a year and looks at one startup at a time. Deal Watch keeps
                a standing watch on all of them, for a fraction of one hire.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
                It also ends the habit nobody admits to: re-checking LinkedIn for startups you
                almost backed, on days when nothing happened.
              </p>
            </div>
            <div className="lg:pl-14">
              <Eyebrow>What it can make</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                One caught miss pays for everything
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
                One deal returns more than the rest combined. A $50,000 early check in Amazon
                would be worth billions today. The expensive mistake is never the bad investment.
                It is the good one that walked past.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
                One miss converted into one well timed meeting pays for Deal Watch many hundred
                times over.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 py-20 sm:py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <Eyebrow>Straight answers</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            The questions investors actually ask
          </h2>
          <div className="mt-10 divide-y divide-gray-200">
            {[
              [
                'Will I still have misses?',
                'Yes. Anyone promising zero misses is lying. A smoke detector does not stop fires. It stops you sleeping through one. Every miss becomes a decision you made with the facts, on time.',
              ],
              [
                'How is this different from keeping my own analyst?',
                'An analyst looks once, when you ask. Deal Watch watches continuously: software catches updates, AI reads changes, a human confirms. For a fraction of one salary.',
              ],
              [
                'Are you trying to influence my decisions?',
                'We deliver verified facts and show the arithmetic. When growth looks temporary, we say so. We never say invest. We explain. You decide.',
              ],
              [
                'What if a startup I watch gets worse, not better?',
                'Then that is what we report. Deterioration is flagged just like growth. You pay for the truth, not good news.',
              ],
              [
                'Will founders know I am watching them?',
                'No. Watching is completely private. Founders never see who holds them on a watchlist.',
              ],
              [
                'What does it cost?',
                'From $149 a month, ₹12,499 in India, sized by how many startups you watch. The founders you invite join free, always. Cancel any time.',
              ],
            ].map(([q, a]) => (
              <div key={q} className="grid gap-2 py-7 sm:grid-cols-[280px_1fr] sm:gap-10">
                <h3 className="text-[15px] font-semibold text-gray-900">{q}</h3>
                <p className="text-[15px] leading-relaxed text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Your anti-portfolio is growing right now.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600">
            Somewhere in the decks you have already seen is the one you will be asked about in ten
            years. Watch it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-base text-white hover:opacity-90"
              style={{ background: BLUE }}
            >
              <Link href="/choose-role">
                Get Deal Watch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <Link href="/signup">Create a free account</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            We explain. You decide.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
