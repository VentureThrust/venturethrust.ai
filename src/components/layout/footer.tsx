import { Logo } from './logo';
import Link from 'next/link';

const footerLinks = {
  Product: [
    { href: '/features', label: 'Features' },
    { href: '/investors', label: 'Deal Watch for investors' },
    { href: '/docs', label: 'Documentation' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#security', label: 'Security' },
    { href: '/#pricing', label: 'Pricing' },
  ],
  Solutions: [
    { href: '/virtual-data-room', label: 'Virtual data room' },
    { href: '/secure-data-room', label: 'Secure data room' },
    { href: '/docsend-alternative', label: 'DocSend alternative' },
    { href: '/send-documents-and-track-opens', label: 'Track document opens' },
    { href: '/track-who-viewed-your-pitch-deck', label: 'Pitch deck tracking' },
    { href: '/data-room-for-fundraising', label: 'Fundraising data room' },
    { href: '/data-room-for-startups', label: 'Startup data room' },
    { href: '/data-room-for-sales', label: 'Sales data room' },
    { href: '/data-room-for-m-and-a', label: 'M&A data room' },
    { href: '/data-room-for-due-diligence', label: 'Due diligence data room' },
    { href: '/data-room-for-legal', label: 'Legal data room' },
    { href: '/data-room-for-real-estate', label: 'Real estate data room' },
    { href: '/data-room-pricing', label: 'Pricing' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/refund', label: 'Refund Policy' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="col-span-2 lg:col-span-2 pr-8">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              A calm place for serious decisions.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VentureThrust, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
