import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service · VentureThrust',
  description: 'The terms that govern your use of VentureThrust.',
};

const LAST_UPDATED = '11 June 2026';
const CONTACT = 'omprakash@venturethrust.com';

export default function TermsPage() {
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
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <article className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-700">
          <section>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the VentureThrust virtual
              data room platform at venturethrust.com (the &ldquo;Service&rdquo;), operated by VentureThrust
              (&ldquo;VentureThrust&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using the
              Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. The Service</h2>
            <p className="mt-3">
              VentureThrust is a virtual data room that lets you store, organise, share, and track documents, with
              features such as secure links, access gates, expiry, NDAs and e-signatures, file requests, viewing
              analytics, and an AI support assistant. We may add, change, or remove features over time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Eligibility and accounts</h2>
            <p className="mt-3">
              You must be at least 18 years old to use the Service. You agree to provide accurate information, keep
              your login credentials secure, and remain responsible for all activity that occurs under your account.
              Notify us promptly of any unauthorised use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Plans, billing, and payments</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Paid plans are billed in Indian Rupees (INR) through our payment provider, Cashfree.</li>
              <li>
                Each plan includes usage limits (members, spaces, visitors per space, and storage) shown on the
                pricing page, which we may enforce.
              </li>
              <li>Applicable taxes such as GST are added as indicated at checkout.</li>
              <li>
                Paid plans remain active for the billing period purchased; the Free plan is provided at no charge and
                may change or end during our early-access period.
              </li>
              <li>
                Unless stated otherwise or required by law, payments are non-refundable. If you believe you were
                charged in error, contact us at {CONTACT}.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Your content and licence</h2>
            <p className="mt-3">
              You retain all ownership of the documents and content you upload. You grant us a limited, non-exclusive
              licence to host, store, process, and display your content solely to operate and provide the Service to
              you and the people you share it with. You are responsible for having the rights necessary to upload and
              share your content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Acceptable use</h2>
            <p className="mt-3">You agree not to use the Service to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>upload or share unlawful, infringing, defamatory, or harmful content;</li>
              <li>upload content you do not have the right to store or distribute;</li>
              <li>distribute malware or attempt to breach, probe, or disrupt the Service or its security;</li>
              <li>scrape, reverse engineer, or resell the Service without our permission; or</li>
              <li>use the Service to violate any applicable law or the rights of others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Sharing and confidentiality</h2>
            <p className="mt-3">
              You control who can access your data rooms through the link, password, email, expiry, and agreement
              settings you choose. You are responsible for configuring those settings appropriately. Visitors may be
              required to provide an email or accept an NDA or agreement before viewing your documents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. AI support assistant</h2>
            <p className="mt-3">
              Our AI support assistant provides automated answers to help you use the Service. Its responses may be
              incomplete or inaccurate and do not constitute professional, legal, or financial advice. For anything
              important, please reach a human via support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Intellectual property</h2>
            <p className="mt-3">
              The Service, including its software, design, and branding, is owned by VentureThrust and protected by
              intellectual-property laws. These Terms grant you a limited, non-transferable right to use the Service;
              they do not transfer any of our intellectual property to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Third-party services</h2>
            <p className="mt-3">
              The Service relies on third-party providers including Supabase, Cashfree, Zoho, Anthropic, and Vercel.
              Your use of those features may also be subject to the providers&rsquo; own terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Disclaimers</h2>
            <p className="mt-3">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any
              kind, whether express or implied, including fitness for a particular purpose and non-infringement, to the
              maximum extent permitted by law. We do not warrant that the Service will be uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">11. Limitation of liability</h2>
            <p className="mt-3">
              To the maximum extent permitted by law, VentureThrust will not be liable for any indirect, incidental,
              special, or consequential damages, or for loss of data, revenue, or profits. Our total liability for any
              claim relating to the Service will not exceed the amount you paid us for the Service in the twelve
              months before the claim arose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">12. Indemnification</h2>
            <p className="mt-3">
              You agree to indemnify and hold VentureThrust harmless from claims, damages, and expenses arising out of
              your content, your use of the Service, or your violation of these Terms or applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">13. Suspension and termination</h2>
            <p className="mt-3">
              We may suspend or terminate your access if you breach these Terms or use the Service in a way that risks
              harm to others or to the platform. You may stop using the Service at any time. On termination, your right
              to use the Service ends, and we may delete your content after a reasonable period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">14. Changes to these Terms</h2>
            <p className="mt-3">
              We may update these Terms from time to time. When we do, we will revise the &ldquo;Last updated&rdquo;
              date above. Your continued use of the Service after changes take effect means you accept the updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">15. Governing law</h2>
            <p className="mt-3">
              These Terms are governed by the laws of India, without regard to conflict-of-laws principles. You agree
              to the exclusive jurisdiction of the competent courts in India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">16. Contact us</h2>
            <p className="mt-3">
              Questions about these Terms? Contact us at{' '}
              <a href={`mailto:${CONTACT}`} className="font-medium text-[#4285F4] underline underline-offset-4">
                {CONTACT}
              </a>
              .
            </p>
          </section>
        </article>

        <div className="mt-12 flex items-center justify-between border-t pt-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="font-medium text-gray-900 hover:text-[#4285F4]">
            Privacy Policy
          </Link>
          <span>&copy; {new Date().getFullYear()} VentureThrust</span>
        </div>
      </div>
    </main>
  );
}
