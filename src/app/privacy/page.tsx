import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - VentureThrust',
  description: 'How VentureThrust collects, uses, and protects your information.',
};

const LAST_UPDATED = '11 June 2026';
const CONTACT = 'omprakash@venturethrust.com';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo isPen />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        <header className="mt-10">
          <p className="text-sm font-semibold text-[#4285F4]">Legal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This document is a general template provided for convenience and is not legal advice. Replace the
          bracketed details with your registered legal entity name, address, and jurisdiction, and have it
          reviewed by a qualified lawyer before relying on it.
        </div>

        <article className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-700">
          <section>
            <p>
              VentureThrust (&ldquo;VentureThrust&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
              operates the VentureThrust virtual data room platform available at venturethrust.com (the
              &ldquo;Service&rdquo;). This Privacy Policy explains what information we collect, how we use it, and the
              choices you have. By using the Service you agree to this Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Information we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Account information</strong> - your name, email address, password (stored only in hashed
                form), and profile details.
              </li>
              <li>
                <strong>Content you upload</strong> - the documents, files, folders, and data rooms
                (&ldquo;Spaces&rdquo;) you add, along with their titles and metadata.
              </li>
              <li>
                <strong>Sharing &amp; visitor data</strong> - when you share a Space, we collect visitor email
                addresses (when you require them), acceptances of NDAs or agreements, and viewing analytics such as
                which documents were viewed, time spent per page, device type, approximate location derived from IP
                address, and timestamps.
              </li>
              <li>
                <strong>Payment information</strong> - payments are processed by our payment provider (Cashfree). We
                receive the transaction status and the plan purchased; we do not store your full card details.
              </li>
              <li>
                <strong>Support communications</strong> - messages you send to support, including conversations with
                our AI support assistant.
              </li>
              <li>
                <strong>Technical data</strong> - IP address, browser and device information, and cookies or local
                storage used to keep you signed in and remember preferences.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. How we use your information</h2>
            <p className="mt-3">We use the information above to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>provide, operate, and maintain the Service and authenticate your account;</li>
              <li>show data room owners analytics about how their shared documents are viewed;</li>
              <li>process payments, manage subscriptions, and enforce plan limits;</li>
              <li>provide customer support, including automated answers from our AI assistant;</li>
              <li>secure the platform, detect abuse, and prevent fraud;</li>
              <li>send you service-related communications; and</li>
              <li>comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. How we share information</h2>
            <p className="mt-3">
              We do not sell your personal information. We share data only with the service providers (sub-processors)
              that help us run the Service:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Supabase</strong> - database, file storage, and authentication (where your data is hosted);</li>
              <li><strong>Cashfree</strong> - payment processing;</li>
              <li><strong>Zoho</strong> - delivery of transactional emails;</li>
              <li>
                <strong>Anthropic</strong> - powers our AI support assistant; the support messages you send may be
                processed by Anthropic to generate replies;
              </li>
              <li><strong>Vercel</strong> - application hosting and content delivery.</li>
            </ul>
            <p className="mt-3">
              We may also disclose information if required by law, or to protect the rights, safety, and property of
              VentureThrust, our users, or others.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Your documents are confidential</h2>
            <p className="mt-3">
              Documents you upload are private to your workspace and are visible only to people you choose to share
              them with, subject to the link, password, email, and expiry settings you apply. We access your content
              only as needed to operate the Service or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. International transfers</h2>
            <p className="mt-3">
              Some of our service providers may store or process data on servers located outside your country. Where
              that happens, we rely on appropriate safeguards to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Data retention</h2>
            <p className="mt-3">
              We keep your information for as long as your account is active and as needed to provide the Service,
              comply with our legal obligations, resolve disputes, and enforce our agreements. You can ask us to
              delete your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Security</h2>
            <p className="mt-3">
              We protect your information with encryption in transit (HTTPS), row-level access controls, hashed
              passwords, rate limiting, and restricted administrative access. No method of transmission or storage is
              ever completely secure, so we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Your rights</h2>
            <p className="mt-3">
              Subject to applicable law, you may request to access, correct, export, or delete your personal
              information, and you may withdraw consent or object to certain processing. To exercise any of these
              rights, contact us at {CONTACT}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Cookies and local storage</h2>
            <p className="mt-3">
              We use cookies and browser local storage to keep you signed in, remember your preferences, and support
              basic analytics. You can control cookies through your browser settings, though some features may not
              work without them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Children</h2>
            <p className="mt-3">
              The Service is intended for users aged 18 and over and is not directed to children. We do not knowingly
              collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">11. Changes to this Policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last
              updated&rdquo; date above. Your continued use of the Service after changes take effect means you accept
              the updated Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">12. Contact us</h2>
            <p className="mt-3">
              For any questions about this Policy or your data, or to raise a grievance, contact us at{' '}
              <a href={`mailto:${CONTACT}`} className="font-medium text-[#4285F4] underline underline-offset-4">
                {CONTACT}
              </a>
              .
            </p>
          </section>
        </article>

        <div className="mt-12 flex items-center justify-between border-t pt-6 text-sm text-muted-foreground">
          <Link href="/terms" className="font-medium text-gray-900 hover:text-[#4285F4]">
            Terms of Service
          </Link>
          <span>&copy; {new Date().getFullYear()} VentureThrust</span>
        </div>
      </div>
    </main>
  );
}
