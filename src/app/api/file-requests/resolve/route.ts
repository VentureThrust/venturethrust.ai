/**
 * GET /api/file-requests/resolve?token=...
 *
 * Public, service-role endpoint that validates a file-request token and returns
 * just enough to render the upload page. Replaces the old flow where the public
 * /request/[token] page read `file_requests` + `profiles` directly with the anon
 * key - which forced those tables to stay readable by anon. With this route in
 * place, RLS can lock both tables to owners only.
 *
 * Returns:
 *   { status: 'ok', request: {...}, owner: { displayName, initial } }
 *   { status: 'not_found' | 'inactive' | 'expired' }
 *
 * We intentionally do NOT return the owner's raw email or created_by - the
 * public uploader only needs a display name + initial.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const rate = consumeRateLimit(`fr-resolve:${clientIp(req)}`, 60, 60_000);
  if (!rate.ok) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const token = req.nextUrl.searchParams.get('token')?.trim();
  if (!token) return NextResponse.json({ status: 'not_found' });

  const { data, error } = await supabase
    .from('file_requests')
    .select(
      'id, title, message, created_by, target_folder_id, target_folder_name, target_type, target_space_id, expires_at, is_active',
    )
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ status: 'not_found' });
  if (!data.is_active) return NextResponse.json({ status: 'inactive' });
  if (data.expires_at && new Date(data.expires_at as string) < new Date()) {
    return NextResponse.json({ status: 'expired' });
  }

  // Owner display name - derived from the email local part, not the full email.
  let displayName = 'Owner';
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.created_by)
      .maybeSingle();
    const local = (prof?.email as string | undefined)?.split('@')[0];
    if (local) displayName = local;
  } catch {
    /* fall back to 'Owner' */
  }
  const initial = displayName[0]?.toUpperCase() ?? 'O';

  return NextResponse.json({
    status: 'ok',
    request: {
      id: data.id,
      title: data.title,
      message: data.message,
      target_folder_id: data.target_folder_id,
      target_folder_name: data.target_folder_name,
      target_type: data.target_type,
      target_space_id: data.target_space_id,
    },
    owner: { displayName, initial },
  });
}
