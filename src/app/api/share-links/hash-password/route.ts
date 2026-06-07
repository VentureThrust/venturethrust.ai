/**
 * /api/share-links/hash-password
 *
 * Tiny utility endpoint that bcrypts a password server-side. The client
 * sends the plaintext password over TLS, the server hashes with a strong
 * algorithm (bcrypt, cost factor 10), and returns the hash for the
 * caller to store in share_links.password_hash.
 *
 * Why this instead of hashing client-side?
 *   - bcrypt is intentionally slow & not available in browsers
 *   - SHA-256 (which we used before) is fast and unsalted → vulnerable to
 *     rainbow-table attacks
 *   - Centralising hashing here lets us upgrade the algorithm later
 *     without touching every caller
 *
 * Auth: the request must come from an authenticated session (we check via
 * the Supabase auth helper). This prevents unauthenticated scripts from
 * hammering the endpoint to compute hashes (DoS via expensive CPU work).
 *
 * Rate-limited to 20 hashes per IP per minute.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────
  const ip = clientIp(request);
  const rl = consumeRateLimit(`hash-pw:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  // ── Auth: only signed-in users can compute hashes ──────────────────
  // We verify the caller's auth by sending their session token to Supabase.
  // The supabase-js anon client honours the Authorization header.
  const authHeader = request.headers.get('authorization') || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const authedClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Read + validate payload ────────────────────────────────────────
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const password = body.password;
  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'password is required' }, { status: 400 });
  }
  if (password.length > 256) {
    // Prevent DoS via massive passwords (bcrypt is CPU-bound)
    return NextResponse.json({ error: 'Password too long' }, { status: 400 });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    return NextResponse.json({ hash });
  } catch (err) {
    console.error('[hash-password] bcrypt failed:', err);
    return NextResponse.json({ error: 'Hash failed' }, { status: 500 });
  }
}
