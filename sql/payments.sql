-- ============================================================================
-- VentureThrust - Cashfree payments schema
-- ============================================================================
-- Run this ONCE in Supabase (SQL editor). It creates:
--   1. public.payments        - one row per Cashfree order (pending -> paid)
--   2. profiles.plan_status    - 'active' once a paid plan is live
--   3. profiles.plan_expires_at- when the current paid cycle ends (+30 days)
--
-- Writes happen ONLY from the server (service-role key) in /api/payments/*,
-- which bypasses RLS. So the table has RLS ON with a single owner-read policy
-- (so a user can see their own billing history) and NO insert/update policy
-- for the public - the public can never forge or alter a payment row.
-- ============================================================================

create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  plan_id     text not null,            -- 'vdr-starter' | 'vdr-growth' | 'vdr-business'
  plan_key    text not null,            -- maps to profiles.plan ('vdr_only')
  amount      integer not null,         -- INR, whole rupees
  currency    text not null default 'INR',
  cf_order_id text not null unique,     -- Cashfree order_id (lookup key for verify/webhook)
  status      text not null default 'PENDING',  -- PENDING | PAID | FAILED
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists payments_user_id_idx  on public.payments (user_id);
create index if not exists payments_cf_order_idx  on public.payments (cf_order_id);

-- Plan lifecycle columns on profiles (no-ops if they already exist).
alter table public.profiles add column if not exists plan_status     text;
alter table public.profiles add column if not exists plan_expires_at timestamptz;

-- ── RLS: owner-read only; all writes are server-side (service role) ─────────
alter table public.payments enable row level security;

drop policy if exists "Owner reads own payments" on public.payments;
create policy "Owner reads own payments" on public.payments
  for select to authenticated
  using (user_id = auth.uid());

-- VERIFY - expect the payments table to exist with rls_enabled = true,
-- exactly one (SELECT, authenticated) policy, and the two new profiles columns.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'payments';

select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'payments';

select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('plan_status', 'plan_expires_at')
order by column_name;
