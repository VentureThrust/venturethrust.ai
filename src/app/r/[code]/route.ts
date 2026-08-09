/**
 * /r/<code> - short link for a share link.
 *
 * A share link token is 32 characters, which is right for something guessed at
 * but wrong for something typed into an email to a stranger. This resolves a
 * short human code to the real token and redirects, so /r/larkspur opens the
 * same page as /shared/<32 chars> with every gate and every counter intact.
 *
 * The code is matched against share_links.link_name, so naming a link in the
 * app is all it takes to give it a short URL. No new table, no new column.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Anonymous visitors cannot read share_links under RLS, and this route hands
// back nothing but a redirect, so the service role is safe here.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const clean = (code ?? '').trim().toLowerCase();
  const origin = new URL(req.url).origin;

  if (!clean || clean.length > 64) {
    return NextResponse.redirect(`${origin}/`, 302);
  }

  const { data } = await admin
    .from('share_links')
    .select('token, is_active')
    .ilike('link_name', clean)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!data?.token) {
    return NextResponse.redirect(`${origin}/`, 302);
  }

  // 302 rather than 301: a permanent redirect gets cached by the browser and
  // by mail clients, and this mapping is allowed to change.
  return NextResponse.redirect(`${origin}/shared/${data.token as string}`, 302);
}
