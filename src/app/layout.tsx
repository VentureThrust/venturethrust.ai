import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FoldersProvider } from '@/lib/folder-provider';
import NextTopLoader from 'nextjs-toploader';
import { GeistSans } from 'geist/font/sans';

export const metadata: Metadata = {
  title: 'Venture Trust | The Clear Path to Smarter Startup Investing',
  description: 'A calm, secure platform for founders and investors to manage documents, identify risks, and make decisions with confidence.',
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
    <html lang="en" className={`scroll-smooth ${GeistSans.variable}`}>
      <body className="font-body antialiased">
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
        <FoldersProvider>
          {children}
        </FoldersProvider>
        <Toaster />
      </body>
    </html>
  );
}
