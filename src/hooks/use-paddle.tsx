'use client';

import { useEffect, useRef, useState } from 'react';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import { PADDLE_ENV, PADDLE_CLIENT_TOKEN } from '@/lib/paddle';

/**
 * Initialise Paddle.js once and return the instance (null until ready).
 *
 * Pass an optional callback that receives Paddle checkout event names (e.g.
 * 'checkout.completed'). It is kept in a ref so the live callback always sees the
 * latest component state, while Paddle itself is only initialised a single time.
 */
export function usePaddle(onEvent?: (name: string) => void): Paddle | null {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    if (!PADDLE_CLIENT_TOKEN) return;
    let cancelled = false;
    initializePaddle({
      environment: PADDLE_ENV,
      token: PADDLE_CLIENT_TOKEN,
      eventCallback: (e) => cb.current?.(e.name ?? ''),
    })
      .then((p) => {
        if (p && !cancelled) setPaddle(p);
      })
      .catch(() => {
        /* checkout simply stays unavailable if Paddle fails to load */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return paddle;
}
