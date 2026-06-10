/**
 * POST /api/support/chat
 *
 * The AI support assistant: a grounded VentureThrust help bot. Calls the
 * Anthropic Messages API SERVER-SIDE (the key never reaches the browser, so
 * there is no CSP impact), answering only from the product knowledge in the
 * system prompt and pointing users at the human-ticket path when it cannot
 * help.
 *
 * Auth: Authorization: Bearer <supabase access token> (signed-in users only).
 * Body: { messages: { role: 'user' | 'assistant'; content: string }[] }
 * Returns: { ok: true, reply: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Swap to 'claude-haiku-4-5' for a cheaper, faster bot on high support volume.
const SUPPORT_MODEL = 'claude-opus-4-8';
const MAX_TURNS = 16; // cap how much history we forward upstream

const BASE_PROMPT = `You are the support assistant for VentureThrust, a secure Virtual Data Room (VDR) product (similar to DocSend). You help signed-in users use the product.

What VentureThrust does:
- Spaces are secure data rooms. Users add files and folders, then share them with a secure link.
- A share link can be gated with an NDA, a password, or an expiry date, and limited to specific email addresses.
- Owners get analytics: views, time spent on each page, and exactly who opened what, in real time.
- File requests let an owner collect documents from someone else via a link.
- Q&A lets a viewer ask questions on a shared space; the owner answers and the asker is notified.
- Security: documents are private by default and isolated per account, with optional dynamic watermarks (email and IP) and screenshot deterrents on shared views.
- Plans are chosen on the plan page and billed securely through Cashfree; a plan stays active for its billing cycle and is then renewed. For exact current prices, point the user to the plan page rather than quoting a number.
- AI due diligence is coming soon and is NOT available yet. Do not promise it or describe it as live.

How to answer:
- Be concise, friendly, and direct. Give the answer in a sentence or two, with short numbered steps only if needed.
- Answer ONLY from the facts above plus general product common sense. Never invent features, prices, limits, or settings. If you are unsure, say so plainly.
- You have NO access to the user's account, files, analytics, or billing records. For anything account-specific (a charge, a missing file, a bug only they can see, a refund), tell them to use the "Talk to a human" option to send a message, and that the team replies to their account email.
- If a request is out of scope (legal or financial advice, or anything unrelated to VentureThrust), politely decline and suggest the human option.
- If you cannot fully resolve the issue, or the user asks to speak to a person, reassure them and tell them to tap the "Talk to a human" button below, which connects them straight to the team.
- Respond with only your answer to the user. Do not include exploratory reasoning, internal notes, or meta-commentary about your process.`;

type InMsg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const rate = consumeRateLimit(`support-chat:${clientIp(req)}`, 20, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  // Signed-in users only (the assistant lives in the authenticated app).
  const authHeader = req.headers.get('authorization') ?? '';
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const arr = Array.isArray((raw as { messages?: unknown })?.messages)
    ? ((raw as { messages: unknown[] }).messages)
    : [];
  const messages: InMsg[] = [];
  for (const m of arr) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
      messages.push({ role, content: content.slice(0, 4000) });
    }
  }
  const trimmed = messages.slice(-MAX_TURNS);
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== 'user') {
    return NextResponse.json({ ok: false, error: 'no_user_message' }, { status: 400 });
  }

  // Load the editable knowledge base (best-effort; falls back to BASE_PROMPT if
  // the support_kb table has not been created yet).
  let system = BASE_PROMPT;
  try {
    const { data: kb } = await authed
      .from('support_kb')
      .select('title, body')
      .eq('is_active', true)
      .order('sort', { ascending: true });
    if (kb && kb.length > 0) {
      system +=
        '\n\nKnowledge base (answer from this and do not contradict it):\n' +
        kb
          .map((e) => `## ${(e as { title: string }).title}\n${(e as { body: string }).body}`)
          .join('\n\n');
    }
  } catch {
    /* table missing or unreadable; keep the base prompt */
  }

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: SUPPORT_MODEL,
        max_tokens: 1024,
        system,
        messages: trimmed,
      }),
    });

    const data = (await aiRes.json().catch(() => ({}))) as { content?: unknown };
    if (!aiRes.ok) {
      console.warn('[support/chat] anthropic error', aiRes.status, JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ ok: false, error: 'assistant_unavailable' }, { status: 502 });
    }

    let reply = '';
    if (Array.isArray(data.content)) {
      reply = data.content
        .map((b) => (b as { type?: unknown; text?: unknown }))
        .filter((b) => b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text as string)
        .join('')
        .trim();
    }

    return NextResponse.json({
      ok: true,
      reply:
        reply ||
        'Sorry, I could not generate a reply just now. Please use the "Talk to a human" option and the team will help.',
    });
  } catch (err) {
    console.error('[support/chat]', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
