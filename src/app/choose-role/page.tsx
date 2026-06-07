'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  features: string[];
};

// ─── Plan catalogue (prices ~30% under the comparable market) ────────────────
const CATALOGUE: Record<Category, Plan[]> = {
  vdr: [
    {
      id: 'vdr-trial', name: 'Free Trial', price: 0, period: '7 days', planKey: 'vdr_only', trial: true,
      tagline: 'Full Starter access, free for 7 days. No card required.',
      features: ['2 team members', '25 GB storage', 'All Starter features', 'Cancel anytime'],
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

const CATEGORY_META: { key: Category; label: string; icon: typeof Folder }[] = [
  { key: 'vdr', label: 'Virtual Data Room', icon: Folder },
  { key: 'ai', label: 'AI Due Diligence', icon: Cpu },
  { key: 'both', label: 'Both', icon: Database },
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function ChoosePlanPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>('vdr');
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

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

  const handleSelect = async (plan: Plan) => {
    if (!userId || !email) return;
    setSelecting(plan.id);

    // Merge categories: if they already have one side and pick the other, they
    // get the full platform.
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
    // Billing comes later - for now every selection starts the 7-day trial.
    router.replace('/dashboard');
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
            Start with a 7-day free trial - no card required. Pick what fits: a secure data room,
            AI due diligence, or both.
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
                ) : plan.trial ? 'Start free trial' : 'Start free trial'}
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
          All paid plans start with a 7-day free trial. You won&apos;t be charged until it ends.
        </p>
      </div>
    </div>
  );
}
