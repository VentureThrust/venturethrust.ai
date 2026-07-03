/**
 * Deal Watch (Investor plan) - client-safe constants + helpers.
 *
 * The account manager is a single human for now (the owner). Server routes
 * re-verify this independently; the client constant only controls UI
 * visibility (nav items, manager dashboard access).
 */

export const DW_MANAGER_EMAIL = (
  process.env.NEXT_PUBLIC_DW_MANAGER_EMAIL ?? 'omprakash@venturethrust.com'
).toLowerCase();

export type DealWatchEventType = 'file_added' | 'file_updated' | 'file_deleted';

/**
 * Fire-and-forget founder-update event. Called after a founder uploads or
 * updates a file. The server decides whether anyone is actually watching this
 * founder; if not it is a no-op. Never blocks or throws into the upload flow.
 */
export async function fireDealWatchEvent(payload: {
  spaceId?: string;
  fileId?: string;
  fileName: string;
  eventType: DealWatchEventType;
}): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch('/api/deal-watch/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Monitoring must never break uploads.
  }
}
