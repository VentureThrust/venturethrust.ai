-- ============================================================================
-- dw_reports  ·  the reports an account manager has sent an investor
-- ============================================================================
-- One row per delivered report. Two kinds only:
--   priority   a startup crossed the conditions in the investor's own note
--   quarterly  the investor asked for a quarterly on that specific startup
-- Silence is the default. A watchlisted startup with nothing to say has no
-- rows here at all, and that is the product working.
-- ============================================================================

create table if not exists public.dw_reports (
  id            uuid primary key default gen_random_uuid(),
  investor_id   uuid not null references auth.users(id) on delete cascade,
  space_id      uuid references public.spaces(id) on delete set null,
  startup_name  text not null,
  kind          text not null check (kind in ('priority', 'quarterly')),
  title         text not null,
  period        text,
  summary       text,
  storage_path  text not null,
  page_count    int,
  size_bytes    bigint,
  sent_at       timestamptz not null default now(),
  opened_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists dw_reports_investor_sent_idx
  on public.dw_reports (investor_id, sent_at desc);

alter table public.dw_reports enable row level security;

-- An investor reads and marks read only their own reports. Nobody inserts
-- from the browser: reports are written by the account manager tooling with
-- the service role.
drop policy if exists dw_reports_select_own on public.dw_reports;
create policy dw_reports_select_own on public.dw_reports
  for select using (investor_id = auth.uid());

drop policy if exists dw_reports_update_own on public.dw_reports;
create policy dw_reports_update_own on public.dw_reports
  for update using (investor_id = auth.uid())
  with check (investor_id = auth.uid());
