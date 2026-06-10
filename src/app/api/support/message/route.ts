/**
 * POST /api/support/message
 *
 * Posts a message into a support conversation, or closes it. The caller must be
 * the conversation's own user OR a support admin; the sender is set accordingly
 * ('user' vs 'owner'). On the first owner reply the conversation flips to
 * 'live'; a user message to a closed conversation reopens it. Both sides see
 * the new row instantly via Supabase Realtime.
 *
 * Auth: Authorization: Bearer <supabase access token>.
 * Body: { conversationId: string, body?: string, action?: 'close' }
 * Returns: { ok: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`support-message:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let payload: { conversationId?: unknown; body?: unknown; action?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const conversationId = typeof payload.conversationId === 'string' ? payload.conversationId : '';
  const text = (typeof payload.body === 'string' ? payload.body : '').trim().slice(0, 4000);
  const action = typeof payload.action === 'string' ? payload.action : '';
  if (!conversationId) return NextResponse.json({ ok: false, error: 'missing_conversation' }, { status: 400 });

  const { data: conv } = await admin
    .from('support_conversations')
    .select('id, user_id, status')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conv) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  const isAdmin = !!(prof && (prof as { is_admin?: boolean }).is_admin);
  const isParticipant = (conv as { user_id: string }).user_id === user.id;
  if (!isAdmin && !isParticipant) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const nowIso = new Date().toISOString();

  if (action === 'close') {
    if (!isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    await admin.from('support_conversations').update({ status: 'closed', last_message_at: nowIso }).eq('id', conversationId);
    await admin.from('support_messages').insert({
      conversation_id: conversationId,
      sender: 'system',
      body: 'The team marked this conversation as resolved. Send another message to reopen it any time.',
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reopen') {
    if (!isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    await admin.from('support_conversations').update({ status: 'awaiting_human', last_message_at: nowIso }).eq('id', conversationId);
    await admin.from('support_messages').insert({
      conversation_id: conversationId,
      sender: 'system',
      body: 'The team reopened this conversation.',
    });
    return NextResponse.json({ ok: true });
  }

  if (!text) return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 });

  // The customer is whoever opened the conversation; anyone else replying (an
  // admin from the Support Inbox) is staff. Attribution does not rely on the
  // is_admin flag, so each message renders on the correct side for both views.
  const sender = (conv as { user_id: string }).user_id === user.id ? 'user' : 'owner';
  const { error: insErr } = await admin
    .from('support_messages')
    .insert({ conversation_id: conversationId, sender, body: text });
  if (insErr) {
    console.warn('[support/message] insert failed:', insErr.message);
    return NextResponse.json({ ok: false, error: 'insert_failed' }, { status: 500 });
  }

  const status = (conv as { status: string }).status;
  const patch: Record<string, unknown> = { last_message_at: nowIso };
  if (sender === 'owner' && status === 'awaiting_human') patch.status = 'live';
  if (sender === 'user' && status === 'closed') patch.status = 'awaiting_human'; // reopen
  await admin.from('support_conversations').update(patch).eq('id', conversationId);

  return NextResponse.json({ ok: true });
}
