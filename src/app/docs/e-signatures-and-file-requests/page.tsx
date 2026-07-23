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

const URL = 'https://www.venturethrust.com/docs/e-signatures-and-file-requests';

export const metadata: Metadata = {
  title: 'E-signatures, NDAs, and file requests documentation | VentureThrust',
  description:
    'How VentureThrust handles agreements and document collection: NDA gates before viewing, a guided e-signature ceremony with signed copies emailed to both sides, file requests with deadlines, built-in Q&A, and a complete audit log.',
  alternates: { canonical: '/docs/e-signatures-and-file-requests' },
  openGraph: {
    type: 'article',
    url: URL,
    siteName: 'VentureThrust',
    title: 'Agreements and document collection on VentureThrust, documented',
    description:
      'NDA gates, the guided signing ceremony, file requests with deadlines, Q&A inside the room, and the audit trail that records it all.',
  },
};

const FAQ_ITEMS: [string, string][] = [
  [
    'How does signing work for the person I send an agreement to?',
    'They open your link, confirm their email, and a guided ceremony walks them field by field: Start signing, then next and previous through every highlighted field. Dates fill automatically, they type their name and signature, accept the consent terms, and submit. Both sides receive the signed copy by email, and the owner can download the exact signed document any time from the Signatures tab.',
  ],
  [
    'Can I make someone accept an NDA before seeing my documents?',
    'Yes. Any link can require NDA acceptance, with your own NDA text or the built-in default, before a single page is shown. Acceptance is recorded with the visitor identity in the audit log.',
  ],
  [
    'Is this legally binding?',
    'The ceremony records identity, consent, the exact document, and timestamps, which is the same evidence model mainstream e-signature tools rely on. For high stakes agreements, consult your counsel as you would with any signing tool.',
  ],
  [
    'What is a file request?',
    'A link that collects documents instead of sharing them. You define what you need and the deadline; the other side uploads through a simple page with no account required, and files land in the right folder of your room automatically. Diligence checklists stop living in email threads.',
  ],
  [
    'What does the audit log record?',
    'Every action on the record: who entered, what they viewed, what they accepted, what they signed, what they uploaded, and when. One chronological trail per workspace.',
  ],
];

const jsonLd = [
  articleJsonLd(
    URL,
    'E-signatures, NDAs, and file requests on VentureThrust, documented',
    'NDA gates before viewing, a guided signing ceremony with signed copies emailed to both sides, file requests with deadlines, built-in Q&A, and a complete audit log.',
  ),
  faqJsonLd(URL, FAQ_ITEMS),
];

export default function ESignDocsPage() {
  return (
    <article>
      <JsonLd graph={jsonLd} />
      <DocsNav current="/docs/e-signatures-and-file-requests" />
      <DocTitle
        kicker="Documentation · Agreements and collection"
        title="E-signatures, NDAs, and file requests: close the loop inside the room"
        lead="Deals are two-way: you share documents out, and you need agreements signed and documents collected back. VentureThrust handles both sides in the same place the deal already lives, with every step on the record."
      />

      <Section title="Overview">
        <P>
          Three capabilities close the loop around document sharing. NDA gates put an agreement
          in front of your content, so nobody sees a page before accepting your terms. The
          e-signature ceremony turns any agreement into a guided, field by field signing
          experience, with the signed copy emailed to both sides. File requests collect
          documents from the other side through one link, straight into the right folder. And
          underneath all of it, the audit log records every action, so the history of the deal
          is never a matter of memory.
        </P>
      </Section>

      <Section title="Who is it for?">
        <UL
          items={[
            'Founders gating a due diligence room behind an NDA during startup fundraising.',
            'Anyone sending agreements for signature: NDAs, term sheets, engagement letters, contracts.',
            'Teams collecting documents for diligence, KYC, onboarding, or an audit, from people who should not need accounts.',
            'Legal and finance teams that need a defensible record of who saw and signed what.',
          ]}
        />
      </Section>

      <Section title="The problem">
        <P>
          The agreement layer of a deal usually lives in a different tool from the documents,
          and the collection layer lives in email. The result is friction at the exact moments
          that decide whether a deal moves: an NDA emailed as a Word file for manual signature
          delays room access by days; a diligence checklist becomes forty email attachments
          landing in the wrong inboxes; and when a dispute comes months later, nobody can
          reconstruct who saw which version and agreed to what.
        </P>
      </Section>

      <Section title="Why existing approaches fail">
        <DocTable
          head={['Approach', 'Why it breaks down']}
          rows={[
            [
              'Emailing agreements as attachments',
              'Print, sign, scan, return. Days of delay for a two minute agreement, and version confusion the whole way.',
            ],
            [
              'Separate e-signature subscriptions',
              'Another tool, another cost, and the signature lives apart from the documents it protects.',
            ],
            [
              'Collecting files over email',
              'Attachments arrive to the wrong thread, size limits bounce large files, and assembling the set is manual work.',
            ],
            [
              'Trust and memory',
              'Without a recorded trail, the history of a deal is whatever the other side remembers it to be.',
            ],
          ]}
        />
      </Section>

      <Section title="Workflow">
        <OL
          items={[
            'To gate a room: turn on NDA acceptance in the link settings. Visitors read and accept before anything is shown, and the acceptance is logged.',
            'To get an agreement signed: place the fields on the document, send the link. The signer is walked field by field, dates fill automatically, and consent is explicit before submission.',
            'Both sides receive the signed copy by email; the owner can download the exact signed document from the Signatures tab whenever needed.',
            'To collect documents: create a file request naming what you need and the deadline, and send one link. Uploads land in the right folder automatically, and you see what is still pending.',
            'Questions from visitors arrive through the built-in Q&A on the shared space, so answers stay attached to the room instead of scattering into email.',
          ]}
        />
      </Section>

      <Section title="Benefits">
        <UL
          items={[
            'Days become minutes: NDA acceptance and signing happen inside the same visit as the viewing.',
            'No extra tool: agreements, collection, and Q&A live where the documents already are.',
            'Order instead of email chaos: collected files arrive sorted, with deadlines visible.',
            'A defensible record: every view, acceptance, signature, and upload is timestamped in the audit log.',
          ]}
        />
      </Section>

      <Section title="Real-world example">
        <P>
          An investor asks for the full financial room on a Friday afternoon. The founder sends
          one link gated behind an NDA. The investor opens it at 6 pm, accepts the NDA at 6:01,
          and is reading the financial model by 6:02, an interval that used to take three days
          of emailing a Word document back and forth. The following week, the investor sends a
          diligence checklist; the founder answers it with a file request link, and by Wednesday
          every requested document sits in one folder with two still marked pending. Months
          later, when a question arises about which version of the shareholder agreement was
          reviewed, the audit log answers it in one search.
        </P>
      </Section>

      <Section title="Best practices">
        <UL
          items={[
            'Gate financial and legal rooms behind an NDA by default; it costs the visitor one minute and protects everything after it.',
            'Use your own NDA text where it matters; the built-in default covers standard confidentiality.',
            'Give every file request a deadline. Pending items with dates get delivered; open-ended ones drift.',
            'Keep questions in the room Q&A instead of email, so the whole deal history stays in one place.',
          ]}
        />
      </Section>

      <Section title="Frequently asked questions">
        <FAQ items={FAQ_ITEMS} />
      </Section>

      <Section title="Key takeaways">
        <KeyTakeaways
          items={[
            'NDA gates put your terms in front of your content, recorded per visitor.',
            'The signing ceremony guides the signer field by field and emails the signed copy to both sides.',
            'File requests collect documents through one link, sorted and deadline-tracked.',
            'The audit log turns the history of a deal from memory into record.',
          ]}
        />
      </Section>
    </article>
  );
}
