'use client';

/**
 * HeroWalkthrough - the landing hero visual. An auto rotating, clickable five
 * step tour of the real product flow (pick a template, upload documents,
 * create the link, set permissions, track views). Every screen is a hand built
 * CSS mock that mirrors the actual app shell: left sidebar, top search bar,
 * the upload dialog + bottom right Uploads tracker, the share dialog toggles,
 * and the analytics view. Auto advances every 4s; hover pauses; clicking a
 * step jumps to it.
 */

import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  FolderOpen,
  Boxes,
  FileSignature,
  Inbox,
  BarChart3,
  Users,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Eye,
  Clock,
  Search,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BLUE = '#4285F4';

const STEPS = [
  'Pick a template',
  'Upload documents',
  'Create the link',
  'Set permissions',
  'Track every view',
];

// ── App shell pieces ──────────────────────────────────────────────────────────

function MiniSidebar({ active }: { active: 'spaces' | 'analytics' }) {
  const items = [
    { k: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { k: 'library', label: 'Content Library', icon: FolderOpen },
    { k: 'spaces', label: 'Spaces', icon: Boxes },
    { k: 'agreements', label: 'Agreements', icon: FileSignature },
    { k: 'requests', label: 'File Requests', icon: Inbox },
    { k: 'analytics', label: 'Analytics', icon: BarChart3 },
    { k: 'shared', label: 'Shared with me', icon: Users },
  ];
  return (
    <div className="hidden w-40 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-3">
        <span className="grid h-4 w-4 place-items-center rounded bg-[#F0F5FF]">
          <span className="h-2 w-2 rounded-[2px]" style={{ background: BLUE }} />
        </span>
        <span className="text-[11px] font-bold text-gray-900">
          VentureThrust.<span style={{ color: BLUE }}>ai</span>
        </span>
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
        <Search className="h-3 w-3" /> Search everything...
      </div>
      <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: BLUE }}>
        O
      </div>
    </div>
  );
}

function Frame({ url, active, children }: { url: string; active: 'spaces' | 'analytics'; children: React.ReactNode }) {
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

// ── Step screens ──────────────────────────────────────────────────────────────

function TemplateScreen() {
  const templates = [
    { name: 'Fundraise data room', d: 'Deck, financials, cap table and legal in one room.' },
    { name: 'General due diligence', d: 'Simplify diligence across any sector.', hot: true },
    { name: 'Sell side M&A data room', d: 'Secure content sharing for acquisitions.' },
  ];
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Spaces</p>
        <span className="rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white">+ Create new Space</span>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Start from a template</p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {templates.map((t) => (
          <div
            key={t.name}
            className={cn(
              'rounded-lg border bg-white p-3.5',
              t.hot ? 'border-transparent shadow-md ring-2' : 'border-gray-200',
            )}
            style={t.hot ? ({ ['--tw-ring-color' as string]: BLUE } as React.CSSProperties) : undefined}
          >
            <Boxes className="h-4 w-4 text-gray-400" />
            <p className="mt-2 text-[12px] font-semibold text-gray-900">{t.name}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{t.d}</p>
            <span
              className={cn(
                'mt-3 inline-block rounded-md px-2 py-1 text-[10px] font-medium',
                t.hot ? 'text-white' : 'bg-gray-100 text-gray-600',
              )}
              style={t.hot ? { background: BLUE } : undefined}
            >
              Use template
            </span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">My Spaces</p>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-gray-400" />
          <span className="text-[12px] font-medium text-gray-800">Series A Data Room</span>
        </div>
        <span className="text-[10px] text-gray-400">Created just now</span>
      </div>
    </div>
  );
}

function UploadScreen() {
  return (
    <div className="relative h-full">
      {/* Dimmed space behind the dialog */}
      <div className="p-5 opacity-40">
        <p className="text-sm font-semibold text-gray-900">Series A Data Room</p>
        <p className="text-xs text-gray-400">Home</p>
      </div>
      {/* Upload dialog */}
      <div className="absolute left-1/2 top-10 w-[88%] max-w-sm -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
        <p className="text-[13px] font-semibold text-gray-900">Upload to "Series A Data Room"</p>
        <div className="mt-3 flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 text-center">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50" style={{ color: BLUE }}>
            <Upload className="h-4 w-4" />
          </span>
          <p className="mt-1.5 text-[11px] font-medium text-gray-800">Drag and drop files here</p>
        </div>
        <div className="mt-3 space-y-1.5">
          {['Pitch Deck.pdf', 'Financial Model.xlsx', 'Cap Table.pdf'].map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-600">
              <FileText className="h-3 w-3 shrink-0 text-gray-400" /> {f}
            </div>
          ))}
        </div>
        <span className="mt-3 block rounded-md py-1.5 text-center text-[11px] font-semibold text-white" style={{ background: BLUE }}>
          Upload 3 files
        </span>
      </div>
      {/* Bottom right uploads tracker */}
      <div className="absolute bottom-3 right-3 w-56 overflow-hidden rounded-lg bg-gray-900 text-white shadow-xl">
        <div className="px-3 py-2 text-[11px] font-semibold">Uploads</div>
        <div className="space-y-1 px-2 pb-2">
          <div className="flex items-center gap-2 rounded bg-gray-800 px-2 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            <span className="truncate text-[10px]">Pitch Deck.pdf</span>
          </div>
          <div className="rounded bg-gray-800 px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 text-blue-400" />
              <span className="truncate text-[10px]">Financial Model.xlsx</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-gray-700">
              <div className="h-full w-2/3 rounded-full bg-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkScreen() {
  return (
    <div className="relative h-full">
      <div className="p-5 opacity-40">
        <p className="text-sm font-semibold text-gray-900">Series A Data Room</p>
        <p className="text-xs text-gray-400">4 files</p>
      </div>
      <div className="absolute left-1/2 top-12 w-[88%] max-w-sm -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
        <p className="text-[13px] font-semibold text-gray-900">Share "Series A Data Room"</p>
        <p className="mt-0.5 text-[11px] text-gray-400">Anyone with the link can view, on your terms.</p>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
          <span className="truncate text-[11px] text-gray-600">venturethrust.com/shared/x7Kq2m</span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold" style={{ color: BLUE }}>
            <Copy className="h-3 w-3" /> Copy
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Email required', 'Expires Jul 15, 2026', 'Watermarked'].map((c) => (
            <span key={c} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium" style={{ color: BLUE }}>
              {c}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-gray-400">Send it to investors. Revoke any time.</p>
      </div>
    </div>
  );
}

function PermissionsScreen() {
  const rows = [
    { label: 'Require email to view', on: true },
    { label: 'Passcode', on: true, value: '••••••' },
    { label: 'Expires', on: true, value: 'Jul 15, 2026' },
    { label: 'Allow downloading', on: false },
    { label: 'Watermark with viewer email', on: true },
  ];
  return (
    <div className="relative h-full">
      <div className="p-5 opacity-40">
        <p className="text-sm font-semibold text-gray-900">Series A Data Room</p>
        <p className="text-xs text-gray-400">Link settings</p>
      </div>
      <div className="absolute left-1/2 top-8 w-[88%] max-w-sm -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
        <p className="text-[13px] font-semibold text-gray-900">Link settings</p>
        <div className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-[12px] text-gray-700">{r.label}</span>
              <span className="flex items-center gap-2">
                {r.value && <span className="text-[10px] text-gray-400">{r.value}</span>}
                <span
                  className={cn('flex h-4 w-7 items-center rounded-full px-0.5', !r.on && 'bg-gray-200')}
                  style={r.on ? { background: BLUE } : undefined}
                >
                  <span className={cn('h-3 w-3 rounded-full bg-white shadow', r.on && 'ml-auto')} />
                </span>
              </span>
            </div>
          ))}
        </div>
        <span className="mt-4 block rounded-md py-1.5 text-center text-[11px] font-semibold text-white" style={{ background: BLUE }}>
          Save and copy link
        </span>
      </div>
    </div>
  );
}

function TrackScreen() {
  const viewers = [
    { who: 'priya@sequoiacap.in', time: '6:48', pct: 92, live: true },
    { who: 'rahul@blume.vc', time: '4:32', pct: 71 },
    { who: 'ankit@matrixpartners.in', time: '2:10', pct: 38 },
  ];
  return (
    <div className="grid h-full grid-cols-1 gap-4 p-5 sm:grid-cols-2">
      <div>
        <p className="text-sm font-semibold text-gray-900">Visits</p>
        <p className="text-xs text-gray-400">Series A Data Room, last 7 days</p>
        <div className="mt-3 space-y-3">
          {viewers.map((v) => (
            <div key={v.who} className="rounded-lg border border-gray-100 bg-white p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="truncate font-medium text-gray-800">{v.who}</span>
                {v.live ? (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live now
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-gray-400">
                    <Clock className="h-3 w-3" /> {v.time}
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${v.pct}%`, background: BLUE }} />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Read {v.pct}% of the deck</p>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden sm:block">
        <p className="text-sm font-semibold text-gray-900">Time per page</p>
        <p className="text-xs text-gray-400">Pitch Deck.pdf</p>
        <div className="mt-3 space-y-2 rounded-lg border border-gray-100 bg-white p-3">
          {[88, 64, 95, 42, 23, 51, 12].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-[10px] text-gray-400">p{i + 1}</span>
              <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${w}%`, background: BLUE }} />
              </div>
            </div>
          ))}
          <p className="pt-1 text-[10px] text-gray-400">
            <Eye className="mr-1 inline h-3 w-3" />
            Page 3 is where investors spend the most time.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Walkthrough ───────────────────────────────────────────────────────────────

export function HeroWalkthrough() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS.length), 4000);
    return () => window.clearTimeout(id);
  }, [step, paused]);

  const urls = [
    'venturethrust.com/spaces',
    'venturethrust.com/spaces/series-a/edit',
    'venturethrust.com/spaces/series-a/edit',
    'venturethrust.com/spaces/series-a/edit',
    'venturethrust.com/spaces/series-a/analytics',
  ];
  const screens = [<TemplateScreen key="t" />, <UploadScreen key="u" />, <LinkScreen key="l" />, <PermissionsScreen key="p" />, <TrackScreen key="k" />];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Step tabs */}
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
        <Frame url={urls[step]} active={step === 4 ? 'analytics' : 'spaces'}>
          <div key={step} className="h-full animate-in fade-in-0 duration-300">
            {screens[step]}
          </div>
        </Frame>
      </div>
    </div>
  );
}
