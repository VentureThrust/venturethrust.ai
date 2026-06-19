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
  // Vercel sets this header at the edge on every request: a reliable, instant
  // ISO country code (e.g. 'IN'). This is our PRIMARY signal for payment routing.
  // ipwho.is below only enriches the "City, Country" string for the live viewer.
  const countryCode = req.headers.get('x-vercel-ip-country') || null;

  // Rate-limit per IP - geo lookup is cheap but not free, and there's no
  // legitimate reason for one client to call this more than a few times.
  const rate = consumeRateLimit(`geo:${ip}`, 10, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  // Skip the city lookup for local / private / unknown IPs, but still return the
  // Vercel country header if present.
  const isLocal =
    !ip ||
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

  if (isLocal) {
    return NextResponse.json({ location: null, ip: null, countryCode });
  }

  try {
    // 2-second timeout - if upstream is slow we'd rather drop the location
    // than block the visitor's session creation.
    const upstream = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2000),
      headers: { 'User-Agent': 'VentureThrust/1.0' },
    });

    if (!upstream.ok) {
      return NextResponse.json({ location: null, ip, countryCode });
    }

    const data: {
      success?: boolean;
      city?: string;
      region?: string;
      country?: string;
      country_code?: string;
    } = await upstream.json();

    if (!data.success) {
      return NextResponse.json({ location: null, ip, countryCode });
    }

    // Build a compact "City, Country" string. Skip region - too noisy for
    // the live-viewer UI ("San Francisco, California, USA" wraps badly).
    const parts = [data.city, data.country].filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    );
    const location = parts.length ? parts.join(', ') : null;

    // Prefer the Vercel header for the country code; fall back to ipwho.is.
    return NextResponse.json({
      location,
      ip,
      countryCode: countryCode ?? data.country_code ?? null,
    });
  } catch (err) {
    console.warn('[geo] lookup failed:', err);
    return NextResponse.json({ location: null, ip, countryCode });
  }
}
