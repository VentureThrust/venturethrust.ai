import { supabase } from './supabaseClient';

/**
 * Multi-workspace model (DocSend-style).
 *
 * A user can belong to several workspaces: their OWN, plus any they've been
 * invited to (rows in workspace_members). At any moment they're "inside" ONE
 * of them - the **active workspace** - chosen via the WorkspaceSwitcher and
 * persisted in localStorage. Every space/folder/file read + write is scoped to
 * the active workspace's owner id.
 *
 * Defaults when nothing is chosen yet:
 *   - if the user owns real spaces → their own workspace
 *   - else if they're a member of one → that invited workspace (pure invitee)
 *   - else → their own
 *
 * The user's identity (profile email) is always their own auth session - only
 * the *data scope* changes with the active workspace.
 */

const ACTIVE_KEY_PREFIX = 'vt_active_workspace_';
const activeKey = (userId: string) => `${ACTIVE_KEY_PREFIX}${userId}`;

let cache: { userId: string; ownerId: string } | null = null;

/** Owner ids of workspaces this user was invited to & joined (excludes self). */
async function getMembershipOwnerIds(userId: string): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_owner_id')
      .eq('member_user_id', userId);
    const ids: string[] = [];
    for (const m of data ?? []) {
      const id = m.workspace_owner_id as string;
      if (id && id !== userId && !ids.includes(id)) ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}

/** Does this user own a real (non-sentinel) space of their own? */
async function ownsRealSpace(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('spaces')
      .select('id')
      .eq('created_by', userId)
      .neq('title', 'CONTENT_LIBRARY')
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/** The active workspace's owner id (what all data scopes to). Cached per user. */
export async function getEffectiveOwnerId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (cache?.userId === user.id) return cache.ownerId;

  let ownerId = user.id;
  try {
    const memberships = await getMembershipOwnerIds(user.id);
    const ownsReal = await ownsRealSpace(user.id);
    // Set when the user self-signed-up or "claimed" their own account.
    const hasOwnAccount = (user.user_metadata as Record<string, unknown> | undefined)?.has_own_account === true;

    // A "pure invitee" - created via an invite, owns no workspace of their own,
    // and hasn't set up their own account. They ONLY ever get the shared
    // workspace. Once they claim their own account (or own a space), they keep
    // access to their personal workspace too.
    const pureInvitee = memberships.length > 0 && !ownsReal && !hasOwnAccount;
    const accessible = pureInvitee ? memberships : [user.id, ...memberships];

    let selected: string | null = null;
    try { selected = localStorage.getItem(activeKey(user.id)); } catch { /* SSR */ }

    if (selected && accessible.includes(selected)) {
      ownerId = selected;
    } else {
      ownerId = pureInvitee
        ? memberships[0]
        : (ownsReal ? user.id : (memberships[0] ?? user.id));
      try { localStorage.setItem(activeKey(user.id), ownerId); } catch { /* SSR */ }
    }
  } catch {
    /* fall back to self */
  }

  cache = { userId: user.id, ownerId };
  return ownerId;
}

/** Synchronously read the saved active workspace id (for UI highlighting). */
export function getActiveWorkspaceId(userId: string): string | null {
  try { return localStorage.getItem(activeKey(userId)); } catch { return null; }
}

/**
 * Switch the active workspace. Persists the choice + clears the cache. The
 * caller should hard-reload afterwards so all providers re-fetch under the new
 * scope.
 */
export function setActiveWorkspace(userId: string, ownerId: string) {
  try { localStorage.setItem(activeKey(userId), ownerId); } catch { /* SSR */ }
  cache = null;
}

export function clearWorkspaceOwnerCache() {
  cache = null;
}
