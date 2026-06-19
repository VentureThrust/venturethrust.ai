'use client';

/**
 * TEMPORARY hidden test page (/paddle-test). Not linked anywhere.
 *
 * Verifies the live payment + activation flow cheaply, on the right rail for the
 * visitor: India pays ₹1 via Cashfree, everyone else pays $1 via Paddle. Both
 * activate the Starter tier, then this page reports whether the plan went active.
 *
 * Delete this file, the PADDLE_TEST_PRICE_ID in lib/paddle.ts, and the 'vdr-test'
 * entry in lib/cashfree.ts once payments are verified.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { isPlanActive } from '@/lib/plan';
import { usePaddle } from '@/hooks/use-paddle';
import { useCountry } from '@/hooks/use-country';
import { PADDLE_TEST_PRICE_ID } from '@/lib/paddle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function PaymentTestPage() {
  const router = useRouter();
  const { isIndia } = useCountry();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
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

  // Poll the profile until the webhook activates the plan (Paddle path).
  const pollActivation = async () => {
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
        setStatus(`SUCCESS. The plan is active (expires ${pr.plan_expires_at ?? 'n/a'}). Payments work end to end.`);
        return;
      }
    }
    setStatus('Paid, but the plan was not active after ~18s. Check the webhook/verify logs.');
  };

  // Cashfree return (India): ?order_id -> verify -> confirm activation.
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id');
    if (!orderId) return;
    (async () => {
      setStatus('Confirming your payment...');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.status === 'PAID') {
          setStatus('SUCCESS. Cashfree payment confirmed and the plan activated. India payments work end to end.');
        } else {
          setStatus('Payment was not completed. Try again.');
        }
      } catch {
        setStatus('Could not confirm the payment.');
      }
      window.history.replaceState({}, '', '/paddle-test');
    })();
  }, []);

  const paddle = usePaddle((name) => {
    if (name === 'checkout.completed') pollActivation();
  });

  const payPaddle = () => {
    if (!PADDLE_TEST_PRICE_ID) {
      setStatus('No Paddle test price configured.');
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

  const payCashfree = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setStatus('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    setStatus('');
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
        body: JSON.stringify({ planId: 'vdr-test', phone: cleanPhone, returnPath: '/paddle-test' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.paymentSessionId) {
        setBusy(false);
        setStatus(json?.cf?.message ? `Cashfree: ${json.cf.message}` : 'Could not start checkout.');
        return;
      }
      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({ mode: json.mode === 'production' ? 'production' : 'sandbox' });
      await cashfree.checkout({ paymentSessionId: json.paymentSessionId, redirectTarget: '_self' });
    } catch {
      setBusy(false);
      setStatus('Could not start checkout.');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Payment test</h1>
      <p className="text-sm text-muted-foreground">
        Hidden page to verify the live payment + activation flow.{' '}
        {isIndia ? 'Pays ₹1 via Cashfree.' : 'Pays $1 via Paddle.'} Activates the Starter tier. Remove
        after testing.
      </p>
      {isIndia ? (
        <>
          <Input
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="max-w-xs"
          />
          <Button onClick={payCashfree} disabled={busy} className="bg-[#4285F4] text-white hover:bg-[#3367d6]">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay ₹1 (test)'}
          </Button>
        </>
      ) : (
        <Button onClick={payPaddle} disabled={busy} className="bg-[#4285F4] text-white hover:bg-[#3367d6]">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay $1 (test)'}
        </Button>
      )}
      {status && <p className="max-w-sm text-sm text-gray-700">{status}</p>}
    </div>
  );
}
