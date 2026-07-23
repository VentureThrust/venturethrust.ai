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

const URL = 'https://www.venturethrust.com/docs/document-analytics';

export const metadata: Metadata = {
  title: 'Document analytics documentation · Who read what, honestly measured | VentureThrust',
  description:
    'How VentureThrust document tracking works: per visitor, per page, per second engagement analytics for decks and videos, counted only while the document is actually on screen.',
  alternates: { canonical: '/docs/document-analytics' },
  openGraph: {
    type: 'article',
    url: URL,
    siteName: 'VentureThrust',
    title: 'Document analytics, documented: who read what, for how long',
    description:
      'Page by page attention, video watch segments and replays, live visitor presence, and why VentureThrust only counts time the document is actually on screen.',
  },
};

const FAQ_ITEMS: [string, string][] = [
  [
    'What does VentureThrust track when someone opens my document?',
    'Who opened it (their email when the link requires one), when, from what device and location, which pages they viewed, how long they spent on each page, and for videos, exactly which seconds they watched and replayed. Owners see it live and in history.',
  ],
  [
    'Is the time data honest if someone leaves a tab open?',
    'Yes, and this is deliberate: the clock only runs while the document is actually visible on screen. Switch tabs or minimize the window and counting pauses. A 40 minute open tab does not become 40 minutes of reading. Decisions built on inflated numbers are bad decisions.',
  ],
  [
    'Can I see video engagement too?',
    'Yes. For video files you see how much was watched, from which second a viewer started, which segments they replayed, and how many viewers finished it. If every investor stops your demo video at the same moment, you know exactly what to fix.',
  ],
  [
    'Why does my analytics page look empty?',
    'Almost always because the link does not require an email, so visitors are anonymous. Turn on email capture and every visit gets an identity.',
  ],
  [
    'How do founders use this during a raise?',
    'The analytics rank your pipeline for you. An investor who read all fifteen pages twice and lingered on the financials is engaged; one who stopped at page three is not. Founders follow up with the first group while the interest is fresh, instead of guessing.',
  ],
];

const jsonLd = [
  articleJsonLd(
    URL,
    'VentureThrust document analytics: who read what, honestly measured',
    'Per visitor, per page, per second engagement tracking for documents and videos, counted only while content is actually on screen.',
  ),
  faqJsonLd(URL, FAQ_ITEMS),
];

export default function DocumentAnalyticsDocsPage() {
  return (
    <article>
      <JsonLd graph={jsonLd} />
      <DocsNav current="/docs/document-analytics" />
      <DocTitle
        kicker="Documentation · Document analytics"
        title="Document analytics: know exactly who read what"
        lead="Every visit to your documents becomes structured knowledge: who opened them, which pages held their attention, which seconds of your video they replayed. Measured honestly, counted only while the content is actually on screen, so the numbers you act on are real."
      />

      <Section title="Overview">
        <P>
          When you share through VentureThrust, the document reports back. Owners see every
          visit per visitor: pages viewed, time per page, device, location, and live presence
          while someone is inside the room. Videos report second by second watch behavior,
          including replays. The result is document tracking that answers the question every
          sender actually has: did they read it, and what did they care about?
        </P>
      </Section>

      <Section title="Who is it for?">
        <UL
          items={[
            'Founders who need to know which investors are genuinely engaging with the pitch deck during startup fundraising.',
            'Sales teams deciding which prospect deserves the next call, based on reading behavior instead of hope.',
            'Anyone sharing a long document who wants to know which sections land and where readers stop.',
            'Deal Watch investors, indirectly: the same living documents that produce these analytics are what the three watching layers monitor for milestones.',
          ]}
        />
      </Section>

      <Section title="The problem">
        <P>
          After you send a document, everything you do next depends on information you do not
          have. Should you follow up today or next week? Was the silence disinterest, or did
          your email land in spam? Which of the twenty investors deserves your limited time?
          Senders guess, and guessing costs deals: following up too late with the engaged
          reader, and wasting a week chasing someone who never opened the file at all.
        </P>
      </Section>

      <Section title="Why existing approaches fail">
        <DocTable
          head={['Approach', 'Why it breaks down']}
          rows={[
            ['Email read receipts', 'Widely blocked, and an opened email says nothing about the attachment.'],
            ['Link shorteners and pixels', 'Count clicks, not reading. One click could be a bounce or an hour of study.'],
            ['Asking the recipient', 'People are polite. Everyone says they will read it this week.'],
            [
              'Tools that count open tab time',
              'A tab left open over lunch reads as deep engagement. Inflated numbers are worse than no numbers, because you act on them.',
            ],
          ]}
        />
      </Section>

      <Section title="Workflow">
        <OL
          items={[
            'Share a document or data room with email capture on, so every visitor has an identity.',
            'Open Analytics for the space or link. Visits appear in real time as they happen.',
            'Review per visitor engagement: total time, per page attention, completion, device and location, and video watch segments where relevant.',
            'Act on it: prioritize the deep readers for follow-up, fix the page where everyone stops, and revisit cold links.',
          ]}
        />
      </Section>

      <Section title="Benefits">
        <UL
          items={[
            'Prioritized follow-up: your pipeline ranks itself by real reading behavior.',
            'Better materials: per page attention shows exactly where a deck loses its audience.',
            'Honest numbers: eyes-on-screen counting means the data reflects attention, not open tabs.',
            'Proof and accountability: for diligence and legal work, the audit trail shows precisely who accessed what and when.',
          ]}
        />
      </Section>

      <Section title="Real-world example">
        <P>
          A founder sends her deck to a fund partner on Tuesday. Wednesday morning the analytics
          show a 6 minute 48 second visit covering 92 percent of the deck, with the longest stop
          on the traction page, and the pitch video watched to the end plus a replay of the
          product segment. She follows up Wednesday afternoon referencing traction, and gets a
          meeting. A second investor shows a 40 second visit that ended on page three. She does
          not spend her week on him, and the deck&apos;s page three gets rewritten before the
          next send.
        </P>
      </Section>

      <Section title="Best practices">
        <UL
          items={[
            'Require an email on every link you care about; anonymous analytics cannot guide follow-up.',
            'Follow up within a day of a deep read. Attention decays fast.',
            'Watch where readers stop, not just how long they stay. The exit page is the page to fix.',
            'Use one link per audience so the analytics separate cleanly.',
          ]}
        />
      </Section>

      <Section title="Frequently asked questions">
        <FAQ items={FAQ_ITEMS} />
      </Section>

      <Section title="Key takeaways">
        <KeyTakeaways
          items={[
            'Every share becomes measurable: who opened it, what they read, how long, on what device.',
            'Video analytics go to the second, including replays and drop-off points.',
            'Time only counts while the document is actually on screen, so the numbers are honest.',
            'Engagement data turns follow-up from guessing into scheduling.',
          ]}
        />
      </Section>
    </article>
  );
}
