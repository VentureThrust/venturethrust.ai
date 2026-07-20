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
            A loss costs you one check. A miss costs you the deal that would have paid for every
            loss you ever took. Investors know this, and it still keeps happening, for three
            reasons nobody has fixed.
          </p>

          <div className="mt-12">
            {[
              {
                n: '01',
                h: 'Deal flow has outgrown any one person',
                b: 'Founders now pitch hundreds of investors from day one. You see hundreds of decks a year and invest in a handful. The interesting rest get a note, a bookmark, a good intention. Then the next hundred arrive.',
              },
              {
                n: '02',
                h: 'The timing trap',
                b: 'You check on a startup on Sunday. Nothing new. They sign their biggest customer on Monday. You do not look again for months, because you just looked. Progress almost never happens on the day you check.',
              },
              {
                n: '03',
                h: 'Nobody watches after the no',
                b: 'The moment you pass, every system you have moves on with you. So the first time you hear the name again is the funding announcement, when the price has already moved and the allocation is already gone.',
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
            Bessemer Venture Partners publish their misses openly and call it the Anti-Portfolio:
            Airbnb, Apple, Facebook, Tesla. Every investor has one. It grows in silence, one
            reasonable pass at a time.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-gray-200 py-20 sm:py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Pin it. Forget it. We take it from there.
          </h2>

          <div className="mt-12">
            {[
              {
                n: '01',
                h: 'Pin the ones where your no means not now',
                b: 'On any deck or data room a founder shares with you, one click adds the startup to your private watchlist. Leave a note about what would change your mind: paying customers, a real team, a signed enterprise contract. That note drives everything we send you later.',
              },
              {
                n: '02',
                h: 'Three layers watch, so you never have to',
                b: 'Software catches every update the startup makes to its documents, the day it happens. AI reads exactly what changed. Then a human account manager, a named person you can call, confirms whether it genuinely matters. Most updates die right there, which is the point.',
              },
              {
                n: '03',
                h: 'One brief, the day it matters',
                b: 'When a watched startup hits a real milestone, a revenue jump, a marquee customer, a round opening, you get a short brief: what changed since your pass, with verified numbers and the arithmetic shown. Before the market knows. What you do with it is entirely up to you.',
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
            You are busy, and your attention is the most expensive thing you own. So Deal Watch is
            built around not wasting it.
          </p>
          <div className="mt-10 divide-y divide-gray-200">
            {[
              [
                'Zero automated notifications',
                'No digests, no weekly emails, no activity feeds. If you hear from us, a human decided it was worth your time.',
              ],
              [
                'Quarterly reports only where you ask',
                'Want a regular pulse on one specific startup? Turn on its quarterly report: a short table, charts, and a six line summary. Everything else stays quiet.',
              ],
              [
                'We never say invest',
                'Every brief shows what changed and shows the arithmetic behind every number. Then it ends the same way, every time: We explain. You decide.',
              ],
              [
                'Watching is private',
                'Founders never see who has them on a watchlist. Your interest, your timing, and your notes are yours alone.',
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
                Keeping one junior analyst on deal tracking costs lakhs a year, and they can still
                only look at one startup at a time. Deal Watch does the standing watch with
                software and AI, and spends human judgment only on the moments that deserve it.
                That is why it costs a fraction of one hire.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
                It also saves the habit nobody admits to: the hours spent re-checking LinkedIn and
                old inboxes, looking for news about startups you almost backed, on days when
                nothing happened.
              </p>
            </div>
            <div className="lg:pl-14">
              <Eyebrow>What it can make</Eyebrow>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                One caught miss pays for everything
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
                Venture returns follow a power law: one deal returns more than the rest of the
                portfolio combined. A $50,000 early check in Amazon would be worth billions today.
                The expensive mistake in this business has never been the bad investment. It is
                the good one you watched walk past.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
                If Deal Watch converts one miss into one meeting taken at the right time, in your
                entire career, it has paid for itself many hundred times over.
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
                'Yes, and anyone who promises otherwise is lying to you. A smoke detector does not promise your house will never burn. It promises you will not sleep through the fire. With Deal Watch, every miss becomes a decision you made with the facts on time, never a deal you simply never heard about again.',
              ],
              [
                'How is this different from keeping my own analyst?',
                'Your analyst looks at a startup once, when you ask. Deal Watch watches continuously: software catches every document update, AI reads what changed, and a human confirms it matters. A standing watch on your whole list, for less than a fraction of one salary.',
              ],
              [
                'Are you trying to influence my decisions?',
                'We deliver verified facts at the right time, and we show the arithmetic behind every number. When growth looks temporary, the brief says so plainly. We never say invest. We explain. You decide.',
              ],
              [
                'What if a startup I watch gets worse, not better?',
                'Then that is what we report. The watch runs both ways: our briefs separate temporary spikes from durable progress, and deterioration is flagged just like growth. You are paying for the truth, not for good news.',
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
            years. Put it on a watchlist today, and be the first to know when it moves.
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
