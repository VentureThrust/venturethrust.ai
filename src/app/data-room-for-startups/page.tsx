import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Rocket, BarChart3, FolderOpen, FileSignature, Wallet, Palette } from 'lucide-react';

export const metadata = {
  title: 'Data room for startups · VentureThrust',
  description:
    'A secure data room for startups. Share your deck, financials, and updates with investors and partners through one link, see who is engaged, and keep everything in one reusable library. From ₹999/mo.',
  keywords: [
    'data room for startups',
    'startup data room',
    'founder data room',
    'investor data room',
    'investor updates',
    'affordable data room',
  ],
  alternates: { canonical: '/data-room-for-startups' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: Rocket, title: 'Share your raise', desc: 'Deck, financials, cap table, and updates in one link you control.' },
  { icon: BarChart3, title: 'See investor interest', desc: 'Track who opened your deck, time on each slide, and who read it all.' },
  { icon: FolderOpen, title: 'Reusable content library', desc: 'Keep every doc in one place and reuse it across rooms without re-uploading.' },
  { icon: FileSignature, title: 'NDA and gates', desc: 'Require an email, password, or NDA before anyone gets in.' },
  { icon: Wallet, title: 'Founder-friendly pricing', desc: 'Plans from ₹999 a month, not enterprise-only pricing.' },
  { icon: Palette, title: 'On-brand rooms', desc: 'Your logo and cover, so your room looks as serious as your company.' },
];

export default function StartupsDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Startups</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">A data room for startups</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Share your deck, financials, and updates with investors and partners through one secure
          link, and see exactly who is engaged. Affordable enough for day one.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/data-room-for-fundraising" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            Raising soon?
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Made for founders</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Give your startup a serious data room</h2>
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
