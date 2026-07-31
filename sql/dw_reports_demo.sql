-- ============================================================================
-- DEAL WATCH REPORTS  ·  demo investor venturethrust@gmail.com
-- ============================================================================
-- Creates the dw_reports table and loads the four reports the account manager
-- has already sent. The PDFs are uploaded to the vdr-files bucket at the same
-- storage_path, so every one of them opens.
--
-- Safe to run on top of an already seeded demo. It replaces only this
-- investor's report rows.
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

drop policy if exists dw_reports_select_own on public.dw_reports;
create policy dw_reports_select_own on public.dw_reports
  for select using (investor_id = auth.uid());

drop policy if exists dw_reports_update_own on public.dw_reports;
create policy dw_reports_update_own on public.dw_reports
  for update using (investor_id = auth.uid())
  with check (investor_id = auth.uid());

do $$
declare
  v_inv uuid;
begin
  select id into v_inv from auth.users where lower(email) = 'venturethrust@gmail.com';
  if v_inv is null then
    raise exception 'No auth user for venturethrust@gmail.com.';
  end if;

  delete from public.dw_reports where investor_id = v_inv;

  -- ── Reports the account manager has already sent ────────────────────────
  -- Nothing for the silent startups. The empty space is the product.
  insert into public.dw_reports
    (id, investor_id, space_id, startup_name, kind, title, period, summary,
     storage_path, size_bytes, sent_at, opened_at)
  select gen_random_uuid(), v_inv,
         (select s.id from public.spaces s where s.name = t.startup limit 1),
         t.startup, t.kind, t.title, t.period,
         t.summary, t.spath, t.sz, t.sent, null
    from (values
      ('Nellara AgriChain','priority','Nellara AgriChain: both your conditions are met','July 2026','Wastage 22 percent to 7.4 percent, gross margin 8 percent to 21 percent. Seed round planned for September.','demo/reports/Nellara AgriChain - Priority brief - Jul 2026.pdf',138417,timestamptz '2026-07-26 09:15:00+05:30'),
      ('Voltaneer','priority','Voltaneer: recurring revenue and sales cycle both past your thresholds','July 2026','Recurring revenue 24 percent to 47 percent, median sales cycle 264 days to 71 days.','demo/reports/Voltaneer - Priority brief - Jul 2026.pdf',148458,timestamptz '2026-07-24 16:40:00+05:30'),
      ('Zylo Health','quarterly','Zylo Health quarterly, Q2 2026','Q2 2026 (Apr to Jun)','Scan volume up 2.4 times, four hospitals live, CDSCO Class B filed on 14 April.','demo/reports/Zylo Health - Quarterly report - Q2 2026.pdf',135679,timestamptz '2026-07-12 11:05:00+05:30'),
      ('Zylo Health','quarterly','Zylo Health quarterly, Q1 2026','Q1 2026 (Jan to Mar)','First quarter after your pass. Volume tripled off a small base, CDSCO still unfiled at quarter end.','demo/reports/Zylo Health - Quarterly report - Q1 2026.pdf',135452,timestamptz '2026-04-11 10:20:00+05:30')
    ) as t(startup, kind, title, period, summary, spath, sz, sent);
end $$;
