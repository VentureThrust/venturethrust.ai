import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, FolderTree, Users, Droplets, History, FileSignature, MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Data room for M&A · VentureThrust',
  description:
    'A secure M&A data room for buyers and sellers. Organize due-diligence documents, control access per party, watermark every page, gate with NDAs, and keep a full audit trail of who saw what.',
  keywords: [
    'data room for M&A',
    'M&A data room',
    'due diligence data room',
    'deal room',
    'mergers and acquisitions data room',
    'virtual data room for due diligence',
  ],
  alternates: { canonical: '/data-room-for-m-and-a' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: FolderTree, title: 'Organized diligence', desc: 'Structure folders for financials, legal, HR, and IP so buyers find everything fast.' },
  { icon: Users, title: 'Control access per party', desc: 'Give each bidder or advisor their own link, with allow lists and instant revoke.' },
  { icon: Droplets, title: 'Watermark every page', desc: 'Dynamic watermarks tie each page to the viewer, deterring leaks during a deal.' },
  { icon: History, title: 'Full audit trail', desc: 'A complete record of who entered, what they opened, and when, for clean diligence.' },
  { icon: FileSignature, title: 'NDA gates', desc: 'Require an NDA before anyone enters the room.' },
  { icon: MessageSquare, title: 'Q&A in the room', desc: 'Answer buyer questions in context, so nothing gets lost in email threads.' },
];

export default function MnaDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Mergers & acquisitions</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">A secure data room for M&amp;A</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Run buy-side or sell-side diligence from one secure room. Control what each party sees,
          watermark every page, and keep a clean audit trail from first look to close.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/secure-data-room" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            See the security
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Built for the deal</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Run your next deal on VentureThrust</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">Start free for 7 days, then plans from ₹999 a month.</p>
          <Link href="/signup" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
