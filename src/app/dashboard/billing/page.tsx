'use client';

/**
 * Billing & plans - the user's subscription management page. Shows the current
 * plan, status, and access-until date, and lets them upgrade with a real
 * Cashfree payment (the existing /api/payments flow). Higher tiers show an
 * Upgrade button; the same/lower tiers and storage/seat add-ons point to sales.
 *
 * The current tier is derived from the user's latest PAID payment (payments
 * table, owner-readable via RLS), since profiles.plan only stores the plan
 * family, not the specific tier.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/use-user';
import { isPlanActive } from '@/lib/plan';
import { PLAN_TIERS, tierById, type PlanTier } from '@/lib/plan-catalogue';
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
import { Check, Loader2, BadgeCheck, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StorageMeter } from '@/components/storage-meter';
import { ContactSalesDialog } from '@/components/contact-sales-dialog';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Human-friendly time remaining until an ISO expiry. Null if past/invalid. */
function timeLeft(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} left`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'} left`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `${mins} minute${mins === 1 ? '' : 's'} left`;
}

function fmtDate(iso: string | null): string {
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
}

export default function BillingPage() {
  const router = useRouter();
  const { user } = useUser();

  const [currentTierId, setCurrentTierId] = useState<string | null>(null);
  const [loadingTier, setLoadingTier] = useState(true);

  const [pendingPlan, setPendingPlan] = useState<PlanTier | null>(null);
  const [salesOpen, setSalesOpen] = useState(false);
  // Re-render every 30s so the "time left" countdown stays current.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState<{ name: string; expiresAt: string | null } | null>(null);

  const loadTier = async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) {
      setLoadingTier(false);
      return;
    }
    const { data } = await supabase
      .from('payments')
      .select('plan_id, created_at')
      .eq('user_id', u.id)
      .eq('status', 'PAID')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setCurrentTierId((data as { plan_id?: string } | null)?.plan_id ?? null);
    setLoadingTier(false);
  };

  useEffect(() => {
    loadTier();
  }, []);

  // Confirm an upgrade after returning from Cashfree (?order_id=...).
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id');
    if (!orderId) return;
    (async () => {
      setVerifying(true);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setVerifying(false);
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
          setSuccess({ name: json.planName ?? 'your plan', expiresAt: json.expiresAt ?? null });
          await loadTier();
        } else {
          setPayError('Your payment was not completed.');
        }
      } catch {
        setPayError('We could not confirm your payment. If you were charged, contact support.');
      }
      setVerifying(false);
      window.history.replaceState({}, '', '/dashboard/billing');
    })();
  }, []);

  const openCheckout = (t: PlanTier) => {
    setPendingPlan(t);
    setPhone('');
    setPayError(null);
  };

  const pay = async () => {
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
        body: JSON.stringify({ planId: pendingPlan.id, phone: cleanPhone, returnPath: '/dashboard/billing' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.paymentSessionId) {
        setPaying(false);
        const cfMsg = json?.detail || json?.cf?.message;
        setPayError(
          json?.error === 'not_configured'
            ? 'Payments are not configured yet.'
            : cfMsg
              ? `Cashfree: ${cfMsg}`
              : 'Could not start checkout. Please try again.',
        );
        return;
      }
      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: json.mode === 'production' ? 'production' : 'sandbox' });
      await cashfree.checkout({ paymentSessionId: json.paymentSessionId, redirectTarget: '_self' });
    } catch {
      setPaying(false);
      setPayError('Could not start checkout. Please try again.');
    }
  };

  const paidTier = tierById(currentTierId);
  // Free users have no payment row, so fall back to the Free tier when the
  // account is on the free early-access plan.
  const onFree = !paidTier && user?.planStatus === 'free';
  const currentTier = paidTier ?? (onFree ? tierById('vdr-free') : null);
  const isFree = currentTier?.id === 'vdr-free';
  const currentRank = currentTier?.rank ?? -1;
  const active = isPlanActive(user?.plan ?? null, user?.planExpiresAt ?? null);
  const grid = PLAN_TIERS.filter((t) => t.showInGrid);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight">Billing &amp; plans</h1>
      <p className="mt-1 text-muted-foreground">Manage your subscription and upgrade any time.</p>

      {/* Current subscription */}
      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        {loadingTier ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your plan...
          </div>
        ) : currentTier ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Current plan</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    active ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {active ? 'Active' : 'Expired'}
                </span>
                {active && timeLeft(user?.planExpiresAt) && (
                  <span className="rounded-full bg-[#F0F5FF] px-2 py-0.5 text-[11px] font-semibold text-[#4285F4]">
                    {timeLeft(user?.planExpiresAt)}
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xl font-bold">{currentTier.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isFree
                  ? user?.planExpiresAt
                    ? `Your free trial runs until ${fmtDate(user.planExpiresAt)}. Upgrade to keep access.`
                    : 'Your free trial is active. Upgrade to keep access.'
                  : user?.planExpiresAt
                    ? active
                      ? `Your access runs until ${fmtDate(user.planExpiresAt)}.`
                      : `Expired on ${fmtDate(user.planExpiresAt)}. Choose a plan below to continue.`
                    : 'Active.'}
              </p>
            </div>
            <div className="text-right">
              {isFree ? (
                <div className="text-3xl font-bold">Free</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{inr(currentTier.price)}</div>
                  <div className="text-sm text-muted-foreground">/mo</div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-lg font-semibold">You are not on a paid plan yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a plan below to unlock the full data room.
            </p>
          </div>
        )}
      </div>

      {/* Storage usage */}
      <StorageMeter className="mt-4" />

      {/* Plans */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {grid.map((t) => {
          const isCurrent = currentTier?.id === t.id;
          const isUpgrade = t.rank > currentRank;
          return (
            <div
              key={t.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md',
                t.popular ? 'border-[#4285F4] ring-1 ring-[#4285F4]' : 'border-gray-200',
                isCurrent && 'border-green-500 ring-2 ring-green-500',
              )}
            >
              {t.popular && !isCurrent && (
                <span className="absolute -top-3 left-6 rounded-full bg-[#4285F4] px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                  <BadgeCheck className="h-3.5 w-3.5" /> Current plan
                </span>
              )}
              <h3 className="text-xl font-semibold">{t.name}</h3>
              <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">{t.tagline}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{inr(t.price)}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">+ 18% GST, billed monthly</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {t.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span className={cn(f.endsWith(':') && 'font-medium text-foreground')}>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent && active ? (
                  <Button disabled variant="outline" className="w-full">
                    Current plan
                  </Button>
                ) : isCurrent && !active ? (
                  <Button onClick={() => openCheckout(t)} className="w-full bg-[#4285F4] text-white hover:bg-[#3367d6]">
                    Renew {t.name}
                  </Button>
                ) : isUpgrade ? (
                  <Button onClick={() => openCheckout(t)} className="w-full bg-[#4285F4] text-white hover:bg-[#3367d6]">
                    Upgrade to {t.name}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setSalesOpen(true)}>
                    Contact sales
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-ons / sales */}
      <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 px-6 py-6 text-center sm:flex-row sm:gap-4">
        <p className="text-sm text-muted-foreground">
          Need more storage, more seats, SSO, or a custom plan?
        </p>
        <button
          type="button"
          onClick={() => setSalesOpen(true)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline underline-offset-4"
        >
          Contact sales <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <ContactSalesDialog open={salesOpen} onOpenChange={setSalesOpen} />

      {/* Phone dialog before checkout */}
      <Dialog
        open={!!pendingPlan}
        onOpenChange={(o) => {
          if (!paying && !o) setPendingPlan(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Continue to secure payment</DialogTitle>
            <DialogDescription>
              {pendingPlan ? `${pendingPlan.name} plan, ${inr(pendingPlan.price)} per month. ` : ''}
              Enter a mobile number for the payment receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bill-phone">Mobile number</Label>
            <Input
              id="bill-phone"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              autoFocus
            />
            {payError && <p className="text-sm text-red-600">{payError}</p>}
          </div>
          <Button onClick={pay} disabled={paying} className="w-full bg-[#4285F4] text-white hover:bg-[#3367d6]">
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

      {/* Verifying overlay */}
      {verifying && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/90">
          <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
          <p className="text-sm text-gray-600">Confirming your payment...</p>
        </div>
      )}

      {/* Success dialog */}
      <Dialog open={!!success} onOpenChange={(o) => { if (!o) window.location.reload(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">You&apos;re upgraded 🎉</DialogTitle>
            <DialogDescription className="text-center text-base">
              {success?.name ? `Your ${success.name} plan is active. ` : 'Your plan is active. '}
              {success?.expiresAt ? `Enjoy full access until ${fmtDate(success.expiresAt)}.` : ''}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => window.location.reload()} className="mt-2 w-full bg-[#4285F4] text-white hover:bg-[#3367d6]">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
