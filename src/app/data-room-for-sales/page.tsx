import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Send, BarChart3, TrendingUp, Users, Ban, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Data room for sales · VentureThrust',
  description:
    'Use a data room to close more sales. Share proposals, decks, and collateral with prospects through one secure link, and see exactly who opened them and what they read, so you can follow up at the right moment.',
  keywords: [
    'data room for sales',
    'sales data room',
    'share sales proposal and track',
    'sales collateral tracking',
    'track who viewed proposal',
    'B2B sales documents',
    'close more deals',
  ],
  alternates: { canonical: '/data-room-for-sales' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: Send, title: 'Send proposals as a link', desc: 'Share proposals, decks, and collateral with one secure link instead of email attachments.' },
  { icon: BarChart3, title: 'See which buyers are engaged', desc: 'Track who opened your proposal, how long they spent, and which pages they actually read.' },
  { icon: TrendingUp, title: 'Follow up at the right moment', desc: 'Reach out while your document is still on their screen, to the buyers who are warmest.' },
  { icon: Users, title: 'A link per prospect', desc: 'Give each buyer their own link, see them separately, and revoke access any time.' },
  { icon: Ban, title: 'Keep pricing in your control', desc: 'Block downloads so sensitive quotes and terms stay view-only.' },
  { icon: Sparkles, title: 'Look professional', desc: 'A branded room signals a serious vendor and helps you stand out in the deal.' },
];

export default function SalesDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Sales</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          A data room that helps you close more sales
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Share proposals, decks, and collateral with prospects through one secure link, and see
          exactly who is engaged, so you follow up with the right buyers at the right time.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/send-documents-and-track-opens" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            Track every open
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Turn shared documents into closed deals</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Close your next deal with VentureThrust</h2>
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
