/**
 * Owner-action audit logging (client-safe). Fire-and-forget: an audit write
 * must never break the action it describes. Rows land in audit_logs and show
 * up in the space's Audit log page.
 */

export async function logAudit(evt: {
  spaceId?: string | null;
  action: string;
  resourceName?: string;
  detail?: string;
}): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      space_id: evt.spaceId ?? null,
      actor_email: user.email ?? null,
      action: evt.action,
      resource_name: evt.resourceName ?? null,
      detail: evt.detail ?? null,
    });
  } catch {
    // Table missing (migration not run) or transient error - never block.
  }
}
