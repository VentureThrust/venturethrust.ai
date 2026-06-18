import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowRight, Building2, Users, BarChart3, Droplets, History, FolderTree } from 'lucide-react';

export const metadata = {
  title: 'Data room for real estate · VentureThrust',
  description:
    'A secure data room for real estate deals. Share property documents, financials, and contracts with buyers, lenders, and partners, control access per party, and see who is engaged.',
  keywords: [
    'data room for real estate',
    'real estate data room',
    'property document sharing',
    'real estate deal room',
    'commercial real estate data room',
    'secure data room',
  ],
  alternates: { canonical: '/data-room-for-real-estate' },
};

const BLUE = '#4285F4';

const POINTS = [
  { icon: FolderTree, title: 'Organize the deal', desc: 'Title docs, financials, leases, and surveys in clear folders buyers can navigate fast.' },
  { icon: Users, title: 'Access per party', desc: 'Give each buyer, lender, or broker their own link, with allow lists and instant revoke.' },
  { icon: BarChart3, title: 'See who is serious', desc: 'Track who opened the package and what they spent time on, so you know the real interest.' },
  { icon: Droplets, title: 'Watermark every page', desc: 'Tie each page to the viewer to deter forwarding of sensitive financials.' },
  { icon: History, title: 'Audit trail', desc: 'A complete record of who saw what and when, through to close.' },
  { icon: Building2, title: 'One link, no attachments', desc: 'Send a single secure link instead of huge email attachments.' },
];

export default function RealEstateDataRoomPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>Real estate</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">A secure data room for real estate deals</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Share property documents, financials, and contracts with buyers, lenders, and partners
          through one secure link, and see exactly who is engaged.
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
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Built for property deals</h2>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Close your next property deal faster</h2>
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
