-- ===========================================================================
-- expired_link_attempts
-- Records when someone tries to open an owner's link while the owner's plan is
-- expired (so the link is inactive). Lets the owner see WHO tried, once they
-- renew. Rows are inserted by the SERVICE ROLE (the public link resolvers);
-- owners read only their own via RLS.
--
-- Run this once in the Supabase SQL editor.
-- ===========================================================================

create table if not exists public.expired_link_attempts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null,
  space_id      uuid,
  visitor_email text,
  created_at    timestamptz not null default now()
);

create index if not exists expired_link_attempts_owner_idx
  on public.expired_link_attempts (owner_id, created_at desc);

alter table public.expired_link_attempts enable row level security;

-- Owners read attempts on their own spaces. Inserts come from the service role
-- (which bypasses RLS), so no insert policy is needed.
drop policy if exists "owner reads own expired attempts" on public.expired_link_attempts;
create policy "owner reads own expired attempts" on public.expired_link_attempts
  for select using (owner_id = auth.uid());
