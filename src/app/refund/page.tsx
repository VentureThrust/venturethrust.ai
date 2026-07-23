import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy · VentureThrust',
  description: 'How refunds, cancellations, and the free trial work on VentureThrust.',
  alternates: { canonical: '/refund' },
};

const LAST_UPDATED = '12 June 2026';
const CONTACT = 'info@venturethrust.com';

export default function RefundPolicyPage() {
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
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">Refund Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <article className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-700">
          <section>
            <p>
              This Refund Policy explains how billing, cancellations, and refunds work for paid plans on the
              VentureThrust virtual data room platform at venturethrust.com (the &ldquo;Service&rdquo;), operated by
              VentureThrust. By purchasing a plan, you agree to this policy together with our{' '}
              <Link href="/terms" className="font-medium text-[#4285F4] underline underline-offset-4">Terms of Service</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Free trial</h2>
            <p className="mt-3">
              New accounts can start a <strong>7-day free trial</strong>. The trial is free of charge and requires no
              card. If you do not upgrade to a paid plan, access simply ends when the trial expires. There is nothing
              to cancel and nothing is charged.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Subscriptions and billing</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Paid plans are billed in Indian Rupees (INR) through our payment provider, Cashfree.</li>
              <li>Access to paid features is granted immediately once a payment succeeds.</li>
              <li>Applicable taxes such as GST are charged in addition to the plan price, as shown at checkout.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. No refunds (all sales are final)</h2>
            <p className="mt-3">
              All plan payments are final and non-refundable. Because access to paid features is delivered to you
              immediately once a payment succeeds, we do not provide refunds for unused time, partial billing periods,
              or a change of mind. You can <strong>cancel at any time</strong> to stop future charges (see Cancellations
              below). The only exceptions are verified billing errors and cases where a refund is required by applicable
              law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. What is not refundable</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Plan fees once a payment has succeeded and access has been granted.</li>
              <li>The unused remainder of a billing period after you cancel (cancellation stops future renewals; it does not refund the current period).</li>
              <li>Government taxes (such as GST) and third-party payment fees, where non-recoverable.</li>
            </ul>
            <p className="mt-3">
              We always honour refunds where they are required by applicable consumer-protection law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Cancellations</h2>
            <p className="mt-3">
              You can stop a paid plan at any time; it will not renew for the next period. You keep access until the end
              of the period you have already paid for.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Failed, duplicate, or incorrect charges</h2>
            <p className="mt-3">
              If you were charged in error, charged more than once for the same plan, or believe a payment was taken
              incorrectly, contact us right away with your order details and we will investigate and refund any verified
              error in full.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. How to cancel</h2>
            <p className="mt-3">
              You can stop your plan from renewing at any time from <strong>Billing</strong> in your dashboard, or by
              emailing{' '}
              <a href={`mailto:${CONTACT}`} className="font-medium text-[#4285F4] underline underline-offset-4">
                {CONTACT}
              </a>{' '}
              from the address on your account. Your plan stays active until the end of the period you have already paid
              for, and you will not be charged again. For a verified billing error, include your order ID and we will
              investigate; approved error refunds are processed within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Changes to this policy</h2>
            <p className="mt-3">
              We may update this Refund Policy from time to time. When we do, we will revise the &ldquo;Last
              updated&rdquo; date above. The policy in effect at the time of your purchase applies to that purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Contact us</h2>
            <p className="mt-3">
              Questions about billing or refunds? Reach us at{' '}
              <a href={`mailto:${CONTACT}`} className="font-medium text-[#4285F4] underline underline-offset-4">
                {CONTACT}
              </a>
              .
            </p>
          </section>
        </article>

        <div className="mt-12 flex items-center justify-between border-t pt-6 text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="/terms" className="font-medium text-gray-900 hover:text-[#4285F4]">Terms</Link>
            <Link href="/privacy" className="font-medium text-gray-900 hover:text-[#4285F4]">Privacy</Link>
          </div>
          <span>&copy; {new Date().getFullYear()} VentureThrust</span>
        </div>
      </div>
    </main>
  );
}
