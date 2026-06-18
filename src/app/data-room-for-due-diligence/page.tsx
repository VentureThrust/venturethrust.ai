import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, ListChecks, Inbox, MessageSquare, History, Droplets, Users } from 'lucide-react';

export const metadata = {
  title: 'Data room for due diligence · VentureThrust',
  description:
    'A secure data room for due diligence. Collect documents with file requests, organize a diligence checklist, control access per party, answer questions in a built-in Q&A, and keep a full audit trail.',
  keywords: [
    'data room for due diligence',
    'due diligence data room',
    'due diligence checklist',
    'diligence document collection',
    'deal room',
    'virtual data room for due diligence',
  ],
  alternates: { canonical: '/data-room-for-due-diligence' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: ListChecks, title: 'Organize the checklist', desc: 'Structure folders around your diligence checklist so nothing is missed.' },
  { icon: Inbox, title: 'Collect documents back', desc: 'Send a file request link and uploads land straight in the right folder, even from people without an account.' },
  { icon: MessageSquare, title: 'Built-in Q&A', desc: 'Answer reviewer questions in context, so nothing gets lost in email threads.' },
  { icon: Users, title: 'Access per party', desc: 'Give each reviewer or advisor their own link, with allow lists and instant revoke.' },
  { icon: Droplets, title: 'Watermark every page', desc: 'Tie each page to the viewer to deter leaks during a live process.' },
  { icon: History, title: 'Clean audit trail', desc: 'A complete record of who opened what and when, ready for the file.' },
];

export default function DueDiligenceDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Due diligence</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">A data room for due diligence</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Run diligence from one secure room. Collect the documents you need, share them with each
          party on their own terms, and keep a clean record of who saw what.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/data-room-for-m-and-a" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            Running an M&amp;A deal?
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Built for the diligence process</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}><p.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-2xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Run cleaner diligence</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">Start free for 7 days, then plans from $12 a month.</p>
          <Link href="/signup" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
