import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Link2, ShieldCheck, BarChart3, Droplets, History, MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Virtual data room (VDR) · VentureThrust',
  description:
    'A virtual data room (VDR) is a secure online space to share confidential documents and control who sees them. VentureThrust gives you secure links, granular access, watermarks, page-by-page analytics, and a full audit trail. From ₹999/mo.',
  keywords: [
    'virtual data room',
    'VDR',
    'virtual data room software',
    'online data room',
    'what is a virtual data room',
    'secure document sharing',
  ],
  alternates: { canonical: '/virtual-data-room' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: Link2, title: 'Secure share links', desc: 'One link per recipient, with email gates, passcodes, expiry, and instant revoke.' },
  { icon: ShieldCheck, title: 'Granular access', desc: 'Decide who can open which files, and restrict to named people with allow and block lists.' },
  { icon: BarChart3, title: 'Page-by-page analytics', desc: 'See who opened each document, when, and how long they spent on every page.' },
  { icon: Droplets, title: 'Dynamic watermarks', desc: 'Stamp every page with the viewer email or IP to deter leaks.' },
  { icon: History, title: 'Full audit trail', desc: 'A complete record of who entered, what they read, and when.' },
  { icon: MessageSquare, title: 'Q&A and file requests', desc: 'Answer questions in the room and collect documents back through a simple link.' },
];

export default function VirtualDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Virtual data room</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">A modern virtual data room</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          A virtual data room is a secure online space to share confidential documents and control
          exactly who sees them. VentureThrust gives you all of it, without the enterprise price tag.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/data-room-pricing" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            See pricing
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">What a great VDR gives you</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Open your virtual data room today</h2>
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
