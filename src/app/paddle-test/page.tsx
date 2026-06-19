'use client';

/**
 * TEMPORARY hidden test page (/paddle-test). Not linked anywhere.
 *
 * Opens a $1 Paddle checkout (PADDLE_TEST_PRICE_ID) to verify the live checkout
 * + webhook flow end to end. Paying it activates the Starter tier, then this page
 * polls the profile and reports whether the webhook activated the plan.
 *
 * Delete this file (and PADDLE_TEST_PRICE_ID in lib/paddle.ts) once payments are
 * verified.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { isPlanActive } from '@/lib/plan';
import { usePaddle } from '@/hooks/use-paddle';
import { PADDLE_TEST_PRICE_ID } from '@/lib/paddle';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function PaddleTestPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) {
        router.replace('/login');
        return;
      }
      setUserId(u.id);
      setEmail(u.email ?? null);
    })();
  }, [router]);

  // After a completed checkout, poll the profile until the webhook activates it.
  const confirmPayment = async () => {
    if (!userId) return;
    setBusy(false);
    setStatus('Payment received. Waiting for the webhook to activate your plan...');
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .maybeSingle();
      const pr = data as { plan?: string | null; plan_expires_at?: string | null } | null;
      if (pr?.plan && isPlanActive(pr.plan, pr.plan_expires_at ?? null)) {
        setStatus(
          `SUCCESS. The webhook activated your plan (expires ${pr.plan_expires_at ?? 'n/a'}). Payments work end to end.`,
        );
        return;
      }
    }
    setStatus(
      'Paid, but the plan was not active after ~18s. Check Paddle > Notifications > your webhook for delivery errors.',
    );
  };

  const paddle = usePaddle((name) => {
    if (name === 'checkout.completed') confirmPayment();
  });

  const pay = () => {
    if (!PADDLE_TEST_PRICE_ID) {
      setStatus('No test price configured. Set NEXT_PUBLIC_PADDLE_TEST_PRICE_ID (or hardcode it) and redeploy.');
      return;
    }
    if (!paddle) {
      setStatus('Checkout is still loading. Try again in a moment.');
      return;
    }
    setBusy(true);
    setStatus('');
    paddle.Checkout.open({
      items: [{ priceId: PADDLE_TEST_PRICE_ID, quantity: 1 }],
      customer: email ? { email } : undefined,
      customData: { user_id: userId ?? '' },
    });
    setTimeout(() => setBusy(false), 1500);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Paddle $1 test</h1>
      <p className="text-sm text-muted-foreground">
        Hidden page to verify the live payment + webhook flow. Pays $1 and activates the Starter tier.
        Remove after testing.
      </p>
      <Button onClick={pay} disabled={busy} className="bg-[#4285F4] text-white hover:bg-[#3367d6]">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay $1 (test)'}
      </Button>
      {status && <p className="max-w-sm text-sm text-gray-700">{status}</p>}
    </div>
  );
}
