-- Deal Watch (Investor plan) - Phase 1
--
-- Run once in the Supabase SQL editor. Additive and safe to re-run.
--
-- Tables:
--   dw_watchlist      one row per (investor, startup) the investor watches.
--                     manager_id set = assigned to the account manager.
--   dw_update_events  founder update feed the account manager reviews.
-- Profile columns:
--   is_investor       true only for accounts on the Investor plan (set by
--                     payment webhook later; flip manually for pilot investors:
--                     update profiles set is_investor = true where email = '...';)
--   dw_auto_assign    remembered "always assign to my account manager" choice.

alter table public.profiles
  add column if not exists is_investor boolean not null default false,
  add column if not exists dw_auto_assign boolean;

create table if not exists public.dw_watchlist (
  id           uuid primary key default gen_random_uuid(),
  investor_id  uuid not null,
  founder_id   uuid,
  space_id     uuid,
  file_id      text,
  startup_name text,
  manager_id   uuid,
  created_at   timestamptz not null default now()
);

create unique index if not exists dw_watchlist_uniq
  on public.dw_watchlist (investor_id, coalesce(space_id::text, ''), coalesce(file_id, ''));
create index if not exists dw_watchlist_founder_idx on public.dw_watchlist (founder_id);

create table if not exists public.dw_update_events (
  id          uuid primary key default gen_random_uuid(),
  founder_id  uuid,
  space_id    uuid,
  file_id     text,
  file_name   text,
  event_type  text not null,
  created_at  timestamptz not null default now(),
  seen        boolean not null default false
);

create index if not exists dw_update_events_created_idx
  on public.dw_update_events (created_at desc);

alter table public.dw_watchlist enable row level security;
alter table public.dw_update_events enable row level security;

-- Investors read and manage ONLY their own watchlist rows.
drop policy if exists dw_watchlist_own on public.dw_watchlist;
create policy dw_watchlist_own on public.dw_watchlist
  for all using (auth.uid() = investor_id) with check (auth.uid() = investor_id);

-- dw_update_events has NO public policies on purpose: events are written and
-- read only through the server API routes (service role), which verify the
-- caller is the founder (write) or the account manager (read).
