-- ============================================================================
-- DEMO INVESTOR ACCOUNT  ·  venturethrust@gmail.com
-- ============================================================================
-- Investor  = venturethrust@gmail.com
-- Founder   = omprakash@venturethrust.com  (owns the five startup data rooms,
--             so they legitimately appear under Shared with me for the investor)
--
-- Builds five investment-ready data rooms with a professional folder
-- structure, shares them with the investor, and puts them on the watchlist.
-- Safe to re-run: it removes only the five demo spaces, never real ones.
-- ============================================================================

alter table public.profiles
  add column if not exists signup_notified boolean not null default false;
update public.profiles set signup_notified = true where signup_notified = false;

alter table public.dw_watchlist
  add column if not exists note text,
  add column if not exists quarterly_report boolean not null default false;

do $$
declare
  v_inv  uuid;   -- investor
  v_own  uuid;   -- founder / owner of the demo rooms
  s_id   uuid;
  f_root uuid;
  f_id   uuid;
  demo_names text[] := array['Nellara AgriChain','Zylo Health','Voltaneer','Aegis Drone Systems','Kadal Systems'];
  rec    record;
  fol    text;
  fname  text;
  ftype  text;
  ids    uuid[] := '{}';
  folders text[] := array[
    '01 Company Overview',
    '02 Financials',
    '03 Product and Technology',
    '04 Customers and Traction',
    '05 Legal and Compliance'
  ];
begin
  select id into v_inv from auth.users where lower(email) = 'venturethrust@gmail.com';
  if v_inv is null then
    raise exception 'No auth user for venturethrust@gmail.com. Sign up with that email first.';
  end if;
  select id into v_own from auth.users where lower(email) = 'omprakash@venturethrust.com';
  if v_own is null then v_own := v_inv; end if;

  -- ── WIPE: investor's own data + any previous demo rooms ─────────────────
  select array_agg(id) into ids from public.spaces
   where name = any(demo_names) and created_by in (v_inv, v_own);
  if ids is null then ids := '{}'; end if;

  if to_regclass('public.share_link_access_logs') is not null then
    delete from public.share_link_access_logs where share_link_id in
      (select id from public.share_links where space_id = any(ids)
        or space_id in (select id from public.spaces where created_by = v_inv));
  end if;
  if to_regclass('public.share_links') is not null then
    delete from public.share_links where space_id = any(ids)
      or space_id in (select id from public.spaces where created_by = v_inv);
  end if;
  if to_regclass('public.visits') is not null then
    delete from public.visits where space_id = any(ids)
      or space_id in (select id from public.spaces where created_by = v_inv);
  end if;
  if to_regclass('public.files') is not null then
    delete from public.files where space_id = any(ids) or user_id = v_inv;
  end if;
  if to_regclass('public.folders') is not null then
    delete from public.folders where space_id = any(ids) or user_id = v_inv;
  end if;
  if to_regclass('public.spaces') is not null then
    delete from public.spaces where id = any(ids) or created_by = v_inv;
  end if;
  if to_regclass('public.dw_update_events') is not null then
    delete from public.dw_update_events where founder_id in (v_inv, v_own);
  end if;
  if to_regclass('public.dw_watchlist') is not null then
    delete from public.dw_watchlist where investor_id = v_inv;
  end if;
  if to_regclass('public.alerts') is not null then
    delete from public.alerts where user_id = v_inv;
  end if;
  if to_regclass('public.dw_offers') is not null then
    delete from public.dw_offers where lower(investor_email) = 'venturethrust@gmail.com';
  end if;

  -- ── Investor plan on ────────────────────────────────────────────────────
  update public.profiles
     set is_investor = true, plan = 'vdr_ai', plan_status = 'active',
         plan_expires_at = now() + interval '365 days',
         dw_auto_assign = true, signup_notified = true
   where id = v_inv;

  -- ── Build the five data rooms ───────────────────────────────────────────
  for rec in
    select * from (values
      ('Nellara AgriChain',
       'Farm-to-retail supply chain for Kerala produce. Aggregates from farmer collectives in Wayanad and Malappuram, runs its own cold chain, and supplies retailers, hotels and restaurants in Kozhikode and Kochi.',
       'Passed at pre-seed, March 2026. Right problem, wrong economics: 22% wastage and 8% gross margin meant every rupee of growth was losing money. Kerala produce supply chain is a real gap and the founder knows the Wayanad collectives personally. Come back when wastage is under 10% and gross margin is above 18%.',
       false, timestamptz '2026-03-12 10:40:00+05:30',
       array['Nellara Pitch Deck v5.pdf','One Pager.pdf','Founder Profiles.pdf',
             'Financial Model FY27.xlsx','Unit Economics by SKU.xlsx','Cap Table.xlsx','GST Returns FY26.pdf',
             'Cold Chain Route Plan.pdf','Procurement App Walkthrough.mp4','Wastage Tracking Method.pdf',
             'Hotel Supply Agreements (3).pdf','Farmer Collective MOUs.pdf','Customer List Jul 2026.xlsx',
             'Certificate of Incorporation.pdf','FSSAI License.pdf','Shareholder Agreement.pdf'],
       array[1,1,1,2,2,2,2,3,3,3,4,4,4,5,5,5]),

      ('Zylo Health',
       'AI-assisted radiology triage for tier-2 and tier-3 hospitals. Ranks scans so urgent cases reach a radiologist first, letting one radiologist safely cover more hospitals. Sold per scan under annual hospital contracts.',
       'Strong clinical team out of Amrita and the radiologist shortage in tier-2 hospitals is real. But everything depends on CDSCO Class B clearance, which they had not even filed when we met. No point pricing a regulated device before the regulator speaks. Revisit on clearance plus one paying hospital outside Kerala.',
       true, timestamptz '2026-02-02 16:05:00+05:30',
       array['Zylo Pitch Deck.pdf','Clinical One Pager.pdf','Founding Team.pdf',
             'Financial Model.xlsx','Per Scan Unit Economics.xlsx','Cap Table.xlsx',
             'Triage Algorithm Overview.pdf','Clinical Validation Summary.pdf','Product Demo.mp4',
             'Hospital Contracts (4).pdf','Scan Volume Report Jul.xlsx','Radiologist Agreement Study.pdf',
             'CDSCO Filing Acknowledgement.pdf','Certificate of Incorporation.pdf','Data Protection Policy.pdf'],
       array[1,1,1,2,2,2,3,3,3,4,4,4,5,5,5]),

      ('Voltaneer',
       'Industrial energy monitoring for small and mid-sized factories. Retrofit sensors report live power draw and the software flags idle-load waste, failing motors and peak-demand penalties. Annual per-factory subscription.',
       'A hardware business wearing a software badge. 76% of revenue was one-time sensor sales and the average deal took nearly nine months because it needed a capex approval. The energy saving is real; the business model was not. Come back when recurring software is above 40% of revenue and the sales cycle is under 90 days.',
       false, timestamptz '2026-02-05 12:15:00+05:30',
       array['Voltaneer Pitch Deck v3.pdf','One Pager.pdf','Team and Advisors.pdf',
             'Financial Model.xlsx','ARR Bridge FY27.xlsx','Cap Table.xlsx',
             'Sensor Spec Sheet.pdf','Dashboard Demo.mp4','Firmware Release Notes.pdf',
             'Annual SaaS Agreement Template.pdf','Customer Savings Report.xlsx','Sales Cycle Export Jul 2026.xlsx',
             'Certificate of Incorporation.pdf','IP Assignment Deed.pdf','ESOP Policy.pdf'],
       array[1,1,1,2,2,2,3,3,3,4,4,4,5,5,5]),

      ('Aegis Drone Systems',
       'Drone-based inspection for ports, power transmission lines and plantation estates. Automated flight plans plus defect detection, sold per inspection cycle with annual retainers for large sites.',
       'Good pilots, good imagery, no repeat business. Every rupee so far has come from one-off inspections, and DGCA BVLOS permissions were still pending when we met. Inspection only becomes a business when it becomes a retainer. Revisit when at least three sites are on annual contracts and BVLOS clearance is granted.',
       false, timestamptz '2026-04-18 15:25:00+05:30',
       array['Aegis Pitch Deck.pdf','Capability Statement.pdf','Pilot Team Credentials.pdf',
             'Financial Model.xlsx','Project Level P&L.xlsx','Cap Table.xlsx',
             'Inspection Platform Overview.pdf','Sample Defect Report.pdf','Flight Demo.mp4',
             'Port Authority Work Order.pdf','Client List.xlsx',
             'DGCA Application Status.pdf','Aviation Insurance Certificate.pdf','Certificate of Incorporation.pdf'],
       array[1,1,1,2,2,2,3,3,3,4,4,5,5,5]),

      ('Kadal Systems',
       'IoT and satellite messaging for small fishing vessels along the Kerala coast. Provides distress alerts, weather warnings and catch logging where mobile networks do not reach. Hardware plus annual connectivity subscription.',
       'Genuinely important product and the safety case is unarguable. My problem is who pays. Almost all current units were bought through a state subsidy scheme, so I have no evidence a boat owner pays full price from his own pocket. Show me 200 units sold without subsidy and I will look again.',
       false, timestamptz '2026-05-06 11:05:00+05:30',
       array['Kadal Pitch Deck.pdf','Product One Pager.pdf','Founders.pdf',
             'Financial Model.xlsx','Unit Cost Breakdown.xlsx','Cap Table.xlsx',
             'Device Spec Sheet.pdf','Satellite Coverage Map.pdf','Field Demo.mp4',
             'Unit Sales Register Jun.xlsx','Fisheries Dept Subsidy Order.pdf',
             'WPC Equipment License.pdf','Certificate of Incorporation.pdf','Founder Agreement.pdf'],
       array[1,1,1,2,2,2,3,3,3,4,4,5,5,5])
    ) as t(nm, descr, note, quarterly, added, files, folder_idx)
  loop
    s_id := gen_random_uuid();

    insert into public.spaces (id, name, title, description, created_by)
    values (s_id, rec.nm, rec.nm, rec.descr, v_own);

    f_root := gen_random_uuid();
    insert into public.folders (id, user_id, name, space_id, parent_id)
    values (f_root, v_own, 'Root', s_id, null);

    -- Five numbered diligence folders, the way a US seed round is organised.
    for i in 1..array_length(folders, 1) loop
      insert into public.folders (id, user_id, name, space_id, parent_id)
      values (gen_random_uuid(), v_own, folders[i], s_id, f_root);
    end loop;

    -- Files into the right folder.
    for i in 1..array_length(rec.files, 1) loop
      fname := rec.files[i];
      fol   := folders[rec.folder_idx[i]];
      select id into f_id from public.folders
       where space_id = s_id and name = fol limit 1;

      ftype := case
        when fname like '%.pdf'  then 'PDF'
        when fname like '%.xlsx' then 'Sheet'
        when fname like '%.mp4'  then 'Doc'
        else 'Doc' end;

      insert into public.files (id, user_id, folder_id, space_id, name, type, created_at, views, storage_path, size_bytes)
      values (gen_random_uuid()::text, v_own, f_id, s_id, fname, ftype,
              now() - (i || ' days')::interval, floor(random()*9)::int,
              'demo/' || replace(lower(rec.nm), ' ', '-') || '/' || fname,
              (200000 + floor(random()*3000000))::bigint);
    end loop;

    -- Share it with the investor: an active link plus the invite alert that
    -- puts it in Shared with me.
    insert into public.share_links (id, space_id, token, is_active, email_required, recipient_email, created_at)
    values (gen_random_uuid(), s_id, encode(gen_random_bytes(16), 'hex'), true, true,
            'venturethrust@gmail.com', rec.added);

    insert into public.alerts (user_id, space_id, type, message, created_at, read_at)
    values (v_inv, s_id, 'space_shared',
            rec.nm || ' shared their data room with you.',
            rec.added,
            case when rec.nm = 'Kadal Systems' then null else rec.added + interval '2 hours' end);

    -- Watchlist entry with the investor's own note.
    insert into public.dw_watchlist
      (id, investor_id, founder_id, space_id, file_id, startup_name, manager_id, note, quarterly_report, created_at)
    values (gen_random_uuid(), v_inv, v_own, s_id, null, rec.nm,
            (select id from public.profiles where lower(email) = 'omprakash@venturethrust.com'),
            rec.note, rec.quarterly, rec.added);
  end loop;

  -- ── Founder update history ──────────────────────────────────────────────
  insert into public.dw_update_events (id, founder_id, space_id, file_id, file_name, event_type, created_at)
  select gen_random_uuid(), v_own, s.id, null, f.name, 'file_updated',
         now() - ((row_number() over ()) || ' days')::interval
    from public.spaces s
    join public.files f on f.space_id = s.id
   where s.name = any(demo_names) and s.created_by = v_own
   limit 24;

  -- ── The two priority briefs waiting ─────────────────────────────────────
  insert into public.alerts (user_id, space_id, type, message, created_at)
  select v_inv, id, 'dw_update',
         'Priority brief ready: Nellara AgriChain has crossed both conditions from your note. Wastage 7.4%, gross margin 21%.',
         now() - interval '10 days'
    from public.spaces where name = 'Nellara AgriChain' and created_by = v_own limit 1;

  insert into public.alerts (user_id, space_id, type, message, created_at)
  select v_inv, id, 'dw_update',
         'Priority brief ready: Voltaneer is at 47% recurring revenue with a 71 day sales cycle, past both thresholds you set.',
         now() - interval '7 days'
    from public.spaces where name = 'Voltaneer' and created_by = v_own limit 1;
end $$;
