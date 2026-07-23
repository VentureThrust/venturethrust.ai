import type { Metadata } from 'next';
import {
  DocsNav,
  DocTitle,
  Section,
  P,
  UL,
  OL,
  DocTable,
  FAQ,
  KeyTakeaways,
  JsonLd,
  faqJsonLd,
  articleJsonLd,
} from '../docs-ui';

const URL = 'https://www.venturethrust.com/docs/data-rooms';

export const metadata: Metadata = {
  title: 'Data rooms documentation · Secure document sharing | VentureThrust',
  description:
    'How VentureThrust data rooms work: share pitch decks, financials, and contracts with one controlled link, gate access with email, password, NDA, or expiry, watermark every page, and revoke any time.',
  alternates: { canonical: '/docs/data-rooms' },
  openGraph: {
    type: 'article',
    url: URL,
    siteName: 'VentureThrust',
    title: 'VentureThrust data rooms, documented',
    description:
      'One controlled link instead of attachments: access gates, watermarks, view-only protection, and instant revoke for startup fundraising, sales, M&A, and legal work.',
  },
};

const FAQ_ITEMS: [string, string][] = [
  [
    'What is a virtual data room?',
    'A virtual data room is a secure online space for sharing confidential documents with outside parties: investors during startup fundraising, buyers during M&A due diligence, or counterparties in legal and sales work. Unlike email attachments or generic cloud drives, a data room controls who can see what, records every access, and can withdraw access at any time.',
  ],
  [
    'How is this different from Google Drive or Dropbox?',
    'Drive links are built for collaboration inside a team, not for controlled disclosure to outsiders. They offer no page level tracking, no watermarks, no NDA gate, no expiry, and once a file is downloaded you have lost it forever. A data room treats every viewer as an outsider by default and gives the owner proof of exactly what happened.',
  ],
  [
    'Can I take a document back after sending it?',
    'Yes. You share one controlled link, not the file itself. Turn the link off and access ends immediately, even for people who already opened it. You can also set an expiry date in advance or block downloads entirely so the document stays view-only.',
  ],
  [
    'Who sees my documents?',
    'Only the people you allow. Links can require an email, a passcode, an NDA acceptance, or a signature before anything is shown, and allow or block lists restrict entry to specific addresses. Documents are private by default and isolated per account.',
  ],
  [
    'What does a data room cost on VentureThrust?',
    'There is a free 7 day trial with no card required, and paid plans start at 12 dollars a month, roughly a tenth of what incumbent tools charge. Founders invited by their investor through Deal Watch use the data room free.',
  ],
];

const jsonLd = [
  articleJsonLd(
    URL,
    'VentureThrust data rooms: secure document sharing, documented',
    'How to share confidential documents through one controlled link with access gates, watermarks, page level tracking, and instant revoke.',
  ),
  faqJsonLd(URL, FAQ_ITEMS),
];

export default function DataRoomsDocsPage() {
  return (
    <article>
      <JsonLd graph={jsonLd} />
      <DocsNav current="/docs/data-rooms" />
      <DocTitle
        kicker="Documentation · Data rooms"
        title="Data rooms: share documents without losing control of them"
        lead="A VentureThrust data room replaces email attachments with one controlled link. You decide who can view, for how long, and on what terms. You see exactly what happens after you hit send, and you can take it all back at any moment."
      />

      <Section title="Overview">
        <P>
          A data room on VentureThrust is a secure space where you organize files and folders,
          then share them through links you control. Each link can carry its own rules: an email
          gate, a passcode, an NDA, a signature requirement, an expiry date, an allow or block
          list. Every page a visitor views is tracked, optionally watermarked with their email,
          and recorded in an audit trail. The document never stops being yours.
        </P>
      </Section>

      <Section title="Who is it for?">
        <UL
          items={[
            'Founders running startup fundraising: pitch deck first, full due diligence data room later, one link each.',
            'Sales teams sending proposals and contracts that should not float around as attachments.',
            'Legal and finance teams sharing agreements, cap tables, and audited statements with outside parties.',
            'M&A and real estate deal teams running structured document disclosure with multiple bidders.',
          ]}
        />
      </Section>

      <Section title="The problem">
        <P>
          The moment you email an attachment, you lose three things at once: control, knowledge,
          and recall. Control, because the file can be forwarded to anyone, anywhere, forever.
          Knowledge, because you have no idea whether the recipient opened it, skimmed it, or
          studied page seven for ten minutes. Recall, because there is no way to take it back
          when the deal dies or the terms change. For confidential material like financials,
          contracts, and cap tables, all three losses are serious, and for a founder mid-raise,
          the knowledge gap is the difference between following up with a hot investor today and
          a cold one next month.
        </P>
      </Section>

      <Section title="Why existing approaches fail">
        <DocTable
          head={['Approach', 'Why it breaks down']}
          rows={[
            [
              'Email attachments',
              'Unrevocable, untrackable, endlessly forwardable. The worst option for anything confidential.',
            ],
            [
              'Google Drive and Dropbox links',
              'Built for team collaboration, not controlled disclosure. No page tracking, no watermarks, no NDA gates, weak revoke.',
            ],
            [
              'WhatsApp and chat apps',
              'Instant, and instantly out of your hands. No identity, no record, no control.',
            ],
            [
              'Legacy enterprise VDRs',
              'Built and priced for billion dollar M&A. Setup takes days and pricing starts where a startup budget ends.',
            ],
            [
              'DocSend and similar tools',
              'Closest in spirit, but several times the price, and nothing on the investor side of the same documents.',
            ],
          ]}
        />
      </Section>

      <Section title="Workflow">
        <OL
          items={[
            'Create a space and add files and folders, or start from a template such as a fundraising data room.',
            'Open Share and set the rules for this audience: email required, passcode, NDA, signature, expiry date, allow or block list, download blocking, watermarks.',
            'Copy the link and send it anywhere: email, WhatsApp, LinkedIn. The rules travel with the link.',
            'Watch the analytics as visitors open it: who, when, which pages, for how long, live.',
            'Adjust at any time: revoke a link, change its gates, or send a personal link to one investor by email so their visits are attributed automatically.',
          ]}
        />
      </Section>

      <Section title="Benefits">
        <UL
          items={[
            'One source of truth: update the file in the room and every link now shows the current version.',
            'Deal intelligence: page level engagement shows who is serious, so you follow up while interest is high.',
            'Real security: encryption in transit and at rest, hashed passcodes, watermarks tied to the viewer, view-only protection, and a complete audit trail.',
            'Instant recall: one switch ends all access, even for people who already opened the link.',
            'Startup pricing: from $12 a month instead of enterprise VDR contracts.',
          ]}
        />
      </Section>

      <Section title="Real-world example">
        <P>
          A founder raising a seed round shares one link to her deck with twenty investors. The
          analytics show that twelve opened it, three read every page twice, and one spent four
          minutes on the financial model page. She prioritizes those four for follow-up and
          opens her full due diligence room, gated behind an NDA, only for the two who ask for
          numbers. When one fund goes quiet, she revokes their link. Nothing she shared is
          floating in anyone&apos;s inbox, and she spent her week on the four investors who were
          actually reading instead of the sixteen who were not.
        </P>
      </Section>

      <Section title="Best practices">
        <UL
          items={[
            'One link per audience. Separate links for investors, advisors, and buyers make analytics readable and revoking painless.',
            'Always require an email. Anonymous views produce anonymous analytics.',
            'Gate sensitive rooms behind an NDA and turn on watermarks for financials and cap tables.',
            'Set expiry dates on anything shared during a live negotiation.',
            'Keep the room alive after the raise: a maintained data room is what lets Deal Watch investors see your progress the day it happens.',
          ]}
        />
      </Section>

      <Section title="Frequently asked questions">
        <FAQ items={FAQ_ITEMS} />
      </Section>

      <Section title="Key takeaways">
        <KeyTakeaways
          items={[
            'Share one controlled link instead of attachments you can never take back.',
            'Gate access with email, passcode, NDA, signature, expiry, and allow or block lists.',
            'See who read what, page by page, and follow up while interest is real.',
            'Revoke everything instantly when circumstances change.',
            'Enterprise grade controls at startup pricing, from $12 a month.',
          ]}
        />
      </Section>
    </article>
  );
}
