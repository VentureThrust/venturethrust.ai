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

const URL = 'https://www.venturethrust.com/docs/deal-watch';

export const metadata: Metadata = {
  title: 'Deal Watch documentation · Startup monitoring for investors | VentureThrust',
  description:
    'How Deal Watch works: investors pin the startups they passed on, three layers watch every document update, and one brief arrives the moment a startup hits a real milestone. Investment tracking without an analyst.',
  alternates: { canonical: '/docs/deal-watch' },
  openGraph: {
    type: 'article',
    url: URL,
    siteName: 'VentureThrust',
    title: 'Deal Watch: startup portfolio monitoring for investors, documented',
    description:
      'The watchlist, the note, the three watching layers, the milestone brief, and the account manager. The complete workflow.',
  },
};

const FAQ_ITEMS: [string, string][] = [
  [
    'Will I still miss deals with Deal Watch?',
    'Yes, and anyone promising zero misses is lying. A smoke detector does not stop fires; it stops you sleeping through one. With Deal Watch, every miss becomes a decision you made with the facts on time, never a deal you simply never heard about again.',
  ],
  [
    'How is Deal Watch different from a spreadsheet or CRM?',
    'A spreadsheet records what you typed into it and then waits for you to come back. It does not know the startup updated its financial model on Tuesday. Deal Watch is connected to the startup side: updates are caught the day they happen, read by AI, and confirmed by a human before you are told. A CRM tracks your activity; Deal Watch tracks the startup itself.',
  ],
  [
    'How is this different from hiring an analyst?',
    'An analyst looks at a startup once, when you ask, and costs a salary. Deal Watch keeps a standing watch on your whole list: software catches updates, AI reads changes, a human confirms significance. The human effort is spent only on moments that deserve it, which is why it costs a fraction of one hire.',
  ],
  [
    'Do founders know I am watching them?',
    'No. Watching is completely private. Founders never see who holds them on a watchlist, and there is no badge or notification on their side.',
  ],
  [
    'Does Deal Watch recommend investments?',
    'Never. Briefs report verified facts with the arithmetic shown, flag growth that looks temporary, and stop there. Every report ends the same way: We explain. You decide.',
  ],
  [
    'What exactly triggers an alert?',
    'A real milestone: a revenue jump, a marquee customer, a strong retention print, a funding round opening. The trigger is judged against your own note, so if you wrote that you want paying customers, the alert comes when paying customers arrive. Routine edits and cosmetic updates never reach you.',
  ],
  [
    'What if I want regular updates on one startup?',
    'Turn on the quarterly report for that startup, either in the add popup or later from your watchlist. It is a short digest: a growth table, charts, and a six line summary. Quarterly reports are only ever sent for startups where you asked.',
  ],
  [
    'What does Deal Watch cost?',
    'From $149 a month, ₹12,499 in India, sized by how many startups you watch. Founders you invite join free, always. Cancel any time.',
  ],
];

const jsonLd = [
  articleJsonLd(
    URL,
    'Deal Watch: startup monitoring for investors, documented',
    'The complete Deal Watch workflow: pinning startups to a watchlist, the three watching layers, milestone briefs, quarterly reports on request, and the human account manager.',
  ),
  faqJsonLd(URL, FAQ_ITEMS),
];

export default function DealWatchDocsPage() {
  return (
    <article>
      <JsonLd graph={jsonLd} />
      <DocsNav current="/docs/deal-watch" />
      <DocTitle
        kicker="Documentation · Deal Watch"
        title="Deal Watch: monitoring the startups you passed on"
        lead="Deal Watch helps investors track the startups they said not now to, without asking founders for updates and without checking anything manually. Software catches every document update, AI reads what changed, a human confirms it matters, and the investor gets one short brief the moment a startup hits a real milestone. The rest of the time: silence."
      />

      <Section title="Overview">
        <P>
          Deal Watch is a startup monitoring service built into VentureThrust. Instead of relying
          on scattered emails, spreadsheets, or LinkedIn checking, an investor pins the startups
          worth revisiting to a private watchlist, writes one note about what would change their
          mind, and stops thinking about them. When a watched startup makes real progress, the
          investor receives a structured brief showing exactly what changed since their pass,
          with verified numbers. It is investment tracking designed around one principle: the
          investor&apos;s attention is the most expensive thing they own.
        </P>
      </Section>

      <Section title="Who is it for?">
        <UL
          items={[
            'Angel investors who review dozens of pitch decks a month with no staff to track the interesting ones.',
            'Syndicate leads and micro VC funds whose deal pipeline has outgrown memory and spreadsheets.',
            'Venture capital funds that want startup portfolio monitoring for passed deals without dedicating an analyst to it.',
            'Any investor whose no often means not yet: too early, show me revenue, come back with a team.',
          ]}
        />
      </Section>

      <Section title="The problem">
        <P>
          Investors reject most of what they see, usually correctly. But some passes are timing
          calls, not verdicts: the company was simply too early. Those startups keep building
          after the meeting, and nobody on the investor side is watching. The investor finds out
          from a funding announcement, when the price has moved and the allocation is gone. Every
          investor has a version of this story. Bessemer Venture Partners publish theirs and call
          it the Anti-Portfolio. Mark Cuban calls passing on Uber his biggest miss: a decision
          that cost him roughly two billion dollars. In a business ruled by the power law, where
          one deal returns more than the rest of the portfolio combined, the miss is the most
          expensive mistake an investor can make. More expensive than any loss.
        </P>
      </Section>

      <Section title="Why existing approaches fail">
        <DocTable
          head={['Approach', 'Why it breaks down']}
          rows={[
            [
              'Spreadsheets and notes',
              'They record the past and wait. Nothing tells the spreadsheet the startup signed its first enterprise customer.',
            ],
            [
              'Asking founders for updates',
              'Founders send updates when raising, which is exactly when everyone else hears too. Between rounds, silence.',
            ],
            [
              'Checking LinkedIn and news',
              'Manual, unreliable, and mistimed. You check on Sunday, the milestone lands on Monday, and you do not look again for months.',
            ],
            [
              'Investor CRMs',
              'They track your own team’s activity: calls made, emails sent. They are blind to what the startup itself is doing.',
            ],
            [
              'Public signal tools',
              'They scrape headcount and web traffic. Public data means late data, and volume without a filter is noise.',
            ],
            [
              'Hiring an analyst',
              'A junior analyst costs lakhs a year, looks at one company at a time, and only looks when asked.',
            ],
          ]}
        />
      </Section>

      <Section title="The solution">
        <P>
          Deal Watch sits where the truth lives: in the startup&apos;s own documents. Founders on
          VentureThrust maintain a living data room, the same one they use for fundraising and
          due diligence. When a watched founder updates anything, three layers act in sequence:
        </P>
        <OL
          items={[
            'Software catches the update the day it happens. No polling, no luck, no Sunday and Monday timing trap.',
            'AI reads what changed: a rewritten revenue page, a new contract, a new team slide, and separates substance from cosmetics.',
            'A named human account manager confirms whether it matters, judged against the note you wrote when you pinned the startup. Most updates die here. That is the point.',
          ]}
        />
        <P>
          Only when all three layers agree does anything reach you: one short brief, with
          verified numbers and the arithmetic shown, before the market knows. Deal Watch never
          says invest. Every brief ends with the same six words: We explain. You decide.
        </P>
      </Section>

      <Section title="Workflow">
        <OL
          items={[
            'A founder shares a pitch deck or data room with you. It lands in your Shared with me inbox, with tabs for pending, opened, and watchlisted items.',
            'You review it and decide the timing is wrong. On the deck itself, you click Add to Watchlist.',
            'A popup asks for one optional note: why you passed and what would change your mind. For example: too early, I want paying customers and one enterprise contract. You can also tick a checkbox to receive quarterly reports on this startup.',
            'That is the entire setup. Your account manager is assigned automatically, and the three layers start watching.',
            'Months later, the startup crosses the milestone from your note. You receive a priority brief: what changed since your pass, metric by metric, verified against the live documents.',
            'You decide what to do with it: reconnect with the founder, request a deeper look from your account manager, or pass again with current facts.',
          ]}
        />
      </Section>

      <Section title="Benefits">
        <UL
          items={[
            'Zero ongoing effort: pin it, forget it. No checking, no follow-up calendars, no update-chasing emails to founders.',
            'Timing advantage: you hear about progress when it happens in the documents, not when a funding announcement makes it public.',
            'Personal relevance: alerts are judged against your own note, so you are only told about the things you said you cared about.',
            'Analyst economics without the analyst: a standing watch on your whole list for a fraction of one junior salary.',
            'Protected attention: no digests, no feeds, no weekly emails. If you hear from Deal Watch, a human decided it was worth your time.',
          ]}
        />
      </Section>

      <Section title="Real-world example">
        <P>
          An angel investor meets BeanBridge, a B2B marketplace where cafes buy coffee beans
          directly from estates, in March. Monthly recurring revenue is 4.2 lakh rupees. The
          investor likes the team but passes: too early, and repeat purchase behavior is
          unproven. They pin BeanBridge with the note: want repeat orders above 50 percent and
          one chain under contract. For four months, nothing arrives, because nothing report-worthy
          happened. In July, BeanBridge updates its data room: revenue is now 11.8 lakh, repeat
          orders are 61 percent, and three cafe chains signed annual contracts. Software catches
          the update at 09:41, AI reads the changes at 09:42, the account manager confirms at
          11:05 that this is exactly the milestone from the note, and the brief lands at 11:20.
          The investor reconnects with the founder that afternoon, months before the round is
          public news.
        </P>
      </Section>

      <Section title="Best practices">
        <UL
          items={[
            'Write the note every time. One honest sentence about why you passed turns generic monitoring into personal monitoring.',
            'Pin generously. The cost of watching one more startup is zero effort; the cost of not watching the wrong one is the whole point of this product.',
            'Reserve quarterly reports for startups you are actively considering. The default silence is a feature, not a gap.',
            'When a brief arrives, act on it the same week. The value of early information decays fast.',
            'Ask your account manager for a one-off report whenever you need a status check between milestones.',
          ]}
        />
      </Section>

      <Section title="Frequently asked questions">
        <FAQ items={FAQ_ITEMS} />
      </Section>

      <Section title="Deal Watch compared with alternatives">
        <DocTable
          head={['', 'Deal Watch', 'Spreadsheet', 'CRM', 'Signal tools', 'Own analyst']}
          rows={[
            ['Sees inside the deal documents', 'Yes', 'No', 'No', 'No', 'Only when asked'],
            ['Catches updates the day they happen', 'Yes', 'No', 'No', 'Late, from public data', 'No'],
            ['Human judgment on every alert', 'Yes', 'No', 'No', 'No', 'Yes'],
            ['Effort required from the investor', 'One click and a note', 'Constant upkeep', 'Constant upkeep', 'Reading noise', 'Managing a hire'],
            ['Monthly cost', 'From $149', 'Free but blind', '$60 to $200 per seat', '$500 and up', 'A salary'],
          ]}
        />
      </Section>

      <Section title="Key takeaways">
        <KeyTakeaways
          items={[
            'Deal Watch turns a not now into a monitored position instead of a forgotten one.',
            'Three layers watch so the investor never has to: software catches, AI reads, a human confirms.',
            'One brief at real milestones, judged against the investor’s own note, before the market knows.',
            'Silence between briefs is deliberate: it is what protected attention looks like.',
            'It reports facts with the arithmetic shown and never gives investment advice. We explain. You decide.',
          ]}
        />
      </Section>
    </article>
  );
}
