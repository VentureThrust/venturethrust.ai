-- Audit log - one row per owner action (rename, delete, link created, file
-- request created, file updated...). Visitor activity (views, uploads,
-- questions) already comes from viewer_sessions/files/questions; this table
-- covers the OWNER-side actions those tables cannot express.
--
-- Run once in the Supabase SQL editor. Additive and safe to re-run.

create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,           -- workspace owner the event belongs to
  space_id      uuid,           -- null = workspace-level event (e.g. space deleted)
  actor_email   text,
  action        text not null,  -- 'file_deleted' | 'folder_deleted' | 'space_deleted'
                                -- | 'item_renamed' | 'link_created' | 'file_updated'
                                -- | 'file_request_created' | ...
  resource_name text,
  detail        text,
  created_at    timestamptz not null default now()
);

create index if not exists audit_logs_space_idx on public.audit_logs (space_id, created_at desc);
create index if not exists audit_logs_user_idx  on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;
drop policy if exists vt_audit_access on public.audit_logs;
create policy vt_audit_access on public.audit_logs for all to authenticated
  using (
    user_id in (select public.vt_accessible_owner_ids())
    or space_id in (select public.vt_accessible_space_ids())
  )
  with check (
    user_id in (select public.vt_accessible_owner_ids())
  );
