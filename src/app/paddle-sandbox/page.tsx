'use client';

/**
 * TEMPORARY hidden sandbox test page (/paddle-sandbox). Not linked anywhere.
 *
 * Verifies the INTERNATIONAL Paddle flow end to end using Paddle's SANDBOX with a
 * TEST card (no real money), simulating a US/EU customer. Activates the Starter
 * tier, then polls to confirm the webhook fired.
 *
 * Needs (in Vercel): NEXT_PUBLIC_PADDLE_SANDBOX_TOKEN, NEXT_PUBLIC_PADDLE_SANDBOX_PRICE_ID,
 * and PADDLE_WEBHOOK_SECRET_SANDBOX. Delete this page + those vars after verifying.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { isPlanActive } from '@/lib/plan';
import { usePaddle } from '@/hooks/use-paddle';
import { PADDLE_SANDBOX_TOKEN, PADDLE_SANDBOX_PRICE_ID } from '@/lib/paddle';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function PaddleSandboxPage() {
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

  const pollActivation = async () => {
    if (!userId) return;
    setBusy(false);
    setStatus('Test payment received. Waiting for the webhook to activate the plan...');
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .maybeSingle();
      const pr = data as { plan?: string | null; plan_expires_at?: string | null } | null;
      if (pr?.plan && isPlanActive(pr.plan, pr.plan_expires_at ?? null)) {
        setStatus('SUCCESS. A sandbox (international) card payment activated the plan end to end. Paddle works for non-India customers.');
        return;
      }
    }
    setStatus('Test paid, but the plan was not active after ~18s. Check the SANDBOX webhook destination and PADDLE_WEBHOOK_SECRET_SANDBOX.');
  };

  const paddle = usePaddle(
    (name) => {
      if (name === 'checkout.completed') pollActivation();
    },
    { environment: 'sandbox', token: PADDLE_SANDBOX_TOKEN },
  );

  const pay = () => {
    if (!PADDLE_SANDBOX_TOKEN || !PADDLE_SANDBOX_PRICE_ID) {
      setStatus('Sandbox is not configured. Set NEXT_PUBLIC_PADDLE_SANDBOX_TOKEN and NEXT_PUBLIC_PADDLE_SANDBOX_PRICE_ID in Vercel, then redeploy.');
      return;
    }
    if (!paddle) {
      setStatus('Sandbox checkout is still loading. Try again in a moment.');
      return;
    }
    setBusy(true);
    setStatus('');
    paddle.Checkout.open({
      items: [{ priceId: PADDLE_SANDBOX_PRICE_ID, quantity: 1 }],
      customer: email ? { email } : undefined,
      customData: { user_id: userId ?? '' },
    });
    setTimeout(() => setBusy(false), 1500);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Paddle sandbox test</h1>
      <p className="text-sm text-muted-foreground">
        Hidden page to verify the international Paddle flow with a TEST card (no real money). In the
        checkout, use card <strong>4242 4242 4242 4242</strong>, any future expiry, any CVC, any name.
        Activates the Starter tier.
      </p>
      <Button onClick={pay} disabled={busy} className="bg-[#4285F4] text-white hover:bg-[#3367d6]">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay with test card (sandbox)'}
      </Button>
      {status && <p className="max-w-sm text-sm text-gray-700">{status}</p>}
    </div>
  );
}
