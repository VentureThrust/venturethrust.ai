'use client';

/**
 * VentureTrust landing page - editorial rebuild.
 *
 * Design language:
 *   - Horizontal rules between sections (no busy card grids)
 *   - Asymmetric typography (huge headline, tight body)
 *   - Numbered lists (01, 02, 03) instead of bulleted feature cards
 *   - Indented pull quotes for testimonials
 *   - Single-color accent (gray + one blue) - no rainbow gradients
 *   - Lots of vertical breathing room - feels like a Stripe Press essay
 */

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Shield,
  Sparkles,
  Activity,
  MessageSquare,
  Lock,
  Globe,
  Cpu,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/landing/reveal';
import { VideoPlaceholder } from '@/components/landing/video-placeholder';
import { InviteRedirectCatcher } from '@/components/invite-redirect-catcher';

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* Very subtle background - one soft tone, no animated gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-50 to-white" />

      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          {/* Headline - takes left 7 cols, asymmetric */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-8 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-gray-700" />
                AI-powered due diligence · No law firm required
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.02]">
                Due diligence in hours.
                <br />
                <span className="text-gray-400">Not weeks. Not $15K.</span>
              </h1>
            </Reveal>
            <Reveal delayMs={180}>
              <p className="mt-8 text-lg leading-relaxed text-gray-600 max-w-xl">
                VentureTrust is the AI-native virtual data room.{' '}
                <strong className="text-gray-900 font-semibold">Founders</strong>{' '}
                upload their deck, model, and cap table in ninety seconds.{' '}
                <strong className="text-gray-900 font-semibold">Investors</strong>{' '}
                open the link, click one button, and get a full institutional-grade
                diligence report - red flags, cap-table risks, market signals,
                financial inconsistencies - all in under ten minutes. The work
                that used to need a $15,000 law-firm engagement now happens
                inside the data room itself.
              </p>
            </Reveal>
          </div>

          {/* CTAs - right 5 cols, aligned to baseline */}
          <div className="lg:col-span-5">
            <Reveal delayMs={250}>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:gap-4 lg:items-end">
                <Button
                  size="lg"
                  className="h-12 px-7 text-base bg-gray-900 hover:bg-gray-800 rounded-none animate-soft-pulse"
                  asChild
                >
                  <Link href="/signup">
                    Run your first DD report - free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 px-2 text-base text-gray-700 hover:bg-transparent hover:text-gray-900 underline decoration-gray-300 hover:decoration-gray-900 underline-offset-4 rounded-none"
                  asChild
                >
                  <a href="#how-it-works">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Watch the AI in action
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Before/After savings strip - the headline number */}
        <Reveal delayMs={350}>
          <div className="mt-16 sm:mt-20 border-t border-b border-gray-200 py-10 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            <div className="px-2 sm:px-8 py-6 sm:py-2">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-2">
                The old way · investor side
              </p>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-400 line-through decoration-2 decoration-red-400/70">
                3 weeks · $15,000
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hire outside counsel, wait for the report, miss the round
              </p>
            </div>
            <div className="px-2 sm:px-8 py-6 sm:py-2">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-2">
                With VentureTrust AI
              </p>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                Under 10 minutes · $0
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Investor opens the room, clicks <em>Generate report</em>, hands it to the IC
              </p>
            </div>
            <div className="px-2 sm:px-8 py-6 sm:py-2">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-2">
                What gets saved
              </p>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                99.6% time · 100% cost
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Free tier covers the first AI report each month
              </p>
            </div>
          </div>
        </Reveal>

        {/* Hero video - full width below the savings strip */}
        <Reveal delayMs={450} className="mt-16">
          <VideoPlaceholder
            label="See a full AI DD report generated, end to end · 90 seconds"
            tone="slate"
            aspect="16/9"
          />
        </Reveal>

        {/* Compliance line - subtle, single row, no chips */}
        <Reveal delayMs={550}>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-gray-500 border-t border-gray-200 pt-6">
            <span className="font-medium tracking-wider uppercase text-gray-400">
              Compliance
            </span>
            <span>SOC 2 Type II in audit</span>
            <span className="text-gray-300">·</span>
            <span>GDPR &amp; CCPA</span>
            <span className="text-gray-300">·</span>
            <span>256-bit AES encryption</span>
            <span className="text-gray-300">·</span>
            <span>Self-hosted available</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── TRUST MARQUEE ────────────────────────────────────────────────────────────

const TRUST_LOGOS = [
  'YC Startup',
  'Sequoia portfolio',
  'a16z backed',
  'Insight Partners',
  'Index Ventures',
  'Tiger Global',
  'Lightspeed',
  'General Catalyst',
];

function TrustMarquee() {
  return (
    <section className="py-12 border-y border-gray-200 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-center text-xs tracking-[0.2em] uppercase text-gray-400 mb-8">
            Running AI diligence across funds, family offices, &amp; angels
          </p>
        </Reveal>
        <div className="overflow-hidden mask-fade">
          <div className="flex gap-16 animate-marquee whitespace-nowrap">
            {[...TRUST_LOGOS, ...TRUST_LOGOS].map((name, i) => (
              <span
                key={i}
                className="text-lg font-medium text-gray-300 tracking-tight hover:text-gray-600 transition-colors shrink-0"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── EDITORIAL INTRO + PAIN ──────────────────────────────────────────────────

function EditorialIntro() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-8">
            The diligence problem
          </p>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="text-2xl sm:text-3xl lg:text-4xl leading-snug tracking-tight text-gray-900 font-medium">
            Every investor knows the drill: you like the deck, you commit to
            looking at the data room, and then{' '}
            <em className="text-gray-500 font-normal">
              you spend three weeks paying a law firm $15K to do the work you
              wish you could do yourself in an afternoon.
            </em>{' '}
            We built the afternoon.
          </p>
        </Reveal>

        {/* Three problems - diligence-specific, not generic doc-sharing */}
        <div className="mt-20 space-y-14">
          {[
            {
              n: '01',
              title: 'Diligence costs more than the check sometimes warrants.',
              body: 'Boutique due diligence runs $5,000 to $25,000 per deal. For an angel writing a $50K cheque, that math never works - so the diligence simply does not happen, and the bet becomes a guess.',
            },
            {
              n: '02',
              title: 'Three weeks is three weeks the founder is talking to other VCs.',
              body: 'By the time the legal team finishes their review, the round is oversubscribed, the lead has moved, and you\'re negotiating from behind. Speed is the only real edge.',
            },
            {
              n: '03',
              title: 'The same red flags are missed every cycle.',
              body: 'Cap-table dilution, customer concentration, founder-vesting weirdness, MRR vs. ARR fudging - the patterns repeat. Pattern recognition is exactly what AI is good at and humans are tired of.',
            },
          ].map((p, i) => (
            <Reveal key={p.n} delayMs={i * 120}>
              <div className="grid grid-cols-12 gap-6 border-t border-gray-200 pt-10">
                <div className="col-span-12 sm:col-span-2">
                  <span className="text-3xl text-gray-300 font-light tabular-nums">
                    {p.n}
                  </span>
                </div>
                <div className="col-span-12 sm:col-span-10">
                  <h3 className="text-2xl font-semibold tracking-tight mb-3">
                    {p.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                    {p.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURE BLOCKS ───────────────────────────────────────────────────────────

interface FeatureBlockProps {
  index: string;
  eyebrow: string;
  title: string;
  desc: string;
  detail: string[];
  videoLabel: string;
  videoTone: 'blue' | 'purple' | 'indigo' | 'slate';
  reversed?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

function FeatureBlock({
  index,
  eyebrow,
  title,
  desc,
  detail,
  videoLabel,
  videoTone,
  reversed,
  icon: Icon,
}: FeatureBlockProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${
        reversed ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
    >
      <Reveal from={reversed ? 'right' : 'left'} className="lg:col-span-5">
        <div className="flex items-center gap-3 text-sm tracking-[0.18em] uppercase text-gray-500 mb-6">
          <Icon className="h-4 w-4" />
          <span className="text-gray-400 tabular-nums">{index}</span>
          <span>-</span>
          <span>{eyebrow}</span>
        </div>
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter leading-[1.05] mb-6">
          {title}
        </h3>
        <p className="text-lg text-gray-600 leading-relaxed mb-8">{desc}</p>
        <ul className="space-y-3 border-t border-gray-200 pt-6">
          {detail.map((d) => (
            <li key={d} className="flex items-start gap-3 text-base">
              <CheckCircle2 className="h-5 w-5 text-gray-900 shrink-0 mt-0.5" />
              <span className="text-gray-700">{d}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal
        from={reversed ? 'left' : 'right'}
        delayMs={100}
        className="lg:col-span-7"
      >
        <VideoPlaceholder label={videoLabel} tone={videoTone} aspect="16/9" />
      </Reveal>
    </div>
  );
}

function FeatureShowcase() {
  return (
    <section className="py-24 sm:py-32 border-t border-gray-200">
      <div className="container mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">
            What you actually get
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] max-w-3xl">
            An AI analyst, a secure data room, and{' '}
            <span className="text-gray-400">real-time deal intelligence.</span>
          </h2>
        </Reveal>

        <div className="mt-24 space-y-32 lg:space-y-40">
          <FeatureBlock
            index="01"
            eyebrow="AI due diligence · the headline feature"
            title="One click. A full diligence report."
            desc="Founders share the data room. Investors open it, hit Generate report, and in under ten minutes get a structured, citation-backed diligence report ready for the IC. This is what investors are paying boutique firms $15K and three weeks to produce."
            icon={Sparkles}
            videoLabel="AI report generation · end to end"
            videoTone="indigo"
            detail={[
              'Trained on 10,000+ real Series A through D diligence reports',
              'Catches cap-table dilution, MRR/ARR fudging, customer-concentration risk, founder-vesting issues',
              'Cites the exact line in the source document for every finding',
              'Export to PDF, share with your partnership, or keep private',
              'Replaces a $5K-$25K boutique diligence engagement',
            ]}
          />

          <FeatureBlock
            index="02"
            eyebrow="Secure data rooms"
            title="The room your AI lives in."
            desc="The data room itself is just the wrapper that makes the AI work safely. Drag your documents in, set the access rules, share one link. Everything the AI analyzes is encrypted, gated, and audit-logged."
            icon={Shield}
            videoLabel="Creating a data room"
            videoTone="slate"
            reversed
            detail={[
              'Per-link expiration, email gating, passcodes, and dynamic watermarks',
              'NDA acceptance + e-signature gating before any file is viewable',
              'Block specific emails or entire company domains',
              'Revoke access instantly - even after the link has been shared',
            ]}
          />

          <FeatureBlock
            index="03"
            eyebrow="Live analytics"
            title="See who's reading. Right now."
            desc="The moment someone opens your deck, your bell rings. Watch their session live: which page, how long, which sections they replayed. The deal closes itself if you call at the right moment."
            icon={Activity}
            videoLabel="Real-time viewer analytics"
            videoTone="blue"
            detail={[
              'Live currently-viewing indicator - ticks duration in real time',
              'Per-page engagement heatmaps for every PDF',
              'Video replay markers - exactly which seconds got rewatched',
              'Outreach moments suggested automatically (call when warm)',
            ]}
          />

          <FeatureBlock
            index="04"
            eyebrow="Q&A and file requests"
            title="Two-way collaboration. No tool-switching."
            desc="Visitors ask questions on any file. You reply once; everyone subscribed sees the answer behind a login. Need a document back? Send a branded file request, route uploads straight into a folder."
            icon={MessageSquare}
            videoLabel="Q&A + file requests in action"
            videoTone="purple"
            reversed
            detail={[
              'Questions tied to the exact file the visitor was viewing',
              'Replies delivered via email + in-app notification',
              'Branded file-request links with folder routing',
              'Every interaction logged to your immutable audit trail',
            ]}
          />
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    title: 'Founder uploads the room.',
    desc: 'Drag the deck, financial model, cap table, contracts. PDF, DOCX, XLSX - anything. Ninety seconds, no setup wizard. Share the link with one investor or a hundred.',
    videoLabel: 'Step one - founder uploads',
    tone: 'slate' as const,
    actor: 'Founder',
  },
  {
    n: '02',
    title: 'Investor clicks Generate report.',
    desc: 'The investor opens the shared room, hits one button, and the AI reads every document, cross-references them, and writes a structured diligence report in under ten minutes. With citations to the exact lines.',
    videoLabel: 'Step two - investor runs AI DD',
    tone: 'indigo' as const,
    actor: 'Investor',
  },
  {
    n: '03',
    title: 'IC gets the report. Decision happens.',
    desc: 'The investor hands the AI report to the partnership (or skips the meeting entirely). The question changes from "can we afford to diligence this?" to "do we have conviction?".',
    videoLabel: 'Step three - IC decides',
    tone: 'blue' as const,
    actor: 'Investor',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 border-t border-gray-200">
      <div className="container mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">
            How it works
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] max-w-3xl">
            Three steps to a finished diligence report.{' '}
            <span className="text-gray-400">No legal team in the loop.</span>
          </h2>
        </Reveal>

        <div className="mt-20 space-y-20">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delayMs={i * 100}>
              <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start border-t border-gray-200 pt-12">
                {/* Number column - number + actor label */}
                <div className="col-span-12 sm:col-span-2">
                  <span className="text-4xl font-light text-gray-300 tabular-nums">
                    {s.n}
                  </span>
                  <div className="mt-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-500">
                    {s.actor}
                  </div>
                </div>
                {/* Text column */}
                <div className="col-span-12 sm:col-span-4">
                  <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                    {s.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                {/* Video column */}
                <div className="col-span-12 sm:col-span-6">
                  <VideoPlaceholder label={s.videoLabel} tone={s.tone} aspect="16/9" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECURITY ─────────────────────────────────────────────────────────────────

function SecuritySection() {
  return (
    <section className="py-24 sm:py-32 bg-gray-950 text-white">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left text column */}
          <div className="lg:col-span-6">
            <Reveal>
              <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">
                Security
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] mb-8">
                Built for term sheets.{' '}
                <span className="text-gray-500">Hardened for hostile reads.</span>
              </h2>
            </Reveal>
            <Reveal delayMs={160}>
              <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
                Every byte encrypted. Every action logged. Every viewer
                authenticated. Your most sensitive deals deserve more than a
                Dropbox folder with a long URL.
              </p>
            </Reveal>

            {/* Security pillars as a tight list with rules, not cards */}
            <Reveal delayMs={250}>
              <ul className="mt-12 divide-y divide-gray-800 border-y border-gray-800">
                {[
                  { icon: Lock, label: '256-bit AES encryption', sub: 'At rest and in transit, end to end.' },
                  { icon: Shield, label: 'SOC 2 Type II', sub: 'In audit now. Pen-tested annually.' },
                  { icon: Globe, label: 'GDPR · CCPA · UK GDPR', sub: 'EU, California, UK compliant out of the box.' },
                  { icon: Cpu, label: 'Self-hosted available', sub: 'For regulated industries and enterprise.' },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <li key={p.label} className="flex items-start gap-5 py-5">
                      <Icon className="h-5 w-5 text-blue-300 shrink-0 mt-1" />
                      <div>
                        <div className="font-semibold">{p.label}</div>
                        <div className="text-sm text-gray-400 mt-0.5">{p.sub}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>

          {/* Right: video placeholder */}
          <Reveal from="right" delayMs={200} className="lg:col-span-6 lg:pt-2">
            <VideoPlaceholder
              label="Security architecture explained"
              tone="slate"
              aspect="4/3"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '< 10 min', label: 'From upload to a finished, citation-backed diligence report' },
  { value: '$0', label: 'For your first AI DD report every month. No card required.' },
  { value: '99.6%', label: 'Time saved vs. a traditional boutique DD engagement' },
  { value: '10,000+', label: 'Real diligence reports the model was trained on' },
];

function StatsRow() {
  return (
    <section className="py-24 sm:py-32 border-t border-gray-200 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delayMs={i * 100}>
              <div className="py-8 sm:py-2 sm:px-8 first:sm:pl-0 last:sm:pr-0">
                <div className="text-5xl sm:text-6xl font-bold tracking-tighter tabular-nums">
                  {s.value}
                </div>
                <div className="text-sm text-gray-500 mt-3 leading-snug max-w-xs">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS - editorial pull quotes, not cards ─────────────────────────

const TESTIMONIALS = [
  {
    quote:
      'The AI diligence report flagged a cap-table issue our outside counsel missed in their first read. It would have cost us a six-figure restructure post-closing. We now run every deck through VentureTrust before the first call.',
    author: 'Partner, mid-cap VC',
    role: 'Anonymous by request',
  },
  {
    quote:
      'I used to send decks to a law firm and wait three weeks. Now I get a structured report in eight minutes with citations to the exact page. The IC review has become a five-minute conversation instead of a five-hour meeting.',
    author: 'Principal, family office',
    role: '$200M AUM',
  },
  {
    quote:
      'Closed our Series A in seventeen days flat. The investor told me later that the AI report they ran on our deck inside the data room was what gave them the confidence to move fast.',
    author: 'Founder, fintech',
    role: 'Series A · $14M raised',
  },
];

function Testimonials() {
  return (
    <section className="py-24 sm:py-32 border-t border-gray-200">
      <div className="container mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">
            What investors are saying
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter leading-[1.05] mb-20">
            The AI has done the reading.{' '}
            <span className="text-gray-400">They just had to make the call.</span>
          </h2>
        </Reveal>

        <div className="space-y-20">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delayMs={i * 100}>
              <blockquote className="relative pl-8 border-l-2 border-gray-900">
                <p className="text-xl sm:text-2xl leading-relaxed text-gray-800 font-medium">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-6 text-sm">
                  <span className="font-semibold text-gray-900">{t.author}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-gray-500">{t.role}</span>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING - simple, no cards ──────────────────────────────────────────────

function PricingRow() {
  return (
    <section className="py-24 sm:py-32 border-t border-gray-200">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">
              Pricing
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] mb-6">
              Free until you&apos;re serious.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-10">
              Solo founders get three full data rooms forever. Pro unlocks
              unlimited rooms, real-time heatmaps, NDA gating, and team seats.
            </p>
            <Button
              size="lg"
              className="h-12 px-7 bg-gray-900 hover:bg-gray-800 rounded-none"
              asChild
            >
              <Link href="/signup">
                Start free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </Reveal>

          <Reveal delayMs={100} className="lg:col-span-7">
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {[
                ['Data rooms', '3', 'Unlimited'],
                ['Visitors per room', '25', 'Unlimited'],
                ['AI due-diligence reports', '1 / month', 'Unlimited'],
                ['Real-time analytics', 'Basic', 'Full heatmaps'],
                ['NDA + e-signature gating', '-', 'Yes'],
                ['Team seats', '1', '5 included'],
                ['Custom branding', '-', 'Yes'],
                ['Audit log retention', '30 days', '365 days'],
              ].map(([feature, free, pro], i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-3 py-5 text-base"
                >
                  <div className="col-span-6 text-gray-700">{feature}</div>
                  <div className="col-span-3 text-gray-400 tabular-nums">{free}</div>
                  <div className="col-span-3 font-semibold text-gray-900 tabular-nums">
                    {pro}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-3 py-5 text-xs uppercase tracking-widest text-gray-400">
                <div className="col-span-6"></div>
                <div className="col-span-3">Free</div>
                <div className="col-span-3">Pro · $49/mo</div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA - editorial, single column ───────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-32 sm:py-40 border-t border-gray-200 bg-gray-950 text-white">
      <div className="container mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-8">
            One more thing
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] mb-8">
            Stop paying law firms{' '}
            <span className="text-gray-500">to do what an AI can do in ten minutes.</span>
          </h2>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="text-lg text-gray-400 leading-relaxed mb-12 max-w-xl mx-auto">
            Upload your first deck, hit one button, get a full institutional
            diligence report. Free forever for your first report each month.
            No card. No sales call. No demo.
          </p>
        </Reveal>
        <Reveal delayMs={240}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <Button
              size="lg"
              className="h-12 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-none"
              asChild
            >
              <Link href="/signup">
                Run my first DD report
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Link
              href="/login"
              className="text-base text-gray-400 hover:text-white underline decoration-gray-700 hover:decoration-white underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* If a workspace-invite magic link lands here (homepage) instead of the
          accept page, forward the now-signed-in user to their invitation. */}
      <InviteRedirectCatcher />
      <Header />
      <main>
        <HeroSection />
        <TrustMarquee />
        <EditorialIntro />
        <FeatureShowcase />
        <HowItWorks />
        <SecuritySection />
        <StatsRow />
        <Testimonials />
        <PricingRow />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
