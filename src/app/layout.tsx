import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FoldersProvider } from '@/lib/folder-provider';
import NextTopLoader from 'nextjs-toploader';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ScreenGuard } from '@/components/screen-guard';

// Inter - the closest free match to DocSend's UI font (Atlas Grotesk).
// Self-hosted by next/font (downloaded at build, served from our own domain),
// so there's no runtime Google Fonts dependency or CSP issue. Exposes
// --font-inter, which every Tailwind font utility resolves to.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// Space Grotesk - the closest free match to DocSend's heading font (Sharp Grotesk).
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

export const metadata: Metadata = {
  title: 'VentureThrust | Secure Virtual Data Room',
  description: 'Share your documents in a secure virtual data room. Send one secure link, gate access with an NDA or expiry, and see exactly who read what, page by page.',
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
        <FoldersProvider>
          {children}
        </FoldersProvider>
        <Toaster />
      </body>
    </html>
  );
}
