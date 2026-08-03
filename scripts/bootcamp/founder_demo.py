# -*- coding: utf-8 -*-
"""
The founder-facing analytics demo, on omprakash161615@gmail.com.

Built to be shown across a table at the bootcamp: one startup's data room,
a twelve page deck, a founder video, four investors who behaved differently,
per page dwell time on the deck, and a video that one investor replayed twice
from fifteen seconds in.

  python scripts/bootcamp/founder_demo.py --upload --sql
"""

import os
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
DEMO = os.path.join(os.path.dirname(HERE), "demo_docs")
sys.path.insert(0, DEMO)

from build import (                       # noqa: E402
    AUTO, BUILDERS, MODELS, env, BUCKET, sqlq, ftype, SAFE_NAME,
    data_table, kv_table,
)
from manifest import doc, table, model, deck   # noqa: E402

OWNER = "omprakash161615@gmail.com"
SLUG = "loopwise"
SPACE = "Loopwise  ·  Seed Round"
VIDEO_SRC = r"C:\Users\Omprakash\Downloads\pitch.mp4"
VIDEO_NAME = "Founder Video.mp4"
DECK_NAME = "Loopwise Pitch Deck.pdf"
OUT = os.path.join(DEMO, "out", SLUG)

FOLDERS = [
    "01 Company Overview",
    "02 Financials",
    "03 Product and Technology",
    "04 Customers and Traction",
    "05 Legal and Compliance",
]

# Four investors, four very different behaviours. That contrast is the demo.
#   name, email, sessions, how they read
INVESTORS = [
    ("Arjun Nair",        "arjun.nair84@gmail.com",      4, "deep"),
    ("Priya Raghavan",    "priya.raghavan@gmail.com",    2, "skim"),
    ("Krishnakumar S",    "s.krishnakumar.vc@gmail.com", 1, "bounce"),
    ("Anand Pillai",      "anandpillai.invest@gmail.com",0, "never"),
]

# Per page seconds on the twelve page deck, per reading style. The shape is the
# point: everyone reads page one, almost nobody reaches page twelve, and the
# serious reader parks on traction and financials.
PAGES = {
    "deep":   [34, 41, 88, 62, 57, 196, 74, 69, 214, 143, 58, 47],
    "skim":   [22, 18, 31, 12,  9,  44, 11,  8,  27,  14,  0,  0],
    "bounce": [16,  9,  7,  0,  0,   0,  0,  0,   0,   0,  0,  0],
}

PROFILE = {
    "slug": SLUG,
    "name": "Loopwise",
    "legal": "Loopwise Technologies Private Limited",
    "cin": "U72900KL2024PTC086741",
    "city": "Kochi, Kerala",
    "founded": "May 2024",
    "sector": "B2B SaaS",
    "founder_email": OWNER,
    "one_line": "Retention analytics for Indian direct to consumer brands.",
    "stage": "Seed",
    "ask": "Rs 7.0 crore",
    "post": "Rs 34 crore post money",
    "runway": "13 months",
    "docs_note": "Prepared for investors, August 2026.",
    "founders": [
        ("Nikhil Varma", "Co-founder and CEO",
         "Six years running growth for a D2C brand that scaled to Rs 90 crore. Watched "
         "repeat rate decide the business twice. B.Tech, CUSAT."),
        ("Sneha Iyer", "Co-founder and CTO",
         "Data infrastructure. Built the event pipeline at a Bengaluru commerce company "
         "handling 40 million events a day. M.Tech, IIT Bombay."),
        ("Rahul Menon", "Head of Customer Success",
         "Onboarded 120 brands onto a marketing automation platform before this."),
    ],
    "metrics": [
        ("ARR, July 2026", "Rs 1.94 crore"),
        ("Paying brands", "68"),
        ("Net revenue retention", "127 percent"),
        ("Logo churn, trailing twelve months", "9 percent"),
        ("Average contract value", "Rs 2.85 lakh a year"),
        ("Gross margin", "81 percent"),
        ("CAC payback", "9 months"),
        ("Monthly burn", "Rs 12.6 lakh"),
    ],
    "traction_rows": [
        ["Month", "ARR (Rs lakh)", "Brands", "NRR %", "Churn %"],
        ["Feb 2026", "104", "38", "112", "14"],
        ["Mar 2026", "121", "44", "116", "13"],
        ["Apr 2026", "142", "51", "119", "11"],
        ["May 2026", "161", "57", "122", "10"],
        ["Jun 2026", "178", "63", "125", "9"],
        ["Jul 2026", "194", "68", "127", "9"],
    ],
    "cap": [
        ["Holder", "Instrument", "Shares", "Fully diluted %"],
        ["Nikhil Varma", "Equity", "3,30,000", "33.0"],
        ["Sneha Iyer", "Equity", "3,00,000", "30.0"],
        ["Rahul Menon", "Equity", "70,000", "7.0"],
        ["Angel round, Sep 2025 (6 investors)", "CCPS", "1,50,000", "15.0"],
        ["ESOP pool (reserved)", "Options", "1,50,000", "15.0"],
    ],
    "customers": [
        ["Brand", "Category", "City", "Live since", "ACV (Rs)", "Status"],
        ["Kochi coffee brand", "Beverages", "Kochi", "Nov 2025", "4,20,000", "Expanded"],
        ["Skincare D2C", "Beauty", "Bengaluru", "Dec 2025", "3,60,000", "Expanded"],
        ["Athleisure label", "Apparel", "Mumbai", "Jan 2026", "2,88,000", "Renewed"],
        ["Snack brand", "Food", "Chennai", "Feb 2026", "2,40,000", "Renewed"],
        ["Home fragrance", "Home", "Delhi", "Apr 2026", "1,92,000", "Live"],
        ["Ayurvedic wellness", "Wellness", "Kochi", "May 2026", "3,00,000", "Live"],
        ["63 further brands", "Mixed", "Pan India", "Various", "1,62,00,000", "Live"],
    ],
    "unit_rows": [
        ["Line item", "Per brand per year (Rs)", "Notes"],
        ["Subscription", "2,85,000", "Average contract value"],
        ["Infrastructure and events", "-31,000", "Scales with order volume"],
        ["Support and success", "-23,000", "One CSM per 34 brands"],
        ["Gross contribution", "2,31,000", "81.1 percent"],
        ["Acquisition cost", "-2,14,000", "Blended, paid plus founder led"],
        ["Payback", "9 months", "Down from 14 months in FY26"],
    ],
    "risks": [
        "Sixty eight brands is still small, and the top five are 22 percent of ARR.",
        "D2C marketing budgets move with funding cycles, which are tight right now.",
        "Shopify and the large marketing platforms could bundle basic retention analytics.",
    ],
}

MODELS[SLUG] = {
    "unit": "Rs lakh",
    "periods": ["Q1 FY27", "Q2 FY27", "Q3 FY27", "Q4 FY27", "FY28", "FY29"],
    "lines": [
        ("Subscription revenue", [58, 76, 98, 126, 704, 1520]),
        ("Gross margin %", [0.811, 0.818, 0.826, 0.833, 0.848, 0.862]),
        ("Infrastructure", [8, 10, 13, 17, 86, 172]),
        ("People cost", [42, 49, 59, 72, 372, 648]),
        ("Sales and marketing", [18, 24, 32, 42, 236, 486]),
    ],
}

AUTO[(SLUG, "Where the business stands")] = lambda st, p: [kv_table(st, p["metrics"])]
AUTO[(SLUG, "Month by month")] = lambda st, p: [data_table(st, p["traction_rows"])]
AUTO[(SLUG, "Who is paying")] = lambda st, p: [data_table(st, p["customers"])]

# Twelve slides, so the per page analytics has something to show.
DECK_SLIDES = [
    ("Loopwise", ["Retention analytics for Indian D2C brands",
                  "Seed round, August 2026", "Kochi, Kerala"]),
    ("The problem", [
        "A D2C brand spends 38 percent of revenue acquiring customers.",
        "Almost all of them can tell you what a customer cost.",
        "Almost none can tell you which ones came back, or why.",
        "So they buy the same customer twice and call it growth."]),
    ("What we do", [
        "We sit on the order and event data the brand already has.",
        "We show repeat rate by cohort, by product and by acquisition channel.",
        "Then we name the specific thing to change this week.",
        "68 brands, Rs 1.94 crore ARR, live today."]),
    ("Why now", [
        "Paid acquisition costs in India have roughly doubled in three years.",
        "The brands that survived 2025 did it on repeat revenue, not on new customers.",
        "Every founder in the category now has retention on the weekly review.",
        "Two years ago that conversation did not exist."]),
    ("The product", [
        "Cohort retention by first product, which is the view nobody has.",
        "Channel quality scoring, so spend moves to the channel that repeats.",
        "Churn risk flags at the customer level, pushed into their own tools.",
        "Setup is a Shopify connect and takes about eleven minutes."]),
    ("Traction", [
        "ARR up from Rs 1.04 crore in February to Rs 1.94 crore in July.",
        "68 paying brands, from 38 in February.",
        "Net revenue retention 127 percent.",
        "Logo churn down from 14 percent to 9 percent."]),
    ("Why they stay", [
        "The weekly action email is opened by 71 percent of brands.",
        "Expansion comes from adding brands inside the same parent company.",
        "Six of our largest ten accounts started on the smallest plan.",
        "We are in the Monday review, which is the hardest place to be removed from."]),
    ("Unit economics", [
        "Average contract value Rs 2.85 lakh a year.",
        "Gross margin 81 percent.",
        "CAC payback nine months, down from fourteen.",
        "Contribution positive on every cohort since October 2025."]),
    ("The market", [
        "Roughly 12,000 Indian D2C brands are above Rs 1 crore of annual revenue.",
        "Our current price puts the reachable market at about Rs 340 crore.",
        "We do not need a category shift for this to work, only share.",
        "Adjacent: the same data serves quick commerce brands, untouched so far."]),
    ("The honest risks", [
        "Top five accounts are 22 percent of ARR.",
        "D2C budgets follow funding cycles and those are tight.",
        "Shopify could bundle a basic version of this.",
        "We are 68 brands, not 680. This is early."]),
    ("Use of funds", [
        "Rs 7.0 crore, expected to last 20 months.",
        "Rs 2.8 crore: sales, moving from founder led to a real team.",
        "Rs 2.2 crore: product, principally the quick commerce data model.",
        "Rs 1.2 crore: customer success, to hold NRR above 125 percent.",
        "Rs 0.8 crore: reserve."]),
    ("The team", [
        "Nikhil Varma, CEO. Six years of D2C growth, scaled a brand to Rs 90 crore.",
        "Sneha Iyer, CTO. Built an event pipeline handling 40 million events a day.",
        "Rahul Menon, Customer Success. Onboarded 120 brands before this.",
        "14 full time, Kochi and Bengaluru."]),
]

MANIFEST = [
    (1, DECK_NAME, *deck(DECK_SLIDES)),
    (1, "One Pager.pdf", *doc("Company summary, August 2026", [
        ("What Loopwise does", [
            "Loopwise reads the order and event data an Indian D2C brand already has and "
            "shows which customers came back, from which channel and after which first "
            "product. Then it names the change worth making this week."]),
        ("Where the business stands", None),
        ("Why brands stay", [
            "The weekly action email is opened by 71 percent of brands, and expansion comes "
            "from adding sibling brands inside the same parent company."]),
        ("Risks we would raise ourselves", None),
    ])),
    (1, "Founding Team.pdf", *doc("Founders and key hires", [])),
    (2, "Financial Model.xlsx", *model("Quarterly build, FY27 to FY29")),
    (2, "Unit Economics.xlsx", *table("Unit economics", rows_key="unit_rows",
                                      note="Per brand, July 2026 actuals")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Product Overview.pdf", *doc("How it works", [
        ("Setup", [
            "A Shopify connect, or a warehouse connection for brands on other stacks. "
            "Median time from signup to first cohort chart is eleven minutes."]),
        ("What it computes", [
            "Repeat rate by cohort, by first product and by acquisition channel.",
            "Contribution per cohort after discounting and returns.",
            "Channel quality scoring, which is repeat rate weighted by margin.",
            "Customer level churn risk, pushed into the brand's own email tool."]),
        ("The weekly action email", [
            "One email every Monday with three things to change, ranked by rupees. This is "
            "the artefact brands actually use and it is why renewal conversations are short."]),
    ])),
    (4, "Traction Report.pdf", *doc("Commercial progress to July 2026", [
        ("Month by month", None),
        ("Who is paying", None),
        ("What we would not claim", [
            "Sixty eight brands is early. The top five accounts are 22 percent of ARR and "
            "losing two of them would be visible immediately. We would rather you knew that "
            "from us."]),
    ])),
    (4, "Customers.xlsx", *table("Customers", rows_key="customers",
                                 note="Paying brands as at 31 July 2026")),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
]

AUTO[(SLUG, "Risks we would raise ourselves")] = lambda st, p: [
    kv_table(st, [("Risk %d" % (i + 1), r) for i, r in enumerate(p["risks"])])]


def generate():
    os.makedirs(OUT, exist_ok=True)
    files = []
    for folder_no, fname, builder, payload in MANIFEST:
        if not SAFE_NAME.match(fname):
            raise SystemExit("Unsafe filename: %r" % fname)
        path = os.path.join(OUT, fname)
        BUILDERS[builder](path, PROFILE, fname, payload)
        files.append({"folder": FOLDERS[folder_no - 1], "name": fname, "path": path,
                      "size": os.path.getsize(path)})
        print("  built %-34s %7d" % (fname, os.path.getsize(path)))
    # The founder video, straight off the machine.
    if os.path.exists(VIDEO_SRC):
        files.insert(1, {"folder": FOLDERS[0], "name": VIDEO_NAME, "path": VIDEO_SRC,
                         "size": os.path.getsize(VIDEO_SRC)})
        print("  video %-34s %7d" % (VIDEO_NAME, os.path.getsize(VIDEO_SRC)))
    else:
        print("  NO VIDEO at %s" % VIDEO_SRC)
    return files


def upload(files):
    import requests
    e = env()
    base = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = e["SUPABASE_SERVICE_ROLE_KEY"]
    ok = 0
    for f in files:
        ext = f["name"].lower().rsplit(".", 1)[-1]
        ct = {"pdf": "application/pdf",
              "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "mp4": "video/mp4"}.get(ext, "application/octet-stream")
        path = "demo/%s/%s" % (SLUG, f["name"])
        with open(f["path"], "rb") as fh:
            body = fh.read()
        r = requests.post(
            "%s/storage/v1/object/%s/%s" % (base, BUCKET, urllib.parse.quote(path, safe="/")),
            data=body, headers={"Authorization": "Bearer %s" % key, "apikey": key,
                                "Content-Type": ct, "x-upsert": "true"}, timeout=300)
        if r.status_code in (200, 201):
            ok += 1
        else:
            print("  FAILED %s %s %s" % (f["name"], r.status_code, r.text[:150]))
    print("  uploaded %d of %d" % (ok, len(files)))


def build_sql(files):
    frows, pos = [], {}
    for f in files:
        pos[f["folder"]] = pos.get(f["folder"], 0) + 1
        frows.append("      ('%s','%s','%s',%d,%d)"
                     % (sqlq(f["folder"]), sqlq(f["name"]), ftype(f["name"]),
                        f["size"], pos[f["folder"]]))

    irows = ["      ('%s','%s',%d,'%s')" % (sqlq(n), e, s, st) for n, e, s, st in INVESTORS]

    prows = []
    for style, secs in PAGES.items():
        for i, s in enumerate(secs, start=1):
            if s:
                prows.append("      ('%s',%d,%d)" % (style, i, s))

    return TEMPLATE % {
        "OWNER": OWNER, "SLUG": SLUG, "SPACE": sqlq(SPACE),
        "DECK": sqlq(DECK_NAME), "VIDEO": sqlq(VIDEO_NAME),
        "FOLDERS": ", ".join("'%s'" % sqlq(f) for f in FOLDERS),
        "FILES": ",\n".join(frows),
        "INVESTORS": ",\n".join(irows),
        "PAGES": ",\n".join(prows),
    }


TEMPLATE = r"""-- ============================================================================
-- FOUNDER ANALYTICS DEMO  ·  %(OWNER)s
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
  select id into v_own from auth.users where lower(email) = '%(OWNER)s';
  if v_own is null then raise exception 'No auth user for %(OWNER)s.'; end if;

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
  values (s_id, '%(SPACE)s', '%(SPACE)s',
          'Retention analytics for Indian direct to consumer brands. Seed round, Kochi.',
          v_own, now() - interval '31 days');

  insert into public.folders (id, user_id, name, space_id, parent_id, position)
  select gen_random_uuid(), v_own, fol, s_id, null, ord
    from unnest(array[%(FOLDERS)s]) with ordinality as u(fol, ord);

  insert into public.files
    (id, user_id, folder_id, space_id, name, type, storage_path,
     size_bytes, views, position, created_at)
  select gen_random_uuid()::text, v_own, fo.id, s_id, f.fname, f.ftype,
         'demo/%(SLUG)s/' || f.fname, f.sz, 0, f.pos,
         now() - interval '31 days' + (f.pos || ' hours')::interval
    from (values
%(FILES)s
    ) as f(fol, fname, ftype, sz, pos)
    join public.folders fo on fo.space_id = s_id and fo.name = f.fol;

  select id into f_deck from public.files where space_id = s_id and name = '%(DECK)s';
  select id into f_vid  from public.files where space_id = s_id and name = '%(VIDEO)s';

  -- ── Investors, and what each of them actually did ────────────────────────
  base_day := 21;
  for inv in select * from (values
%(INVESTORS)s
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
%(PAGES)s
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
%(PAGES)s
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
"""


if __name__ == "__main__":
    print("Building founder analytics demo")
    fs = generate()
    if "--upload" in sys.argv:
        print("Uploading")
        upload(fs)
    if "--sql" in sys.argv:
        out = os.path.join(os.path.dirname(os.path.dirname(HERE)), "sql", "founder_demo.sql")
        s = build_sql(fs)
        with open(out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(s)
        print("  wrote %s (%d lines)" % (out, s.count("\n") + 1))
