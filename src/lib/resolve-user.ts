/**
 * resolveUserByEmail - SERVER ONLY. Given an email, return the VentureThrust
 * account that owns it, or null if no account exists.
 *
 * IMPORTANT: we resolve against the AUTH user list first, because the id we
 * return is used as alerts.user_id, and the invitee reads their notifications /
 * "Shared with me" with that same auth id. The `profiles` table is only a cache
 * and can be stale (e.g. an old row left behind after a re-signup), so trusting
 * it for the id can produce an alert nobody can see. profiles is the fallback.
 *
 * Reads the service-role key, so NEVER import this into a client component -
 * only API route handlers.
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

  // 1) Authoritative: the auth user list. This id is what signed-in requests
  //    and RLS use, so it is the only id that makes a notification visible.
  //    Capped at 1000, which is fine at launch scale; revisit as we grow.
  try {
    const { data, error } = await admin().auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (!error) {
      const u = data.users.find((x) => x.email?.toLowerCase() === email);
      if (u) {
        const meta = (u.user_metadata as Record<string, unknown> | undefined) ?? {};
        const name = typeof meta.full_name === 'string' ? meta.full_name : null;
        return { id: u.id, email: u.email ?? email, name };
      }
    }
  } catch {
    /* fall through to the profiles cache */
  }

  // 2) Fallback: the profiles table (profiles.id is the auth uid in this app).
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
    /* ignore - treated as "no account" */
  }

  return null;
}
