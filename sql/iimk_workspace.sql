-- ============================================================================
-- IIMK LIVE WORKSPACE  ·  omprakashborkar611@gmail.com
-- ============================================================================
-- What IIMK LIVE's account looks like once they are actually using this: the
-- cohort index room, a data room for every portfolio company, share links out
-- to named investors, and the engagement those links produced.
--
-- The Analytics tab is the demonstration. Two investors have read nearly
-- everything and two have not opened anything at all, and today nobody at an
-- incubator can see that.
--
-- Institutional figures are IIMK LIVE's published numbers and the programme
-- names are theirs. The companies are invented and every page says SAMPLE.
--
-- Safe to re-run. Touches only this account.
-- ============================================================================

do $$
declare
  v_own uuid;
  s_id  uuid;
  lnk   uuid;
  ses   uuid;
  r     record;
  inv   record;
  n     int;
  sent  int;
  opens int;
  secs  int;
  k     int;
begin
  select id into v_own from auth.users where lower(email) = 'omprakashborkar611@gmail.com';
  if v_own is null then raise exception 'No auth user for omprakashborkar611@gmail.com.'; end if;

  update public.profiles
     set plan = 'vdr_ai', plan_status = 'active',
         plan_expires_at = greatest(coalesce(plan_expires_at, now()), now() + interval '730 days')
   where id = v_own;

  -- Clear the leftover test rooms and any previous run of this workspace.
  for s_id in select id from public.spaces
               where created_by = v_own and name = any(array['IDEA VAULT Cohort 1  ·  Investor Room', 'Aether Semiconductors  ·  Data Room', 'Verdant Climate  ·  Data Room', 'Orbitfall Systems  ·  Data Room', 'Praan Robotics  ·  Data Room', 'Quantiva  ·  Data Room', 'Sarva Health AI  ·  Data Room', 'gandu', 'Untitled Space', 'IIMK LIVE  ·  Cohort Investor Room (demonstration)'])
  loop
    delete from public.file_page_views where space_id = s_id;
    delete from public.viewer_sessions where space_id = s_id;
    delete from public.space_questions where space_id = s_id;
    delete from public.share_link_access_logs where share_link_id in
      (select id from public.share_links where space_id = s_id);
    delete from public.share_links where space_id = s_id;
    delete from public.files   where space_id = s_id;
    delete from public.folders where space_id = s_id;
    delete from public.spaces  where id = s_id;
  end loop;

  -- ── Rooms ────────────────────────────────────────────────────────────────
  for r in select * from (values
    ('IDEA VAULT Cohort 1  ·  Investor Room','iimk-live','IDEA VAULT Cohort 1. The index every investor in the Matching Investment Program receives. A VentureThrust demonstration built for IIMK LIVE; cohort companies are sample data.',array['01 About IIMK LIVE', '02 Cohort Snapshot', '03 Startup Profiles', '04 Investor Process', '05 Programme and Compliance'],44),
    ('Aether Semiconductors  ·  Data Room','aether-semiconductors','Analog front end IP for industrial sensing, licensed to Indian fabless houses. IIMK LIVE portfolio company, Semiconductors, Kochi.',array['01 Company Overview', '02 Financials', '03 Product and Technology', '04 Customers and Traction', '05 Legal and Compliance'],39),
    ('Verdant Climate  ·  Data Room','verdant-climate','Carbon measurement and verification for smallholder agroforestry. IIMK LIVE portfolio company, Climate technology, Kozhikode.',array['01 Company Overview', '02 Financials', '03 Product and Technology', '04 Customers and Traction', '05 Legal and Compliance'],34),
    ('Orbitfall Systems  ·  Data Room','orbitfall-systems','Ground segment software for small satellite operators. IIMK LIVE portfolio company, Space technology, Kochi.',array['01 Company Overview', '02 Financials', '03 Product and Technology', '04 Customers and Traction', '05 Legal and Compliance'],29),
    ('Praan Robotics  ·  Data Room','praan-robotics','Retrofit autonomous mobile robots for mid sized warehouses. IIMK LIVE portfolio company, Robotics, Kochi.',array['01 Company Overview', '02 Financials', '03 Product and Technology', '04 Customers and Traction', '05 Legal and Compliance'],24),
    ('Quantiva  ·  Data Room','quantiva','Post quantum cryptography discovery and migration for financial institutions. IIMK LIVE portfolio company, Quantum safe security, Kozhikode.',array['01 Company Overview', '02 Financials', '03 Product and Technology', '04 Customers and Traction', '05 Legal and Compliance'],19),
    ('Sarva Health AI  ·  Data Room','sarva-health-ai','Discharge summary generation for Indian hospitals, English and Malayalam. IIMK LIVE portfolio company, Health AI, Kozhikode.',array['01 Company Overview', '02 Financials', '03 Product and Technology', '04 Customers and Traction', '05 Legal and Compliance'],14)
  ) as t(nm, slug, descr, folders, age) loop

    s_id := gen_random_uuid();
    insert into public.spaces (id, name, title, description, created_by, created_at)
    values (s_id, r.nm, r.nm, r.descr, v_own, now() - (r.age || ' days')::interval);

    insert into public.folders (id, user_id, name, space_id, parent_id, position)
    select gen_random_uuid(), v_own, fol, s_id, null, ord
      from unnest(r.folders) with ordinality as u(fol, ord);

    insert into public.files
      (id, user_id, folder_id, space_id, name, type, storage_path,
       size_bytes, views, position, created_at)
    select gen_random_uuid()::text, v_own, fo.id, s_id, f.fname, f.ftype,
           'demo/' || r.slug || '/' || f.fname, f.sz,
           (4 + (random() * 30)::int), f.pos,
           now() - (r.age || ' days')::interval + (f.pos || ' hours')::interval
      from (values
        ('iimk-live','01 About IIMK LIVE','IIMK LIVE Overview.pdf','PDF',3438,1),
        ('iimk-live','01 About IIMK LIVE','Programmes and Funding.pdf','PDF',3616,2),
        ('iimk-live','01 About IIMK LIVE','Leadership and Investment Committee.pdf','PDF',3424,3),
        ('iimk-live','02 Cohort Snapshot','Cohort Snapshot.pdf','PDF',3597,1),
        ('iimk-live','02 Cohort Snapshot','Cohort Companies.xlsx','Sheet',5690,2),
        ('iimk-live','02 Cohort Snapshot','Cohort Metrics.xlsx','Sheet',5656,3),
        ('iimk-live','03 Startup Profiles','Aether Semiconductors.pdf','PDF',2971,1),
        ('iimk-live','03 Startup Profiles','Verdant Climate.pdf','PDF',2969,2),
        ('iimk-live','03 Startup Profiles','Orbitfall Systems.pdf','PDF',2954,3),
        ('iimk-live','03 Startup Profiles','Praan Robotics.pdf','PDF',2944,4),
        ('iimk-live','03 Startup Profiles','Quantiva.pdf','PDF',2880,5),
        ('iimk-live','03 Startup Profiles','Sarva Health AI.pdf','PDF',2917,6),
        ('iimk-live','04 Investor Process','Matching Investment Program.pdf','PDF',3824,1),
        ('iimk-live','04 Investor Process','Investor Engagement Record.xlsx','Sheet',5816,2),
        ('iimk-live','04 Investor Process','Investment Committee Process.pdf','PDF',2880,3),
        ('iimk-live','04 Investor Process','How to Request Access.pdf','PDF',2863,4),
        ('iimk-live','05 Programme and Compliance','DST Recognition and Governance.pdf','PDF',3160,1),
        ('iimk-live','05 Programme and Compliance','Incubation Agreement Template.pdf','PDF',2840,2),
        ('iimk-live','05 Programme and Compliance','Data Sharing and Consent.pdf','PDF',2863,3),
        ('aether-semiconductors','01 Company Overview','Aether Semiconductors Pitch Deck.pdf','Deck',3496,1),
        ('aether-semiconductors','01 Company Overview','One Pager.pdf','PDF',3151,2),
        ('aether-semiconductors','01 Company Overview','Founding Team.pdf','PDF',3339,3),
        ('aether-semiconductors','02 Financials','Financial Model.xlsx','Sheet',7182,1),
        ('aether-semiconductors','02 Financials','Unit Economics.xlsx','Sheet',5560,2),
        ('aether-semiconductors','02 Financials','Cap Table.xlsx','Sheet',5553,3),
        ('aether-semiconductors','03 Product and Technology','Product and Technology.pdf','PDF',2829,1),
        ('aether-semiconductors','04 Customers and Traction','Traction Report.pdf','PDF',3318,1),
        ('aether-semiconductors','04 Customers and Traction','Customers.xlsx','Sheet',5566,2),
        ('aether-semiconductors','05 Legal and Compliance','Certificate of Incorporation.pdf','PDF',3364,1),
        ('verdant-climate','01 Company Overview','Verdant Climate Pitch Deck.pdf','Deck',3498,1),
        ('verdant-climate','01 Company Overview','One Pager.pdf','PDF',3161,2),
        ('verdant-climate','01 Company Overview','Founding Team.pdf','PDF',3311,3),
        ('verdant-climate','02 Financials','Financial Model.xlsx','Sheet',7131,1),
        ('verdant-climate','02 Financials','Unit Economics.xlsx','Sheet',5573,2),
        ('verdant-climate','02 Financials','Cap Table.xlsx','Sheet',5581,3),
        ('verdant-climate','03 Product and Technology','Product and Technology.pdf','PDF',2782,1),
        ('verdant-climate','04 Customers and Traction','Traction Report.pdf','PDF',3115,1),
        ('verdant-climate','04 Customers and Traction','Customers.xlsx','Sheet',5575,2),
        ('verdant-climate','05 Legal and Compliance','Certificate of Incorporation.pdf','PDF',3339,1),
        ('orbitfall-systems','01 Company Overview','Orbitfall Systems Pitch Deck.pdf','Deck',3456,1),
        ('orbitfall-systems','01 Company Overview','One Pager.pdf','PDF',3124,2),
        ('orbitfall-systems','01 Company Overview','Founding Team.pdf','PDF',3308,3),
        ('orbitfall-systems','02 Financials','Financial Model.xlsx','Sheet',7120,1),
        ('orbitfall-systems','02 Financials','Unit Economics.xlsx','Sheet',5514,2),
        ('orbitfall-systems','02 Financials','Cap Table.xlsx','Sheet',5551,3),
        ('orbitfall-systems','03 Product and Technology','Product and Technology.pdf','PDF',2709,1),
        ('orbitfall-systems','04 Customers and Traction','Traction Report.pdf','PDF',3134,1),
        ('orbitfall-systems','04 Customers and Traction','Customers.xlsx','Sheet',5562,2),
        ('orbitfall-systems','05 Legal and Compliance','Certificate of Incorporation.pdf','PDF',3342,1),
        ('praan-robotics','01 Company Overview','Praan Robotics Pitch Deck.pdf','Deck',3460,1),
        ('praan-robotics','01 Company Overview','One Pager.pdf','PDF',3144,2),
        ('praan-robotics','01 Company Overview','Founding Team.pdf','PDF',3259,3),
        ('praan-robotics','02 Financials','Financial Model.xlsx','Sheet',7135,1),
        ('praan-robotics','02 Financials','Unit Economics.xlsx','Sheet',5547,2),
        ('praan-robotics','02 Financials','Cap Table.xlsx','Sheet',5574,3),
        ('praan-robotics','03 Product and Technology','Product and Technology.pdf','PDF',2698,1),
        ('praan-robotics','04 Customers and Traction','Traction Report.pdf','PDF',3194,1),
        ('praan-robotics','04 Customers and Traction','Customers.xlsx','Sheet',5617,2),
        ('praan-robotics','05 Legal and Compliance','Certificate of Incorporation.pdf','PDF',3330,1),
        ('quantiva','01 Company Overview','Quantiva Pitch Deck.pdf','Deck',3409,1),
        ('quantiva','01 Company Overview','One Pager.pdf','PDF',3122,2),
        ('quantiva','01 Company Overview','Founding Team.pdf','PDF',3257,3),
        ('quantiva','02 Financials','Financial Model.xlsx','Sheet',7175,1),
        ('quantiva','02 Financials','Unit Economics.xlsx','Sheet',5510,2),
        ('quantiva','02 Financials','Cap Table.xlsx','Sheet',5551,3),
        ('quantiva','03 Product and Technology','Product and Technology.pdf','PDF',2757,1),
        ('quantiva','04 Customers and Traction','Traction Report.pdf','PDF',3070,1),
        ('quantiva','04 Customers and Traction','Customers.xlsx','Sheet',5544,2),
        ('quantiva','05 Legal and Compliance','Certificate of Incorporation.pdf','PDF',3324,1),
        ('sarva-health-ai','01 Company Overview','Sarva Health AI Pitch Deck.pdf','Deck',3461,1),
        ('sarva-health-ai','01 Company Overview','One Pager.pdf','PDF',3132,2),
        ('sarva-health-ai','01 Company Overview','Founding Team.pdf','PDF',3284,3),
        ('sarva-health-ai','02 Financials','Financial Model.xlsx','Sheet',7128,1),
        ('sarva-health-ai','02 Financials','Unit Economics.xlsx','Sheet',5537,2),
        ('sarva-health-ai','02 Financials','Cap Table.xlsx','Sheet',5565,3),
        ('sarva-health-ai','03 Product and Technology','Product and Technology.pdf','PDF',2765,1),
        ('sarva-health-ai','04 Customers and Traction','Traction Report.pdf','PDF',3305,1),
        ('sarva-health-ai','04 Customers and Traction','Customers.xlsx','Sheet',5665,2),
        ('sarva-health-ai','05 Legal and Compliance','Certificate of Incorporation.pdf','PDF',3343,1)
      ) as f(slug, fol, fname, ftype, sz, pos)
      join public.folders fo on fo.space_id = s_id and fo.name = f.fol
     where f.slug = r.slug;

    -- ── Share links to the investor network, and what they did with them ───
    n := 0;
    for inv in select * from (values
      ('Malabar Angel Network','deals@malabarangels.example',10),
      ('Unicorn India Ventures','review@uiv.example',10),
      ('Speciale Invest','deeptech@speciale.example',4),
      ('Kerala Startup Mission Fund','fund@ksum.example',4),
      ('IIMK alumni angel syndicate','syndicate@iimkalumni.example',1),
      ('Rainmatter Capital','climate@rainmatter.example',1),
      ('Anthill Ventures','scout@anthill.example',0),
      ('Yournest Venture Capital','team@yournest.example',0)
    ) as i(nm, em, wt) loop
      n := n + 1;

      -- The index room goes to everyone. Company rooms go to a subset,
      -- because that is how a real programme introduces a portfolio.
      continue when r.slug <> 'iimk-live' and (n + r.age) % 3 = 2;

      sent := greatest(r.age - 6 - n, 1);
      opens := case when inv.wt = 0 then 0
                    else inv.wt + (random() * 3)::int end;

      lnk := gen_random_uuid();
      insert into public.share_links
        (id, space_id, token, is_active, email_required, recipient_email,
         recipient_name, created_by, created_at, sent_at, open_count,
         opened_at, last_opened_at, link_name)
      values (lnk, s_id, encode(gen_random_bytes(16), 'hex'), true, true,
              inv.em, inv.nm, v_own,
              now() - (sent || ' days')::interval,
              now() - (sent || ' days')::interval,
              opens,
              case when opens = 0 then null
                   else now() - ((sent - 1) || ' days')::interval end,
              case when opens = 0 then null
                   else now() - (greatest(sent - 9, 1) || ' days')::interval end,
              inv.nm);

      continue when opens = 0;

      -- One viewer session per visit, capped at four so the timeline reads.
      for k in 1..least(opens, 4) loop
        ses  := gen_random_uuid();
        secs := case when inv.wt >= 10 then 140 + (random() * 1300)::int
                     else 60 + (random() * 360)::int end;
        insert into public.viewer_sessions
          (id, space_id, share_link_id, visitor_email, device,
           started_at, last_heartbeat, ended_at, total_seconds)
        values (ses, s_id, lnk, inv.em,
                (array['Desktop','Desktop','Mobile'])[1 + (random() * 2)::int],
                now() - ((greatest(sent - 1 - (k - 1) * 3, 1)) || ' days')::interval,
                now() - ((greatest(sent - 1 - (k - 1) * 3, 1)) || ' days')::interval
                      + (secs || ' seconds')::interval,
                now() - ((greatest(sent - 1 - (k - 1) * 3, 1)) || ' days')::interval
                      + (secs || ' seconds')::interval,
                secs);

        -- Page level dwell on the deck, which is the screen that sells this.
        insert into public.file_page_views
          (id, file_id, space_id, visitor_email, session_id, page_number,
           seconds_viewed, viewed_at)
        select gen_random_uuid(), f.id, s_id, inv.em, ses, g.pg,
               8 + (random() * 74)::int,
               now() - ((greatest(sent - 1 - (k - 1) * 3, 1)) || ' days')::interval
        from public.files f
        cross join generate_series(1, 6) as g(pg)
        where f.space_id = s_id and f.name ilike '%pitch deck%';
      end loop;

      insert into public.share_link_access_logs
        (id, share_link_id, email, action, created_at)
      values (gen_random_uuid(), lnk, inv.em, 'OPEN',
              now() - (greatest(sent - 1, 1) || ' days')::interval);
    end loop;
  end loop;

  -- ── Questions investors actually asked ───────────────────────────────────
  insert into public.space_questions
    (id, space_id, file_id, file_name, visitor_name, visitor_email, question,
     asked_at, answer, answered_at)
  select gen_random_uuid(), f.space_id, f.id, f.name, q.who, q.em, q.qn,
         now() - interval '4 days', q.ans,
         case when q.ans is null then null else now() - interval '3 days' end
    from (values
      ('Praan Robotics  ·  Data Room', 'Unit Economics.xlsx', 'Unicorn India Ventures',
       'review@uiv.example',
       'Is the field service cost per robot inside the contribution figure, or above it?',
       'Inside it, at Rs 4,200 per robot per month. That is one engineer per twelve robots at current density.'),
      ('Verdant Climate  ·  Data Room', 'Customers.xlsx', 'Malabar Angel Network',
       'deals@malabarangels.example',
       'What happens to the Coorg project if Verra validation is refused?',
       null),
      ('Sarva Health AI  ·  Data Room', 'Traction Report.pdf', 'Malabar Angel Network',
       'deals@malabarangels.example',
       'Acceptance is 89 percent overall. What is the Malayalam number on its own?',
       null)
    ) as q(sp, fl, who, em, qn, ans)
    join public.spaces s on s.name = q.sp and s.created_by = v_own
    join public.files  f on f.space_id = s.id and f.name = q.fl;
end $$;
