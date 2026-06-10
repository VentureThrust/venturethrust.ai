-- ============================================================================
-- VentureThrust - Row-Level Security, PHASE 1 (core VDR tables)
-- ============================================================================
-- WHAT THIS DOES
--   * Turns on RLS for every core data-room table.
--   * A logged-in user can only ever SELECT/INSERT/UPDATE/DELETE rows that
--     belong to a workspace they can access (their own + any they were invited
--     to via workspace_members + any space shared with them via space_members).
--   * Your service-role API routes (analytics tracking, /shared viewer, file
--     request counts, share-link validation) BYPASS RLS automatically, so they
--     keep working untouched.
--   * The public upload page (/request/[token]) runs as the anon role; it keeps
--     working through three *temporary, minimal* anon policies (clearly marked).
--     Phase 2 replaces that flow with a validated service-role route and drops
--     these.
--
-- SAFE TO RUN: it only changes access rules, never data. An emergency rollback
-- is at the very bottom.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Helper functions. SECURITY DEFINER so they resolve "which workspaces /
--    spaces / people can I see" while bypassing RLS - this avoids recursion
--    when other tables' policies reference spaces / workspace_members.
-- ---------------------------------------------------------------------------

create or replace function public.vt_accessible_owner_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select auth.uid()
  union
  select workspace_owner_id from public.workspace_members
   where member_user_id = auth.uid()
$$;

create or replace function public.vt_accessible_space_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.spaces
   where created_by in (select public.vt_accessible_owner_ids())
  union
  select space_id from public.space_members
   where user_id = auth.uid()
$$;

create or replace function public.vt_coworkspace_user_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select auth.uid()
  union
  select member_user_id   from public.workspace_members
   where workspace_owner_id in (select public.vt_accessible_owner_ids())
  union
  select workspace_owner_id from public.workspace_members
   where member_user_id = auth.uid()
$$;

revoke all on function public.vt_accessible_owner_ids()  from public;
revoke all on function public.vt_accessible_space_ids()  from public;
revoke all on function public.vt_coworkspace_user_ids()  from public;
grant execute on function public.vt_accessible_owner_ids()  to authenticated;
grant execute on function public.vt_accessible_space_ids()  to authenticated;
grant execute on function public.vt_coworkspace_user_ids()  to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Drop any pre-existing policies on the Phase-1 tables, so ONLY the ones
--    below apply (a stray permissive policy would otherwise undo the lock).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  p record;
  tbls text[] := array[
    'spaces','folders','files','file_requests','file_request_uploads',
    'deleted_items','alerts','space_sections','file_permissions',
    'space_questions','space_nodes','space_analytics','space_members',
    'viewer_sessions','file_page_views','file_playback_events',
    'share_links','workspace_members','profiles'
  ];
begin
  foreach t in array tbls loop
    for p in select policyname from pg_policies
              where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3) created_by-owned tables
-- ---------------------------------------------------------------------------
alter table public.spaces enable row level security;
-- IMPORTANT: USING uses a DIRECT created_by check, never a self-referencing
-- subquery on `spaces` - a self-reference breaks INSERT ... RETURNING (which is
-- how the app creates the hidden Content Library space).
create policy "vt_access" on public.spaces for all to authenticated
  using (
    created_by in (select public.vt_accessible_owner_ids())
    or id in (select space_id from public.space_members where user_id = auth.uid())
  )
  with check (created_by in (select public.vt_accessible_owner_ids()));

alter table public.share_links enable row level security;
create policy "vt_access" on public.share_links for all to authenticated
  using      (created_by in (select public.vt_accessible_owner_ids()))
  with check (created_by in (select public.vt_accessible_owner_ids()));

-- ---------------------------------------------------------------------------
-- 4) user_id-owned tables
-- ---------------------------------------------------------------------------
alter table public.folders enable row level security;
create policy "vt_access" on public.folders for all to authenticated
  using      (user_id in (select public.vt_accessible_owner_ids()))
  with check (user_id in (select public.vt_accessible_owner_ids()));

alter table public.deleted_items enable row level security;
create policy "vt_access" on public.deleted_items for all to authenticated
  using      (user_id in (select public.vt_accessible_owner_ids()))
  with check (user_id in (select public.vt_accessible_owner_ids()));

alter table public.alerts enable row level security;
create policy "vt_access" on public.alerts for all to authenticated
  using      (user_id in (select public.vt_accessible_owner_ids()))
  with check (user_id in (select public.vt_accessible_owner_ids()));

alter table public.space_sections enable row level security;
create policy "vt_access" on public.space_sections for all to authenticated
  using      (user_id in (select public.vt_accessible_owner_ids()))
  with check (user_id in (select public.vt_accessible_owner_ids()));

alter table public.file_permissions enable row level security;
create policy "vt_access" on public.file_permissions for all to authenticated
  using      (user_id in (select public.vt_accessible_owner_ids()))
  with check (user_id in (select public.vt_accessible_owner_ids()));

-- ---------------------------------------------------------------------------
-- 5) space_id-owned tables (owner = the space's creator / accessible space)
-- ---------------------------------------------------------------------------
alter table public.space_questions enable row level security;
create policy "vt_access" on public.space_questions for all to authenticated
  using      (space_id in (select public.vt_accessible_space_ids()))
  with check (space_id in (select public.vt_accessible_space_ids()));

alter table public.space_nodes enable row level security;
create policy "vt_access" on public.space_nodes for all to authenticated
  using      (space_id in (select public.vt_accessible_space_ids()))
  with check (space_id in (select public.vt_accessible_space_ids()));

alter table public.space_analytics enable row level security;
create policy "vt_access" on public.space_analytics for all to authenticated
  using      (space_id in (select public.vt_accessible_space_ids()))
  with check (space_id in (select public.vt_accessible_space_ids()));

alter table public.viewer_sessions enable row level security;
create policy "vt_access" on public.viewer_sessions for all to authenticated
  using      (space_id in (select public.vt_accessible_space_ids()))
  with check (space_id in (select public.vt_accessible_space_ids()));

alter table public.file_page_views enable row level security;
create policy "vt_access" on public.file_page_views for all to authenticated
  using      (space_id in (select public.vt_accessible_space_ids()))
  with check (space_id in (select public.vt_accessible_space_ids()));

alter table public.file_playback_events enable row level security;
create policy "vt_access" on public.file_playback_events for all to authenticated
  using      (space_id in (select public.vt_accessible_space_ids()))
  with check (space_id in (select public.vt_accessible_space_ids()));

-- ---------------------------------------------------------------------------
-- 6) membership tables
-- ---------------------------------------------------------------------------
alter table public.workspace_members enable row level security;
create policy "vt_access" on public.workspace_members for all to authenticated
  using      (member_user_id = auth.uid() or workspace_owner_id = auth.uid())
  with check (member_user_id = auth.uid() or workspace_owner_id = auth.uid());

alter table public.space_members enable row level security;
create policy "vt_access" on public.space_members for all to authenticated
  using      (user_id = auth.uid() or space_id in (select public.vt_accessible_space_ids()))
  with check (user_id = auth.uid() or space_id in (select public.vt_accessible_space_ids()));

-- ---------------------------------------------------------------------------
-- 7) profiles - read your own + co-workspace people (names/avatars); write own
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "vt_profile_write_own" on public.profiles for all to authenticated
  using      (id = auth.uid())
  with check (id = auth.uid());
create policy "vt_profile_read_coworkspace" on public.profiles for select to authenticated
  using (id in (select public.vt_coworkspace_user_ids()));

-- ---------------------------------------------------------------------------
-- 8) files - READ/UPDATE/DELETE locked to owner/workspace.
--    Anon INSERT is kept TEMPORARILY so the public upload page keeps working.
--    >>> Phase 2 replaces that with a service-role route and DROPS the temp
--    >>> policy below (closing the "anon can insert any file row" hole).
-- ---------------------------------------------------------------------------
alter table public.files enable row level security;
create policy "vt_access" on public.files for all to authenticated
  using      (user_id in (select public.vt_accessible_owner_ids())
              or space_id in (select public.vt_accessible_space_ids()))
  with check (user_id in (select public.vt_accessible_owner_ids())
              or space_id in (select public.vt_accessible_space_ids()));
create policy "vt_TEMP_anon_upload_insert" on public.files for insert to anon
  with check (true);   -- TEMP (Phase 2 removes)

-- ---------------------------------------------------------------------------
-- 9) file_requests - owner full access; anon may read ACTIVE requests (the
--    public page resolves a request by its token). TEMP until Phase 2 route.
-- ---------------------------------------------------------------------------
alter table public.file_requests enable row level security;
create policy "vt_access" on public.file_requests for all to authenticated
  using      (created_by in (select public.vt_accessible_owner_ids()))
  with check (created_by in (select public.vt_accessible_owner_ids()));
create policy "vt_TEMP_anon_read_active" on public.file_requests for select to anon
  using (is_active = true);   -- TEMP (Phase 2 removes)

-- ---------------------------------------------------------------------------
-- 10) file_request_uploads - anon inserts a tracking row on upload; owners
--     read counts via a service-role route (bypasses RLS), so no authenticated
--     SELECT policy is needed. TEMP until Phase 2 route.
-- ---------------------------------------------------------------------------
alter table public.file_request_uploads enable row level security;
create policy "vt_TEMP_anon_insert" on public.file_request_uploads for insert to anon
  with check (true);   -- TEMP (Phase 2 removes)

-- ============================================================================
-- VERIFY - every table below should show rls_enabled = true
-- ============================================================================
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relkind='r'
  and c.relname in ('spaces','folders','files','file_requests',
    'file_request_uploads','deleted_items','alerts','space_sections',
    'file_permissions','space_questions','space_nodes','space_analytics',
    'space_members','viewer_sessions','file_page_views','file_playback_events',
    'share_links','workspace_members','profiles')
order by c.relrowsecurity, c.relname;

-- ============================================================================
-- EMERGENCY ROLLBACK - run ONLY if the app misbehaves after the above.
-- Re-opens access on the Phase-1 tables so you're unblocked while we tune.
-- ============================================================================
-- do $$
-- declare t text; tbls text[] := array[
--   'spaces','folders','files','file_requests','file_request_uploads',
--   'deleted_items','alerts','space_sections','file_permissions',
--   'space_questions','space_nodes','space_analytics','space_members',
--   'viewer_sessions','file_page_views','file_playback_events',
--   'share_links','workspace_members','profiles'];
-- begin
--   foreach t in array tbls loop
--     execute format('alter table public.%I disable row level security', t);
--   end loop;
-- end $$;
