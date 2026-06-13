'use client';

/**
 * Forgot password - step 1. The user enters their email and we send a Supabase
 * password-recovery link that lands on /reset-password. We always show the
 * "check your email" state (except on rate limit) so we never reveal which
 * emails have accounts.
 */

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (err && err.message.toLowerCase().includes('rate')) {
      setError('Too many requests. Please wait a minute and try again.');
      setLoading(false);
      return;
    }
    // Always confirm, even if the email has no account, to avoid leaking which
    // addresses are registered.
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <MailCheck className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Check your email</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                If an account exists for <strong className="text-gray-900">{email}</strong>, we have sent a
                link to set a new password. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-medium text-[#4285F4] underline underline-offset-4"
              >
                Back to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Forgot your password?</h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter your email and we will send you a link to set a new one.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-[#4285F4] text-white hover:bg-[#3367d6]"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
                {error && <p className="text-center text-sm text-red-600">{error}</p>}
              </form>
              <p className="mt-6 text-center text-sm text-gray-500">
                Remembered it?{' '}
                <Link href="/login" className="font-medium text-gray-900 underline underline-offset-4">
                  Back to log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
