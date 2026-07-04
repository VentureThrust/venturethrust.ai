/**
 * /api/deal-watch/enquiries - the manager's enquiry inbox.
 *
 * contact_submissions is service-role-only by design (no public RLS
 * policies), so this manager-gated route is how the owner reads the
 * enquiries made through Talk to sales / Get a demo call / Contact us.
 *
 * GET  -> { enquiries: [...] } newest first (limit 200)
 * POST -> { id, status } to mark read | replied | archived
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';
import { DW_MANAGER_EMAIL } from '@/lib/deal-watch';
import { dwAdmin, dwCaller } from '@/lib/deal-watch-server';

export const dynamic = 'force-dynamic';

async function requireManager(req: NextRequest) {
  const caller = await dwCaller(req);
  if (!caller) return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };
  if (caller.email !== DW_MANAGER_EMAIL) {
    return { error: NextResponse.json({ error: 'NOT_MANAGER' }, { status: 403 }) };
  }
  return { caller };
}

export async function GET(req: NextRequest) {
  const rl = consumeRateLimit(`dw-enquiries:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const gate = await requireManager(req);
  if ('error' in gate) return gate.error;

  const { data, error } = await dwAdmin
    .from('contact_submissions')
    .select('id, created_at, name, email, company, phone, topic, message, status')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ enquiries: data ?? [] });
}

export async function POST(req: NextRequest) {
  const rl = consumeRateLimit(`dw-enquiries-w:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return new NextResponse('Too many requests', { status: 429 });

  const gate = await requireManager(req);
  if ('error' in gate) return gate.error;

  let body: { id?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const status = typeof body.status === 'string' ? body.status : '';
  if (!id || !['new', 'read', 'replied', 'archived'].includes(status)) {
    return NextResponse.json({ error: 'BAD_INPUT' }, { status: 400 });
  }
  const { error } = await dwAdmin.from('contact_submissions').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
