/**
 * POST /api/share-links/space-status
 *
 * Lightweight check used by the space viewer on load: is the space's owner plan
 * still active? Returns { active }. Fails OPEN (active:true) on any error or
 * rate limit, so a paying owner's room is never wrongly blocked.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { getSpaceOwner, isOwnerPlanActive } from '@/lib/owner-plan';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`space-status:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ active: true });

  let spaceId = '';
  try {
    const b = await req.json();
    spaceId = String(b.spaceId ?? '').trim();
  } catch {
    return NextResponse.json({ active: true });
  }
  if (!spaceId) return NextResponse.json({ active: true });

  const ownerId = await getSpaceOwner(admin, spaceId);
  const active = await isOwnerPlanActive(admin, ownerId);
  return NextResponse.json({ active });
}
