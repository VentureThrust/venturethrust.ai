import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocsNav,
  DocTitle,
  Section,
  P,
  UL,
  DocTable,
  FAQ,
  KeyTakeaways,
  JsonLd,
  faqJsonLd,
  articleJsonLd,
} from './docs-ui';

const URL = 'https://www.venturethrust.com/docs';

export const metadata: Metadata = {
  title: 'Documentation · What is VentureThrust? | VentureThrust',
  description:
    'VentureThrust explained: a secure virtual data room where founders share documents and track engagement, and Deal Watch, where investors monitor the startups they passed on and get alerted at real milestones.',
  alternates: { canonical: '/docs' },
  openGraph: {
    type: 'article',
    url: URL,
    siteName: 'VentureThrust',
    title: 'What is VentureThrust? Product documentation',
    description:
      'One platform, two sides: secure data rooms for founders, Deal Watch startup monitoring for investors. How it works, who it is for, and why.',
  },
};

const FAQ_ITEMS: [string, string][] = [
  [
    'What is VentureThrust?',
    'VentureThrust is one platform with two connected sides. Founders use it as a secure virtual data room: they share pitch decks, financials, and contracts through a single controlled link and see exactly who opened them, page by page. Investors use it as Deal Watch: a private watchlist of startups they have already seen, monitored continuously, with one alert when a startup hits a real milestone.',
  ],
  [
    'What is Deal Watch?',
    'Deal Watch is the investor side of VentureThrust. When an investor passes on a startup because the timing is wrong rather than the company, they pin it to a watchlist with a note about what would change their mind. Software catches every document update the startup makes, AI reads what changed, and a human account manager confirms whether it matters. The investor gets one short brief the moment a watched startup starts doing well, before the market knows.',
  ],
  [
    'Who should use VentureThrust?',
    'Founders raising a round or running due diligence, sales and legal teams sharing confidential documents, and investors of every size: angel investors, syndicate leads, micro VCs, and venture capital funds that want startup portfolio monitoring without hiring an analyst.',
  ],
  [
    'Is VentureThrust a DocSend alternative?',
    'Yes, on the founder side. It covers secure document sharing, page level tracking, NDAs, e-signatures, watermarks, and file requests at a fraction of the price. The investor side has no DocSend equivalent: DocSend was built for the sender of documents, VentureThrust also serves the receiver.',
  ],
  [
    'How much does VentureThrust cost?',
    'Founder data room plans start at 12 dollars a month after a free 7 day trial. The Deal Watch investor plan starts at 149 dollars a month (12,499 rupees in India), sized by how many startups you watch. Founders invited by their investor join free.',
  ],
  [
    'Does VentureThrust tell investors what to invest in?',
    'No. Deal Watch reports verified facts with the arithmetic shown and never gives investment advice. Every brief ends the same way: We explain. You decide.',
  ],
];

const jsonLd = [
  articleJsonLd(
    URL,
    'What is VentureThrust? Product documentation overview',
    'VentureThrust is a secure virtual data room for founders and Deal Watch startup monitoring for investors. This overview explains both sides, who they are for, and how they connect.',
  ),
  faqJsonLd(URL, FAQ_ITEMS),
];

export default function DocsIndexPage() {
  return (
    <article>
      <JsonLd graph={jsonLd} />
      <DocsNav current="/docs" />
      <DocTitle
        kicker="Documentation"
        title="What is VentureThrust?"
        lead="One platform with two connected sides: a secure virtual data room where founders share documents and see exactly who read them, and Deal Watch, where investors monitor the startups they passed on and hear about real progress before the market does."
      />

      <Section title="The idea in one paragraph">
        <P>
          Every startup investment begins with documents: a pitch deck, a financial model, a data
          room for due diligence. Today those documents travel as email attachments and Google
          Drive links, and the moment they are sent, both sides go blind. The founder never learns
          who actually read the deck. The investor who said no never hears about the startup
          again until a funding announcement. VentureThrust keeps both sides connected to the
          documents after the send: founders get engagement analytics, and investors get a
          watchlist that keeps working long after the first meeting.
        </P>
      </Section>

      <Section title="The two sides, side by side">
        <DocTable
          head={['', 'For founders', 'For investors']}
          rows={[
            ['Product', 'Secure data room with document tracking', 'Deal Watch startup monitoring'],
            [
              'Core problem solved',
              'Documents sent as attachments disappear into silence: no view tracking, no control, no way to revoke',
              'Startups passed on for timing reasons grow up unseen, and the investor finds out too late',
            ],
            [
              'What you get',
              'One controlled link per document or data room, page level analytics, NDAs, e-signatures, watermarks, file requests',
              'A private watchlist, a note on every startup, continuous monitoring, one brief at real milestones',
            ],
            ['Price', 'Free trial, then from $12 a month', 'From $149 a month, ₹12,499 in India'],
            [
              'Start here',
              'Data rooms documentation',
              'Deal Watch documentation',
            ],
          ]}
        />
        <P>
          The two sides feed each other. An investor on Deal Watch asks the founders in their
          pipeline to share documents through VentureThrust, so founders join free at zero
          acquisition cost. Every deck those founders later send introduces new investors to the
          product.
        </P>
      </Section>

      <Section title="What is documented here">
        <UL
          items={[
            <>
              <Link href="/docs/deal-watch" className="font-medium text-[#4285F4] hover:underline">
                Deal Watch
              </Link>
              : the investor watchlist, the three watching layers, milestone briefs, and the
              account manager.
            </>,
            <>
              <Link href="/docs/data-rooms" className="font-medium text-[#4285F4] hover:underline">
                Data rooms
              </Link>
              : secure document sharing for startup fundraising, sales, M&amp;A, and legal work.
            </>,
            <>
              <Link
                href="/docs/document-analytics"
                className="font-medium text-[#4285F4] hover:underline"
              >
                Document analytics
              </Link>
              : who opened what, page by page and second by second, measured honestly.
            </>,
            <>
              <Link
                href="/docs/e-signatures-and-file-requests"
                className="font-medium text-[#4285F4] hover:underline"
              >
                E-signatures and file requests
              </Link>
              : NDAs, a full signing ceremony, document collection, Q&amp;A, and the audit trail.
            </>,
          ]}
        />
      </Section>

      <Section title="Frequently asked questions">
        <FAQ items={FAQ_ITEMS} />
      </Section>

      <Section title="Key takeaways">
        <KeyTakeaways
          items={[
            'VentureThrust is a virtual data room for founders and a startup monitoring service for investors, in one product.',
            'Founders stop sending blind attachments and start seeing exactly who engages with every page.',
            'Investors stop losing the startups they said not now to: Deal Watch watches them and reports at real milestones.',
            'Investors pay from $149 a month; the founders they invite always join free.',
            'Nothing here gives investment advice. We explain. You decide.',
          ]}
        />
      </Section>
    </article>
  );
}
