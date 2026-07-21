'use client';

/**
 * DealWatchHowSlides - the /investors "How it works" section body.
 * Three steps on the left, three slides on the right, in sync: the
 * active step is highlighted while its visual shows (the pin dialog,
 * the three-layer pipeline, the brief). Auto advances every 4s, hover
 * pauses, clicking a step jumps to its slide.
 */

import { useEffect, useState } from 'react';
import { FileText, Sparkles, UserCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const BLUE = '#4285F4';

const STEPS = [
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
];

// ── Slide 1: the pin dialog ───────────────────────────────────────────────────

function PinSlide() {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <p className="text-[15px] font-bold text-gray-900">Watch BeanBridge</p>
        <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
          We will alert you the moment this startup hits a real milestone, with what changed
          since you passed. Nothing else, unless you ask.
        </p>
        <p className="mt-4 text-[11px] font-semibold text-gray-800">
          Note for your account manager <span className="font-normal text-gray-400">(optional)</span>
        </p>
        <div className="mt-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-[11px] italic text-gray-600">
          Too early for me. I want to see paying customers and one enterprise contract.
        </div>
        <div className="mt-3.5 flex items-start gap-2">
          <span className="mt-0.5 h-3.5 w-3.5 rounded-sm border border-gray-300 bg-white" />
          <span className="text-[11px] text-gray-600">Also send me a quarterly report on this startup</span>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <span className="rounded-md border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600">
            Cancel
          </span>
          <span className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-semibold text-white" style={{ background: BLUE }}>
            <Star className="h-3 w-3" /> Add to watchlist
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Slide 2: the three layers firing ─────────────────────────────────────────

function LayersSlide() {
  const layers = [
    {
      icon: FileText,
      tag: 'SOFTWARE',
      when: '09:41',
      t: 'Update caught the same minute',
      d: 'BeanBridge edited Pitch Deck v4 in its data room.',
    },
    {
      icon: Sparkles,
      tag: 'AI',
      when: '09:42',
      t: 'The change, read and understood',
      d: 'Revenue page rewritten: ₹4.2 L is now ₹11.8 L.',
    },
    {
      icon: UserCheck,
      tag: 'HUMAN',
      when: '11:05',
      t: 'Your account manager confirms',
      d: 'This is the milestone from your note. Brief approved.',
    },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-6">
      {layers.map((l, i) => (
        <div key={l.tag}>
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F0F5FF]" style={{ color: BLUE }}>
              <l.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400">{l.tag}</p>
                <p className="text-[10px] font-medium tabular-nums text-gray-400">{l.when}</p>
              </div>
              <p className="text-[13px] font-semibold text-gray-900">{l.t}</p>
              <p className="text-[11px] text-gray-500">{l.d}</p>
            </div>
          </div>
          {i < layers.length - 1 && (
            <div className="ml-[26px] h-3 border-l border-dashed border-gray-300" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Slide 3: the brief ────────────────────────────────────────────────────────

function BriefSlide() {
  const rows = [
    ['Monthly recurring revenue', '₹4.2 L', '₹11.8 L', '+181%'],
    ['Repeat order rate', '34%', '61%', '+27 pts'],
    ['Chains under annual contract', '0', '3', '+3'],
  ];
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-md border border-gray-300 bg-white font-serif shadow-xl">
        <div className="bg-[#0F2440] py-1.5 text-center text-[8px] font-semibold tracking-[0.5em] text-[#C9A227]">
          CONFIDENTIAL
        </div>
        <div className="px-5 pb-4 pt-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#0F2440]">Deal Watch</p>
          <p className="mt-0.5 text-[16px] font-bold text-[#0F2440]">Priority Brief · BeanBridge</p>
          <div className="mt-2.5 bg-[#8B1A1A] px-3 py-1.5">
            <p className="text-[10px] font-semibold text-white">
              The milestone you were waiting for has happened.
            </p>
          </div>
          <table className="mt-3 w-full text-[9.5px]">
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
            All figures verified against the company&apos;s live documents.
          </p>
          <p className="mt-2.5 border-t border-gray-200 pt-2 text-center text-[10px] font-bold text-[#0F2440]">
            We explain. You decide.
          </p>
        </div>
        <div className="bg-[#0F2440] py-1.5 text-center text-[8px] font-semibold tracking-[0.5em] text-[#C9A227]">
          CONFIDENTIAL
        </div>
      </div>
    </div>
  );
}

// ── The synced steps + slides ────────────────────────────────────────────────

export function DealWatchHowSlides() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS.length), 4000);
    return () => window.clearTimeout(id);
  }, [step, paused]);

  const slides = [<PinSlide key="p" />, <LayersSlide key="l" />, <BriefSlide key="b" />];

  return (
    <div
      className="grid items-start gap-10 lg:grid-cols-[1fr_440px] lg:gap-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div>
        {STEPS.map((r, i) => (
          <button
            key={r.n}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              'flex w-full gap-6 border-t border-gray-200 py-8 text-left transition-opacity sm:gap-10',
              i === step ? 'opacity-100' : 'opacity-40 hover:opacity-70',
            )}
          >
            <p className="w-10 shrink-0 pt-0.5 text-sm font-semibold" style={{ color: BLUE }}>
              {r.n}
            </p>
            <span>
              <span className="block text-lg font-semibold text-gray-900">{r.h}</span>
              <span className="mt-2 block max-w-2xl text-[15px] leading-relaxed text-gray-600">
                {r.b}
              </span>
            </span>
          </button>
        ))}
        <div className="flex gap-1.5 border-t border-gray-200 pt-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1 w-8 rounded-full transition-colors"
              style={{ background: i === step ? BLUE : '#E5E7EB' }}
            />
          ))}
        </div>
      </div>
      <div className="h-[440px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <div key={step} className="h-full animate-in fade-in-0 duration-300">
          {slides[step]}
        </div>
      </div>
    </div>
  );
}
