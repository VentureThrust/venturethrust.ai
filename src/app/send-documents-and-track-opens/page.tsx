import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Send, Bell, Clock, Eye, Download, Ban } from 'lucide-react';

export const metadata = {
  title: 'Send documents and track opens · VentureThrust',
  description:
    'Send any document as a secure link and know the moment it is opened. See who viewed it, how long they spent on each page, get notified on every open, and block downloads when you need to.',
  keywords: [
    'send documents and track opens',
    'document open tracking',
    'know when a document is opened',
    'track document views',
    'document link tracking',
    'see who opened my document',
  ],
  alternates: { canonical: '/send-documents-and-track-opens' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: Send, title: 'One secure link', desc: 'Send a document as a link instead of an attachment, and keep control after you hit send.' },
  { icon: Bell, title: 'Open notifications', desc: 'Get notified the moment your document is opened, in real time.' },
  { icon: Eye, title: 'Know who opened it', desc: 'Capture each viewer email so you know exactly who is reading.' },
  { icon: Clock, title: 'Time on every page', desc: 'See how long each person spent on each page, not just that they opened it.' },
  { icon: Download, title: 'Download tracking', desc: 'Know if and when someone downloaded your file.' },
  { icon: Ban, title: 'Block downloads', desc: 'Keep documents view-only when the content should never leave the room.' },
];

export default function SendAndTrackPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Document tracking</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Send documents and know when they are opened</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Stop wondering if anyone read what you sent. Share a secure link and see who opened it,
          when, and how long they spent on every page.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/track-who-viewed-your-pitch-deck" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            Tracking a pitch deck?
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">See everything after you hit send</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Never wonder if it was read again</h2>
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
