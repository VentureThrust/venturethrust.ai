-- Deal Watch custom offers (enterprise-style quotes).
--
-- The account manager creates an offer for an investor's email (seats +
-- discount). When that investor opens VentureThrust, the plan page shows a
-- "Made for you" card with the quoted price; one click pays it through the
-- normal rails. Writes happen via the service role; investors can only READ
-- offers addressed to their own login email.
--
-- Run once in the Supabase SQL editor. Additive and safe to re-run.

create table if not exists public.dw_offers (
  id                   uuid primary key default gen_random_uuid(),
  investor_email       text not null,
  seats                integer not null default 1,
  discount_pct         numeric not null default 0,
  price_usd            numeric not null,
  price_inr            numeric not null,
  paddle_discount_code text,          -- optional Paddle discount code for non-India checkout
  note                 text,
  status               text not null default 'open',   -- open | paid | expired
  created_at           timestamptz not null default now()
);

create index if not exists dw_offers_email_idx
  on public.dw_offers (lower(investor_email), status);

alter table public.dw_offers enable row level security;
drop policy if exists dw_offers_own_read on public.dw_offers;
create policy dw_offers_own_read on public.dw_offers
  for select to authenticated
  using (lower(investor_email) = lower(coalesce(auth.email(), '')));
-- No insert/update policies: the manager writes through the service role.
