'use client';

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
import { Check, Folder, Cpu, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';
import { supabase } from '@/lib/supabaseClient';

type PlanKey = 'vdr_only' | 'ai_only' | 'vdr_ai';
type Category = 'vdr' | 'ai' | 'both';

type Plan = {
  id: string;
  name: string;
  price: number; // monthly INR; 0 = free trial
  period?: string; // shown when not /mo (e.g. trial)
  planKey: PlanKey;
  tagline: string;
  popular?: boolean;
  trial?: boolean;
  note?: string; // small line under the price (e.g. the Access test-cycle notice)
  features: string[];
};

// ─── Plan catalogue (prices ~30% under the comparable market) ────────────────
const CATALOGUE: Record<Category, Plan[]> = {
  vdr: [
    {
      id: 'vdr-access', name: 'Access', price: 1, planKey: 'vdr_only',
      tagline: 'Unlock the secure data room for one rupee.',
      note: 'Test plan: full access for 1 minute after purchase.',
      features: ['2 team members', '25 GB storage', 'All Starter features', 'Secure links, gates & expiry'],
    },
    {
      id: 'vdr-starter', name: 'Starter', price: 999, planKey: 'vdr_only',
      tagline: 'For founders sharing a deck or data room.',
      features: ['2 team members', '25 GB storage', 'Unlimited spaces', 'Secure links, gates & expiry', 'View & page-time analytics', 'File requests & Q&A'],
    },
    {
      id: 'vdr-growth', name: 'Growth', price: 2499, planKey: 'vdr_only', popular: true,
      tagline: 'For teams running real deals.',
      features: ['5 team members', '100 GB storage', 'Everything in Starter, plus:', 'Custom branding & domain', 'NDA + e-signatures', 'Dynamic watermark (email/IP)', 'Audit log & advanced analytics'],
    },
    {
      id: 'vdr-business', name: 'Business', price: 5999, planKey: 'vdr_only',
      tagline: 'For firms managing many rooms.',
      features: ['15 team members', '500 GB storage', 'Everything in Growth, plus:', 'Group & granular permissions', 'SSO', 'Bulk operations', 'Priority support'],
    },
  ],
  ai: [
    {
      id: 'ai-trial', name: 'Free Trial', price: 0, period: '7 days', planKey: 'ai_only', trial: true,
      tagline: 'Try AI due diligence free for 7 days.',
      features: ['3 AI diligence reports', 'Red-flag detection', 'No card required'],
    },
    {
      id: 'ai-std', name: 'AI Diligence', price: 1999, planKey: 'ai_only',
      tagline: 'Automated diligence on every deal.',
      features: ['15 AI reports / month', 'AI red-flag detection', 'Financial statement analysis', 'Cap-table & legal scanning', 'Executive summaries'],
    },
    {
      id: 'ai-pro', name: 'AI Diligence Pro', price: 4999, planKey: 'ai_only', popular: true,
      tagline: 'For active investors & analysts.',
      features: ['50 AI reports / month', 'Deeper, higher-accuracy analysis', 'Everything in AI Diligence', 'Priority processing'],
    },
  ],
  both: [
    {
      id: 'both-trial', name: 'Free Trial', price: 0, period: '7 days', planKey: 'vdr_ai', trial: true,
      tagline: 'The complete platform, free for 7 days.',
      features: ['VDR + AI diligence', '3 AI reports', 'No card required'],
    },
    {
      id: 'both-complete', name: 'Complete', price: 3999, planKey: 'vdr_ai', popular: true,
      tagline: 'Data room + AI diligence in one.',
      features: ['Growth VDR + AI Diligence', '5 team members', '100 GB storage', '15 AI reports / month', 'Save vs. buying separately'],
    },
    {
      id: 'both-pro', name: 'Complete Pro', price: 8999, planKey: 'vdr_ai',
      tagline: 'Everything, at scale.',
      features: ['Business VDR + AI Pro', '15 team members', '500 GB storage', '50 AI reports / month', 'Priority support'],
    },
  ],
};

// AI Due Diligence + Both are hidden pre-launch - only the Virtual Data Room
// plans are offered. (The ai/both catalogue entries remain but are unreachable.)
const CATEGORY_META: { key: Category; label: string; icon: typeof Folder }[] = [
  { key: 'vdr', label: 'Virtual Data Room', icon: Folder },
];

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
  const [category, setCategory] = useState<Category>('vdr');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  // Cashfree payment state: paid plans open a phone dialog, then hosted checkout.
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
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
      if (!user) { router.replace('/login'); return; }
      setUserId(user.id);
      setEmail(user.email ?? null);
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
      setCurrentPlan((profile?.plan as PlanKey) ?? null);
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
      if (!token) { router.replace('/login'); return; }
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

  const handleSelect = async (plan: Plan) => {
    if (!userId || !email) return;

    // Paid plan: collect the mobile number Cashfree requires, then checkout.
    if (!plan.trial && plan.price > 0) {
      setPendingPlan(plan);
      setPhone('');
      setPayError(null);
      setPhoneOpen(true);
      return;
    }

    // Free Trial (zero price): activate immediately, no payment.
    setSelecting(plan.id);
    let finalPlan: PlanKey = plan.planKey;
    if (
      (currentPlan === 'ai_only' && plan.planKey === 'vdr_only') ||
      (currentPlan === 'vdr_only' && plan.planKey === 'ai_only')
    ) {
      finalPlan = 'vdr_ai';
    }
    if (currentPlan === 'vdr_ai') finalPlan = 'vdr_ai';

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, plan: finalPlan }, { onConflict: 'id' });

    if (error) {
      setSelecting(null);
      return;
    }
    router.replace('/dashboard');
  };

  // Create a Cashfree order for the pending paid plan and open hosted checkout.
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
      if (!token) { router.replace('/login'); return; }

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: pendingPlan.id, phone: cleanPhone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.paymentSessionId) {
        setPaying(false);
        console.error('[create-order] failed:', json);
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

  const plans = CATALOGUE[category];

  return (
    <div className="min-h-screen w-full bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="flex flex-col items-center text-center">
          <Logo isPen />
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">Choose your plan</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A secure virtual data room to share your documents and track investor
            interest. Pick a plan to get started.
          </p>
        </header>

        {/* Category toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
            {CATEGORY_META.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                    active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan cards */}
        <div className={cn('mt-12 grid gap-6', plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3', 'sm:grid-cols-2')}>
          {plans.map((plan) => (
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
              {plan.trial && (
                <span className="absolute -top-3 left-6 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                  7 days free
                </span>
              )}

              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1">
                {plan.trial ? (
                  <>
                    <span className="text-4xl font-bold">₹0</span>
                    <span className="text-muted-foreground">/ {plan.period}</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold">{inr(plan.price)}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </>
                )}
              </div>
              {!plan.trial && <p className="mt-1 text-xs text-muted-foreground">+ 18% GST · billed monthly</p>}
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
                disabled={selecting !== null}
                className={cn(
                  'mt-8 h-11 w-full text-base',
                  plan.popular || plan.trial ? 'bg-gray-900 text-white hover:bg-gray-800' : '',
                )}
                variant={plan.popular || plan.trial ? 'default' : 'outline'}
              >
                {selecting === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : plan.trial ? 'Start free trial' : `Choose ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise footer */}
        <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 px-6 py-6 text-center sm:flex-row sm:gap-4">
          <p className="text-sm text-muted-foreground">
            Need unlimited seats, SSO, white-label, or a custom contract?
          </p>
          <a href="mailto:omprakash@venturethrust.com" className="text-sm font-semibold text-gray-900 underline underline-offset-4">
            Talk to sales
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans are billed securely through Cashfree.
        </p>

        {/* Phone collection, then Cashfree hosted checkout for paid plans */}
        <Dialog open={phoneOpen} onOpenChange={(o) => { if (!paying) setPhoneOpen(o); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Continue to secure payment</DialogTitle>
              <DialogDescription>
                {pendingPlan ? `${pendingPlan.name} plan, ₹${pendingPlan.price.toLocaleString('en-IN')} per month. ` : ''}
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening checkout…</>
              ) : (
                `Pay ₹${pendingPlan ? pendingPlan.price.toLocaleString('en-IN') : ''} with Cashfree`
              )}
            </Button>
          </DialogContent>
        </Dialog>

        {verifying && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/90">
            <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
            <p className="text-sm text-gray-600">Confirming your payment…</p>
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
