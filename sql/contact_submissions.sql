-- ===========================================================================
-- contact_submissions
-- Stores messages from the public /contact page (Contact us / Contact sales).
-- The /api/contact route writes here with the SERVICE-ROLE key, which bypasses
-- RLS, so we deliberately add NO anon/authenticated policies. With RLS enabled
-- and no public policies, the table is invisible to everyone except the
-- service role (and a support admin, via the optional policy at the bottom).
--
-- Run this once in the Supabase SQL editor.
-- ===========================================================================

create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  company     text,
  phone       text,
  topic       text not null default 'general',   -- sales | support | general
  message     text not null,
  status      text not null default 'new',        -- new | read | replied | archived
  emailed     boolean not null default false,     -- was the notification email sent
  ip          text,
  user_agent  text
);

-- Newest first when browsing an inbox.
create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- Lock the table down. Inserts happen via the service role (bypasses RLS).
alter table public.contact_submissions enable row level security;

-- ---------------------------------------------------------------------------
-- Optional: let support admins READ submissions, for a future inbox UI.
-- Safe to skip. Only runs if the vt_is_support_admin() helper already exists
-- (created with the support inbox). Idempotent.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_proc where proname = 'vt_is_support_admin') then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'contact_submissions'
        and policyname = 'vt_contact_admin_read'
    ) then
      create policy vt_contact_admin_read on public.contact_submissions
        for select using (public.vt_is_support_admin());
    end if;
  end if;
end $$;
