import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContactForm } from '@/components/contact-form';
import { Mail, Phone, Clock, MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Contact us · VentureThrust',
  description: 'Talk to the VentureThrust team about sales, support, or anything else. Email info@venturethrust.com or call +91 8530329552.',
  alternates: { canonical: '/contact' },
};

const BLUE = '#4285F4';
const EMAIL = 'info@venturethrust.com';
const PHONE_DISPLAY = '+91 8530329552';
const PHONE_TEL = '+918530329552';

export default function ContactPage() {
  return (
    <div className="bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="container mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-20">
        <p className="text-sm font-semibold" style={{ color: BLUE }}>
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Talk to our team
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600">
          Whether you are sizing up a plan for your team or need a hand getting set up, we are happy to help.
          Send a message and we will get back to you.
        </p>
      </section>

      {/* Methods + form */}
      <section className="container mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
          {/* Left: direct contact methods */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900">Reach us directly</h2>
            <p className="mt-1.5 text-sm text-gray-600">Prefer email or a call? Use the details below.</p>

            <div className="mt-6 space-y-4">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <Mail className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">Email</span>
                  <span className="block break-all text-sm text-gray-600">{EMAIL}</span>
                </span>
              </a>

              <a
                href={`tel:${PHONE_TEL}`}
                className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <Phone className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">Phone</span>
                  <span className="block text-sm text-gray-600">{PHONE_DISPLAY}</span>
                </span>
              </a>

              <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <Clock className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">Response time</span>
                  <span className="block text-sm text-gray-600">We usually reply within one business day.</span>
                </span>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F0F5FF]" style={{ color: BLUE }}>
                  <MessageSquare className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">Already a customer?</span>
                  <span className="block text-sm text-gray-600">
                    Use the in-app support chat from your dashboard for the fastest help.
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: the form */}
          <div className="lg:col-span-3">
            <ContactForm defaultTopic="sales" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
