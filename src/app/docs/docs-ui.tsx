/**
 * Shared building blocks for the documentation pages. Server components
 * only: plain semantic HTML with consistent styling, so every docs page
 * reads identically and the full content ships in the initial HTML for
 * search engines and AI assistants.
 */

import Link from 'next/link';

const BLUE = '#4285F4';

export const DOCS_NAV = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/deal-watch', label: 'Deal Watch' },
  { href: '/docs/data-rooms', label: 'Data rooms' },
  { href: '/docs/document-analytics', label: 'Document analytics' },
  { href: '/docs/e-signatures-and-file-requests', label: 'E-signatures and file requests' },
];

export function DocsNav({ current }: { current: string }) {
  return (
    <nav aria-label="Documentation" className="flex flex-wrap gap-x-5 gap-y-2 border-b border-gray-200 pb-4 text-sm">
      {DOCS_NAV.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            l.href === current
              ? 'font-semibold'
              : 'text-gray-500 transition-colors hover:text-gray-900'
          }
          style={l.href === current ? { color: BLUE } : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function DocTitle({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  return (
    <header className="mt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: BLUE }}>
        {kicker}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">{lead}</p>
    </header>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>
      <div className="mt-4 max-w-3xl space-y-4">{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-gray-700">{children}</p>;
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-gray-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-gray-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  );
}

export function DocTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-gray-300">
            {head.map((h) => (
              <th key={h} className="py-2.5 pr-4 align-top text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 align-top">
              {r.map((c, j) => (
                <td key={j} className={`py-2.5 pr-4 leading-relaxed ${j === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FAQ({ items }: { items: [string, string][] }) {
  return (
    <div className="divide-y divide-gray-200">
      {items.map(([q, a]) => (
        <div key={q} className="py-4">
          <h3 className="text-[15px] font-semibold text-gray-900">{q}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{a}</p>
        </div>
      ))}
    </div>
  );
}

export function KeyTakeaways({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-gray-800">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BLUE }} />
          {t}
        </li>
      ))}
    </ul>
  );
}

/** FAQPage JSON-LD from the same items rendered by <FAQ>, so the
 *  structured data can never drift from the visible answers. */
export function faqJsonLd(pageUrl: string, items: [string, string][]) {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function articleJsonLd(pageUrl: string, headline: string, description: string) {
  return {
    '@type': 'TechArticle',
    '@id': `${pageUrl}#article`,
    headline,
    description,
    url: pageUrl,
    author: { '@id': 'https://www.venturethrust.com/#org' },
    publisher: { '@id': 'https://www.venturethrust.com/#org' },
    about: { '@id': 'https://www.venturethrust.com/#app' },
  };
}

export function JsonLd({ graph }: { graph: object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
      }}
    />
  );
}
