/**
 * resolveUserByEmail - SERVER ONLY. Given an email, return the VentureThrust
 * account that owns it, or null if no account exists.
 *
 * Checks the fast, indexed `profiles` table first, then falls back to the
 * authoritative auth admin list (so a user whose profile row is missing or has
 * no email is still found). Reads the service-role key, so NEVER import this
 * into a client component - only API route handlers.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type ResolvedUser = { id: string; email: string; name: string | null };

let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!_admin) _admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  return _admin;
}

export async function resolveUserByEmail(emailRaw: string): Promise<ResolvedUser | null> {
  const email = (emailRaw ?? '').trim().toLowerCase();
  if (!email) return null;

  // 1) Fast path: the profiles table (indexed, case-insensitive).
  try {
    const { data } = await admin()
      .from('profiles')
      .select('id, email')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
    if (data?.id) {
      return { id: data.id as string, email: (data.email as string) ?? email, name: null };
    }
  } catch {
    /* a missing column or unreadable row falls through to the auth fallback */
  }

  // 2) Authoritative fallback: scan auth users. Capped at 1000, which is fine at
  //    launch scale; revisit (search API / a synced email index) as we grow.
  try {
    const { data, error } = await admin().auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return null;
    const u = data.users.find((x) => x.email?.toLowerCase() === email);
    if (u) {
      const meta = (u.user_metadata as Record<string, unknown> | undefined) ?? {};
      const name = typeof meta.full_name === 'string' ? meta.full_name : null;
      return { id: u.id, email: u.email ?? email, name };
    }
  } catch {
    /* ignore - treated as "no account" */
  }

  return null;
}
