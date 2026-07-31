-- ============================================================================
-- DEMO INVESTOR ACCOUNT  ·  venturethrust@gmail.com
-- ============================================================================
-- Wipes everything that account owns, turns it into an Investor-plan account,
-- and loads five watched startups with investor-grade notes, history, and
-- founder update events, so the account can be shown live to an investor.
--
-- Run the whole file at once in the Supabase SQL editor.
-- Safe to re-run: it wipes and rebuilds the same demo every time.
--
-- STEP 0 (optional): see what is about to be deleted.
--   select 'spaces' t, count(*) from spaces where created_by =
--     (select id from auth.users where lower(email)='venturethrust@gmail.com')
--   union all select 'files', count(*) from files where user_id =
--     (select id from auth.users where lower(email)='venturethrust@gmail.com');
-- ============================================================================

do $$
declare
  v_uid    uuid;   -- the demo investor
  v_mgr    uuid;   -- the account manager (omprakash@venturethrust.com)
  s_bean   uuid := gen_random_uuid();
  s_zylo   uuid := gen_random_uuid();
  s_karta  uuid := gen_random_uuid();
  s_meraki uuid := gen_random_uuid();
  s_anvaya uuid := gen_random_uuid();
begin
  select id into v_uid from auth.users where lower(email) = 'venturethrust@gmail.com';
  if v_uid is null then
    raise exception 'No auth user for venturethrust@gmail.com. Sign up with that email first.';
  end if;

  select id into v_mgr from public.profiles where lower(email) = 'omprakash@venturethrust.com';

  -- ── 1. WIPE everything this account owns ────────────────────────────────
  -- Child rows first so foreign keys never block the delete. Each table is
  -- guarded, so a schema without that table is skipped instead of erroring.

  if to_regclass('public.file_request_uploads') is not null then
    delete from public.file_request_uploads
     where file_request_id in (select id from public.file_requests where created_by = v_uid);
  end if;
  if to_regclass('public.file_requests') is not null then
    delete from public.file_requests where created_by = v_uid;
  end if;
  if to_regclass('public.share_link_access_logs') is not null then
    delete from public.share_link_access_logs
     where share_link_id in (
       select id from public.share_links
        where space_id in (select id from public.spaces where created_by = v_uid)
     );
  end if;
  if to_regclass('public.share_links') is not null then
    delete from public.share_links
     where space_id in (select id from public.spaces where created_by = v_uid)
        or file_id in (select id from public.files where user_id = v_uid);
  end if;
  if to_regclass('public.visits') is not null then
    delete from public.visits
     where space_id in (select id from public.spaces where created_by = v_uid);
  end if;
  if to_regclass('public.questions') is not null then
    delete from public.questions
     where space_id in (select id from public.spaces where created_by = v_uid);
  end if;
  if to_regclass('public.signatures') is not null then
    delete from public.signatures
     where file_id in (select id from public.files where user_id = v_uid);
  end if;
  if to_regclass('public.files') is not null then
    delete from public.files where user_id = v_uid;
  end if;
  if to_regclass('public.folders') is not null then
    delete from public.folders where user_id = v_uid;
  end if;
  if to_regclass('public.spaces') is not null then
    delete from public.spaces where created_by = v_uid;
  end if;
  if to_regclass('public.dw_update_events') is not null then
    delete from public.dw_update_events where founder_id = v_uid;
  end if;
  if to_regclass('public.dw_watchlist') is not null then
    delete from public.dw_watchlist where investor_id = v_uid or founder_id = v_uid;
  end if;
  if to_regclass('public.alerts') is not null then
    delete from public.alerts where user_id = v_uid;
  end if;
  if to_regclass('public.audit_logs') is not null then
    delete from public.audit_logs where user_id = v_uid;
  end if;
  if to_regclass('public.support_tickets') is not null then
    delete from public.support_tickets where user_id = v_uid;
  end if;
  if to_regclass('public.dw_offers') is not null then
    delete from public.dw_offers where lower(investor_email) = 'venturethrust@gmail.com';
  end if;

  -- ── 2. Make it a full Investor-plan account ─────────────────────────────
  update public.profiles
     set is_investor      = true,
         plan             = 'vdr_ai',
         plan_status      = 'active',
         plan_expires_at  = now() + interval '365 days',
         dw_auto_assign   = true
   where id = v_uid;

  -- ── 3. The five watched startups, as real spaces ────────────────────────
  -- Owned by the demo account so every "open the data room" link resolves
  -- during a live demo instead of 404ing.

  insert into public.spaces (id, name, title, description, created_by) values
    (s_bean,   'BeanBridge',      'BeanBridge',      'B2B marketplace where Indian cafes and roasters buy coffee beans directly from domestic estates. Quality grading and logistics handled by the platform. Revenue is commission per order plus annual supply contracts.', v_uid),
    (s_zylo,   'Zylo Health',     'Zylo Health',     'AI-assisted radiology triage for tier-2 and tier-3 hospitals. Flags urgent scans first so a single radiologist can cover more hospitals. Sold per scan on an annual hospital contract.', v_uid),
    (s_karta,  'Karta Logistics', 'Karta Logistics', 'Intra-city B2B freight matching for manufacturers and distributors in Pune. Fills empty return trips. Revenue is a take rate on every load moved.', v_uid),
    (s_meraki, 'Meraki Looms',    'Meraki Looms',    'Direct-to-consumer handloom label working with 140 weaver families in Kerala. Sells through its own site and two marketplaces. Margin comes from cutting out three layers of middlemen.', v_uid),
    (s_anvaya, 'Anvaya HR',       'Anvaya HR',       'Labour law and payroll compliance software for Indian SMEs under 200 employees. Automates PF, ESI, PT and shops-and-establishments filings. Annual subscription per company.', v_uid);

  insert into public.folders (id, user_id, name, space_id, parent_id) values
    (gen_random_uuid(), v_uid, 'Root', s_bean,   null),
    (gen_random_uuid(), v_uid, 'Root', s_zylo,   null),
    (gen_random_uuid(), v_uid, 'Root', s_karta,  null),
    (gen_random_uuid(), v_uid, 'Root', s_meraki, null),
    (gen_random_uuid(), v_uid, 'Root', s_anvaya, null);

  -- ── 4. The watchlist, with the notes an investor would actually write ───

  insert into public.dw_watchlist
    (id, investor_id, founder_id, space_id, file_id, startup_name, manager_id, note, quarterly_report, created_at)
  values
    (gen_random_uuid(), v_uid, null, s_bean, null, 'BeanBridge', v_mgr,
     'Passed at pre-seed in March 2026. Unit economics were broken: CAC of Rs 9,400 against a first order of about Rs 1,000, and repeat order rate only 34%. The domestic sourcing thesis is right, but they were buying growth. Come back to me when repeat orders cross 50% and at least one cafe chain is on an annual contract.',
     false, timestamptz '2026-03-14 11:20:00+05:30'),

    (gen_random_uuid(), v_uid, null, s_zylo, null, 'Zylo Health', v_mgr,
     'Strong clinical team out of Amrita. The product works and the radiologist shortage is real. But everything depends on CDSCO Class B clearance, which they had not even filed when we met. No point pricing a regulated device before the regulator speaks. Revisit on clearance plus one paying hospital outside Kerala.',
     true, timestamptz '2026-02-02 16:05:00+05:30'),

    (gen_random_uuid(), v_uid, null, s_karta, null, 'Karta Logistics', v_mgr,
     'Good founder, wrong stage for me. Rs 18 lakh ARR with roughly 70% coming from two customers. Concentration risk is too high and nothing proves the model works outside Pune. Revisit at Rs 1 Cr ARR with no single customer above 20% of revenue.',
     false, timestamptz '2026-01-20 09:45:00+05:30'),

    (gen_random_uuid(), v_uid, null, s_meraki, null, 'Meraki Looms', v_mgr,
     'Beautiful product and a genuine weaver network, but I could not find the moat. Anyone can copy a catalogue. First-purchase economics were fine; nothing showed me that customers come back. Show me 40% repeat purchase inside twelve months and I will look again.',
     false, timestamptz '2026-04-08 14:30:00+05:30'),

    (gen_random_uuid(), v_uid, null, s_anvaya, null, 'Anvaya HR', v_mgr,
     'Met them pre-product in January 2026. Deck only, no working software, and compliance SaaS lives or dies on accuracy. I told them to come back with a shipped product and 25 paying SMEs. Most coachable founder I met that quarter, which is why this one stayed on the list.',
     false, timestamptz '2026-01-15 10:10:00+05:30');

  -- ── 5. Founder update history (powers the manager Deal Watch feed) ──────

  insert into public.dw_update_events (id, founder_id, space_id, file_id, file_name, event_type, created_at) values
    (gen_random_uuid(), v_uid, s_bean,   null, 'Financial Model v6.xlsx',        'file_updated', now() - interval '11 days'),
    (gen_random_uuid(), v_uid, s_bean,   null, 'Chain Supply Agreement.pdf',     'file_added',   now() - interval '10 days'),
    (gen_random_uuid(), v_uid, s_bean,   null, 'Pitch Deck v4.pdf',              'file_updated', now() - interval '9 days'),
    (gen_random_uuid(), v_uid, s_anvaya, null, 'Product Walkthrough.mp4',        'file_added',   now() - interval '6 days'),
    (gen_random_uuid(), v_uid, s_anvaya, null, 'Customer List Jul 2026.xlsx',    'file_updated', now() - interval '5 days'),
    (gen_random_uuid(), v_uid, s_zylo,   null, 'CDSCO Filing Acknowledgement.pdf','file_added',  now() - interval '19 days'),
    (gen_random_uuid(), v_uid, s_zylo,   null, 'Clinical Validation Summary.pdf','file_updated', now() - interval '17 days'),
    (gen_random_uuid(), v_uid, s_meraki, null, 'Cohort Retention Sheet.xlsx',    'file_updated', now() - interval '23 days'),
    (gen_random_uuid(), v_uid, s_karta,  null, 'Monthly Metrics Jun.xlsx',       'file_updated', now() - interval '31 days');

  -- ── 6. What the investor sees in their bell ─────────────────────────────

  if to_regclass('public.alerts') is not null then
    insert into public.alerts (user_id, space_id, type, message, created_at) values
      (v_uid, s_bean,   'dw_update', 'Priority brief ready: BeanBridge has crossed both conditions from your note. Repeat orders 61%, three chains under annual contract.', now() - interval '9 days'),
      (v_uid, s_anvaya, 'dw_update', 'Priority brief ready: Anvaya HR shipped the product and is at 31 paying SMEs, past the 25 you asked for.', now() - interval '5 days');
  end if;

  raise notice 'Demo investor account ready for %', v_uid;
end $$;

-- ── Verify ──────────────────────────────────────────────────────────────
select w.startup_name,
       w.quarterly_report,
       (w.manager_id is not null) as managed,
       left(w.note, 60) || '...' as note_preview,
       w.created_at::date as added
  from public.dw_watchlist w
  join auth.users u on u.id = w.investor_id
 where lower(u.email) = 'venturethrust@gmail.com'
 order by w.created_at;
