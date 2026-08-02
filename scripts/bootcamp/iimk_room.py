# -*- coding: utf-8 -*-
"""
The IIMK LIVE demonstration data room, on omprakashborkar611@gmail.com.

The pitch this room makes, without a word being said: IIMK LIVE runs a
Matching Investment Program that puts its startups in front of 50+ VCs, and
has no idea what happens to a document after it is sent. This is that cohort,
in a room they control, where every open is visible.

IIMK LIVE's own published figures are used for the institution (207 startups
incubated, Rs 304 crore raised, and so on) because getting those right is the
homework. The cohort companies are invented and every page says SAMPLE.

  python scripts/bootcamp/iimk_room.py --upload --sql
"""

import os
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
DEMO = os.path.join(os.path.dirname(HERE), "demo_docs")
sys.path.insert(0, DEMO)

from build import (                      # noqa: E402
    AUTO, BUILDERS, env, BUCKET, sqlq, ftype, SAFE_NAME, data_table, kv_table,
)
from manifest import doc, table          # noqa: E402

SLUG = "iimk-live"
SPACE = "IIMK LIVE  ·  Cohort Investor Room (demonstration)"
OWNER_EMAIL = "omprakashborkar611@gmail.com"
OUT = os.path.join(DEMO, "out", SLUG)

FOLDERS_IIMK = [
    "01 About IIMK LIVE",
    "02 Cohort Snapshot",
    "03 Startup Profiles",
    "04 Investor Process",
    "05 Programme and Compliance",
]

PROFILE = {
    "slug": SLUG,
    "name": "IIMK LIVE",
    "legal": "Laboratory for Innovation Venturing and Entrepreneurship, IIM Kozhikode",
    "cin": "Section 8, IIM Kozhikode",
    "city": "Kozhikode and Kochi, Kerala",
    "founded": "June 2016",
    "sector": "Incubation",
    "founder_email": OWNER_EMAIL,
    "one_line": "IIM Kozhikode's incubator, supported by the Department of Science and Technology.",
    "stage": "Institution",
    "ask": "n/a",
    "post": "n/a",
    "runway": "n/a",
    "docs_note": "Prepared for the IIMK LIVE investor network, August 2026.",
    "founders": [
        ("Prof. Ashutosh Sarkar", "Executive Director, IIMK LIVE",
         "Leads the incubator across the Kozhikode and Kochi campuses."),
        ("Investment Committee", "Startup selection and funding decisions",
         "Includes IIMK alumni operators. Ashutosh Vikram, co-founder of Ninjacart, "
         "sits on the committee as an Investment Committee member and startup mentor."),
        ("Mentor panel", "Sector and functional mentors",
         "Angel investors and operators drawn from Indian Angel Network, Malabar Angel "
         "Network and the IIMK alumni base."),
    ],
    # Published figures from iimklive.org
    "metrics": [
        ("Startups incubated", "207"),
        ("Startups graduated", "65"),
        ("Promoters supported", "532"),
        ("External funds raised by portfolio", "Rs 304 crore"),
        ("Seed fund assistance deployed", "Rs 13 crore"),
        ("Follow on investment", "Rs 179 crore"),
        ("Portfolio revenue generated", "Rs 145 crore"),
        ("Jobs created", "1,503"),
    ],
    "traction_rows": [
        ["Programme", "What it is", "Stage served", "Support"],
        ["Business Incubation Programme", "Twelve month incubation at Kozhikode and Kochi",
         "Business model validation to product market fit", "Space, mentors, investor access"],
        ["DEEP LEAP", "Deep tech incubation, powered by Walmart",
         "AI and ML, robotics, spaceTech, climateTech, semiconductors, quantum",
         "Up to Rs 30 lakh"],
        ["Matching Investment Program", "Structured investor matching",
         "Fundraise ready", "50+ VCs, three month mentorship, demo pitch"],
        ["FundQuest", "Fundraising readiness",
         "Pre raise", "Deck review, fundability assessment, investor insight"],
        ["IDEA VAULT", "Idea stage programme and bootcamp",
         "Idea to prototype", "Workshops, one to one mentoring"],
        ["GENESIS", "Workshop series",
         "All stages", "Leadership, brand and scaling"],
    ],
    "cap": [
        ["Cohort company", "Sector", "Campus", "Stage", "Raising", "Status"],
        ["Aether Semiconductors", "Semiconductors", "Kochi", "Seed", "Rs 9.0 crore", "In market"],
        ["Verdant Climate", "Climate tech", "Kozhikode", "Seed", "Rs 6.5 crore", "In market"],
        ["Orbitfall Systems", "Space tech", "Kochi", "Pre seed", "Rs 4.0 crore", "Preparing"],
        ["Praan Robotics", "Robotics", "Kochi", "Seed", "Rs 7.5 crore", "In market"],
        ["Quantiva", "Quantum safe security", "Kozhikode", "Pre seed", "Rs 3.5 crore", "Preparing"],
        ["Sarva Health AI", "Health AI", "Kozhikode", "Seed", "Rs 8.0 crore", "In market"],
    ],
    "customers": [
        ["Investor", "Type", "Introduced", "Rooms opened", "Documents read", "Status"],
        ["Angel network, Kerala", "Angel network", "12 Jul 2026", "6 of 6", "41", "Two in diligence"],
        ["Early stage fund, Bengaluru", "VC", "12 Jul 2026", "4 of 6", "22", "One in diligence"],
        ["Deep tech fund, Mumbai", "VC", "14 Jul 2026", "3 of 6", "17", "Reviewing"],
        ["Family office, Kochi", "Family office", "14 Jul 2026", "6 of 6", "38", "Reviewing"],
        ["Corporate venture arm", "CVC", "18 Jul 2026", "2 of 6", "9", "Reviewing"],
        ["Sector fund, Chennai", "VC", "18 Jul 2026", "0 of 6", "0", "Not opened"],
        ["Angel, IIMK alumnus", "Angel", "21 Jul 2026", "5 of 6", "26", "One in diligence"],
        ["Seed fund, Hyderabad", "VC", "21 Jul 2026", "1 of 6", "3", "Reviewing"],
    ],
    "unit_rows": [
        ["Metric", "Cohort 1", "Note"],
        ["Companies in cohort", "6", "Selected from 118 applications"],
        ["Combined raise sought", "Rs 38.5 crore", "Across six companies"],
        ["Companies with revenue", "4 of 6", "Remaining two are pre revenue by design"],
        ["Combined annualised revenue", "Rs 4.9 crore", "As at 31 July 2026"],
        ["Median founder age", "31", "Four of six are first time founders"],
        ["Women in founding teams", "5", "Across four of the six companies"],
        ["Investors introduced", "8", "Through the Matching Investment Program"],
    ],
    "risks": [
        "Two of six companies are pre revenue and are presented as such.",
        "Deep tech timelines are long. Semiconductor and quantum companies here are "
        "pre commercial and should be read on milestones, not revenue.",
        "Every figure in the startup profiles is founder reported and marked where it is "
        "unaudited.",
    ],
}


# Which table each "None" section resolves to. Without these every one of
# them silently falls back to the institution metrics, which would put the
# same eight numbers on four different pages.
AUTO[(SLUG, "Track record")] = lambda st, p: [kv_table(st, p["metrics"])]
AUTO[(SLUG, "Reported outcomes")] = lambda st, p: [kv_table(st, p["metrics"])]
AUTO[(SLUG, "The programmes")] = lambda st, p: [data_table(st, p["traction_rows"])]
AUTO[(SLUG, "The cohort at a glance")] = lambda st, p: [data_table(st, p["cap"])]
AUTO[(SLUG, "Current cohort engagement")] = lambda st, p: [data_table(st, p["customers"])]


def startup(name, tag, sector, city, one_liner, sections):
    """A cohort one pager, in the same shape every profile follows."""
    return (3, "%s.pdf" % name, *doc(
        "%s  ·  %s  ·  %s" % (tag, sector, city),
        [("What they do", [one_liner])] + sections))


MANIFEST_IIMK = [
    (1, "IIMK LIVE Overview.pdf", *doc(
        "The incubator, its mandate and its reach", [
            ("What IIMK LIVE is", [
                "The Laboratory for Innovation Venturing and Entrepreneurship is IIM "
                "Kozhikode's business incubator and entrepreneurship development centre, "
                "set up in June 2016 with support from the Department of Science and "
                "Technology, Government of India. It operates from the Kozhikode campus "
                "and from a second campus in Kochi."]),
            ("Track record", None),
            ("Who it is open to", [
                "The incubation programme is open to any founder and is not restricted to "
                "IIMK students, alumni or faculty. Applicants are expected to have a proof "
                "of concept or a prototype and to be registered as a company."]),
            ("Partners", [
                "Department of Science and Technology, Government of India.",
                "MeitY Startup Hub, Ministry of Electronics and Information Technology.",
                "Walmart, through the DEEP LEAP deep tech programme.",
                "Cochin Shipyard.",
                "Startup India."]),
        ])),

    (1, "Programmes and Funding.pdf", *doc(
        "What a startup can enter and what it receives", [
            ("The programmes", None),
            ("Seed capital", [
                "LIVE has deployed Rs 13 crore of seed fund assistance into its portfolio, "
                "which has gone on to attract Rs 179 crore of follow on investment. DEEP "
                "LEAP carries funding of up to Rs 30 lakh per deep tech company."]),
            ("What the institution measures itself on", [
                "Not applications received. Graduated companies, capital raised by the "
                "portfolio, revenue generated and jobs created. Those four numbers are "
                "published and are on the previous page."]),
        ])),

    (1, "Leadership and Investment Committee.pdf", *doc(
        "Who decides and who mentors", [])),

    (2, "Cohort Snapshot.pdf", *doc(
        "IDEA VAULT Cohort 1, August 2026", [
            ("The cohort at a glance", None),
            ("How they were selected", [
                "118 applications, 34 first round interviews, 12 shortlisted for the "
                "bootcamp and 6 admitted to the cohort. Selection weighted proof of "
                "concept and founder domain depth over polish of the deck."]),
            ("Sector mix", [
                "The cohort deliberately follows the DEEP LEAP sectors: semiconductors, "
                "climate technology, space technology, robotics, quantum safe security and "
                "health AI. Four are at the Kochi campus and two at Kozhikode."]),
            ("What this room is for", [
                "Every company below has a full data room of its own. This room is the "
                "index. An investor opens it once, reads the profiles, and asks for access "
                "to the rooms they want. LIVE sees exactly which profiles were read and by "
                "whom, which is the part that does not exist today."]),
        ])),

    (2, "Cohort Companies.xlsx", *table("Cohort", rows_key="cap",
                                        note="IDEA VAULT Cohort 1, as at 31 July 2026")),
    (2, "Cohort Metrics.xlsx", *table("Metrics", rows_key="unit_rows",
                                      note="Cohort level figures, as at 31 July 2026")),

    startup("Aether Semiconductors", "Cohort 1", "Semiconductors", "Kochi",
            "Analog front end design for industrial sensing, sold as licensed IP blocks to "
            "Indian fabless design houses and instrument makers.", [
                ("Where they are", [
                    "Three IP blocks taped out on a 180 nanometre process and validated in "
                    "silicon. Two paid evaluation licences signed with Indian instrument "
                    "manufacturers. Pre revenue on royalties, which begin at customer volume."]),
                ("The team", [
                    "Two founders out of a global semiconductor company's Bengaluru design "
                    "centre, with a combined nineteen years in analog design, plus a third "
                    "on the verification side."]),
                ("Why LIVE admitted them", [
                    "India has design talent and almost no design product companies. The "
                    "team had already taped out before applying, which removed the largest "
                    "single risk in a semiconductor company at this stage."]),
                ("What an investor should test", [
                    "Royalty conversion from evaluation licence to volume, the length of the "
                    "customer design cycle, and dependence on a single foundry relationship."]),
            ]),

    startup("Verdant Climate", "Cohort 1", "Climate technology", "Kozhikode",
            "Measurement, reporting and verification for smallholder agroforestry carbon "
            "projects, using satellite imagery plus a field app that works offline.", [
                ("Where they are", [
                    "Two projects under contract covering 4,100 hectares and 2,600 "
                    "smallholders in Kerala and Karnataka. Annualised revenue of Rs 1.4 "
                    "crore on verification fees."]),
                ("The team", [
                    "A remote sensing scientist, a carbon markets specialist who has taken "
                    "two projects through Verra validation, and a field operations lead."]),
                ("Why LIVE admitted them", [
                    "Carbon MRV for smallholders is unsolved because the plots are too small "
                    "to survey economically. Satellite plus offline field app is a credible "
                    "answer, and the team has actually cleared a registry before."]),
                ("What an investor should test", [
                    "Registry acceptance of their methodology, buyer concentration in the "
                    "voluntary carbon market, and whether pricing survives a market downturn."]),
            ]),

    startup("Orbitfall Systems", "Cohort 1", "Space technology", "Kochi",
            "Ground segment software for small satellite operators: pass scheduling, "
            "telemetry decoding and automated anomaly detection across rented antennas.", [
                ("Where they are", [
                    "Pre revenue. Two paid pilots with Indian small satellite operators and "
                    "an agreement with one ground station network. Software is flying "
                    "against two live spacecraft."]),
                ("The team", [
                    "Founders from an Indian space startup's mission operations team, having "
                    "run ground segment for four launches between them."]),
                ("Why LIVE admitted them", [
                    "Every new operator rebuilds the same ground software badly. It is a "
                    "picks and shovels position in a sector where India is adding operators "
                    "faster than it is adding ground capability."]),
                ("What an investor should test", [
                    "How many Indian operators are actually funded, whether the ground "
                    "station networks build this themselves, and the length of the sales "
                    "cycle into a public sector buyer."]),
            ]),

    startup("Praan Robotics", "Cohort 1", "Robotics", "Kochi",
            "Autonomous mobile robots for mid sized warehouses, retrofitted into existing "
            "racking rather than requiring a purpose built facility.", [
                ("Where they are", [
                    "Eleven robots deployed across three warehouses. Annualised revenue of "
                    "Rs 2.1 crore on a robot as a service model at Rs 32,000 per robot per "
                    "month."]),
                ("The team", [
                    "A robotics engineer from an Indian warehouse automation company, a "
                    "controls specialist and a third founder from third party logistics "
                    "operations."]),
                ("Why LIVE admitted them", [
                    "Warehouse automation in India is sold to the top of the market. The mid "
                    "sized operator with existing racking and no capital budget is unserved, "
                    "and the retrofit plus subscription model is built for exactly that buyer."]),
                ("What an investor should test", [
                    "Robot utilisation across sites, the cost of the field service model as "
                    "the fleet grows, and gross margin once hardware depreciation is fully "
                    "loaded."]),
            ]),

    startup("Quantiva", "Cohort 1", "Quantum safe security", "Kozhikode",
            "Post quantum cryptography migration tooling: it inventories where an "
            "organisation uses vulnerable cryptography and sequences the replacement.", [
                ("Where they are", [
                    "Pre revenue. Two paid discovery engagements with Indian financial "
                    "institutions. Product is at the inventory stage, with migration "
                    "orchestration on the roadmap."]),
                ("The team", [
                    "A cryptographer with a doctorate and two engineers from a payments "
                    "security company."]),
                ("Why LIVE admitted them", [
                    "The regulatory clock is the whole thesis. Financial regulators will "
                    "eventually mandate migration, and no Indian institution knows today "
                    "where its vulnerable cryptography lives."]),
                ("What an investor should test", [
                    "Whether the timeline is a real budget cycle or a distant fear, and "
                    "whether the large security vendors simply add this as a feature."]),
            ]),

    startup("Sarva Health AI", "Cohort 1", "Health AI", "Kozhikode",
            "Discharge summary generation for Indian hospitals from clinician notes and "
            "the case sheet, in English and Malayalam, cutting documentation time.", [
                ("Where they are", [
                    "Live in five hospitals with annualised revenue of Rs 1.4 crore. Median "
                    "time to produce a discharge summary is down from 34 minutes to 6."]),
                ("The team", [
                    "A physician who practised for seven years, an NLP engineer and a "
                    "hospital operations lead."]),
                ("Why LIVE admitted them", [
                    "Documentation, not diagnosis, is where clinician time actually goes. It "
                    "is a lower regulatory bar than a diagnostic device and the buyer is the "
                    "hospital administrator, who has a budget."]),
                ("What an investor should test", [
                    "Clinician acceptance rate on generated text without editing, whether "
                    "the hospital information system vendors bundle this, and the accuracy "
                    "of the Malayalam output."]),
            ]),

    (4, "Matching Investment Program.pdf", *doc(
        "How LIVE introduces its portfolio to investors", [
            ("The programme", [
                "The Matching Investment Program connects fundraise ready portfolio "
                "companies with an investor network of more than fifty venture funds, "
                "alongside three months of mentorship and a demo pitch session."]),
            ("How an introduction works today", [
                "LIVE sends the company's deck and supporting documents to the relevant "
                "investors, usually by email attachment, and then waits. Whether the "
                "investor opened it, how long they spent, which page they stopped on and "
                "which of the fifty read anything at all is not visible to anyone."]),
            ("What this room changes", [
                "Every profile and every company room is shared as a link rather than an "
                "attachment. LIVE sees who opened, what they read, how long they stayed and "
                "where they stopped. A follow up goes to the investor who read the "
                "financials twice, not to all fifty."]),
            ("Current cohort engagement", None),
        ])),

    (4, "Investor Engagement Record.xlsx", *table(
        "Investors", rows_key="customers",
        note="Cohort 1 investor engagement, as at 31 July 2026")),

    (4, "Investment Committee Process.pdf", *doc(
        "How a company reaches an investor through LIVE", [
            ("Selection", [
                "Applications are screened by the LIVE team, then interviewed. Companies "
                "admitted to incubation are reviewed by the Investment Committee, which "
                "includes IIMK alumni operators and investors."]),
            ("Seed assistance", [
                "Seed fund assistance is decided by the committee against milestones rather "
                "than a fixed schedule. Rs 13 crore has been deployed across the portfolio "
                "to date."]),
            ("Introduction to the network", [
                "A company is put in front of the investor network when it is judged "
                "fundraise ready, which in practice means a validated model, evidence of "
                "demand, and a data room that will survive diligence."]),
            ("What LIVE does not do", [
                "LIVE does not recommend an investment and does not represent any company's "
                "figures as verified. Every number in this room is founder reported."]),
        ])),

    (4, "How to Request Access.pdf", *doc(
        "For investors reading this room", [
            ("Reading this room", [
                "This index room contains a one page profile for each company in the cohort. "
                "It is deliberately short. Nothing here is confidential."]),
            ("Requesting a company room", [
                "Each company has its own full data room with financials, contracts, "
                "technical documentation and legal files. Access is granted per investor by "
                "the founder, not by LIVE, and is revocable at any time."]),
            ("Asking a question", [
                "Every document carries an Ask a question action. The question reaches the "
                "LIVE programme manager with the document and the page it came from "
                "attached, so the answer is specific."]),
            ("What the founder sees", [
                "The founder sees that you opened the room and which sections you spent time "
                "in. This is disclosed to every investor up front, because a room that "
                "watches you without saying so is not a room anyone should trust."]),
        ])),

    (5, "DST Recognition and Governance.pdf", *doc(
        "Institutional standing", [
            ("Recognition", [
                "Established in June 2016 with support from the Department of Science and "
                "Technology, Government of India. Recognised on the Startup India platform "
                "as an incubator and associated with MeitY Startup Hub."]),
            ("Governance", [
                "LIVE operates under IIM Kozhikode with its own Executive Director and an "
                "Investment Committee for funding decisions. Reporting obligations to DST "
                "cover startups supported, funds deployed, follow on capital and jobs "
                "created."]),
            ("Reported outcomes", None),
        ])),

    (5, "Incubation Agreement Template.pdf", *doc(
        "Standard terms between LIVE and a portfolio company", [
            ("Term", [
                "Twelve months of incubation, extendable once on review. Covers workspace at "
                "subsidised rates, mentorship, and access to the investor network."]),
            ("Consideration", [
                "Where seed fund assistance is provided, it is on terms agreed per company "
                "with the Investment Committee. Incubation alone does not carry an equity "
                "requirement."]),
            ("Confidentiality", [
                "Mutual. LIVE may name the company as a portfolio company and use its "
                "aggregate metrics in reporting to DST and in published figures. Anything "
                "beyond that requires written consent."]),
            ("Exit", [
                "Either party may end the engagement on thirty days notice. Companies that "
                "complete the term are recorded as graduated, of which there are 65 to date."]),
        ])),

    (5, "Data Sharing and Consent.pdf", *doc(
        "How company documents are shared with investors", [
            ("The principle", [
                "A document reaches an investor because the founder decided it should. LIVE "
                "makes the introduction. It does not hold a standing right to circulate any "
                "company's material."]),
            ("Per investor access", [
                "Access is granted to a named investor email, not to a public link. It can "
                "be withdrawn at any moment, and withdrawal takes effect immediately, "
                "including on links already sent."]),
            ("What is logged", [
                "Who opened, when, for how long, and which pages. The log is visible to the "
                "founder and to the LIVE programme manager. It is disclosed to the investor "
                "before they open anything."]),
            ("Retention", [
                "Access logs are retained for the life of the cohort plus twelve months. "
                "Company documents remain the company's property throughout and are removed "
                "on request."]),
        ])),
]


def generate():
    os.makedirs(OUT, exist_ok=True)
    made = []
    for folder_no, filename, builder, payload in MANIFEST_IIMK:
        if not SAFE_NAME.match(filename):
            raise SystemExit("Unsafe filename: %r" % filename)
        path = os.path.join(OUT, filename)
        BUILDERS[builder](path, PROFILE, filename, payload)
        made.append({
            "folder": FOLDERS_IIMK[folder_no - 1],
            "name": filename,
            "path": path,
            "storage": "demo/%s/%s" % (SLUG, filename),
            "size": os.path.getsize(path),
        })
        print("  built %-46s %7d bytes" % (filename, os.path.getsize(path)))
    return made


def upload(files):
    import requests
    e = env()
    base = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = e["SUPABASE_SERVICE_ROLE_KEY"]
    ok = 0
    for f in files:
        ct = ("application/pdf" if f["name"].lower().endswith(".pdf")
              else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        url = "%s/storage/v1/object/%s/%s" % (
            base, BUCKET, urllib.parse.quote(f["storage"], safe="/"))
        with open(f["path"], "rb") as fh:
            body = fh.read()
        r = requests.post(url, data=body, headers={
            "Authorization": "Bearer %s" % key, "apikey": key,
            "Content-Type": ct, "x-upsert": "true",
        }, timeout=120)
        if r.status_code in (200, 201):
            ok += 1
        else:
            print("  FAILED %s -> %s %s" % (f["storage"], r.status_code, r.text[:200]))
    print("  uploaded %d of %d" % (ok, len(files)))


SQL_TEMPLATE = """-- ============================================================================
-- IIMK LIVE DEMONSTRATION DATA ROOM
-- ============================================================================
-- Owner: %(OWNER)s
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
  select id into v_own from auth.users where lower(email) = '%(OWNER)s';
  if v_own is null then
    raise exception 'No auth user for %(OWNER)s.';
  end if;

  -- Remove only a previous copy of this one room.
  select id into s_id from public.spaces
   where name = '%(SPACE)s' and created_by = v_own limit 1;
  if s_id is not null then
    delete from public.files   where space_id = s_id;
    delete from public.folders where space_id = s_id;
    delete from public.share_links where space_id = s_id;
    delete from public.spaces  where id = s_id;
  end if;

  s_id := gen_random_uuid();

  insert into public.spaces (id, name, title, description, created_by)
  values (s_id, '%(SPACE)s', '%(SPACE)s',
          '%(DESC)s', v_own);

  insert into public.folders (id, user_id, name, space_id, parent_id, position)
  select gen_random_uuid(), v_own, fol, s_id, null, ord
    from unnest(array[%(FOLDERS)s]) with ordinality as u(fol, ord);

  insert into public.files
    (id, user_id, folder_id, space_id, name, type, storage_path,
     size_bytes, views, position, created_at)
  select gen_random_uuid()::text, v_own, fo.id, s_id, t.fname, t.ftype,
         'demo/%(SLUG)s/' || t.fname, t.sz, t.vws, t.pos,
         now() - (t.age || ' days')::interval
    from (values
%(ROWS)s
    ) as t(fol, fname, ftype, sz, vws, pos, age)
    join public.folders fo on fo.space_id = s_id and fo.name = t.fol;
end $$;
"""


def write_sql(files):
    rows = []
    seen = {}
    for i, f in enumerate(files):
        seen[f["folder"]] = seen.get(f["folder"], 0) + 1
        rows.append("      ('%s','%s','%s',%d,%d,%d,%d)"
                    % (sqlq(f["folder"]), sqlq(f["name"]), ftype(f["name"]),
                       f["size"], (i * 5) % 31, seen[f["folder"]], 2 + (i * 3) % 26))
    sql = SQL_TEMPLATE % {
        "OWNER": OWNER_EMAIL,
        "SPACE": sqlq(SPACE),
        "SLUG": SLUG,
        "DESC": sqlq(
            "How IIMK LIVE could share IDEA VAULT Cohort 1 with its investor network, "
            "with every open visible. A VentureThrust demonstration. Institutional figures "
            "are IIMK LIVE's published numbers; the cohort companies are sample data."),
        "FOLDERS": ", ".join("'%s'" % sqlq(f) for f in FOLDERS_IIMK),
        "ROWS": ",\n".join(rows),
    }
    out = os.path.join(os.path.dirname(os.path.dirname(HERE)), "sql", "iimk_demo_room.sql")
    with open(out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(sql)
    print("  wrote %s" % out)


if __name__ == "__main__":
    print("Generating IIMK LIVE room")
    fs = generate()
    print("  %d files" % len(fs))
    if "--upload" in sys.argv:
        print("Uploading")
        upload(fs)
    if "--sql" in sys.argv:
        write_sql(fs)
