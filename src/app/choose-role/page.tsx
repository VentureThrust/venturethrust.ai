'use client';

/**
 * Choose your plan - the gate destination for users without an active plan.
 * Virtual Data Room only (AI due diligence is a future product). Plans come
 * from the shared catalogue (lib/plan-catalogue.ts) so this page and the
 * billing page never drift apart. The Free plan activates instantly; paid
 * plans open the phone dialog and run Cashfree checkout.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ContactSalesButton } from '@/components/contact-sales-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Check,
  Loader2,
  Sparkles,
  Rocket,
  TrendingUp,
  Building2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';
import { supabase } from '@/lib/supabaseClient';
import { getDeviceFingerprint } from '@/lib/device-id';
import { isPlanActive } from '@/lib/plan';
import { PLAN_TIERS, type PlanTier } from '@/lib/plan-catalogue';
import { usePaddle } from '@/hooks/use-paddle';
import { PADDLE_PRICE_BY_TIER } from '@/lib/paddle';

const inr = (n: number) => `$${n.toLocaleString('en-US')}`;

// Per-plan icon + chip colour, so each card has its own personality.
const PLAN_META: Record<string, { icon: LucideIcon; chip: string }> = {
  'vdr-free': { icon: Sparkles, chip: 'bg-emerald-50 text-emerald-600' },
  'vdr-starter': { icon: Rocket, chip: 'bg-blue-50 text-[#4285F4]' },
  'vdr-growth': { icon: TrendingUp, chip: 'bg-white/10 text-white' },
  'vdr-business': { icon: Building2, chip: 'bg-violet-50 text-violet-600' },
};

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

  // Paddle payment state: paid plans open the Paddle overlay checkout.
  const [selecting, setSelecting] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PlanTier | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState<{ planName: string; expiresAt: string | null } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // A completed Paddle checkout is confirmed server-side by the webhook within a
  // few seconds. Poll the profile until the plan flips, then show success.
  const confirmPaddlePayment = async () => {
    if (!userId) return;
    setPaying(false);
    setVerifying(true);
    const planName = pendingPlan?.name ?? 'VentureThrust';
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .maybeSingle();
      const pr = data as { plan?: string | null; plan_expires_at?: string | null } | null;
      if (pr?.plan && isPlanActive(pr.plan, pr.plan_expires_at ?? null)) {
        setVerifying(false);
        setSuccess({ planName, expiresAt: pr.plan_expires_at ?? null });
        return;
      }
    }
    // The webhook may still be processing; show success optimistically.
    setVerifying(false);
    setSuccess({ planName, expiresAt: null });
  };

  const paddle = usePaddle((name) => {
    if (name === 'checkout.completed') confirmPaddlePayment();
  });

  // Open Paddle's overlay checkout for a paid plan.
  const openPaddle = (plan: PlanTier) => {
    if (!userId) return;
    const priceId = PADDLE_PRICE_BY_TIER[plan.id];
    if (!priceId) {
      setNotice('This plan is not available for online checkout yet.');
      return;
    }
    if (!paddle) {
      setNotice('Checkout is still loading. Please try again in a moment.');
      return;
    }
    setPendingPlan(plan);
    setPayError(null);
    setNotice(null);
    setPaying(true);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      customData: { user_id: userId },
    });
    setTimeout(() => setPaying(false), 1500);
  };

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

      // If they HAD a plan that has now lapsed, show the "expired" banner and
      // email them once that their shared links are paused.
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('plan, plan_expires_at')
          .eq('id', user.id)
          .maybeSingle();
        const pr = prof as { plan?: string | null; plan_expires_at?: string | null } | null;
        if (pr?.plan && !isPlanActive(pr.plan, pr.plan_expires_at ?? null)) {
          setExpired(true);
          const token = data.session?.access_token;
          if (token) {
            fetch('/api/plan/notify-expiry', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          }
        }
      } catch {
        /* best-effort: the banner/email are non-critical */
      }
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

  const handleSelect = async (plan: PlanTier) => {
    if (!userId || !email) return;

    // Free plan: activate immediately, no payment.
    if (plan.price === 0) {
      setSelecting(plan.id);
      setNotice(null);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          router.replace('/login');
          return;
        }
        const fingerprint = await getDeviceFingerprint();
        const res = await fetch('/api/plan/activate-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fingerprint }),
        });
        if (res.ok) {
          router.replace('/dashboard');
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (json?.error === 'device_used') {
          setNotice(
            'This device has already used the free plan. Choose a paid plan below to continue.',
          );
        }
      } catch {
        /* fall through to re-enable the button */
      }
      setSelecting(null);
      return;
    }

    // Paid plan: open the Paddle overlay checkout.
    openPaddle(plan);
  };

  // (Cashfree checkout removed - payments now run through Paddle. The
  // /api/payments/* routes and src/lib/cashfree.ts stay server-side for quick
  // rollback until Paddle is verified live, then they will be deleted.)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#F0F5FF] via-white to-white px-4 py-12 sm:px-6 lg:px-8">
      {/* Soft brand glow behind the header */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#4285F4]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 -z-10 h-72 w-72 rounded-full bg-[#FBBC05]/10 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="flex flex-col items-center text-center">
          <Logo isPen />
          <span className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#4285F4]">
            <Sparkles className="h-3.5 w-3.5" /> Simple, transparent pricing
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose your plan
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A secure virtual data room to share your documents and track investor interest. Start
            free, upgrade when you grow.
          </p>
        </header>

        {expired && (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-800">
            <p className="font-semibold">Your plan has expired.</p>
            <p className="mt-1">
              While it is expired, any links you have shared are paused and recipients cannot open your
              documents. Renew below to restore access for you and everyone you shared with.
            </p>
          </div>
        )}

        {notice && (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            {notice}
          </div>
        )}

        {/* Plan cards */}
        <div
          className={cn(
            'mt-14 grid gap-6 sm:grid-cols-2',
            PLAN_TIERS.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
          )}
        >
          {PLAN_TIERS.map((plan) => {
            const featured = !!plan.popular;
            const meta = PLAN_META[plan.id] ?? { icon: Sparkles, chip: 'bg-gray-100 text-gray-600' };
            const Icon = meta.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-3xl border p-6 transition-all duration-200',
                  featured
                    ? 'border-transparent bg-gradient-to-b from-[#1b2a4e] to-[#2a4a7f] text-white shadow-2xl shadow-blue-900/25 lg:-translate-y-2'
                    : 'border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl',
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FBBC05] px-3 py-1 text-xs font-bold text-[#1b2a4e] shadow-md">
                    Most popular
                  </span>
                )}

                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', meta.chip)}>
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className={cn('mt-4 text-xl font-bold', featured ? 'text-white' : 'text-gray-900')}>
                  {plan.name}
                </h3>
                <p className={cn('mt-1 min-h-[40px] text-sm', featured ? 'text-blue-100' : 'text-muted-foreground')}>
                  {plan.tagline}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-extrabold">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold">{inr(plan.price)}</span>
                      <span className={featured ? 'text-blue-200' : 'text-muted-foreground'}>/mo</span>
                    </>
                  )}
                </div>
                {plan.price > 0 && (
                  <p className={cn('mt-1 text-xs', featured ? 'text-blue-200' : 'text-muted-foreground')}>
                    Billed monthly
                  </p>
                )}
                {plan.note && (
                  <p className={cn('mt-1 text-xs font-medium', featured ? 'text-amber-300' : 'text-amber-600')}>
                    {plan.note}
                  </p>
                )}

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', featured ? 'text-amber-300' : 'text-[#4285F4]')} />
                      <span
                        className={cn(
                          featured ? 'text-blue-50' : 'text-gray-700',
                          f.endsWith(':') && 'font-semibold',
                        )}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelect(plan)}
                  disabled={paying || selecting !== null}
                  className={cn(
                    'mt-8 h-11 w-full rounded-xl text-base font-semibold shadow-sm transition-colors',
                    featured
                      ? 'bg-white text-[#1b2a4e] hover:bg-blue-50'
                      : plan.price === 0
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#4285F4] text-white hover:bg-[#3367d6]',
                  )}
                >
                  {selecting === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : plan.price === 0 ? (
                    'Start free trial'
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Enterprise / sales */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#F0F5FF] to-white px-6 py-6 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4285F4]/10 text-[#4285F4]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Need something custom?</p>
              <p className="text-sm text-muted-foreground">
                Unlimited seats, SSO, white-label, or a custom contract.
              </p>
            </div>
          </div>
          <ContactSalesButton
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 sm:mt-0"
          >
            Talk to sales
          </ContactSalesButton>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Payments secured by Paddle
        </p>


        {verifying && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/90">
            <Loader2 className="h-8 w-8 animate-spin text-[#4285F4]" />
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
              className="mt-2 w-full bg-[#4285F4] text-white hover:bg-[#3367d6]"
            >
              Go to my dashboard
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
