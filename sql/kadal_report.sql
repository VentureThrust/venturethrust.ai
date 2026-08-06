-- ============================================================================
-- KADAL SYSTEMS PRIORITY BRIEF  ·  demo investor venturethrust@gmail.com
-- ============================================================================
-- The brief the sales deck walks through, so the deck and the live product
-- show the same startup. The PDF is already uploaded to the vdr-files bucket.
--
-- Safe to re-run. Replaces only this one report row.
-- ============================================================================

do $$
declare
  v_inv uuid;
begin
  select id into v_inv from auth.users where lower(email) = 'venturethrust@gmail.com';
  if v_inv is null then
    raise exception 'No auth user for venturethrust@gmail.com.';
  end if;

  delete from public.dw_reports
   where investor_id = v_inv and startup_name = 'Kadal Systems';

  insert into public.dw_reports
    (id, investor_id, space_id, startup_name, kind, title, period, summary,
     storage_path, size_bytes, sent_at, opened_at)
  select gen_random_uuid(), v_inv,
         (select s.id from public.spaces s where s.name = 'Kadal Systems' limit 1),
         'Kadal Systems', 'priority',
         'Kadal Systems: 240 units sold without subsidy, past the 200 you asked for',
         'August 2026',
         'Full price units 175 to 240, crossing your 200 mark in July. Full price share of volume 9.5 percent to 14.4 percent.',
         'demo/reports/Kadal Systems - Priority brief - Aug 2026.pdf',
         178308, timestamptz '2026-08-04 09:30:00+05:30', null;
end $$;
