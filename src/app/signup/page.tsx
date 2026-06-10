// app/signup/page.tsx
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
import { MailCheck, Users } from 'lucide-react';

export default function SignupPage() {
  // useSearchParams() requires a Suspense boundary in Next 15 production builds.
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next');
  const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/choose-role';

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [mode, setMode] = useState<'signup' | 'claim'>('signup');
  const [existing, setExisting] = useState(false); // invite-only email → offer to claim
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setNotice(null);
    setExisting(false);

    try {
      const res = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const { status, hasOwnAccount, isInvitee } = res.ok
        ? await res.json()
        : { status: 'ERROR', hasOwnAccount: false, isInvitee: false };

      // Existing account that is NOT an invite-only one → log in.
      if (status === 'CONFIRMED' && (hasOwnAccount || !isInvitee)) {
        setMessage('An account with this email already exists. Please log in.');
        setLoading(false);
        return;
      }
      // Invite-created account (member of a workspace, no own account yet)
      // → offer to set up their own account.
      if (status === 'CONFIRMED' && !hasOwnAccount && isInvitee) {
        setExisting(true);
        setLoading(false);
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}${nextPath}`, data: { has_own_account: true } },
      });

      if (error) {
        if (/already|registered|exists/i.test(error.message)) {
          await supabase.auth.resend({ type: 'signup', email });
        } else {
          setMessage(error.message);
          setLoading(false);
          return;
        }
      }

      if (data?.session) {
        window.location.href = nextPath; // confirmation disabled → straight in
        return;
      }

      setMode('signup');
      setStep('otp');
      setNotice(`We sent a 6-digit code to ${email}.`);
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Invitee opts to set up their OWN account → verify ownership via a code,
  // then set their password and drop them into their own (empty) workspace.
  const handleClaim = async () => {
    if (!password) {
      setMessage('Choose a password for your own account first.');
      return;
    }
    setLoading(true);
    setMessage(null);
    // Send the code via our own (Zoho) endpoint so the email always contains a
    // 6-digit CODE - independent of the Supabase "Magic Link" email template.
    const res = await fetch('/api/workspace-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = res.ok ? await res.json() : { ok: false };
    if (!data.ok) {
      setMessage('We couldn’t send a code. Please try again in a moment.');
      setLoading(false);
      return;
    }
    setMode('claim');
    setStep('otp');
    setExisting(false);
    setNotice(`We sent a 6-digit code to ${email} to confirm it's you.`);
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (code.length < 6) {
      setMessage('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setMessage(null);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
      if (error || !data.session) {
        setMessage('That code is invalid or has expired. Please try again.');
        setLoading(false);
        return;
      }
      window.location.href = nextPath;
      return;
    }

    // claim - verify our own emailed code, then exchange the paired token_hash.
    const res = await fetch('/api/workspace-code/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const vres = res.ok ? await res.json() : { ok: false };
    if (!vres.ok || !vres.tokenHash) {
      setMessage('That code is invalid or has expired. Please try again.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: vres.tokenHash,
      type: 'magiclink',
    });
    if (error || !data.session) {
      setMessage('That code is invalid or has expired. Please try again.');
      setLoading(false);
      return;
    }
    // Set the password they chose + flag this as their own account.
    const { error: updErr } = await supabase.auth.updateUser({
      password,
      data: { has_own_account: true },
    });
    if (updErr) {
      setMessage(updErr.message);
      setLoading(false);
      return;
    }
    if (data.user) setActiveWorkspace(data.user.id, data.user.id); // land in their OWN workspace
    window.location.href = '/spaces';
  };

  const handleResend = async () => {
    setMessage(null);
    setNotice(null);
    if (mode === 'claim') {
      const res = await fetch('/api/workspace-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = res.ok ? await res.json() : { ok: false };
      setNotice(data.ok ? 'A new code is on its way.' : null);
      if (!data.ok) setMessage('We couldn’t send a code. Please try again.');
      return;
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setNotice(error ? null : 'A new code is on its way.');
    if (error) setMessage(error.message);
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
            Share documents securely.
            <span className="block text-gray-400">Track every page.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-300">
            A secure virtual data room. Share your deck, financials, and contracts
            with one link, gate access with an NDA or expiry, and see exactly who
            read what.
          </p>
        </div>
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} VentureThrust</p>
      </div>

      {/* ── Right: form / claim / OTP ── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="lg:hidden mb-10 flex justify-center"><Logo /></div>

        <div className="mx-auto w-full max-w-md">
          {step === 'form' ? (
            <>
              <h1 className="text-4xl font-bold tracking-tight">Create your account</h1>
              <p className="mt-3 text-lg text-muted-foreground">Sign up with your email and password.</p>

              <form onSubmit={handleSignup} className="mt-10 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" value={email}
                    onChange={(e) => { setEmail(e.target.value); setExisting(false); }} required className="h-12 text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required className="h-12 text-base" />
                </div>

                {!existing && (
                  <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
                    {loading ? 'Sending code…' : 'Create account'}
                  </Button>
                )}

                {message && <p className="text-center text-sm text-red-600">{message}</p>}
              </form>

              {/* Invite-only email → offer to set up their own account */}
              {existing && (
                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">You already have access to a shared workspace.</p>
                      <p className="mt-1 text-muted-foreground">
                        Want your <strong>own</strong> workspace too? We&apos;ll email a code to confirm it&apos;s
                        you, then set the password above for your own account.
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleClaim} disabled={loading} className="mt-4 h-11 w-full bg-gray-900 text-white hover:bg-gray-800">
                    {loading ? 'Sending code…' : 'Set up my own account'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={loading}
                    className="mt-2 h-11 w-full"
                    onClick={() => router.push(`/login?email=${encodeURIComponent(email)}${rawNext ? `&next=${encodeURIComponent(rawNext)}` : ''}`)}
                  >
                    Log in to the shared workspace
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <MailCheck className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                {mode === 'claim' ? "Confirm it's you" : 'Enter the code'}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                We emailed a 6-digit code to <strong className="text-foreground">{email}</strong>.{' '}
                {mode === 'claim' ? 'Enter it to set up your own account.' : 'Enter it to confirm your account.'}
              </p>

              <form onSubmit={handleVerify} className="mt-10 space-y-6">
                <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••••" autoFocus
                  className="h-16 text-center text-3xl font-semibold tracking-[0.5em]" />

                <Button type="submit" className="h-12 w-full text-base" disabled={loading || otp.length < 6}>
                  {loading ? 'Verifying…' : mode === 'claim' ? 'Verify & create my account' : 'Verify & continue'}
                </Button>

                {notice && <p className="text-center text-sm text-green-600">{notice}</p>}
                {message && <p className="text-center text-sm text-red-600">{message}</p>}

                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t get it?{' '}
                  <button type="button" onClick={handleResend} className="font-medium text-foreground underline underline-offset-4">
                    Resend code
                  </button>
                </p>
              </form>
            </>
          )}

          <p className="mt-10 text-center text-base text-muted-foreground">
            Already have an account?{' '}
            <Link href={rawNext ? `/login?next=${encodeURIComponent(rawNext)}` : '/login'}
              className="font-medium text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
