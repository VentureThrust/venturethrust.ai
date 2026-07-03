/**
 * POST /api/deal-watch/message
 *
 * Investor sends a message to their account manager straight from the portal
 * (email + in-app alert to the manager). Investor-plan only.
 *
 * Body: { message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { dwCaller, dwIsInvestor, dwManagerId, dwNotifyManager } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-msg:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const caller = await dwCaller(req);
  if (!caller) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (!(await dwIsInvestor(caller.id))) {
    return NextResponse.json({ error: 'INVESTOR_PLAN_REQUIRED' }, { status: 403 });
  }

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';
  if (!message) return NextResponse.json({ error: 'MESSAGE_REQUIRED' }, { status: 400 });

  await dwNotifyManager({
    managerId: await dwManagerId(),
    alertType: 'dw_message',
    subject: `Deal Watch message from ${caller.email}`,
    message: `Message from investor ${caller.email}: ${message}`,
  });

  return NextResponse.json({ ok: true });
}
