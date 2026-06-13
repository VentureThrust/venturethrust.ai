import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, ShieldCheck, Eye, Zap, Heart } from 'lucide-react';

export const metadata = {
  title: 'About us - VentureThrust',
  description: 'Why we built VentureThrust: a secure, modern data room that helps founders raise with confidence.',
};

const BLUE = '#4285F4';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Confidentiality first',
    desc: 'Your deck, financials, and cap table are sensitive. Every layer of the product assumes they must stay private.',
  },
  {
    icon: Eye,
    title: 'Clarity, not noise',
    desc: 'We turn raw activity into a clear picture of who is engaged, so you spend time on the right conversations.',
  },
  {
    icon: Zap,
    title: 'Fast and simple',
    desc: 'Set up a room and share a link in minutes. Powerful controls that never get in your way.',
  },
  {
    icon: Heart,
    title: 'Built for founders',
    desc: 'We obsess over the fundraising experience, because that is the moment that decides a company.',
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
          We help founders raise with confidence
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          VentureThrust is a secure virtual data room for fundraises and deals - share your documents with a single
          link, control exactly who gets in, and see who is truly engaged.
        </p>
      </section>

      {/* Story */}
      <section className="border-t border-gray-200">
        <div className="container mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Why we built it</h2>
          <div className="mt-6 space-y-5 text-[16px] leading-relaxed text-gray-600">
            <p>
              Raising capital means sending your most sensitive documents to people you are still getting to know. Yet
              most founders still do it with email attachments and shared drives - no control once it is sent, and no
              idea whether anyone actually read it.
            </p>
            <p>
              We thought that was backwards. The moment your future depends on a document, you should know exactly where
              it went, who opened it, and what held their attention - and you should be able to pull access back the
              instant a conversation ends.
            </p>
            <p>
              So we built VentureThrust: a data room that is as easy as sharing a link, as secure as the documents
              deserve, and honest about what is happening after you hit send. It is the tool we wish we had on the other
              side of the table.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-gray-200 bg-gray-50">
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
            Run your next raise on VentureThrust
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
