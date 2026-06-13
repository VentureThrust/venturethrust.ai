'use client';

/**
 * Reset password - step 2. The Supabase recovery link lands here with a token
 * in the URL hash, which supabase-js exchanges for a temporary session. Once a
 * session exists we show the new-password form and call updateUser({ password }).
 * This also works for accounts created via Google: setting a password adds an
 * email/password login to the account.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false); // a recovery session is present
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    // supabase-js parses the recovery token from the URL and fires this once the
    // session is set.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) {
        setReady(true);
        setChecking(false);
      }
    });
    // In case the session is already established by the time we mount.
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        setReady(true);
        setChecking(false);
      }
    });
    // Grace period: if no session arrives, treat the link as invalid/expired.
    const t = setTimeout(() => {
      if (active) setChecking(false);
    }, 2500);
    return () => {
      active = false;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message || 'Could not update your password. Please request a new link.');
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Password updated</h1>
              <p className="mt-2 text-sm text-gray-600">Your new password is set. You are now signed in.</p>
              <Link
                href="/dashboard"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#4285F4] font-medium text-white hover:bg-[#3367d6]"
              >
                Go to dashboard
              </Link>
            </div>
          ) : checking ? (
            <p className="py-6 text-center text-sm text-gray-500">Verifying your reset link…</p>
          ) : ready ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Set a new password</h1>
              <p className="mt-2 text-sm text-gray-600">Choose a new password for your account.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-[#4285F4] text-white hover:bg-[#3367d6]"
                >
                  {loading ? 'Saving…' : 'Update password'}
                </Button>
                {error && <p className="text-center text-sm text-red-600">{error}</p>}
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Link expired or invalid</h1>
              <p className="mt-2 text-sm text-gray-600">
                This reset link is no longer valid. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block text-sm font-medium text-[#4285F4] underline underline-offset-4"
              >
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
