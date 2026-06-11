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
import {
  ArrowRight,
  FileText,
  Check,
  Eye,
  Clock,
  Lock,
  Globe2,
  ScanLine,
  History,
} from 'lucide-react';

const BLUE = '#4285F4';

// ── Hero product mock: a data room with live activity ────────────────────────

function ProductMock() {
  const files = [
    { name: 'Pitch Deck.pdf', meta: '14 pages', views: 32 },
    { name: 'Financial Model.xlsx', meta: 'Updated 2d ago', views: 18 },
    { name: 'Cap Table.pdf', meta: '3 pages', views: 11 },
    { name: 'Term Sheet Draft.pdf', meta: '6 pages', views: 7 },
  ];
  const visits = [
    { who: 'priya@sequoiacap.in', what: 'Viewed Pitch Deck', when: '2m ago', live: true },
    { who: 'rahul@blume.vc', what: 'Spent 4:32 on Financial Model', when: '1h ago' },
    { who: 'ankit@matrixpartners.in', what: 'Signed NDA, entered room', when: '3h ago' },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="ml-3 flex h-6 flex-1 max-w-md items-center rounded-md bg-white px-3 text-[11px] text-gray-400 ring-1 ring-gray-200">
          venturethrust.com/spaces/series-a
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* File list */}
        <div className="md:col-span-3 border-b border-gray-100 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Series A Data Room</p>
              <p className="text-xs text-gray-400">Shared with 9 investors</p>
            </div>
            <span className="rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white">Share</span>
          </div>
          <div className="px-2 pb-3">
            {files.map((f) => (
              <div key={f.name} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-gray-800">{f.name}</p>
                  <p className="text-[11px] text-gray-400">{f.meta}</p>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Eye className="h-3 w-3" /> {f.views}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="md:col-span-2 bg-gray-50/60">
          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-gray-900">Activity</p>
          </div>
          <div className="space-y-1 px-2 pb-4">
            {visits.map((v) => (
              <div key={v.who} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[12px] font-medium text-gray-800">{v.who}</p>
                  {v.live ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">{v.when}</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500">{v.what}</p>
              </div>
            ))}
            {/* Page time mini chart */}
            <div className="rounded-lg bg-white px-3 py-3 ring-1 ring-gray-100">
              <p className="text-[11px] font-medium text-gray-700">Time per page, Pitch Deck</p>
              <div className="mt-2 space-y-1.5">
                {[88, 64, 95, 42, 23].map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-[10px] text-gray-400">p{i + 1}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${w}%`, background: BLUE }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small mock visuals for the feature sections ───────────────────────────────

function LinkControlsMock() {
  const rows = [
    { label: 'Require email to view', on: true },
    { label: 'Passcode', on: true, value: '••••••' },
    { label: 'Expires', on: true, value: 'Jul 15, 2026' },
    { label: 'Allow downloading', on: false },
    { label: 'Watermark with viewer email', on: true },
  ];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">Link settings</p>
      <p className="text-xs text-gray-400">Series A Data Room</p>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[13px] text-gray-700">{r.label}</span>
            <span className="flex items-center gap-2">
              {r.value && <span className="text-[12px] text-gray-400">{r.value}</span>}
              <span
                className={`flex h-5 w-9 items-center rounded-full px-0.5 ${r.on ? '' : 'bg-gray-200'}`}
                style={r.on ? { background: BLUE } : undefined}
              >
                <span className={`h-4 w-4 rounded-full bg-white shadow ${r.on ? 'ml-auto' : ''}`} />
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
        <span className="truncate text-[12px] text-gray-500">venturethrust.com/shared/x7Kq2m</span>
        <span className="text-[12px] font-medium" style={{ color: BLUE }}>Copy</span>
      </div>
    </div>
  );
}

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
            VentureThrust is a secure data room for fundraises and deals. Send one link,
            control who gets in, and see time spent on every page.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 text-base text-white hover:opacity-90" style={{ background: BLUE }}>
              <Link href="/signup">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-gray-400">Free plan available. No card required.</p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl sm:mt-16">
          <ProductMock />
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
        visual={<LinkControlsMock />}
      />

      <Feature
        id="how-it-works"
        eyebrow="Track"
        title="See what happens after you hit send"
        body="Every visit is tracked page by page, so you know which investor read the whole deck and who stopped at slide three. Follow up with the people who are actually engaged."
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
              Term sheets, financials, and cap tables deserve more than an email attachment.
              Every layer of VentureThrust assumes the contents are confidential.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lock, t: 'Encrypted', d: 'Encrypted in transit and at rest, with hashed link passcodes.' },
              { icon: Globe2, t: 'Access controls', d: 'Email gates, allow and block lists, expiry, and instant revoke.' },
              { icon: ScanLine, t: 'Watermarking', d: 'Dynamic watermarks tie every page to the person viewing it.' },
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

      {/* Closing CTA */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your next raise deserves a better data room
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
