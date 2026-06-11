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

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Free access does not expire on its own. A far-future date keeps it "active"
// under the (strict) plan gate, which requires a future plan_expires_at.
const FAR_FUTURE = '2099-12-31T23:59:59.000Z';

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

    const { error } = await admin.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? null,
        plan: 'vdr_only',
        plan_status: 'free',
        plan_expires_at: FAR_FUTURE,
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
