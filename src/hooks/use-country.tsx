'use client';

import { useEffect, useState } from 'react';

/**
 * Best-effort visitor country via /api/geo (IP lookup). Used to route payments:
 * India -> Cashfree (INR), everyone else -> Paddle (USD). Defaults to non-India
 * until the lookup resolves, so the common (international) path shows first.
 */
export function useCountry(): { countryCode: string | null; isIndia: boolean } {
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/geo')
      .then((r) => r.json())
      .then((d) => {
        if (active) setCountryCode((d?.countryCode as string | undefined) ?? null);
      })
      .catch(() => {
        /* leave as null -> treated as non-India */
      });
    return () => {
      active = false;
    };
  }, []);

  return { countryCode, isIndia: countryCode === 'IN' };
}
