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
    // Manual override via ?region=in / ?region=us (persisted), for VPN users or
    // when IP geo is wrong. Lets anyone force their region for pricing/checkout.
    try {
      const param = new URLSearchParams(window.location.search).get('region');
      if (param) localStorage.setItem('vt_region', param);
      const forced = param || localStorage.getItem('vt_region');
      if (forced) {
        setCountryCode(forced.trim().toUpperCase());
        return;
      }
    } catch {
      /* ignore and fall back to geo */
    }
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
