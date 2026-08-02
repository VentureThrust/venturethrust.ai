-- ============================================================================
-- IIMK LIVE DEMONSTRATION DATA ROOM
-- ============================================================================
-- Owner: omprakashborkar611@gmail.com
--
-- The room shown to IIM Kozhikode LIVE as a prospective data room customer.
-- Institutional figures are IIMK LIVE's own published numbers. The six cohort
-- companies are invented and every generated page carries a SAMPLE footer.
--
-- Touches nothing else on this account. Safe to re-run.
-- ============================================================================

do $$
declare
  v_own uuid;
  s_id  uuid;
begin
  select id into v_own from auth.users where lower(email) = 'omprakashborkar611@gmail.com';
  if v_own is null then
    raise exception 'No auth user for omprakashborkar611@gmail.com.';
  end if;

  -- Without an active plan the app sends this account to the pricing page
  -- instead of the workspace, because PlanGate checks isPlanActive before it
  -- lets anyone into the app shell. A demo account has to be past that gate.
  update public.profiles
     set plan = 'vdr_ai',
         plan_status = 'active',
         plan_expires_at = greatest(coalesce(plan_expires_at, now()), now() + interval '730 days')
   where id = v_own;

  -- Remove only a previous copy of this one room.
  select id into s_id from public.spaces
   where name = 'IIMK LIVE  ·  Cohort Investor Room (demonstration)' and created_by = v_own limit 1;
  if s_id is not null then
    delete from public.files   where space_id = s_id;
    delete from public.folders where space_id = s_id;
    delete from public.share_links where space_id = s_id;
    delete from public.spaces  where id = s_id;
  end if;

  s_id := gen_random_uuid();

  insert into public.spaces (id, name, title, description, created_by)
  values (s_id, 'IIMK LIVE  ·  Cohort Investor Room (demonstration)', 'IIMK LIVE  ·  Cohort Investor Room (demonstration)',
          'How IIMK LIVE could share IDEA VAULT Cohort 1 with its investor network, with every open visible. A VentureThrust demonstration. Institutional figures are IIMK LIVE''s published numbers; the cohort companies are sample data.', v_own);

  insert into public.folders (id, user_id, name, space_id, parent_id, position)
  select gen_random_uuid(), v_own, fol, s_id, null, ord
    from unnest(array['01 About IIMK LIVE', '02 Cohort Snapshot', '03 Startup Profiles', '04 Investor Process', '05 Programme and Compliance']) with ordinality as u(fol, ord);

  insert into public.files
    (id, user_id, folder_id, space_id, name, type, storage_path,
     size_bytes, views, position, created_at)
  select gen_random_uuid()::text, v_own, fo.id, s_id, t.fname, t.ftype,
         'demo/iimk-live/' || t.fname, t.sz, t.vws, t.pos,
         now() - (t.age || ' days')::interval
    from (values
      ('01 About IIMK LIVE','IIMK LIVE Overview.pdf','PDF',3438,0,1,2),
      ('01 About IIMK LIVE','Programmes and Funding.pdf','PDF',3616,5,2,5),
      ('01 About IIMK LIVE','Leadership and Investment Committee.pdf','PDF',3424,10,3,8),
      ('02 Cohort Snapshot','Cohort Snapshot.pdf','PDF',3597,15,1,11),
      ('02 Cohort Snapshot','Cohort Companies.xlsx','Sheet',5690,20,2,14),
      ('02 Cohort Snapshot','Cohort Metrics.xlsx','Sheet',5656,25,3,17),
      ('03 Startup Profiles','Aether Semiconductors.pdf','PDF',2971,30,1,20),
      ('03 Startup Profiles','Verdant Climate.pdf','PDF',2969,4,2,23),
      ('03 Startup Profiles','Orbitfall Systems.pdf','PDF',2954,9,3,26),
      ('03 Startup Profiles','Praan Robotics.pdf','PDF',2944,14,4,3),
      ('03 Startup Profiles','Quantiva.pdf','PDF',2880,19,5,6),
      ('03 Startup Profiles','Sarva Health AI.pdf','PDF',2917,24,6,9),
      ('04 Investor Process','Matching Investment Program.pdf','PDF',3824,29,1,12),
      ('04 Investor Process','Investor Engagement Record.xlsx','Sheet',5816,3,2,15),
      ('04 Investor Process','Investment Committee Process.pdf','PDF',2880,8,3,18),
      ('04 Investor Process','How to Request Access.pdf','PDF',2863,13,4,21),
      ('05 Programme and Compliance','DST Recognition and Governance.pdf','PDF',3160,18,1,24),
      ('05 Programme and Compliance','Incubation Agreement Template.pdf','PDF',2840,23,2,27),
      ('05 Programme and Compliance','Data Sharing and Consent.pdf','PDF',2863,28,3,4)
    ) as t(fol, fname, ftype, sz, vws, pos, age)
    join public.folders fo on fo.space_id = s_id and fo.name = t.fol;
end $$;
