/**
 * Short-lived store for invitee login codes (and the matching admin magic-link
 * token_hash that establishes the session once the code is verified).
 *
 * We email the user a 6-digit code, verify it OURSELVES here, then hand back the
 * paired `tokenHash` for the client to exchange via
 *   supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
 *
 * This keeps ALL invitee sign-in on one reliable Supabase path (token_hash) and
 * never depends on the Supabase email template or a guessed OTP `type`.
 *
 * Module-level Map persists across requests within the same server process
 * (same model as lib/rate-limit.ts). Fine for single-instance dev/small prod;
 * swap for Redis if you scale horizontally.
 */

type Entry = {
  code: string;
  tokenHash: string;
  ownerId: string;
  expiresAt: number;
  attempts: number;
};

const TTL_MS = 10 * 60 * 1000; // codes valid for 10 minutes
const MAX_ATTEMPTS = 5;

const store = new Map<string, Entry>();

// Periodically purge expired entries so the Map doesn't grow unbounded.
if (typeof globalThis !== 'undefined' && !(globalThis as { __lc_cleanup?: NodeJS.Timeout }).__lc_cleanup) {
  (globalThis as { __lc_cleanup?: NodeJS.Timeout }).__lc_cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, e] of store) {
      if (now > e.expiresAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function putLoginCode(
  email: string,
  data: { code: string; tokenHash: string; ownerId: string },
): void {
  store.set(email.trim().toLowerCase(), {
    ...data,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
  });
}

export type TakeResult =
  | { ok: true; tokenHash: string; ownerId: string }
  | { ok: false; reason: 'none' | 'expired' | 'locked' | 'mismatch' };

export function takeLoginCode(email: string, code: string): TakeResult {
  const key = email.trim().toLowerCase();
  const entry = store.get(key);
  if (!entry) return { ok: false, reason: 'none' };

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return { ok: false, reason: 'expired' };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(key);
    return { ok: false, reason: 'locked' };
  }
  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    return { ok: false, reason: 'mismatch' };
  }

  store.delete(key); // single use
  return { ok: true, tokenHash: entry.tokenHash, ownerId: entry.ownerId };
}
