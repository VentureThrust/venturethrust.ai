'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { setActiveWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { MailCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  // useSearchParams() requires a Suspense boundary in Next 15 production builds.
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next');
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/dashboard';

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Shown after a wrong workspace password - offers the code/own-account paths.
  const [inviteeFallback, setInviteeFallback] = useState(false);
  // Owner of the shared workspace, so we can scope into it after a code login.
  const [codeOwnerId, setCodeOwnerId] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setInviteeFallback(false);
    setLoading(true);

    // 1) Normal login (real account holders, incl. workspace owners).
    const { error: pwErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!pwErr) {
      window.location.href = nextPath; // hard nav so the workspace scope resolves fresh
      return;
    }

    // 2) Password didn't match this account - figure out who they are.
    try {
      const res = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const { status, hasOwnAccount, isInvitee } = res.ok
        ? await res.json()
        : { status: 'ERROR', hasOwnAccount: false, isInvitee: false };

      // An invitee with no password of their own → treat what they typed as the
      // WORKSPACE OWNER's password (the shared key to the workspace).
      if (status === 'CONFIRMED' && isInvitee && !hasOwnAccount) {
        const wl = await fetch('/api/workspace-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = wl.ok ? await wl.json() : { ok: false, reason: 'server' };

        if (data.ok && data.tokenHash) {
          const { data: v, error: vErr } = await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink',
          });
          if (!vErr && v.session) {
            if (v.user && data.ownerId) setActiveWorkspace(v.user.id, data.ownerId);
            window.location.href = nextPath; // into the shared workspace
            return;
          }
        }

        setError(
          data.reason === 'wrong_password'
            ? 'That workspace password is incorrect. Re-enter it, or log in with a code.'
            : 'We couldn’t log you in. Try logging in with a code instead.',
        );
        setInviteeFallback(true);
        setLoading(false);
        return;
      }

      if (status === 'NOT_EXISTS') {
        setError('No account found with this email. Please create an account first.');
      } else {
        setError('Incorrect email or password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  // Invitee chose "log in with a code" → we email a 6-digit code (via Zoho).
  const handleSendCode = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/workspace-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = res.ok ? await res.json() : { ok: false };
      if (!data.ok) {
        setError('We couldn’t send a code. Please try again in a moment.');
        setLoading(false);
        return;
      }
      setCodeOwnerId(data.ownerId ?? null);
      setStep('otp');
      setInviteeFallback(false);
      setNotice(`We emailed a 6-digit code to ${email}.`);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (code.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/workspace-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = res.ok ? await res.json() : { ok: false };
      if (!data.ok || !data.tokenHash) {
        setError('That code is invalid or has expired. Please try again.');
        setLoading(false);
        return;
      }
      const { data: v, error: vErr } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: 'magiclink',
      });
      if (vErr || !v.session) {
        setError('That code is invalid or has expired. Please try again.');
        setLoading(false);
        return;
      }
      const ownerId = data.ownerId ?? codeOwnerId;
      if (v.user && ownerId) setActiveWorkspace(v.user.id, ownerId);
      window.location.href = nextPath; // into their shared workspace
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${nextPath}` },
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: brand panel ── */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gray-900 px-14 py-12 text-white overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950" />
        <div className="flex items-center gap-2.5 text-xl font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-900">V</span>
          VentureThrust
        </div>
        <div className="max-w-md">
          <h2 className="text-5xl font-bold leading-[1.05] tracking-tight">
            Welcome back.
            <span className="block text-gray-400">Pick up where you left off.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-300">
            Your secure data rooms, AI diligence, and shared workspaces - all in one place.
          </p>
        </div>
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} VentureThrust</p>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="lg:hidden mb-10 flex justify-center"><Logo /></div>

        <div className="mx-auto w-full max-w-md">
          {step === 'form' && (
            <>
              <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-3 text-lg text-muted-foreground">Log in to your account.</p>

              <Button type="button" variant="outline" className="mt-8 h-12 w-full gap-2 text-base" onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 text-base" />
                </div>
                <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
                  {loading ? 'Logging in…' : 'Log in'}
                </Button>
                {error && <p className="text-center text-sm text-red-600">{error}</p>}
              </form>

              {/* Wrong workspace password → offer code / own-account paths. */}
              {inviteeFallback && (
                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Trouble with the workspace password?</p>
                      <p className="mt-1 text-muted-foreground">
                        Re-enter the password above and try again, or get a one-time code emailed to you.
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleSendCode} disabled={loading} className="mt-4 h-11 w-full bg-gray-900 text-white hover:bg-gray-800">
                    {loading ? 'Sending code…' : 'Log in with a code instead'}
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-2 h-11 w-full"
                    onClick={() => router.push(`/signup?email=${encodeURIComponent(email)}${rawNext ? `&next=${encodeURIComponent(rawNext)}` : ''}`)}
                  >
                    Create my own workspace instead
                  </Button>
                </div>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <MailCheck className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Enter the code</h1>
              <p className="mt-3 text-lg text-muted-foreground">
                We emailed a 6-digit code to <strong className="text-foreground">{email}</strong>.
              </p>
              <form onSubmit={handleVerify} className="mt-10 space-y-6">
                <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••••" autoFocus
                  className="h-16 text-center text-3xl font-semibold tracking-[0.5em]" />
                <Button type="submit" className="h-12 w-full text-base" disabled={loading || otp.length < 6}>
                  {loading ? 'Verifying…' : 'Log in'}
                </Button>
                {notice && <p className="text-center text-sm text-green-600">{notice}</p>}
                {error && <p className="text-center text-sm text-red-600">{error}</p>}
                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t get it?{' '}
                  <button type="button" onClick={handleSendCode} className="font-medium text-foreground underline underline-offset-4">Resend code</button>
                  {'  ·  '}
                  <button type="button" onClick={() => { setStep('form'); setError(null); setNotice(null); }} className="font-medium text-foreground underline underline-offset-4">Back</button>
                </p>
              </form>
            </>
          )}

          <p className="mt-10 text-center text-base text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href={rawNext ? `/signup?next=${encodeURIComponent(rawNext)}` : '/signup'} className="font-medium text-foreground underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
