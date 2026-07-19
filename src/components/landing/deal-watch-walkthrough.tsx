'use client';

/**
 * DealWatchWalkthrough - the /investors page visual. An auto rotating,
 * clickable four step tour of Deal Watch from the INVESTOR's seat:
 * the shared-with-me deal inbox, the Add to Watchlist dialog (note +
 * quarterly opt-in), the watchlist itself, and the brief that arrives
 * when a watched startup moves. Same interaction pattern as the home
 * page HeroWalkthrough: auto advances every 4s, hover pauses, clicking
 * a step jumps to it. All screens are CSS mocks of the real product.
 */

import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Users,
  Star,
  BarChart3,
  Headset,
  FileText,
  Boxes,
  Search,
  UserCheck,
  FileBarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BLUE = '#4285F4';

const STEPS = ['Your deal inbox', 'Add to Watchlist', 'Your watchlist', 'The brief arrives'];

// ── Investor app shell ────────────────────────────────────────────────────────

function MiniSidebar({ active }: { active: 'shared' | 'watchlist' | 'dashboard' }) {
  const items = [
    { k: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { k: 'shared', label: 'Shared with me', icon: Users },
    { k: 'watchlist', label: 'Watchlist', icon: Star },
    { k: 'spaces', label: 'Spaces', icon: Boxes },
    { k: 'analytics', label: 'Analytics', icon: BarChart3 },
    { k: 'manager', label: 'Account Manager', icon: Headset },
  ];
  return (
    <div className="hidden w-40 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-3">
        <span className="text-[11px] font-bold text-gray-900">VentureThrust</span>
      </div>
      <div className="space-y-0.5 p-2">
        {items.map((it) => (
          <div
            key={it.k}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]',
              it.k === active ? 'bg-[#F0F5FF] font-semibold' : 'text-gray-500',
            )}
            style={it.k === active ? { color: BLUE } : undefined}
          >
            <it.icon className="h-3.5 w-3.5" />
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTopbar() {
  return (
    <div className="flex h-10 items-center justify-between border-b border-gray-100 px-4">
      <div className="flex h-6 w-44 items-center gap-1.5 rounded-md bg-gray-50 px-2 text-[10px] text-gray-400 ring-1 ring-gray-200">
        <Search className="h-3 w-3" /> Search spaces and files...
      </div>
      <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: BLUE }}>
        R
      </div>
    </div>
  );
}

function Frame({
  url,
  active,
  children,
}: {
  url: string;
  active: 'shared' | 'watchlist' | 'dashboard';
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="ml-3 flex h-6 max-w-md flex-1 items-center rounded-md bg-white px-3 text-[11px] text-gray-400 ring-1 ring-gray-200">
          {url}
        </div>
      </div>
      <div className="flex">
        <MiniSidebar active={active} />
        <div className="relative min-w-0 flex-1">
          <MiniTopbar />
          <div className="relative h-[360px] overflow-hidden bg-gray-50/40 sm:h-[380px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: the deal inbox ────────────────────────────────────────────────────

function InboxScreen() {
  const rows = [
    { name: 'BeanBridge, Seed Deck.pdf', from: 'arjun@beanbridge.in', when: '2 days ago', state: 'Opened' },
    { name: 'Zylo Health, Data Room', from: 'meera@zylohealth.com', when: '3 days ago', state: 'Opened' },
    { name: 'FarmLink Pitch v4.pdf', from: 'dev@farmlink.co', when: '5 days ago', state: 'Pending' },
    { name: 'Karta Logistics, Data Room', from: 'sana@karta.io', when: '1 week ago', state: 'Opened' },
  ];
  return (
    <div className="p-4">
      <p className="text-[13px] font-bold text-gray-900">Shared with me</p>
      <p className="text-[10px] text-gray-400">Every deck and data room founders send you, in one inbox</p>
      <div className="mt-3 flex items-center gap-3 border-b border-gray-200 text-[10px]">
        {[
          ['All', '12'],
          ['Pending', '1'],
          ['Opened', '9'],
          ['Watchlist', '2'],
        ].map(([t, n], i) => (
          <span
            key={t}
            className={cn('flex items-center gap-1 pb-1.5', i === 0 ? 'border-b-2 font-semibold' : 'text-gray-400')}
            style={i === 0 ? { borderColor: BLUE, color: BLUE } : undefined}
          >
            {t} <span className="text-gray-400">{n}</span>
          </span>
        ))}
      </div>
      <div className="mt-1 divide-y divide-gray-100">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 py-2.5">
            <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-gray-800">{r.name}</p>
              <p className="text-[9.5px] text-gray-400">{r.from} · {r.when}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold',
                r.state === 'Opened' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700',
              )}
            >
              {r.state}
            </span>
            <span
              className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[9px] font-semibold text-white sm:flex"
              style={{ background: BLUE }}
            >
              <Star className="h-2.5 w-2.5" /> Add to Watchlist
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: the Add to Watchlist dialog ───────────────────────────────────────

function DialogScreen() {
  return (
    <div className="relative h-full">
      <div className="p-4 opacity-30">
        <p className="text-[13px] font-bold text-gray-900">BeanBridge, Seed Deck.pdf</p>
        <div className="mt-3 h-40 rounded-lg border border-gray-200 bg-white" />
      </div>
      <div className="absolute inset-0 grid place-items-center bg-gray-900/20 p-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
          <p className="text-[13px] font-bold text-gray-900">Watch BeanBridge</p>
          <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
            We will alert you the moment this startup hits a real milestone, with what changed
            since you passed. Nothing else, unless you ask.
          </p>
          <p className="mt-3 text-[10px] font-semibold text-gray-800">
            Note for your account manager <span className="font-normal text-gray-400">(optional)</span>
          </p>
          <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-[10px] italic text-gray-600">
            Too early for me. I want to see paying customers and one enterprise contract.
          </div>
          <div className="mt-3 flex items-start gap-2">
            <span className="mt-0.5 h-3 w-3 rounded-sm border border-gray-300 bg-white" />
            <span className="text-[10px] text-gray-600">Also send me a quarterly report on this startup</span>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <span className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] font-medium text-gray-600">
              Cancel
            </span>
            <span className="rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-white" style={{ background: BLUE }}>
              Add to watchlist
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: the watchlist ─────────────────────────────────────────────────────

function WatchlistScreen() {
  const rows = [
    {
      name: 'BeanBridge',
      note: 'Too early for me. I want paying customers and one enterprise contract.',
      added: 'Mar 14, 2026',
      quarterly: false,
    },
    {
      name: 'Zylo Health',
      note: 'Strong team. Waiting for the regulatory clearance.',
      added: 'Feb 02, 2026',
      quarterly: true,
    },
    {
      name: 'Karta Logistics',
      note: 'Revisit after they cross 1 Cr ARR.',
      added: 'Jan 20, 2026',
      quarterly: false,
    },
  ];
  return (
    <div className="p-4">
      <p className="text-[13px] font-bold text-gray-900">Watchlist</p>
      <p className="text-[10px] text-gray-400">
        Startups you follow. We alert you the moment one hits a real milestone.
      </p>
      <div className="mt-3 divide-y divide-gray-100">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 py-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#FFF8E6]">
              <Star className="h-3 w-3 text-[#F4B400]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-800">{r.name}</p>
              <p className="truncate text-[9.5px] italic text-gray-400">{r.note}</p>
            </div>
            <span className="hidden shrink-0 text-[9.5px] text-gray-400 lg:block">{r.added}</span>
            <span
              className={cn(
                'hidden shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8.5px] font-semibold sm:flex',
                r.quarterly ? 'border-gray-200 text-gray-700' : 'border-transparent text-gray-400',
              )}
            >
              <FileBarChart className="h-2.5 w-2.5" />
              {r.quarterly ? 'Quarterly on' : 'Quarterly off'}
            </span>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[8.5px] font-semibold text-green-700">
              <UserCheck className="h-2.5 w-2.5" /> Managed for you
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2">
        <p className="text-[10px] font-medium text-[#1e3a8a]">
          Your account manager reads every update these startups make. You hear only what matters.
        </p>
      </div>
    </div>
  );
}

// ── Step 4: the brief ─────────────────────────────────────────────────────────

function BriefScreen() {
  const rows = [
    ['Monthly recurring revenue', '₹4.2 L', '₹11.8 L', '+181%'],
    ['Repeat order rate', '34%', '61%', '+27 pts'],
    ['Cafe chains under contract', '0', '3', '+3'],
  ];
  return (
    <div className="p-4">
      <div className="mx-auto max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-2.5" style={{ background: '#8B1A1A' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white">
            Priority brief · BeanBridge
          </p>
        </div>
        <div className="p-4">
          <p className="text-[10px] leading-relaxed text-gray-600">
            You passed in March and asked to see paying customers and an enterprise contract.
            Both happened. Here is what changed since your no.
          </p>
          <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
            <div className="grid grid-cols-4 gap-2 border-b border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[8.5px] font-semibold uppercase tracking-wide text-gray-400">
              <span>Metric</span>
              <span className="text-right">Your pass</span>
              <span className="text-right">Today</span>
              <span className="text-right">Change</span>
            </div>
            {rows.map((r) => (
              <div key={r[0]} className="grid grid-cols-4 gap-2 border-b border-gray-100 px-2.5 py-1.5 text-[9.5px] last:border-0">
                <span className="font-medium text-gray-700">{r[0]}</span>
                <span className="text-right text-gray-500">{r[1]}</span>
                <span className="text-right font-semibold text-gray-900">{r[2]}</span>
                <span className="text-right font-semibold text-green-700">{r[3]}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[8.5px] text-gray-400">
            All figures verified against the company&apos;s live documents. Arithmetic shown in the
            full brief.
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
            <p className="text-[9.5px] font-semibold text-gray-900">We explain. You decide.</p>
            <span className="rounded-md px-2.5 py-1 text-[9.5px] font-semibold text-white" style={{ background: BLUE }}>
              Open the full brief
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] text-gray-400">
        Sent by your account manager, the day it happened. The market reads about it later.
      </p>
    </div>
  );
}

// ── Walkthrough ───────────────────────────────────────────────────────────────

export function DealWatchWalkthrough() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS.length), 4000);
    return () => window.clearTimeout(id);
  }, [step, paused]);

  const urls = [
    'venturethrust.com/dashboard/shared-with-me',
    'venturethrust.com/shared/beanbridge-seed-deck',
    'venturethrust.com/watchlist',
    'venturethrust.com/dashboard',
  ];
  const actives: ('shared' | 'watchlist' | 'dashboard')[] = ['shared', 'shared', 'watchlist', 'dashboard'];
  const screens = [
    <InboxScreen key="i" />,
    <DialogScreen key="d" />,
    <WatchlistScreen key="w" />,
    <BriefScreen key="b" />,
  ];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="no-scrollbar -mx-6 overflow-x-auto px-6">
        <div className="mx-auto flex w-max items-center gap-1 rounded-full border border-gray-200 bg-white p-1">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                i === step ? 'text-white' : 'text-gray-500 hover:text-gray-900',
              )}
              style={i === step ? { background: BLUE } : undefined}
            >
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold',
                  i === step ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500',
                )}
              >
                {i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Frame url={urls[step]} active={actives[step]}>
          <div key={step} className="h-full animate-in fade-in-0 duration-300">
            {screens[step]}
          </div>
        </Frame>
      </div>
    </div>
  );
}
