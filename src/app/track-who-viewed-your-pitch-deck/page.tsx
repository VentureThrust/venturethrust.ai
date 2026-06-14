import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Clock, Eye, Flame, Download, Radio } from 'lucide-react';

export const metadata = {
  title: 'See who viewed your pitch deck · VentureThrust',
  description:
    'Stop wondering if investors opened your pitch deck. Share it as a secure link and see exactly who viewed it, when, how long they spent on each slide, and who to follow up with.',
  keywords: [
    'see who viewed my pitch deck',
    'who opened my pitch deck',
    'track pitch deck views',
    'know who read your document',
    'pitch deck analytics',
    'document tracking',
    'data room',
  ],
  alternates: { canonical: '/track-who-viewed-your-pitch-deck' },
};

const BLUE = '#4285F4';

const SEES = [
  { icon: Eye, title: 'Who opened it', desc: 'Capture each viewer email at the gate, so you know exactly which investor opened your deck.' },
  { icon: Clock, title: 'Time on every slide', desc: 'See how long each person spent on each page, not just that they opened it.' },
  { icon: Flame, title: 'Which slides held attention', desc: 'A page heatmap shows the slides investors actually read and the ones they skipped.' },
  { icon: Download, title: 'Downloads', desc: 'Know if and when someone downloaded your deck (or block downloads entirely).' },
  { icon: Radio, title: 'Live viewers', desc: 'See who is inside your deck right now, the moment they open the link.' },
];

function DeckMock() {
  const viewers = [
    { who: 'priya@sequoiacap.in', time: '6:48', pct: 92 },
    { who: 'rahul@blume.vc', time: '4:32', pct: 71 },
    { who: 'ankit@matrixpartners.in', time: '2:10', pct: 38 },
  ];
  return (
    <div className="mx-auto mt-12 max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Views, Pitch Deck.pdf</p>
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

export default function TrackPitchDeckPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>
          Pitch deck tracking
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Know exactly who viewed your pitch deck
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Stop wondering whether investors opened your deck. Share it as a secure link and see who
          viewed it, when, how long they spent on each slide, and who is worth following up with.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: BLUE }}
          >
            Track my deck free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/features"
            className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            See all features
          </Link>
        </div>
        <DeckMock />
      </section>

      {/* What you'll see */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What you will see after you hit send
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SEES.map((s) => (
              <div key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Follow up */}
      <section className="border-t border-gray-200 py-20 sm:py-24">
        <div className="container mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Turn views into meetings
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-600">
            When you can see which investors read the whole deck and which stopped on slide three, you
            know exactly who to call first. Follow up while your deck is still on their screen.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg px-8 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: BLUE }}
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
