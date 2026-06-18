import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Rocket, BarChart3, FileSignature, Link2, Boxes, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Data room for fundraising · VentureThrust',
  description:
    'Run your raise from a secure data room. Share your pitch deck, financials, and cap table with one link, gate access with an NDA, and see which investors are engaged so you can follow up and close.',
  keywords: [
    'data room for fundraising',
    'fundraising data room',
    'investor data room',
    'pitch deck data room',
    'raise capital data room',
    'startup data room',
  ],
  alternates: { canonical: '/data-room-for-fundraising' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: Boxes, title: 'Your whole raise in one room', desc: 'Deck, financials, cap table, and legal docs organized in folders, shared with one link.' },
  { icon: BarChart3, title: 'See which investors are engaged', desc: 'Track who opened the deck, how long they spent on each slide, and who read it all.' },
  { icon: Rocket, title: 'Follow up at the right moment', desc: 'Reach out while interest is high, to the investors who actually read your materials.' },
  { icon: FileSignature, title: 'Gate with an NDA', desc: 'Require an NDA or email before anyone can open sensitive financials.' },
  { icon: Link2, title: 'One link, instant revoke', desc: 'No more email attachments you can never take back. Cut off access any time.' },
  { icon: Sparkles, title: 'Look buttoned-up', desc: 'A branded, professional room signals you run a tight process.' },
];

export default function FundraisingDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Fundraising</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">A data room built for fundraising</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Share your pitch deck, financials, and cap table with one secure link, and see which
          investors are truly engaged so you know who to call first.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/track-who-viewed-your-pitch-deck" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            Track who views your deck
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything your raise needs</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Run your next raise on VentureThrust</h2>
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
