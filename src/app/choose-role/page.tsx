'use client';

/**
 * Choose your plan - the gate destination for users without an active plan.
 * Virtual Data Room only (AI due diligence is a future product). Plans come
 * from the shared catalogue (lib/plan-catalogue.ts) so this page and the
 * billing page never drift apart. Every plan is paid, so selecting one opens
 * the phone dialog and runs Cashfree checkout.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';
import { supabase } from '@/lib/supabaseClient';
import { PLAN_TIERS, type PlanTier } from '@/lib/plan-catalogue';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Friendly date + time for the "plan active" confirmation, e.g. 10 Jun 2026, 11:45 AM.
const formatExpiry = (iso: string | null): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

export default function ChoosePlanPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Cashfree payment state: every plan opens a phone dialog, then hosted checkout.
  const [pendingPlan, setPendingPlan] = useState<PlanTier | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState<{ planName: string; expiresAt: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? null);
    })();
  }, [router]);

  // After returning from Cashfree checkout (?order_id=...), confirm the payment
  // server-side and, if PAID, send the user into their dashboard.
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id');
    if (!orderId) return;
    (async () => {
      setVerifying(true);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.status === 'PAID') {
          setSuccess({ planName: json.planName ?? 'VentureThrust', expiresAt: json.expiresAt ?? null });
        } else {
          setPayError('Your payment was not completed. Pick a plan to try again.');
        }
      } catch {
        setPayError('We could not confirm your payment. If you were charged, contact support.');
      }
      setVerifying(false);
      window.history.replaceState({}, '', '/choose-role');
    })();
  }, [router]);

  const handleSelect = (plan: PlanTier) => {
    if (!userId || !email) return;
    setPendingPlan(plan);
    setPhone('');
    setPayError(null);
    setPhoneOpen(true);
  };

  // Create a Cashfree order for the pending plan and open hosted checkout.
  const startPayment = async () => {
    if (!pendingPlan) return;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setPayError('Enter a valid 10-digit mobile number.');
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace('/login');
        return;
      }

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: pendingPlan.id, phone: cleanPhone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.paymentSessionId) {
        setPaying(false);
        const cfMsg = json?.detail || json?.cf?.message;
        setPayError(
          json?.error === 'not_configured'
            ? 'Payments are not configured (check .env.local, then restart the dev server).'
            : cfMsg
              ? `Cashfree: ${cfMsg}`
              : 'Could not start checkout. Please try again.',
        );
        return;
      }

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: json.mode === 'production' ? 'production' : 'sandbox' });
      await cashfree.checkout({ paymentSessionId: json.paymentSessionId, redirectTarget: '_self' });
      // redirectTarget '_self' navigates to Cashfree; code after this does not run.
    } catch {
      setPaying(false);
      setPayError('Could not start checkout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="flex flex-col items-center text-center">
          <Logo isPen />
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">Choose your plan</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A secure virtual data room to share your documents and track investor interest. Pick a
            plan to get started.
          </p>
        </header>

        {/* Plan cards */}
        <div
          className={cn(
            'mt-12 grid gap-6 sm:grid-cols-2',
            PLAN_TIERS.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
          )}
        >
          {PLAN_TIERS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md',
                plan.popular ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200',
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}

              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{inr(plan.price)}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">+ 18% GST, billed monthly</p>
              {plan.note && <p className="mt-1 text-xs font-medium text-amber-600">{plan.note}</p>}

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span className={cn(f.endsWith(':') && 'font-medium text-foreground')}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelect(plan)}
                disabled={paying}
                className={cn(
                  'mt-8 h-11 w-full text-base',
                  plan.popular ? 'bg-gray-900 text-white hover:bg-gray-800' : '',
                )}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {`Choose ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise footer */}
        <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 px-6 py-6 text-center sm:flex-row sm:gap-4">
          <p className="text-sm text-muted-foreground">
            Need unlimited seats, SSO, white-label, or a custom contract?
          </p>
          <a
            href="mailto:omprakash@venturethrust.com"
            className="text-sm font-semibold text-gray-900 underline underline-offset-4"
          >
            Talk to sales
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans are billed securely through Cashfree.
        </p>

        {/* Phone collection, then Cashfree hosted checkout */}
        <Dialog open={phoneOpen} onOpenChange={(o) => { if (!paying) setPhoneOpen(o); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Continue to secure payment</DialogTitle>
              <DialogDescription>
                {pendingPlan ? `${pendingPlan.name} plan, ${inr(pendingPlan.price)} per month. ` : ''}
                Enter a mobile number for the payment receipt.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="pay-phone">Mobile number</Label>
              <Input
                id="pay-phone"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                autoFocus
              />
              {payError && <p className="text-sm text-red-600">{payError}</p>}
            </div>
            <Button
              onClick={startPayment}
              disabled={paying}
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening checkout...
                </>
              ) : (
                `Pay ${pendingPlan ? inr(pendingPlan.price) : ''} with Cashfree`
              )}
            </Button>
          </DialogContent>
        </Dialog>

        {verifying && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/90">
            <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
            <p className="text-sm text-gray-600">Confirming your payment...</p>
          </div>
        )}

        {/* Positive confirmation after a successful purchase. */}
        <Dialog open={!!success} onOpenChange={(o) => { if (!o) router.replace('/dashboard'); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <DialogTitle className="text-center text-2xl">You&apos;re all set 🎉</DialogTitle>
              <DialogDescription className="text-center text-base">
                {success?.planName ? `Your ${success.planName} plan is active. ` : 'Your plan is active. '}
                {success?.expiresAt
                  ? `Enjoy full access to VentureThrust until ${formatExpiry(success.expiresAt)}.`
                  : 'Enjoy your VentureThrust experience.'}
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => router.replace('/dashboard')}
              className="mt-2 w-full bg-gray-900 text-white hover:bg-gray-800"
            >
              Go to my dashboard
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
