import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  ArrowRight,
  Check,
  BarChart3,
  Link2,
  FileSignature,
  Droplets,
  Boxes,
  Wallet,
} from 'lucide-react';

export const metadata = {
  title: 'The affordable DocSend alternative · VentureThrust',
  description:
    'VentureThrust is a secure data room and an affordable DocSend alternative. Share documents with one link, gate access with NDAs and expiry, and see exactly who opened them and which pages they read. Plans from ₹999/mo.',
  keywords: [
    'DocSend alternative',
    'affordable DocSend alternative',
    'cheaper than DocSend',
    'data room',
    'document tracking',
    'share documents securely',
    'page-by-page analytics',
  ],
  alternates: { canonical: '/docsend-alternative' },
};

const BLUE = '#4285F4';

const POINTS = [
  {
    icon: BarChart3,
    title: 'Page-by-page analytics',
    desc: 'See exactly who opened your document, when, and how long they spent on every page, the same tracking DocSend is known for.',
  },
  {
    icon: Link2,
    title: 'Secure share links',
    desc: 'One link with email gates, passcodes, allow and block lists, expiry dates, and instant revoke.',
  },
  {
    icon: FileSignature,
    title: 'NDAs and e-signatures',
    desc: 'Require an NDA or a signature before anyone can open your files.',
  },
  {
    icon: Droplets,
    title: 'Dynamic watermarks',
    desc: 'Stamp every page with the viewer email or IP, so leaks trace back to a person.',
  },
  {
    icon: Boxes,
    title: 'Whole data rooms, not just files',
    desc: 'Organize folders and full rooms for a raise or a deal, not one document at a time.',
  },
  {
    icon: Wallet,
    title: 'Affordable, transparent pricing',
    desc: 'Plans from ₹999 a month, with no enterprise-only paywall on the features that matter.',
  },
];

export default function DocSendAlternativePage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>
          DocSend alternative
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          The affordable DocSend alternative
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          VentureThrust is a secure data room with the page-by-page tracking you came for, for less.
          Share a link, control who gets in, and see exactly who read what.
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
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>

      {/* Why switch */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you expect from DocSend, for less
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reassurance row */}
      <section className="border-t border-gray-200 py-16">
        <div className="container mx-auto max-w-3xl px-6">
          <ul className="space-y-3">
            {[
              'Move your deck, financials, and cap table into one secure room in minutes.',
              'Send a single link instead of email attachments you can never take back.',
              'See which investors are engaged, then follow up while interest is high.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[15px] text-gray-700">
                <Check className="mt-1 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto max-w-2xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Switch to a data room that respects your budget
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">
            Start free for 7 days, then plans from ₹999 a month.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: BLUE }}
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
