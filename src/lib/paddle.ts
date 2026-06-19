/**
 * Paddle (Billing) config - client-safe.
 *
 * The client-side token and price IDs are PUBLISHABLE by design (Paddle.js needs
 * them in the browser bundle), so they live here with env overrides. Real secrets
 * (the webhook signing secret, any API key) are read server-side from process.env
 * and never appear in this file.
 */

export const PADDLE_ENV: 'sandbox' | 'production' =
  (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production') || 'production';

/** Client-side token from Paddle > Developer Tools > Authentication. */
export const PADDLE_CLIENT_TOKEN =
  process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'live_7e0b35f6b55dc26d05832b1a6a0';

/** Our plan tier id -> Paddle price id (monthly, USD). */
export const PADDLE_PRICE_BY_TIER: Record<string, string> = {
  'vdr-starter': 'pri_01kvcyej4zdgwe38evg7g2fg0r',
  'vdr-growth': 'pri_01kvcyq2x90y3h5b57t8brfdyd',
  'vdr-business': 'pri_01kvcyqyst4h6n3fe7c5ack7f3',
};

/**
 * TEMPORARY $1 test price, used by the hidden /paddle-test page to verify the
 * live checkout + webhook without spending real money. Paying it activates the
 * Starter tier. Remove this and /paddle-test once payments are verified.
 * Set via NEXT_PUBLIC_PADDLE_TEST_PRICE_ID, or paste the id below.
 */
export const PADDLE_TEST_PRICE_ID =
  process.env.NEXT_PUBLIC_PADDLE_TEST_PRICE_ID || 'pri_01kvfhk2z63brms5aya7bqmnvy';

/**
 * Paddle SANDBOX config for the hidden /paddle-sandbox page, which verifies the
 * international flow with a TEST card (no real money). Sandbox is a separate
 * Paddle account, so it has its own token + price id + webhook secret.
 * Remove after verifying.
 */
export const PADDLE_SANDBOX_TOKEN = process.env.NEXT_PUBLIC_PADDLE_SANDBOX_TOKEN || '';
export const PADDLE_SANDBOX_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_SANDBOX_PRICE_ID || '';

/** Reverse lookup for the webhook: Paddle price id -> our plan tier id. */
export const TIER_BY_PADDLE_PRICE: Record<string, string> = {
  ...Object.fromEntries(Object.entries(PADDLE_PRICE_BY_TIER).map(([tier, price]) => [price, tier])),
  ...(PADDLE_TEST_PRICE_ID ? { [PADDLE_TEST_PRICE_ID]: 'vdr-starter' } : {}),
  ...(PADDLE_SANDBOX_PRICE_ID ? { [PADDLE_SANDBOX_PRICE_ID]: 'vdr-starter' } : {}),
};
