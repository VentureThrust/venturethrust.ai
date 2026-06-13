'use client';

/**
 * ContactForm - the interactive form on /contact. POSTs to /api/contact.
 * If the server can't send (SMTP not configured, or any error), it shows a
 * friendly fallback asking the visitor to email directly, so nothing fails
 * silently.
 */

import { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

const BLUE = '#4285F4';
const GENERAL_EMAIL = 'info@venturethrust.com';
const SALES_EMAIL = 'sales@venturethrust.com';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const TOPICS = [
  { value: 'sales', label: 'Sales enquiry' },
  { value: 'support', label: 'Product support' },
  { value: 'general', label: 'General' },
];

export function ContactForm({
  defaultTopic = 'sales',
  hideTopic = false,
}: {
  defaultTopic?: string;
  hideTopic?: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    topic: defaultTopic,
    message: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setStatus('sent');
        return;
      }
      // Nothing captured (no DB + no SMTP), validation error, or send failure.
      setStatus('error');
      setError(typeof json.error === 'string' ? json.error : '');
    } catch {
      setStatus('error');
      setError('');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Thanks, we have your message</h3>
        <p className="mt-1.5 text-sm text-gray-600">
          We usually reply within one business day, at {form.email || 'your email'}.
        </p>
      </div>
    );
  }

  const fallbackEmail = form.topic === 'sales' ? SALES_EMAIL : GENERAL_EMAIL;

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20';

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
          <input required value={form.name} onChange={set('name')} className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Work email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={set('email')}
            className={inputClass}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Company <span className="text-gray-400">(optional)</span></label>
          <input value={form.company} onChange={set('company')} className={inputClass} placeholder="Company name" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone <span className="text-gray-400">(optional)</span></label>
          <input value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+91 ..." />
        </div>
      </div>

      {!hideTopic && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">How can we help?</label>
          <select value={form.topic} onChange={set('topic')} className={inputClass}>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={set('message')}
          className={`${inputClass} resize-y`}
          placeholder="Tell us what you are looking for."
        />
      </div>

      {status === 'error' && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error ? `${error} ` : 'We could not submit the form right now. '}
          Please email us directly at{' '}
          <a href={`mailto:${fallbackEmail}`} className="font-semibold underline">
            {fallbackEmail}
          </a>
          .
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-7"
        style={{ background: BLUE }}
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending
          </>
        ) : (
          <>
            Send message <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
