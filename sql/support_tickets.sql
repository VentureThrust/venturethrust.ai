-- ============================================================================
-- VentureThrust - support tickets
-- ============================================================================
-- Backs the in-app Support panel. The /api/support route (service role) writes
-- rows here AND emails you via Zoho, so a request is never lost even if this
-- table does not exist yet (the insert is best-effort, the email is the
-- source of truth).
--
-- RLS: writes are server-side only (service role bypasses RLS). A user can read
-- their OWN tickets (so a future "my requests" view works); nobody else can.
-- Safe to run once.
-- ============================================================================

create table if not exists public.support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  email      text,
  subject    text,
  category   text not null default 'general',
  message    text not null,
  status     text not null default 'open',   -- open | closed
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx    on public.support_tickets (user_id);
create index if not exists support_tickets_created_idx on public.support_tickets (created_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "Owner reads own tickets" on public.support_tickets;
create policy "Owner reads own tickets" on public.support_tickets
  for select to authenticated
  using (user_id = auth.uid());

-- VERIFY - table exists with RLS on, and exactly one (SELECT, authenticated) policy.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'support_tickets';

select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'support_tickets';
