/**
 * Lightweight in-memory rate limiter for Next.js API routes.
 *
 * Suitable for single-instance dev and small prod deployments. For
 * horizontally-scaled prod, swap the in-memory Map for Redis (interface
 * is intentionally similar - `consume(key, limit, windowMs)`).
 *
 * Usage in an API route:
 *   const rate = consumeRateLimit(`notify:${clientIp(request)}`, 10, 60_000);
 *   if (!rate.ok) {
 *     return new NextResponse('Too many requests', {
 *       status: 429,
 *       headers: { 'Retry-After': String(rate.retryAfterSec) },
 *     });
 *   }
 *
 * Threat model this addresses:
 *   - Email-spam abuse via /api/notify-question-answer
 *   - Brute-force passcode guessing on share links
 *   - Token enumeration / scraping
 *   - Generic DoS amplification through expensive endpoints
 */

import { NextRequest } from 'next/server';

type Bucket = {
  count: number;
  windowStartMs: number;
};

// Module-level Map persists across requests within the same Next.js server
// process. Cleared automatically when entries expire.
const buckets = new Map<string, Bucket>();

// Periodically purge expired buckets so the Map doesn't grow unbounded.
// 5-minute interval is fine - the buckets themselves enforce their windows.
if (typeof globalThis !== 'undefined' && !(globalThis as { __rl_cleanup?: NodeJS.Timeout }).__rl_cleanup) {
  (globalThis as { __rl_cleanup?: NodeJS.Timeout }).__rl_cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      // Remove buckets idle for >15 min (safe upper bound vs any window we use)
      if (now - b.windowStartMs > 15 * 60 * 1000) buckets.delete(key);
    }
  }, 5 * 60 * 1000);
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAtMs: number }
  | { ok: false; retryAfterSec: number; resetAtMs: number };

/**
 * Try to consume one token from the bucket identified by `key`.
 * - Allows up to `limit` requests per `windowMs` rolling window.
 * - Returns ok:false with Retry-After hint when exhausted.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartMs >= windowMs) {
    // New window
    buckets.set(key, { count: 1, windowStartMs: now });
    return { ok: true, remaining: limit - 1, resetAtMs: now + windowMs };
  }

  if (existing.count >= limit) {
    const resetAtMs = existing.windowStartMs + windowMs;
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
      resetAtMs,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAtMs: existing.windowStartMs + windowMs,
  };
}

/**
 * Best-effort client IP extraction from common proxy headers.
 * Falls back to a stable "unknown" bucket so abusers can't bypass
 * by stripping headers (still rate-limited as a group).
 */
export function clientIp(req: NextRequest): string {
  // Vercel, most reverse proxies
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();

  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();

  // Cloudflare
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  // Last resort - use a constant; this groups all header-less requests
  // into a single shared bucket which is the conservative choice.
  return 'unknown';
}
