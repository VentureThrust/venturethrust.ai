import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FoldersProvider } from '@/lib/folder-provider';
import NextTopLoader from 'nextjs-toploader';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ScreenGuard } from '@/components/screen-guard';
import { DisableContextMenu } from '@/components/disable-context-menu';

// Inter - the closest free match to DocSend's UI font (Atlas Grotesk).
// Self-hosted by next/font (downloaded at build, served from our own domain),
// so there's no runtime Google Fonts dependency or CSP issue. Exposes
// --font-inter, which every Tailwind font utility resolves to.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// Space Grotesk - the closest free match to DocSend's heading font (Sharp Grotesk).
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.venturethrust.com'),
  title: 'VentureThrust · Secure Data Room to Share & Track Documents',
  description:
    'A secure virtual data room to share your pitch deck, financials, and contracts with one link, and see exactly who opened them and which pages they read. The affordable DocSend alternative for fundraising, sales, and M&A.',
  keywords: [
    'data room',
    'virtual data room',
    'secure data room',
    'VDR',
    'DocSend alternative',
    'affordable data room',
    'share documents securely',
    'document tracking',
    'track who views your documents',
    'see who opened my pitch deck',
    'pitch deck tracking',
    'know who read your document',
    'fundraising data room',
    'M&A data room',
    'deal room',
    'sales document sharing',
  ],
  applicationName: 'VentureThrust',
  creator: 'VentureThrust',
  publisher: 'VentureThrust',
  openGraph: {
    type: 'website',
    url: 'https://www.venturethrust.com',
    siteName: 'VentureThrust',
    title: 'VentureThrust · Secure Data Room to Share & Track Documents',
    description:
      'Share documents with one secure link and see exactly who opened them and what they read. The affordable DocSend alternative for fundraising, sales, and M&A.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VentureThrust · Secure Data Room to Share & Track Documents',
    description:
      'Share documents with one secure link and see exactly who opened them and what they read. The affordable DocSend alternative.',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

// Structured data so search engines and AI assistants can understand the
// product: the organization, the app, and both sides of the pricing
// (founder data room plans from $12, Deal Watch investor plans from $149).
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.venturethrust.com/#org',
      name: 'VentureThrust',
      url: 'https://www.venturethrust.com',
      logo: 'https://www.venturethrust.com/logo.svg',
      email: 'info@venturethrust.com',
      description:
        'VentureThrust makes secure data rooms for founders and Deal Watch, a watchlist service that alerts investors the moment a startup they passed on hits a real milestone.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.venturethrust.com/#app',
      name: 'VentureThrust',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://www.venturethrust.com',
      publisher: { '@id': 'https://www.venturethrust.com/#org' },
      description:
        'A secure virtual data room to share documents and see exactly who opened them and which pages they read, plus Deal Watch: investors pin the startups they passed on and get one brief the moment one starts doing well.',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '12',
        highPrice: '149',
        priceCurrency: 'USD',
        offerCount: '4',
      },
      featureList: [
        'Secure data rooms with one-link sharing',
        'Page-level document analytics',
        'NDA and e-signatures',
        'Dynamic watermarks and access controls',
        'File requests and audit trail',
        'Deal Watch investor watchlist with human account manager',
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Geist - Vercel's open-source geometric grotesk (closest free match to
  // DocSend's Sharp Grotesk). Self-hosted via next/font so it ALWAYS loads -
  // no Google Fonts network dependency, no CSP/blocked fallback to a system
  // font. GeistSans.variable defines --font-geist-sans, which every Tailwind
  // font utility resolves to (see tailwind.config.ts).
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Top-of-page progress bar - shows instant feedback for every
            navigation event. Massive perceived-perf win because the user
            sees motion before the new route's content hydrates. */}
        <NextTopLoader
          color="#3b82f6"
          height={3}
          shadow="0 0 10px #3b82f6, 0 0 5px #3b82f6"
          showSpinner={false}
          speed={200}
          easing="ease"
        />
        <ScreenGuard />
        <DisableContextMenu />
        <FoldersProvider>
          {children}
        </FoldersProvider>
        <Toaster />
      </body>
    </html>
  );
}
