-- ============================================================================
-- FOUNDER ANALYTICS DEMO  ·  omprakash161615@gmail.com
-- ============================================================================
-- One startup's data room, four investors who behaved completely differently,
-- per page dwell on a twelve page deck, and a founder video that one investor
-- replayed twice from fifteen seconds in.
--
-- Wipes everything else on this account first. Safe to re-run.
-- ============================================================================

do $$
declare
  v_own uuid;
  s_id  uuid;
  lnk   uuid;
  ses   uuid;
  f_deck text;
  f_vid  text;
  inv   record;
  pg    record;
  k     int;
  base_day int;
begin
  select id into v_own from auth.users where lower(email) = 'omprakash161615@gmail.com';
  if v_own is null then raise exception 'No auth user for omprakash161615@gmail.com.'; end if;

  update public.profiles
     set plan = 'vdr_ai', plan_status = 'active',
         plan_expires_at = greatest(coalesce(plan_expires_at, now()), now() + interval '730 days')
   where id = v_own;

  -- Clear this account completely. It is a demo account.
  for s_id in select id from public.spaces where created_by = v_own loop
    delete from public.file_playback_events where space_id = s_id;
    delete from public.file_page_views      where space_id = s_id;
    delete from public.viewer_sessions      where space_id = s_id;
    delete from public.space_questions      where space_id = s_id;
    delete from public.share_link_access_logs where share_link_id in
      (select id from public.share_links where space_id = s_id);
    delete from public.share_links where space_id = s_id;
    delete from public.files       where space_id = s_id;
    delete from public.folders     where space_id = s_id;
    delete from public.spaces      where id = s_id;
  end loop;
  delete from public.files   where user_id = v_own;
  delete from public.folders where user_id = v_own;

  -- ── The room ─────────────────────────────────────────────────────────────
  s_id := gen_random_uuid();
  insert into public.spaces (id, name, title, description, created_by, created_at)
  values (s_id, 'Loopwise  ·  Seed Round', 'Loopwise  ·  Seed Round',
          'Retention analytics for Indian direct to consumer brands. Seed round, Kochi.',
          v_own, now() - interval '31 days');

  insert into public.folders (id, user_id, name, space_id, parent_id, position)
  select gen_random_uuid(), v_own, fol, s_id, null, ord
    from unnest(array['01 Company Overview', '02 Financials', '03 Product and Technology', '04 Customers and Traction', '05 Legal and Compliance']) with ordinality as u(fol, ord);

  insert into public.files
    (id, user_id, folder_id, space_id, name, type, storage_path,
     size_bytes, views, position, created_at)
  select gen_random_uuid()::text, v_own, fo.id, s_id, f.fname, f.ftype,
         'demo/loopwise/' || f.fname, f.sz, 0, f.pos,
         now() - interval '31 days' + (f.pos || ' hours')::interval
    from (values
      ('01 Company Overview','Loopwise Pitch Deck.pdf','Deck',13228,1),
      ('01 Company Overview','Founder Video.mp4','Doc',14063646,2),
      ('01 Company Overview','One Pager.pdf','PDF',3423,3),
      ('01 Company Overview','Founding Team.pdf','PDF',3417,4),
      ('02 Financials','Financial Model.xlsx','Sheet',7195,1),
      ('02 Financials','Unit Economics.xlsx','Sheet',5612,2),
      ('02 Financials','Cap Table.xlsx','Sheet',5546,3),
      ('03 Product and Technology','Product Overview.pdf','PDF',2816,1),
      ('04 Customers and Traction','Traction Report.pdf','PDF',3736,1),
      ('04 Customers and Traction','Customers.xlsx','Sheet',5765,2),
      ('05 Legal and Compliance','Certificate of Incorporation.pdf','PDF',3353,1)
    ) as f(fol, fname, ftype, sz, pos)
    join public.folders fo on fo.space_id = s_id and fo.name = f.fol;

  select id into f_deck from public.files where space_id = s_id and name = 'Loopwise Pitch Deck.pdf';
  select id into f_vid  from public.files where space_id = s_id and name = 'Founder Video.mp4';

  -- ── Investors, and what each of them actually did ────────────────────────
  base_day := 21;
  for inv in select * from (values
      ('Arjun Nair','arjun.nair84@gmail.com',4,'deep'),
      ('Priya Raghavan','priya.raghavan@gmail.com',2,'skim'),
      ('Krishnakumar S','s.krishnakumar.vc@gmail.com',1,'bounce'),
      ('Anand Pillai','anandpillai.invest@gmail.com',0,'never')
  ) as i(nm, em, sessions, style) loop

    lnk := gen_random_uuid();
    insert into public.share_links
      (id, space_id, token, is_active, email_required, recipient_email, recipient_name,
       created_by, created_at, sent_at, open_count, opened_at, last_opened_at, link_name)
    values (lnk, s_id, encode(gen_random_bytes(16),'hex'), true, true,
            inv.em, inv.nm, v_own,
            now() - (base_day || ' days')::interval,
            now() - (base_day || ' days')::interval,
            inv.sessions,
            case when inv.sessions = 0 then null
                 else now() - ((base_day - 2) || ' days')::interval end,
            case when inv.sessions = 0 then null
                 else now() - ((base_day - 2 - (inv.sessions - 1) * 4) || ' days')::interval end,
            'Sent to ' || inv.nm);

    if inv.sessions = 0 then
      base_day := base_day - 2;
      continue;
    end if;

    for k in 1..inv.sessions loop
      ses := gen_random_uuid();
      insert into public.viewer_sessions
        (id, space_id, share_link_id, visitor_email, device,
         started_at, last_heartbeat, ended_at, total_seconds)
      select ses, s_id, lnk, inv.em,
             case when k = 1 then 'Desktop' else
               (array['Desktop','Mobile'])[1 + (random())::int] end,
             now() - ((base_day - 2 - (k - 1) * 4) || ' days')::interval,
             now() - ((base_day - 2 - (k - 1) * 4) || ' days')::interval
                   + (t.tot || ' seconds')::interval,
             now() - ((base_day - 2 - (k - 1) * 4) || ' days')::interval
                   + (t.tot || ' seconds')::interval,
             t.tot
        from (select coalesce(sum(p.secs), 60) as tot
                from (values
      ('deep',1,34),
      ('deep',2,41),
      ('deep',3,88),
      ('deep',4,62),
      ('deep',5,57),
      ('deep',6,196),
      ('deep',7,74),
      ('deep',8,69),
      ('deep',9,214),
      ('deep',10,143),
      ('deep',11,58),
      ('deep',12,47),
      ('skim',1,22),
      ('skim',2,18),
      ('skim',3,31),
      ('skim',4,12),
      ('skim',5,9),
      ('skim',6,44),
      ('skim',7,11),
      ('skim',8,8),
      ('skim',9,27),
      ('skim',10,14),
      ('bounce',1,16),
      ('bounce',2,9),
      ('bounce',3,7)
                ) as p(style, page, secs)
               where p.style = inv.style) as t;

      -- Per page dwell on the deck. Only the first session reads it fully;
      -- later visits are shorter, which is what real re-reads look like.
      insert into public.file_page_views
        (id, file_id, space_id, visitor_email, session_id, page_number,
         seconds_viewed, viewed_at)
      select gen_random_uuid(), f_deck, s_id, inv.em, ses, p.page,
             greatest(3, (p.secs / k)::int),
             now() - ((base_day - 2 - (k - 1) * 4) || ' days')::interval
        from (values
      ('deep',1,34),
      ('deep',2,41),
      ('deep',3,88),
      ('deep',4,62),
      ('deep',5,57),
      ('deep',6,196),
      ('deep',7,74),
      ('deep',8,69),
      ('deep',9,214),
      ('deep',10,143),
      ('deep',11,58),
      ('deep',12,47),
      ('skim',1,22),
      ('skim',2,18),
      ('skim',3,31),
      ('skim',4,12),
      ('skim',5,9),
      ('skim',6,44),
      ('skim',7,11),
      ('skim',8,8),
      ('skim',9,27),
      ('skim',10,14),
      ('bounce',1,16),
      ('bounce',2,9),
      ('bounce',3,7)
        ) as p(style, page, secs)
       where p.style = inv.style and f_deck is not null;
    end loop;

    insert into public.share_link_access_logs (id, share_link_id, email, action, created_at)
    values (gen_random_uuid(), lnk, inv.em, 'OPEN',
            now() - ((base_day - 2) || ' days')::interval);

    base_day := base_day - 2;
  end loop;

  -- ── The founder video, replayed twice from fifteen seconds ───────────────
  -- The analytics screen plots only 'segment' events (heatmap) and 'replay'
  -- events (the markers), and both read range_start/range_end, never
  -- position_seconds. A replay marker means "jumped from range_start back to
  -- range_end", so both replays landing at range_end = 15 is the founder's
  -- headline: an investor rewatched the fifteen second mark twice.
  if f_vid is not null then
    select vs.id into ses
      from public.viewer_sessions vs
     where vs.space_id = s_id and vs.visitor_email = 'arjun.nair84@gmail.com'
     order by vs.started_at asc limit 1;

    insert into public.file_playback_events
      (id, file_id, space_id, visitor_email, session_id, event_type,
       position_seconds, range_start, range_end, occurred_at)
    values
      (gen_random_uuid(), f_vid, s_id, 'arjun.nair84@gmail.com', ses, 'play',
       0, null, null, now() - interval '19 days'),
      -- watched the opening through to 62s
      (gen_random_uuid(), f_vid, s_id, 'arjun.nair84@gmail.com', ses, 'segment',
       null, 0, 62, now() - interval '19 days' + interval '62 seconds'),
      -- jumped back from 62 to 15  (replay marker #1, lands at 0:15)
      (gen_random_uuid(), f_vid, s_id, 'arjun.nair84@gmail.com', ses, 'replay',
       null, 62, 15, now() - interval '19 days' + interval '63 seconds'),
      -- rewatched 15 to 62
      (gen_random_uuid(), f_vid, s_id, 'arjun.nair84@gmail.com', ses, 'segment',
       null, 15, 62, now() - interval '19 days' + interval '110 seconds'),
      -- jumped back from 62 to 15 again  (replay marker #2, lands at 0:15)
      (gen_random_uuid(), f_vid, s_id, 'arjun.nair84@gmail.com', ses, 'replay',
       null, 62, 15, now() - interval '19 days' + interval '111 seconds'),
      -- watched 15 through to 88 and paused
      (gen_random_uuid(), f_vid, s_id, 'arjun.nair84@gmail.com', ses, 'segment',
       null, 15, 88, now() - interval '19 days' + interval '184 seconds'),
      (gen_random_uuid(), f_vid, s_id, 'arjun.nair84@gmail.com', ses, 'pause',
       88, null, null, now() - interval '19 days' + interval '185 seconds');

    -- Priya watched the opening only and left.
    select vs.id into ses
      from public.viewer_sessions vs
     where vs.space_id = s_id and vs.visitor_email = 'priya.raghavan@gmail.com'
     order by vs.started_at asc limit 1;

    insert into public.file_playback_events
      (id, file_id, space_id, visitor_email, session_id, event_type,
       position_seconds, range_start, range_end, occurred_at)
    values
      (gen_random_uuid(), f_vid, s_id, 'priya.raghavan@gmail.com', ses, 'play',
       0, null, null, now() - interval '15 days'),
      (gen_random_uuid(), f_vid, s_id, 'priya.raghavan@gmail.com', ses, 'segment',
       null, 0, 24, now() - interval '15 days' + interval '24 seconds'),
      (gen_random_uuid(), f_vid, s_id, 'priya.raghavan@gmail.com', ses, 'pause',
       24, null, null, now() - interval '15 days' + interval '25 seconds');
  end if;

  -- View counts on the files, so the room does not read as untouched.
  update public.files f
     set views = coalesce((select count(*) from public.file_page_views v
                            where v.file_id = f.id), 0) / 12 + 3
   where f.space_id = s_id;

  -- One question, because a live room gets them.
  insert into public.space_questions
    (id, space_id, file_id, file_name, visitor_name, visitor_email, question, asked_at)
  select gen_random_uuid(), s_id, f.id, f.name, 'Arjun Nair', 'arjun.nair84@gmail.com',
         'The top five accounts are 22 percent of ARR. What is the concentration if you strip out the largest one?',
         now() - interval '17 days'
    from public.files f where f.space_id = s_id and f.name = 'Unit Economics.xlsx';
end $$;
