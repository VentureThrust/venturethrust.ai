'use client';

/**
 * VentureThrust landing page - editorial rebuild, positioned on the VIRTUAL DATA
 * ROOM (the live product): secure document sharing, page-by-page tracking,
 * access control, file requests + Q&A. AI due diligence is a small "coming
 * soon" teaser, not the headline (it is gated behind a pilot waitlist).
 *
 * Design language:
 *   - Horizontal rules between sections (no busy card grids)
 *   - Asymmetric typography (huge headline, tight body)
 *   - Numbered lists (01, 02, 03) instead of bulleted feature cards
 *   - Indented pull quotes for testimonials
 *   - Single-color accent (gray + one blue), no rainbow gradients
 *   - Lots of vertical breathing room, like a Stripe Press essay
 */

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
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
    <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* Animated aurora background: soft colored blobs drift behind the hero */}
      <div className="absolute inset-0 -z-20 bg-white" />
      <div className="pointer-events-none absolute -z-10 -top-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-blue-300/30 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -z-10 top-0 right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-indigo-300/30 blur-3xl animate-blob-delayed" />
      <div className="pointer-events-none absolute -z-10 bottom-[-6rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-violet-200/40 blur-3xl animate-blob" />

      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          {/* Headline, left 7 cols, asymmetric */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-8 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-gray-700" />
                Secure virtual data room
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.02]">
                Know who read your documents,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent animate-gradient">
                  down to the page.
                </span>
              </h1>
            </Reveal>
            <Reveal delayMs={180}>
              <p className="mt-8 text-lg leading-relaxed text-gray-600 max-w-xl">
                VentureThrust is a secure virtual data room. Keep your deck,
                financials, and contracts in one place,{' '}
                <strong className="text-gray-900 font-semibold">share them with a single link</strong>,
                gate access with an NDA or expiry, and{' '}
                <strong className="text-gray-900 font-semibold">
                  see exactly who opened what, page by page
                </strong>.
              </p>
            </Reveal>
          </div>

          {/* CTAs, right 5 cols, aligned to baseline */}
          <div className="lg:col-span-5">
            <Reveal delayMs={250}>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:gap-4 lg:items-end">
                <Button
                  size="lg"
                  className="h-12 px-7 text-base bg-gray-900 hover:bg-gray-800 rounded-none animate-soft-pulse"
                  asChild
                >
                  <Link href="/signup">
                    Create your data room, free
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
                    See how it works
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Value strip: the three things a data room does for you */}
        <Reveal delayMs={350}>
          <div className="mt-16 sm:mt-20 border-t border-b border-gray-200 py-10 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            <div className="px-2 sm:px-8 py-6 sm:py-2 rounded-xl transition-transform duration-300 hover:-translate-y-1">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-2">
                Share
              </p>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                One secure link
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Your entire room behind a single link. No email attachments, no file-size limits.
              </p>
            </div>
            <div className="px-2 sm:px-8 py-6 sm:py-2 rounded-xl transition-transform duration-300 hover:-translate-y-1">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-2">
                Track
              </p>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                Every page, live
              </p>
              <p className="text-sm text-gray-500 mt-2">
                A real-time alert the moment it opens, then page-by-page engagement.
              </p>
            </div>
            <div className="px-2 sm:px-8 py-6 sm:py-2 rounded-xl transition-transform duration-300 hover:-translate-y-1">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400 mb-2">
                Control
              </p>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                Revoke any time
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Gate with an NDA, email, passcode, or expiry, and cut access in one click.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Hero video, full width below the value strip */}
        <Reveal delayMs={450} className="mt-16">
          <VideoPlaceholder
            label="See a data room created, shared, and tracked, end to end · 90 seconds"
            tone="indigo"
            aspect="16/9"
          />
        </Reveal>

        {/* Compliance line, subtle, single row, no chips */}
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

// ─── EDITORIAL INTRO + PAIN ──────────────────────────────────────────────────

function EditorialIntro() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-8">
            The problem with email
          </p>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="text-2xl sm:text-3xl lg:text-4xl leading-snug tracking-tight text-gray-900 font-medium">
            You email a deck or a contract, and the moment it lands{' '}
            <em className="text-gray-500 font-normal">
              you have lost control of it. You cannot tell if it was opened, you
              cannot stop it being forwarded, and you cannot take it back.
            </em>{' '}
            We built a place where you keep the keys.
          </p>
        </Reveal>

        {/* Three problems, sharing-specific */}
        <div className="mt-20 space-y-14">
          {[
            {
              n: '01',
              title: 'Email attachments leave your control the second you send.',
              body: 'Once a file is in someone’s inbox it can be forwarded, downloaded, and saved forever. There is no expiry, no way to require an NDA first, and no way to pull it back if a conversation goes cold.',
            },
            {
              n: '02',
              title: 'You are flying blind on whether anyone even read it.',
              body: 'Did the investor open your deck? Which slides held their attention? Did they skip the financials? With an attachment you will never know, so you are guessing about who is actually interested.',
            },
            {
              n: '03',
              title: 'Sensitive documents need more than a shared Dropbox link.',
              body: 'Term sheets, cap tables, and contracts need NDAs, dynamic watermarks, per-recipient access, and an audit trail. A long, unguessable URL is not access control.',
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

// ─── DOCUMENT-TYPES MARQUEE (auto-scroll animation) ──────────────────────────

const DOC_TYPES = [
  'Pitch decks', 'Financial models', 'Cap tables', 'NDAs', 'Board decks',
  'Contracts', 'Due diligence', 'Term sheets', 'Investor updates', 'Fundraising',
];

function DocTypesMarquee() {
  return (
    <section className="py-10 border-y border-gray-200 bg-gray-50/70 overflow-hidden">
      <Reveal>
        <p className="text-center text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">
          Built for the documents that move deals
        </p>
      </Reveal>
      <div className="mask-fade">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...DOC_TYPES, ...DOC_TYPES].map((t, i) => (
            <span
              key={i}
              className="mx-6 text-xl sm:text-2xl font-semibold text-gray-300 hover:text-gray-500 transition-colors shrink-0"
            >
              {t}
            </span>
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
            A secure data room, document tracking, and{' '}
            <span className="text-gray-400">control over every link you share.</span>
          </h2>
        </Reveal>

        <div className="mt-24 space-y-32 lg:space-y-40">
          <FeatureBlock
            index="01"
            eyebrow="Secure data rooms"
            title="One room. One link. Total order."
            desc="Drag your documents in, organize them into folders and sections, add your logo, and share the whole room with a single link. Works with PDFs, Office files, images, and video."
            icon={Shield}
            videoLabel="Creating and organizing a data room"
            videoTone="slate"
            detail={[
              'Folders and sections to structure your deck, financials, and contracts',
              'Your branding on the room visitors see',
              'Share with one person or a hundred from the same link',
              'Everything encrypted at rest and in transit',
            ]}
          />

          <FeatureBlock
            index="02"
            eyebrow="Document tracking"
            title="See who is reading. Right now."
            desc="The moment someone opens your room, your bell rings. Watch the session live: which page they are on, how long they linger, which sections they replay. Know exactly where the real interest is."
            icon={Activity}
            videoLabel="Real-time viewer analytics, page by page"
            videoTone="blue"
            reversed
            detail={[
              'Real-time alert the instant a visitor opens your documents',
              'Per-page engagement, so you see which slides actually landed',
              'Time spent on every page and every file',
              'Video replay markers showing which seconds got rewatched',
            ]}
          />

          <FeatureBlock
            index="03"
            eyebrow="Access control"
            title="Share on your terms. Revoke on your terms."
            desc="A long URL is not security. Gate every link the way the document deserves, and cut off access the second a deal cools or a recipient changes."
            icon={Lock}
            videoLabel="NDA gate, watermark, and link settings"
            videoTone="indigo"
            detail={[
              'Require an NDA or e-signature before any file is viewable',
              'Verify the viewer’s email, or set a passcode and an expiry date',
              'Dynamic watermark stamped with the viewer’s email and IP',
              'Block specific emails or whole domains, and revoke any link instantly',
            ]}
          />

          <FeatureBlock
            index="04"
            eyebrow="File requests and Q&A"
            title="Collect documents and answer questions in one place."
            desc="Need a document back? Send a branded request and uploads route straight into a folder, no account required. Visitors ask questions on any file, and you answer once for everyone."
            icon={MessageSquare}
            videoLabel="File requests and Q&A in action"
            videoTone="purple"
            reversed
            detail={[
              'Branded file-request links that drop uploads into the right folder',
              'Collect files from people who do not have an account',
              'Questions tied to the exact file the visitor was viewing',
              'Every upload and reply written to an audit trail',
            ]}
          />
        </div>
      </div>
    </section>
  );
}

// ─── AI TEASER (small, coming soon) ──────────────────────────────────────────

function AiTeaser() {
  return (
    <section className="py-16 border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto max-w-4xl px-6">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 border border-blue-200">
                <Sparkles className="h-3.5 w-3.5" /> Coming soon
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                AI due diligence, built into the room
              </h3>
              <p className="text-gray-600 mt-1 leading-relaxed">
                Generate a structured, citation-backed diligence report from any data
                room. We are validating it with a small group of professional investors
                first. Join the waitlist to be early.
              </p>
            </div>
            <Link
              href="/signup"
              className="shrink-0 text-sm font-medium text-gray-900 underline decoration-gray-300 hover:decoration-gray-900 underline-offset-4"
            >
              Join the waitlist
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    title: 'Build your room.',
    desc: 'Drag in your deck, financial model, cap table, and contracts. PDF, DOCX, XLSX, video, anything. Organize them into folders. Ninety seconds, no setup wizard.',
    videoLabel: 'Step one, build the room',
    tone: 'slate' as const,
    actor: 'You',
  },
  {
    n: '02',
    title: 'Share a secure link.',
    desc: 'Set the access rules, an NDA gate, email verification, a passcode, an expiry, a watermark, then send one link to a single investor or a whole list.',
    videoLabel: 'Step two, share with control',
    tone: 'indigo' as const,
    actor: 'You',
  },
  {
    n: '03',
    title: 'Watch the engagement.',
    desc: 'The moment they open it your bell rings. See which pages they read and for how long, answer their questions in place, and follow up at exactly the right moment.',
    videoLabel: 'Step three, track and follow up',
    tone: 'blue' as const,
    actor: 'They',
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
            Three steps to a tracked, secure share.{' '}
            <span className="text-gray-400">No attachments. No guesswork.</span>
          </h2>
        </Reveal>

        <div className="mt-20 space-y-20">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delayMs={i * 100}>
              <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start border-t border-gray-200 pt-12">
                {/* Number column, number + actor label */}
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
              label="Security and access control explained"
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

// Count-up number that animates from 0 to `to` when it scrolls into view.
function CountUp({
  to,
  prefix = '',
  suffix = '',
  duration = 1400,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
              setVal(Math.round(eased * to));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

const STATS = [
  { to: 100, prefix: '', suffix: '%', label: 'of every document open tracked, page by page' },
  { to: 256, prefix: '', suffix: '-bit', label: 'AES encryption on every file, at rest and in transit' },
  { to: 30, prefix: '', suffix: 's', label: 'to build a data room and share a secure link' },
  { to: 0, prefix: '$', suffix: '', label: 'to start. Your first data room, no card required.' },
];

function StatsRow() {
  return (
    <section className="py-24 sm:py-32 border-t border-gray-200 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delayMs={i * 100}>
              <div className="py-8 sm:py-2 sm:px-8 first:sm:pl-0 last:sm:pr-0 transition-transform duration-300 hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-bold tracking-tighter tabular-nums">
                  <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
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

// ─── TESTIMONIALS, editorial pull quotes, not cards ──────────────────────────

const TESTIMONIALS = [
  {
    quote:
      'I shared our data room with twelve investors and could see exactly who actually read the financials. I followed up with the three who did and closed the round in three weeks.',
    author: 'Founder, seed-stage SaaS',
    role: 'Anonymous by request',
  },
  {
    quote:
      'We replaced a messy Dropbox folder and endless email threads with one room. The NDA gate and the audit log alone made it worth switching.',
    author: 'Operating partner',
    role: 'Lower mid-market PE',
  },
  {
    quote:
      'Seeing that an investor spent nine minutes on our cap-table page told me more than any meeting. I called them that afternoon and we had a term sheet that week.',
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
            What people are saying
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter leading-[1.05] mb-20">
            You shared a link.{' '}
            <span className="text-gray-400">You saw everything that happened next.</span>
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

// ─── PRICING, simple, no cards ───────────────────────────────────────────────

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
              Start free with a real data room. Pro unlocks unlimited rooms,
              full page-by-page analytics, NDA gating, watermarks, and team seats.
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
                ['Page-by-page analytics', 'Basic', 'Full heatmaps'],
                ['NDA + e-signature gating', '-', 'Yes'],
                ['Dynamic watermarks', '-', 'Yes'],
                ['File requests + Q&A', 'Yes', 'Yes'],
                ['Team seats', '1', '5 included'],
                ['Custom branding', '-', 'Yes'],
                ['Audit log retention', '30 days', '365 days'],
                ['AI due diligence', 'Coming soon', 'Coming soon'],
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
                <div className="col-span-3">Pro</div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA, editorial, single column ─────────────────────────────────────

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
            Stop emailing your most important documents.{' '}
            <span className="text-gray-500">Put them in a room you control.</span>
          </h2>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="text-lg text-gray-400 leading-relaxed mb-12 max-w-xl mx-auto">
            Create your first data room, share a secure link, and see every page
            your investors read. Free to start. No card. No sales call.
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
                Create my data room
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
        <EditorialIntro />
        <DocTypesMarquee />
        <FeatureShowcase />
        <AiTeaser />
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
