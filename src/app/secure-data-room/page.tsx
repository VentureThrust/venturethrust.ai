import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Lock, KeyRound, Droplets, FileSignature, CalendarClock, History } from 'lucide-react';

export const metadata = {
  title: 'Secure virtual data room · VentureThrust',
  description:
    'VentureThrust is a secure virtual data room. Share confidential documents with encrypted links, email and password gates, NDA gates, dynamic watermarks, expiry, instant revoke, and a full audit trail.',
  keywords: [
    'secure data room',
    'virtual data room',
    'confidential document sharing',
    'encrypted data room',
    'VDR',
    'share documents securely',
  ],
  alternates: { canonical: '/secure-data-room' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: Lock, title: 'Encrypted by default', desc: 'Documents are encrypted in transit and at rest, with link passcodes stored only as hashes.' },
  { icon: KeyRound, title: 'Access gates', desc: 'Require an email or password, and restrict to specific people with allow and block lists.' },
  { icon: Droplets, title: 'Dynamic watermarks', desc: 'Stamp every page with the viewer email or IP, so any leak traces back to a person.' },
  { icon: FileSignature, title: 'NDA and e-signature', desc: 'Require an NDA or a signature before anyone can open your files.' },
  { icon: CalendarClock, title: 'Expiry and instant revoke', desc: 'Set an expiry date or cut off access the moment a conversation ends.' },
  { icon: History, title: 'Full audit trail', desc: 'A complete log of who entered, what they opened, and when.' },
];

export default function SecureDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Secure data room</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          A secure virtual data room for sensitive documents
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Share confidential documents with one link, control exactly who gets in, and keep a full
          record of who saw what. Built so the contents stay private.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BLUE }}>
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/#security" className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50">
            How we secure it
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">7-day free trial. No card required.</p>
      </section>
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Security at every layer</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Set up your secure room in minutes</h2>
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
