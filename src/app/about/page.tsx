import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  ArrowRight,
  ShieldCheck,
  Eye,
  Zap,
  Target,
  Rocket,
  Handshake,
  GitMerge,
  Scale,
  Users,
  Briefcase,
} from 'lucide-react';

export const metadata = {
  title: 'About us · VentureThrust',
  description:
    'Why we built VentureThrust: a secure data room that helps teams share documents, see who is engaged, and close deals.',
};

const BLUE = '#4285F4';

const USE_CASES = [
  { icon: Rocket, title: 'Fundraising', desc: 'Founders share decks and data rooms, and see which investors are leaning in.' },
  { icon: Handshake, title: 'B2B sales', desc: 'Send proposals and collateral, then follow up with the buyers who actually read them.' },
  { icon: GitMerge, title: 'Mergers & acquisitions', desc: 'Run secure deal rooms for buyers and sellers, with a full audit trail.' },
  { icon: Scale, title: 'Legal & law firms', desc: 'Share confidential documents with clients and counterparties under NDA.' },
  { icon: Users, title: 'Recruiting & HR', desc: 'Send offers, profiles, and references securely, and know they were seen.' },
  { icon: Briefcase, title: 'Consulting & agencies', desc: 'Deliver reports and pitches with tracking, so you know what landed.' },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Confidentiality first',
    desc: 'Your documents are sensitive. Every layer of the product assumes they must stay private.',
  },
  {
    icon: Target,
    title: 'Built to close',
    desc: 'We surface who is engaged so you can follow up at the right moment and win the deal.',
  },
  {
    icon: Eye,
    title: 'Clarity, not noise',
    desc: 'We turn raw activity into a clear picture, so you spend time on the right conversations.',
  },
  {
    icon: Zap,
    title: 'Fast and simple',
    desc: 'Set up a room and share a link in minutes, with powerful controls that stay out of your way.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="container mx-auto max-w-3xl px-6 pb-12 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>
          About us
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Helping teams share documents and close deals
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          VentureThrust is a secure data room for any high-stakes document you send. Share with a single link, control
          who gets in, and see who is engaged so you can follow up and close.
        </p>
      </section>

      {/* Story */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Why we built it</h2>
          <div className="mt-6 space-y-5 text-[16px] leading-relaxed text-gray-600">
            <p>
              Whether you are raising a round, closing a sale, or running a deal, you end up sending sensitive documents
              to people you are still getting to know. Most teams still do it with email attachments: no control once it
              is sent, and no idea whether anyone read it.
            </p>
            <p>
              We thought that was backwards. When a document can win or lose a deal, you should know exactly where it
              went, who opened it, and what held their attention. You should be able to follow up while interest is
              high, and pull access back the moment a conversation ends.
            </p>
            <p>
              So we built VentureThrust: as easy as sharing a link, as secure as the documents deserve, and honest about
              what happens after you hit send.
            </p>
          </div>
        </div>
      </section>

      {/* Who uses it */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Who uses VentureThrust</h2>
            <p className="mt-3 text-base text-gray-600">
              Anyone who shares important documents to move a deal forward.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u) => (
              <div key={u.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <u.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{u.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">What we believe</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-2xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Close your next deal on VentureThrust
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">
            Start free for 7 days. Questions? We would love to hear from you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-lg px-7 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: BLUE }}
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:omprakash@venturethrust.com"
              className="inline-flex h-12 items-center rounded-lg border border-gray-300 px-7 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              Contact us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
