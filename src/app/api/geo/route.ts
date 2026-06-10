/**
 * /api/geo  →  best-effort IP-based location lookup
 *
 * Returns { location: "City, Country" } or { location: null } when the
 * caller's IP can't be resolved (local network, private IP, lookup failure).
 *
 * Used by the space-viewer page so that, when a visitor enters a space,
 * the owner sees an approximate location alongside the device.
 *
 * Privacy / safety notes:
 *   - We deliberately only store City + Country (no exact lat/long).
 *   - Lookup is rate-limited by IP - 10 / minute is enough for normal
 *     traffic and stops anyone scripting the endpoint for free geolookups.
 *   - Falls back gracefully to `null` on any error so a flaky upstream
 *     can never break session creation.
 *
 * Upstream provider: ipwhois.app (HTTPS, no auth, ~10k/mo free tier).
 * If we outgrow this, drop in a paid MaxMind GeoLite2 binding here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { clientIp, consumeRateLimit } from '@/lib/rate-limit';

// Don't pre-render this route - it needs the live request headers.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = clientIp(req);

  // Rate-limit per IP - geo lookup is cheap but not free, and there's no
  // legitimate reason for one client to call this more than a few times.
  const rate = consumeRateLimit(`geo:${ip}`, 10, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  // Skip lookup for local / private / unknown IPs - they don't resolve
  // to anything meaningful and ipwhois will just return an error.
  const isLocal =
    !ip ||
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

  if (isLocal) {
    return NextResponse.json({ location: null, ip: null });
  }

  try {
    // 2-second timeout - if upstream is slow we'd rather drop the location
    // than block the visitor's session creation.
    const upstream = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2000),
      headers: { 'User-Agent': 'VentureThrust/1.0' },
    });

    if (!upstream.ok) {
      return NextResponse.json({ location: null, ip });
    }

    const data: {
      success?: boolean;
      city?: string;
      region?: string;
      country?: string;
    } = await upstream.json();

    if (!data.success) {
      return NextResponse.json({ location: null, ip });
    }

    // Build a compact "City, Country" string. Skip region - too noisy for
    // the live-viewer UI ("San Francisco, California, USA" wraps badly).
    const parts = [data.city, data.country].filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    );
    const location = parts.length ? parts.join(', ') : null;

    // IP is returned to the browser too - needed by the {{ip-address}}
    // watermark token. Safe to return because the visitor is looking at
    // *their own* IP; the only thing we expose is what they already know.
    return NextResponse.json({ location, ip });
  } catch (err) {
    console.warn('[geo] lookup failed:', err);
    return NextResponse.json({ location: null, ip });
  }
}
