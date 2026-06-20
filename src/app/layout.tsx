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
    card: 'summary',
    title: 'VentureThrust · Secure Data Room to Share & Track Documents',
    description:
      'Share documents with one secure link and see exactly who opened them and what they read. The affordable DocSend alternative.',
  },
  robots: { index: true, follow: true },
};

// Structured data so Google can render a richer result for the product.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VentureThrust',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.venturethrust.com',
  description:
    'A secure virtual data room to share documents and see exactly who opened them and which pages they read.',
  offers: { '@type': 'Offer', price: '12', priceCurrency: 'USD' },
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
