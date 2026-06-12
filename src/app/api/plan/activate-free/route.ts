/**
 * POST /api/plan/activate-free
 *
 * Activates the free early-access VDR plan for the signed-in user. No payment.
 * Stamps the profile with a non-expiring (far-future) window so the plan gate
 * treats it as active. Uses the service role so the write does not depend on
 * profile RLS policies.
 *
 * Auth: Authorization: Bearer <supabase access token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// The free plan is a 7-day trial. After it lapses the plan gate sends the user
// back to choose a plan, and the device fingerprint blocks re-claiming the
// trial with a fresh email on the same device.
const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
    } = await authed.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    // ── One free plan per device ────────────────────────────────────────────
    // Device fingerprint stops someone claiming the free plan repeatedly with
    // throwaway emails on the same machine. Fails open if the table is missing
    // (run the free_plan_claims migration to switch enforcement on).
    let fingerprint = '';
    try {
      const body = await req.json();
      fingerprint = typeof body?.fingerprint === 'string' ? body.fingerprint.slice(0, 64) : '';
    } catch {
      /* no body / not JSON - skip fingerprint check */
    }
    if (fingerprint) {
      try {
        const { data: claim } = await admin
          .from('free_plan_claims')
          .select('user_id')
          .eq('fingerprint', fingerprint)
          .maybeSingle();
        if (claim && (claim as { user_id?: string }).user_id !== user.id) {
          return NextResponse.json({ ok: false, error: 'device_used' }, { status: 403 });
        }
        if (!claim) {
          await admin.from('free_plan_claims').insert({
            fingerprint,
            user_id: user.id,
            ip: clientIp(req),
          });
        }
      } catch (err) {
        console.warn('[plan/activate-free] fingerprint check skipped:', (err as Error)?.message);
      }
    }

    const { error } = await admin.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? null,
        plan: 'vdr_only',
        plan_status: 'free',
        plan_expires_at: new Date(Date.now() + TRIAL_MS).toISOString(),
      },
      { onConflict: 'id' },
    );
    if (error) {
      console.warn('[plan/activate-free]', error.message);
      return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[plan/activate-free]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
