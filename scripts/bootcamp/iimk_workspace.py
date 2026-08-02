# -*- coding: utf-8 -*-
"""
The whole IIMK LIVE workspace on omprakashborkar611@gmail.com.

Not one room. What their account looks like on a Tuesday six weeks in: the
cohort index, a full data room per portfolio company, share links out to named
investors, and the engagement those links produced. The point of the demo is
the Analytics tab, where one fund has opened nothing and another has read the
financials three times.

Institutional figures are IIMK LIVE's published numbers. Programme names are
theirs: SPROUT, LIFE, FundQuest, Bouncer, DEEP LEAP, the Matching Investment
Program and the Business Incubation Programme. The companies are invented and
every generated page carries a SAMPLE footer.

  python scripts/bootcamp/iimk_workspace.py --upload --sql
"""

import os
import sys
import random
import urllib.parse
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
DEMO = os.path.join(os.path.dirname(HERE), "demo_docs")
sys.path.insert(0, DEMO)

from build import (                       # noqa: E402
    AUTO, BUILDERS, MODELS, env, BUCKET, sqlq, ftype, SAFE_NAME,
    data_table, kv_table,
)
from manifest import doc, table, model    # noqa: E402
import iimk_room                          # noqa: E402  (the cohort index room)

OWNER = "omprakashborkar611@gmail.com"
OUT_ROOT = os.path.join(DEMO, "out")
random.seed(20260803)

FOLDERS_CO = [
    "01 Company Overview",
    "02 Financials",
    "03 Product and Technology",
    "04 Customers and Traction",
    "05 Legal and Compliance",
]

# Junk left over from testing. It sits next to the demo in the Spaces list and
# undoes the whole illusion, so it goes.
JUNK_SPACES = ["gandu", "Untitled Space",
               "IIMK LIVE  ·  Cohort Investor Room (demonstration)"]

# The investor side of the Matching Investment Program. Engagement is uneven on
# purpose: that is what makes the analytics worth looking at.
INVESTORS = [
    ("Malabar Angel Network",      "deals@malabarangels.example",     "heavy"),
    ("Unicorn India Ventures",     "review@uiv.example",              "heavy"),
    ("Speciale Invest",            "deeptech@speciale.example",       "medium"),
    ("Kerala Startup Mission Fund", "fund@ksum.example",              "medium"),
    ("IIMK alumni angel syndicate", "syndicate@iimkalumni.example",   "light"),
    ("Rainmatter Capital",         "climate@rainmatter.example",      "light"),
    ("Anthill Ventures",           "scout@anthill.example",           "none"),
    ("Yournest Venture Capital",   "team@yournest.example",           "none"),
]

WEIGHT = {"heavy": (10, 16), "medium": (4, 8), "light": (1, 3), "none": (0, 0)}


def company(slug, name, sector, city, one_line, ask, metrics, cap, customers,
            unit_rows, traction_rows, founders, risks, product, traction_note):
    return dict(
        slug=slug, name=name, sector=sector, city=city, one_line=one_line,
        legal="%s Private Limited" % name, cin="U72900KL2025PTC0%s" % slug[-5:].upper()[:5],
        founded="2025", stage="Seed", ask=ask, post="n/a", runway="n/a",
        founder_email=OWNER, docs_note="IIMK LIVE portfolio company. Prepared for investors, August 2026.",
        metrics=metrics, cap=cap, customers=customers, unit_rows=unit_rows,
        traction_rows=traction_rows, founders=founders, risks=risks,
        _product=product, _traction=traction_note,
    )


COMPANIES = [
    company(
        "aether-semiconductors", "Aether Semiconductors", "Semiconductors", "Kochi",
        "Analog front end IP for industrial sensing, licensed to Indian fabless houses.",
        "Rs 9.0 crore",
        [("Programme", "DEEP LEAP, Cohort 2"), ("IP blocks taped out", "3, on 180 nm"),
         ("Evaluation licences signed", "2"), ("Royalty revenue", "Pre revenue"),
         ("LIVE seed assistance", "Rs 30 lakh"), ("Raising", "Rs 9.0 crore seed"),
         ("Team", "7 full time"), ("Monthly burn", "Rs 14.2 lakh")],
        [["Holder", "Instrument", "Shares", "Fully diluted %"],
         ["Founder, design", "Equity", "3,60,000", "36.0"],
         ["Founder, verification", "Equity", "3,00,000", "30.0"],
         ["IIMK LIVE (DEEP LEAP)", "CCPS", "60,000", "6.0"],
         ["Angel round, Mar 2026", "CCPS", "1,30,000", "13.0"],
         ["ESOP pool", "Options", "1,50,000", "15.0"]],
        [["Customer", "Type", "Location", "Since", "Value (Rs)", "Status"],
         ["Instrument maker, Bengaluru", "Evaluation licence", "Bengaluru", "Apr 2026", "12,00,000", "Live"],
         ["Process control OEM", "Evaluation licence", "Pune", "Jun 2026", "9,00,000", "Live"],
         ["Fabless design house", "In discussion", "Hyderabad", "Jul 2026", "Pending", "Negotiating"]],
        [["Line item", "Per licence (Rs)", "Notes"],
         ["Evaluation licence fee", "6,00,000", "One time, twelve months"],
         ["Royalty per unit shipped", "34", "Begins at customer volume"],
         ["Mask and tape out cost", "-48,00,000", "Amortised across blocks"],
         ["EDA tool licences", "-18,00,000", "Annual"],
         ["Design headcount", "-84,00,000", "Annual, five engineers"]],
        [["Quarter", "IP blocks", "Licences", "Revenue (Rs lakh)", "Headcount"],
         ["Q3 FY26", "1", "0", "0", "3"], ["Q4 FY26", "2", "1", "6", "5"],
         ["Q1 FY27", "3", "2", "15", "7"]],
        [("Design lead", "Co-founder and CEO",
          "Eleven years in analog design at a global semiconductor company's Bengaluru centre."),
         ("Verification lead", "Co-founder and CTO",
          "Eight years in mixed signal verification, three tape outs to volume."),
         ("Applications engineer", "Founding engineer",
          "Customer facing design support, previously at an instrumentation OEM.")],
        ["Royalty conversion from evaluation to volume is unproven.",
         "Design cycles at customers run 12 to 18 months, so revenue is slow to appear.",
         "Single foundry relationship for the 180 nm process."],
        [("The IP", ["Three analog front end blocks for industrial sensing: a low noise "
                     "amplifier chain, a 24 bit sigma delta converter and a precision "
                     "reference. All three are silicon validated on a 180 nanometre process."]),
         ("Why licensed IP and not chips", [
             "Selling IP blocks avoids inventory, avoids a fab relationship at volume and "
             "puts the company inside the customer's design rather than beside it. It also "
             "means revenue arrives late, which is the trade being made deliberately."]),
         ("Validation", ["Each block has a characterisation report against datasheet "
                         "parameters across temperature. Both evaluation customers have "
                         "reproduced the results on their own boards."])],
        [("Where the revenue comes from", [
            "Two paid evaluation licences at Rs 6 lakh each. Royalties begin when either "
            "customer ships volume, which on their stated timelines is Q3 FY27."]),
         ("Pipeline", None)],
    ),
    company(
        "verdant-climate", "Verdant Climate", "Climate technology", "Kozhikode",
        "Carbon measurement and verification for smallholder agroforestry.",
        "Rs 6.5 crore",
        [("Programme", "Business Incubation Programme"), ("Hectares under contract", "4,100"),
         ("Smallholders covered", "2,600"), ("Annualised revenue", "Rs 1.42 crore"),
         ("LIVE seed assistance", "Rs 25 lakh"), ("Raising", "Rs 6.5 crore seed"),
         ("Gross margin", "58 percent"), ("Monthly burn", "Rs 11.8 lakh")],
        [["Holder", "Instrument", "Shares", "Fully diluted %"],
         ["Founder, remote sensing", "Equity", "3,40,000", "34.0"],
         ["Founder, carbon markets", "Equity", "3,10,000", "31.0"],
         ["Field operations lead", "Equity", "80,000", "8.0"],
         ["IIMK LIVE", "CCPS", "50,000", "5.0"],
         ["Angel round, Jan 2026", "CCPS", "1,20,000", "12.0"],
         ["ESOP pool", "Options", "1,00,000", "10.0"]],
        [["Project", "Hectares", "Smallholders", "State", "Registry", "Annual fee (Rs)"],
         ["Wayanad agroforestry", "2,400", "1,510", "Kerala", "Verra, validation", "84,00,000"],
         ["Coorg shade coffee", "1,700", "1,090", "Karnataka", "Verra, pipeline", "58,00,000"],
         ["Nilgiris pilot", "300", "180", "Tamil Nadu", "Pre validation", "Unbilled"]],
        [["Line item", "Per hectare per year (Rs)", "Notes"],
         ["Verification fee", "3,460", "Charged to the project developer"],
         ["Satellite imagery", "-210", "Commercial licence, per hectare"],
         ["Field sampling", "-680", "Ground truthing at 4 percent of plots"],
         ["Registry and audit", "-540", "Third party validation"],
         ["Contribution", "2,030", "58.7 percent"]],
        [["Quarter", "Hectares", "Smallholders", "Revenue (Rs lakh)", "Projects"],
         ["Q3 FY26", "1,200", "740", "18", "1"], ["Q4 FY26", "2,400", "1,510", "26", "1"],
         ["Q1 FY27", "4,100", "2,600", "36", "3"]],
        [("Remote sensing lead", "Co-founder and CEO",
          "Doctorate in remote sensing, six years on land use change modelling."),
         ("Carbon markets lead", "Co-founder",
          "Took two agroforestry projects through Verra validation before this."),
         ("Field operations lead", "Head of Field",
          "Ran a state agricultural extension programme across three districts.")],
        ["Registry acceptance of the methodology is not yet final on two of three projects.",
         "Voluntary carbon prices are volatile and buyer concentration is high.",
         "Field sampling cost rises if registries tighten ground truthing requirements."],
        [("How measurement works", [
            "Satellite imagery estimates biomass change across the whole project area. A "
            "field app, which works offline, captures ground truth on a 4 percent sample of "
            "plots. The two are reconciled into a verification report the registry accepts."]),
         ("Why smallholders are the hard case", [
             "Plots are a fraction of a hectare, so conventional survey costs more than the "
             "credits are worth. Satellite plus sampled ground truth is the only economics "
             "that closes."]),
         ("The offline app", [
             "Field officers in Wayanad and Coorg work without signal for most of the day. "
             "Everything captures locally and syncs when a connection appears."])],
        [("Projects under contract", None)],
    ),
    company(
        "orbitfall-systems", "Orbitfall Systems", "Space technology", "Kochi",
        "Ground segment software for small satellite operators.",
        "Rs 4.0 crore",
        [("Programme", "DEEP LEAP, Cohort 2"), ("Spacecraft supported", "2, live"),
         ("Paid pilots", "2"), ("Revenue", "Pre revenue"),
         ("LIVE seed assistance", "Rs 30 lakh"), ("Raising", "Rs 4.0 crore pre seed"),
         ("Team", "5 full time"), ("Monthly burn", "Rs 7.4 lakh")],
        [["Holder", "Instrument", "Shares", "Fully diluted %"],
         ["Founder, mission operations", "Equity", "4,00,000", "40.0"],
         ["Founder, software", "Equity", "3,20,000", "32.0"],
         ["IIMK LIVE (DEEP LEAP)", "CCPS", "60,000", "6.0"],
         ["Friends and family", "CCPS", "70,000", "7.0"],
         ["ESOP pool", "Options", "1,50,000", "15.0"]],
        [["Customer", "Type", "Engagement", "Since", "Value (Rs)", "Status"],
         ["Small satellite operator A", "Paid pilot", "Pass scheduling", "Mar 2026", "8,00,000", "Live"],
         ["Small satellite operator B", "Paid pilot", "Telemetry decode", "May 2026", "6,00,000", "Live"],
         ["Ground station network", "Partnership", "Integration", "Jun 2026", "Revenue share", "Signed"]],
        [["Line item", "Per operator per year (Rs)", "Notes"],
         ["Platform subscription, target", "24,00,000", "Not yet charged at list"],
         ["Pilot fee, actual", "7,00,000", "Average of two pilots"],
         ["Cloud and compute", "-3,20,000", "Per operator"],
         ["Support engineer allocation", "-6,40,000", "Per operator"]],
        [["Quarter", "Spacecraft", "Pilots", "Revenue (Rs lakh)", "Headcount"],
         ["Q3 FY26", "0", "0", "0", "3"], ["Q4 FY26", "1", "1", "8", "4"],
         ["Q1 FY27", "2", "2", "6", "5"]],
        [("Mission operations lead", "Co-founder and CEO",
          "Ran ground segment for four launches at an Indian space startup."),
         ("Software lead", "Co-founder and CTO",
          "Distributed systems, previously on a satellite tasking platform."),
         ("Ground systems engineer", "Founding engineer",
          "RF and antenna control, from a public sector ground station.")],
        ["Pre revenue at list price. The two pilots are priced below the target subscription.",
         "The number of funded Indian small satellite operators is small and known.",
         "Ground station networks could build this in house and are the obvious competitor."],
        [("What the software does", [
            "Schedules passes across rented antennas, decodes telemetry into readable "
            "parameters, and flags anomalies automatically instead of waiting for an "
            "operator to notice."]),
         ("Why operators do not build it", [
             "They do, badly, and then maintain it forever. It is not their differentiator "
             "and it consumes the engineers who should be working on the spacecraft."]),
         ("Current deployment", [
             "Flying against two live spacecraft with a third integration in progress "
             "through the ground station network partnership."])],
        [("Pilots and partnership", None)],
    ),
    company(
        "praan-robotics", "Praan Robotics", "Robotics", "Kochi",
        "Retrofit autonomous mobile robots for mid sized warehouses.",
        "Rs 7.5 crore",
        [("Programme", "DEEP LEAP, Cohort 2"), ("Robots deployed", "11"),
         ("Warehouses live", "3"), ("Annualised revenue", "Rs 2.11 crore"),
         ("Price per robot per month", "Rs 32,000"), ("Raising", "Rs 7.5 crore seed"),
         ("Gross margin", "41 percent"), ("Monthly burn", "Rs 16.4 lakh")],
        [["Holder", "Instrument", "Shares", "Fully diluted %"],
         ["Founder, robotics", "Equity", "3,20,000", "32.0"],
         ["Founder, controls", "Equity", "2,90,000", "29.0"],
         ["Founder, operations", "Equity", "1,00,000", "10.0"],
         ["IIMK LIVE (DEEP LEAP)", "CCPS", "60,000", "6.0"],
         ["Angel round, Feb 2026", "CCPS", "1,30,000", "13.0"],
         ["ESOP pool", "Options", "1,00,000", "10.0"]],
        [["Warehouse", "Operator type", "Location", "Robots", "Live since", "Annual value (Rs)"],
         ["Third party logistics, Kochi", "3PL", "Kochi", "5", "Nov 2025", "19,20,000"],
         ["FMCG distributor", "Distributor", "Coimbatore", "4", "Feb 2026", "15,36,000"],
         ["Pharma distributor", "Distributor", "Kochi", "2", "Jun 2026", "7,68,000"],
         ["Auto parts warehouse", "In pilot", "Chennai", "0", "Aug 2026", "Pilot"]],
        [["Line item", "Per robot per month (Rs)", "Notes"],
         ["Subscription", "32,000", "Robot as a service, no capex to customer"],
         ["Hardware amortisation", "-11,400", "Four year life"],
         ["Field service", "-4,200", "One engineer per twelve robots"],
         ["Connectivity and cloud", "-1,100", "Per robot"],
         ["Contribution", "15,300", "47.8 percent"]],
        [["Quarter", "Robots", "Warehouses", "Revenue (Rs lakh)", "Uptime %"],
         ["Q3 FY26", "5", "1", "9", "94.1"], ["Q4 FY26", "9", "2", "17", "96.4"],
         ["Q1 FY27", "11", "3", "26", "97.8"]],
        [("Robotics lead", "Co-founder and CEO",
          "Six years at an Indian warehouse automation company, last on navigation."),
         ("Controls lead", "Co-founder and CTO",
          "Motion planning and fleet control, doctorate in robotics."),
         ("Operations lead", "Co-founder",
          "Nine years running third party logistics warehouse floors.")],
        ["Field service cost per robot is the number that decides whether this scales.",
         "Retrofit means every site is slightly different, which resists standardisation.",
         "Hardware depreciation is carried on the company balance sheet, not the customer's."],
        [("Why retrofit", [
            "Purpose built automation needs a new building. Mid sized Indian operators have "
            "existing racking, existing aisles and no capital budget. The robots are built "
            "to work in the warehouse that is already there."]),
         ("The fleet software", [
             "Traffic management, task allocation and charging scheduling across a mixed "
             "fleet, with a floor supervisor view that needs no training to read."]),
         ("Uptime", ["97.8 percent across the fleet in Q1 FY27, up from 94.1 percent, mostly "
                     "from better charge scheduling rather than better hardware."])],
        [("Deployments", None)],
    ),
    company(
        "quantiva", "Quantiva", "Quantum safe security", "Kozhikode",
        "Post quantum cryptography discovery and migration for financial institutions.",
        "Rs 3.5 crore",
        [("Programme", "DEEP LEAP, Cohort 2"), ("Paid discovery engagements", "2"),
         ("Institutions in pipeline", "5"), ("Revenue", "Rs 18 lakh, project based"),
         ("LIVE seed assistance", "Rs 30 lakh"), ("Raising", "Rs 3.5 crore pre seed"),
         ("Team", "6 full time"), ("Monthly burn", "Rs 9.1 lakh")],
        [["Holder", "Instrument", "Shares", "Fully diluted %"],
         ["Founder, cryptography", "Equity", "3,80,000", "38.0"],
         ["Founder, engineering", "Equity", "3,00,000", "30.0"],
         ["IIMK LIVE (DEEP LEAP)", "CCPS", "60,000", "6.0"],
         ["Angel, security operator", "CCPS", "60,000", "6.0"],
         ["ESOP pool", "Options", "2,00,000", "20.0"]],
        [["Institution", "Type", "Engagement", "Since", "Value (Rs)", "Status"],
         ["Private bank", "Bank", "Discovery", "Apr 2026", "10,00,000", "Delivered"],
         ["Payments company", "Fintech", "Discovery", "Jun 2026", "8,00,000", "In progress"],
         ["Cooperative bank group", "Bank", "Proposal", "Jul 2026", "Pending", "Proposal out"]],
        [["Line item", "Per engagement (Rs)", "Notes"],
         ["Discovery engagement", "9,00,000", "Six to ten weeks"],
         ["Migration platform, target", "36,00,000", "Annual, not yet sold"],
         ["Delivery cost", "-4,20,000", "Two engineers, part allocated"],
         ["Contribution, discovery", "4,80,000", "53.3 percent"]],
        [["Quarter", "Engagements", "Institutions", "Revenue (Rs lakh)", "Headcount"],
         ["Q3 FY26", "0", "0", "0", "3"], ["Q4 FY26", "1", "1", "10", "5"],
         ["Q1 FY27", "2", "2", "8", "6"]],
        [("Cryptographer", "Co-founder and CEO",
          "Doctorate in cryptography, published on lattice based schemes."),
         ("Engineering lead", "Co-founder and CTO",
          "Payments security, built HSM integration at a card network."),
         ("Delivery lead", "Founding engineer",
          "Security assessment delivery into Indian banks.")],
        ["The regulatory deadline is anticipated, not published. Budgets may not move yet.",
         "Large security vendors could add discovery as a feature.",
         "Revenue is project shaped today and has to become recurring."],
        [("What the product finds", [
            "Every place an institution relies on cryptography that a quantum computer would "
            "eventually break: TLS termination, code signing, stored keys, HSM "
            "configurations and hard coded certificates in legacy applications."]),
         ("Why discovery first", [
             "No Indian institution can currently answer where its vulnerable cryptography "
             "lives. Migration cannot be planned or priced until it can, so discovery is "
             "both the wedge and the honest first step."]),
         ("The migration roadmap", [
             "Sequencing and orchestration of the replacement is on the roadmap and is where "
             "the recurring revenue is. It does not exist yet and is not sold."])],
        [("Engagements to date", None)],
    ),
    company(
        "sarva-health-ai", "Sarva Health AI", "Health AI", "Kozhikode",
        "Discharge summary generation for Indian hospitals, English and Malayalam.",
        "Rs 8.0 crore",
        [("Programme", "Business Incubation Programme"), ("Hospitals live", "5"),
         ("Summaries generated per month", "9,400"), ("Annualised revenue", "Rs 1.44 crore"),
         ("Time per summary", "6 minutes, from 34"), ("Raising", "Rs 8.0 crore seed"),
         ("Gross margin", "71 percent"), ("Monthly burn", "Rs 13.6 lakh")],
        [["Holder", "Instrument", "Shares", "Fully diluted %"],
         ["Founder, clinical", "Equity", "3,40,000", "34.0"],
         ["Founder, NLP", "Equity", "3,00,000", "30.0"],
         ["Founder, operations", "Equity", "90,000", "9.0"],
         ["IIMK LIVE", "CCPS", "50,000", "5.0"],
         ["Angel round, Dec 2025", "CCPS", "1,20,000", "12.0"],
         ["ESOP pool", "Options", "1,00,000", "10.0"]],
        [["Hospital", "Beds", "District", "Live since", "Summaries/month", "Annual value (Rs)"],
         ["Multi speciality, Kozhikode", "220", "Kozhikode", "Oct 2025", "2,800", "42,00,000"],
         ["District referral hospital", "180", "Malappuram", "Dec 2025", "2,100", "31,50,000"],
         ["Private hospital, Kochi", "140", "Ernakulam", "Feb 2026", "1,700", "25,50,000"],
         ["Speciality hospital", "90", "Thrissur", "Apr 2026", "1,400", "21,00,000"],
         ["Co operative hospital", "110", "Kannur", "Jun 2026", "1,400", "21,00,000"]],
        [["Line item", "Per summary (Rs)", "Notes"],
         ["Price realised", "128", "Annual hospital contract, per summary"],
         ["Inference cost", "-14", "Indian cloud region"],
         ["Clinician review sampling", "-16", "6 percent re read"],
         ["Support and success", "-7", "Allocated"],
         ["Contribution", "91", "71.1 percent"]],
        [["Quarter", "Hospitals", "Summaries", "Revenue (Rs lakh)", "Acceptance %"],
         ["Q3 FY26", "2", "12,600", "16", "78"], ["Q4 FY26", "3", "19,400", "25", "84"],
         ["Q1 FY27", "5", "28,200", "36", "89"]],
        [("Clinician founder", "Co-founder and CEO",
          "Practised for seven years, wrote several thousand discharge summaries by hand."),
         ("NLP lead", "Co-founder and CTO",
          "Clinical language models, previously at a health records company."),
         ("Operations lead", "Co-founder",
          "Hospital operations, ran medical records for a 300 bed hospital.")],
        ["Clinician acceptance without edit is 89 percent and has to keep climbing.",
         "Hospital information system vendors could bundle this.",
         "Malayalam output accuracy trails English and is checked more heavily."],
        [("What it does", [
            "Takes the case sheet and the clinician's notes and produces a discharge summary "
            "in the hospital's own format, in English or Malayalam. Median time to produce "
            "one falls from 34 minutes to 6."]),
         ("Why documentation and not diagnosis", [
             "Documentation is where clinician time actually goes, the regulatory bar is far "
             "lower than a diagnostic device, and the buyer is the administrator who has a "
             "budget and a staffing problem."]),
         ("Safety", [
             "Nothing is filed without a clinician signing it. Six percent of summaries are "
             "re read by an independent clinician and scored, and that score is reported to "
             "the hospital monthly."])],
        [("Hospitals live", None)],
    ),
]


# The financial model sheet needs a driver set per company. Deep tech ramps
# late and hard; the revenue businesses ramp earlier and flatter.
FIN = {
    "aether-semiconductors": [("Licence revenue", [15, 24, 38, 56, 420, 1180]),
                              ("Royalty revenue", [0, 0, 8, 22, 260, 940]),
                              ("Gross margin %", [0.62, 0.66, 0.71, 0.74, 0.79, 0.83]),
                              ("Design and tape out", [38, 42, 48, 54, 268, 452]),
                              ("People cost", [42, 48, 58, 70, 356, 624])],
    "verdant-climate":       [("Verification revenue", [36, 48, 64, 84, 468, 1020]),
                              ("Gross margin %", [0.587, 0.601, 0.618, 0.634, 0.668, 0.702]),
                              ("Field operations", [14, 18, 23, 29, 148, 296]),
                              ("People cost", [34, 39, 47, 56, 284, 498])],
    "orbitfall-systems":     [("Platform revenue", [6, 14, 26, 44, 318, 820]),
                              ("Gross margin %", [0.48, 0.55, 0.62, 0.68, 0.76, 0.81]),
                              ("Cloud and ground", [8, 11, 15, 20, 96, 188]),
                              ("People cost", [24, 29, 36, 45, 236, 412])],
    "praan-robotics":        [("Subscription revenue", [26, 38, 54, 74, 412, 918]),
                              ("Gross margin %", [0.478, 0.502, 0.528, 0.551, 0.598, 0.641]),
                              ("Fleet and field service", [12, 17, 24, 32, 168, 342]),
                              ("People cost", [38, 44, 53, 64, 322, 566])],
    "quantiva":              [("Engagement revenue", [8, 14, 22, 34, 196, 388]),
                              ("Platform revenue", [0, 0, 9, 18, 184, 596]),
                              ("Gross margin %", [0.533, 0.561, 0.604, 0.648, 0.712, 0.768]),
                              ("Delivery cost", [9, 12, 16, 21, 104, 196]),
                              ("People cost", [22, 26, 32, 40, 208, 372])],
    "sarva-health-ai":       [("Subscription revenue", [36, 48, 64, 84, 496, 1140]),
                              ("Gross margin %", [0.711, 0.724, 0.738, 0.751, 0.782, 0.808]),
                              ("Cloud and review", [8, 10, 13, 17, 84, 176]),
                              ("People cost", [32, 37, 45, 54, 278, 486])],
}
for _slug, _lines in FIN.items():
    MODELS[_slug] = {"unit": "Rs lakh",
                     "periods": ["Q1 FY27", "Q2 FY27", "Q3 FY27", "Q4 FY27", "FY28", "FY29"],
                     "lines": _lines}


def register_auto():
    for c in COMPANIES:
        s = c["slug"]
        AUTO[(s, "Where the business stands")] = lambda st, p: [kv_table(st, p["metrics"])]
        AUTO[(s, "Pipeline")] = lambda st, p: [data_table(st, p["customers"])]
        for head in ("Projects under contract", "Pilots and partnership", "Deployments",
                     "Engagements to date", "Hospitals live"):
            AUTO[(s, head)] = lambda st, p: [data_table(st, p["customers"])]
        AUTO[(s, "Quarter by quarter")] = lambda st, p: [data_table(st, p["traction_rows"])]


def room_manifest(c):
    """The ten documents every portfolio company room carries."""
    return [
        (1, "%s Pitch Deck.pdf" % c["name"], *doc(
            "Seed deck, August 2026", [
                ("What they do", [c["one_line"]]),
                ("Where the business stands", None),
                ("The team", [
                    "%s. %s" % (c["founders"][0][0], c["founders"][0][2]),
                    "%s. %s" % (c["founders"][1][0], c["founders"][1][2]),
                    "%s. %s" % (c["founders"][2][0], c["founders"][2][2])]),
                ("The raise", ["Raising %s. IIMK LIVE portfolio company, introduced through "
                               "the Matching Investment Program." % c["ask"]]),
                ("What we would still watch", c["risks"]),
            ])),
        (1, "One Pager.pdf", *doc("Company summary, August 2026", [
            ("What they do", [c["one_line"]]),
            ("Where the business stands", None),
            ("Risks the company states itself", c["risks"]),
        ])),
        (1, "Founding Team.pdf", *doc("Founders and key hires", [])),
        (2, "Financial Model.xlsx", *model("Quarterly build, FY27 to FY29")),
        (2, "Unit Economics.xlsx", *table("Unit economics", rows_key="unit_rows",
                                          note="As at 31 July 2026")),
        (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                     note="Fully diluted, before the proposed round")),
        (3, "Product and Technology.pdf", *doc("How it works", c["_product"])),
        (4, "Traction Report.pdf", *doc("Commercial progress to July 2026",
                                        c["_traction"] + [("Quarter by quarter", None)])),
        (4, "Customers.xlsx", *table("Customers", rows_key="customers",
                                     note="As at 31 July 2026")),
        (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies", [])),
    ]


def generate():
    register_auto()
    rooms = []
    for c in COMPANIES:
        out = os.path.join(OUT_ROOT, c["slug"])
        os.makedirs(out, exist_ok=True)
        files = []
        for folder_no, fname, builder, payload in room_manifest(c):
            if not SAFE_NAME.match(fname):
                raise SystemExit("Unsafe filename: %r" % fname)
            path = os.path.join(out, fname)
            BUILDERS[builder](path, c, fname, payload)
            files.append({
                "folder": FOLDERS_CO[folder_no - 1], "name": fname, "path": path,
                "storage": "demo/%s/%s" % (c["slug"], fname),
                "size": os.path.getsize(path),
            })
        print("  %-24s %2d files" % (c["name"], len(files)))
        rooms.append({"space": "%s  ·  Data Room" % c["name"], "slug": c["slug"],
                      "files": files})
    return rooms


def upload(rooms):
    import requests
    e = env()
    base = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = e["SUPABASE_SERVICE_ROLE_KEY"]
    ok = tot = 0
    for r in rooms:
        for f in r["files"]:
            tot += 1
            with open(f["path"], "rb") as fh:
                body = fh.read()
            ct = ("application/pdf" if f["name"].lower().endswith(".pdf")
                  else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            resp = requests.post(
                "%s/storage/v1/object/%s/%s" % (base, BUCKET,
                                                urllib.parse.quote(f["storage"], safe="/")),
                data=body, headers={"Authorization": "Bearer %s" % key, "apikey": key,
                                    "Content-Type": ct, "x-upsert": "true"}, timeout=120)
            if resp.status_code in (200, 201):
                ok += 1
            else:
                print("  FAILED %s %s" % (f["storage"], resp.status_code))
    print("  uploaded %d of %d" % (ok, tot))


# ── SQL ──────────────────────────────────────────────────────────────────────

NOW = datetime(2026, 8, 2, 12, 0, tzinfo=timezone.utc)


def ts(days_ago, hour=10, minute=0):
    d = NOW - timedelta(days=days_ago)
    return d.replace(hour=hour, minute=minute).strftime("%Y-%m-%d %H:%M:%S+00")


SQL_BODY = r"""
  -- ── Rooms ────────────────────────────────────────────────────────────────
  for r in select * from (values
%(ROOMS)s
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
%(FILES)s
      ) as f(slug, fol, fname, ftype, sz, pos)
      join public.folders fo on fo.space_id = s_id and fo.name = f.fol
     where f.slug = r.slug;

    -- ── Share links to the investor network, and what they did with them ───
    n := 0;
    for inv in select * from (values
%(INVESTORS)s
    ) as i(nm, em, wt) loop
      n := n + 1;

      -- The index room goes to everyone. Company rooms go to a subset,
      -- because that is how a real programme introduces a portfolio.
      continue when r.slug <> '%(INDEX_SLUG)s' and (n + r.age) %% 3 = 2;

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
                (array['Desktop','Desktop','Mobile','Tablet'])[1 + (random() * 3)::int],
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
        where f.space_id = s_id and f.name ilike '%%pitch deck%%';
      end loop;

      insert into public.share_link_access_logs
        (id, share_link_id, email, action, created_at)
      values (gen_random_uuid(), lnk, inv.em, 'opened',
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
"""


def build_sql_compact(rooms):
    """Loop driven, so the whole workspace fits on a screen instead of 2,300 lines."""
    idx_files = []
    for folder_no, fname, _, _ in iimk_room.MANIFEST_IIMK:
        p = os.path.join(OUT_ROOT, iimk_room.SLUG, fname)
        idx_files.append((iimk_room.SLUG, iimk_room.FOLDERS_IIMK[folder_no - 1], fname,
                          os.path.getsize(p) if os.path.exists(p) else 0))

    all_rooms = [(iimk_room.SPACE, iimk_room.SLUG,
                  "IDEA VAULT Cohort 1. The index every investor in the Matching Investment "
                  "Program receives. A VentureThrust demonstration built for IIMK LIVE; "
                  "cohort companies are sample data.",
                  iimk_room.FOLDERS_IIMK, 44)]
    file_rows = list(idx_files)
    for i, r in enumerate(rooms):
        c = next(x for x in COMPANIES if x["slug"] == r["slug"])
        all_rooms.append((r["space"], r["slug"],
                          "%s IIMK LIVE portfolio company, %s, %s."
                          % (c["one_line"], c["sector"], c["city"]),
                          FOLDERS_CO, 39 - i * 5))
        seen = {}
        for f in r["files"]:
            seen[f["folder"]] = seen.get(f["folder"], 0) + 1
            file_rows.append((r["slug"], f["folder"], f["name"], f["size"]))

    # positions per (slug, folder)
    pos = {}
    frows = []
    for row in file_rows:
        slug, fol, fname = row[0], row[1], row[2]
        size = row[3] if len(row) == 4 else row[3]
        key = (slug, fol)
        pos[key] = pos.get(key, 0) + 1
        frows.append("        ('%s','%s','%s','%s',%d,%d)"
                     % (slug, sqlq(fol), sqlq(fname), ftype(fname), size, pos[key]))

    rrows = ["    ('%s','%s','%s',array[%s],%d)"
             % (sqlq(nm), slug, sqlq(descr),
                ", ".join("'%s'" % sqlq(f) for f in folders), age)
             for nm, slug, descr, folders, age in all_rooms]

    irows = ["      ('%s','%s',%d)" % (sqlq(n), e, WEIGHT[w][0])
             for n, e, w in INVESTORS]

    head = """-- ============================================================================
-- IIMK LIVE WORKSPACE  ·  %s
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
  select id into v_own from auth.users where lower(email) = '%s';
  if v_own is null then raise exception 'No auth user for %s.'; end if;

  update public.profiles
     set plan = 'vdr_ai', plan_status = 'active',
         plan_expires_at = greatest(coalesce(plan_expires_at, now()), now() + interval '730 days')
   where id = v_own;

  -- Clear the leftover test rooms and any previous run of this workspace.
  for s_id in select id from public.spaces
               where created_by = v_own and name = any(array[%s])
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
""" % (OWNER, OWNER, OWNER,
       ", ".join("'%s'" % sqlq(x) for x in
                 [nm for nm, _, _, _, _ in all_rooms] + JUNK_SPACES))

    return head + SQL_BODY % {
        "ROOMS": ",\n".join(rrows),
        "FILES": ",\n".join(frows),
        "INVESTORS": ",\n".join(irows),
        "INDEX_SLUG": iimk_room.SLUG,
    }


def build_sql(rooms):
    L = []
    add = L.append

    add("""-- ============================================================================
-- IIMK LIVE WORKSPACE  ·  %s
-- ============================================================================
-- What IIMK LIVE's account looks like once they are actually using the
-- product: the cohort index room, a data room for every portfolio company,
-- share links out to named investors, and the engagement those links produced.
--
-- The Analytics tab is the demonstration. Two investors have read almost
-- everything, two have not opened anything at all, and today nobody can see
-- that.
--
-- Institutional figures are IIMK LIVE's published numbers. Programme names
-- are theirs. The companies are invented and every page says SAMPLE.
--
-- Safe to re-run. Only touches this account.
-- ============================================================================

do $$
declare
  v_own uuid;
  s_id  uuid;
  lnk   uuid;
  ses   uuid;
begin
  select id into v_own from auth.users where lower(email) = '%s';
  if v_own is null then raise exception 'No auth user for %s.'; end if;

  update public.profiles
     set plan = 'vdr_ai', plan_status = 'active',
         plan_expires_at = greatest(coalesce(plan_expires_at, now()), now() + interval '730 days')
   where id = v_own;
""" % (OWNER, OWNER, OWNER))

    # Wipe the leftover test spaces plus any previous run of this workspace.
    names = [r["space"] for r in rooms] + JUNK_SPACES + [iimk_room.SPACE]
    add("  -- Clear leftover test rooms and any previous run of this workspace.\n")
    add("  for s_id in select id from public.spaces\n"
        "               where created_by = v_own and name = any(array[%s])\n  loop\n"
        % ", ".join("'%s'" % sqlq(n) for n in names))
    add("""    delete from public.file_page_views where space_id = s_id;
    delete from public.viewer_sessions where space_id = s_id;
    delete from public.space_questions where space_id = s_id;
    delete from public.share_link_access_logs where share_link_id in
      (select id from public.share_links where space_id = s_id);
    delete from public.share_links where space_id = s_id;
    delete from public.files   where space_id = s_id;
    delete from public.folders where space_id = s_id;
    delete from public.spaces  where id = s_id;
  end loop;
""")

    # The cohort index room, rebuilt here so the whole workspace is one script.
    idx_files = []
    for folder_no, fname, _, _ in iimk_room.MANIFEST_IIMK:
        p = os.path.join(OUT_ROOT, iimk_room.SLUG, fname)
        idx_files.append({"folder": iimk_room.FOLDERS_IIMK[folder_no - 1], "name": fname,
                          "size": os.path.getsize(p) if os.path.exists(p) else 0})
    all_rooms = [{"space": iimk_room.SPACE, "slug": iimk_room.SLUG,
                  "files": idx_files, "folders": iimk_room.FOLDERS_IIMK,
                  "desc": "IDEA VAULT Cohort 1. The index every investor in the Matching "
                          "Investment Program receives. A VentureThrust demonstration built "
                          "for IIMK LIVE; cohort companies are sample data."}]
    for r in rooms:
        c = next(x for x in COMPANIES if x["slug"] == r["slug"])
        all_rooms.append({**r, "folders": FOLDERS_CO,
                          "desc": "%s %s, %s. IIMK LIVE portfolio company." %
                                  (c["one_line"], c["sector"], c["city"])})

    for ri, room in enumerate(all_rooms):
        age = 44 - ri * 5
        add("\n  -- ── %s ─────────────────────────\n" % room["space"])
        add("  s_id := gen_random_uuid();\n")
        add("  insert into public.spaces (id, name, title, description, created_by, created_at)\n"
            "  values (s_id, '%s', '%s', '%s', v_own, timestamptz '%s');\n"
            % (sqlq(room["space"]), sqlq(room["space"]), sqlq(room["desc"]), ts(age)))
        add("  insert into public.folders (id, user_id, name, space_id, parent_id, position)\n"
            "  select gen_random_uuid(), v_own, fol, s_id, null, ord\n"
            "    from unnest(array[%s]) with ordinality as u(fol, ord);\n"
            % ", ".join("'%s'" % sqlq(f) for f in room["folders"]))

        add("  insert into public.files\n"
            "    (id, user_id, folder_id, space_id, name, type, storage_path,\n"
            "     size_bytes, views, position, created_at)\n"
            "  select gen_random_uuid()::text, v_own, fo.id, s_id, t.fname, t.ftype,\n"
            "         'demo/%s/' || t.fname, t.sz, t.vws, t.pos,\n"
            "         timestamptz '%s' + (t.pos || ' hours')::interval\n"
            "    from (values\n" % (room["slug"], ts(age)))
        seen = {}
        rows = []
        for i, f in enumerate(room["files"]):
            seen[f["folder"]] = seen.get(f["folder"], 0) + 1
            rows.append("      ('%s','%s','%s',%d,%d,%d)"
                        % (sqlq(f["folder"]), sqlq(f["name"]), ftype(f["name"]),
                           f["size"], random.randint(2, 34), seen[f["folder"]]))
        add(",\n".join(rows))
        add("\n    ) as t(fol, fname, ftype, sz, vws, pos)\n"
            "    join public.folders fo on fo.space_id = s_id and fo.name = t.fol;\n")

        # Share links to the investor network, and the engagement they produced.
        for ii, (iname, iemail, weight) in enumerate(INVESTORS):
            # Company rooms go to a subset; the index goes to everyone.
            if ri > 0 and (ii + ri) % 3 == 2:
                continue
            sent = age - 6 - ii
            if sent < 1:
                sent = 1 + ii % 5
            lo, hi = WEIGHT[weight]
            opens = random.randint(lo, hi) if hi else 0
            add("\n  lnk := gen_random_uuid();\n")
            add("  insert into public.share_links\n"
                "    (id, space_id, token, is_active, email_required, recipient_email,\n"
                "     recipient_name, created_by, created_at, sent_at, open_count,\n"
                "     opened_at, last_opened_at, link_name)\n"
                "  values (lnk, s_id, encode(gen_random_bytes(16),'hex'), true, true,\n"
                "          '%s', '%s', v_own, timestamptz '%s', timestamptz '%s', %d,\n"
                "          %s, %s, '%s');\n"
                % (iemail, sqlq(iname), ts(sent), ts(sent), opens,
                   ("timestamptz '%s'" % ts(sent - 1, 11)) if opens else "null",
                   ("timestamptz '%s'" % ts(max(sent - 9, 1), 16)) if opens else "null",
                   sqlq(iname)))

            if not opens:
                continue

            # One viewer session per open, with page level dwell on the deck.
            for k in range(min(opens, 4)):
                day = max(sent - 1 - k * 3, 1)
                secs = random.randint(140, 1500) if weight == "heavy" else random.randint(60, 420)
                dev = random.choice(["Desktop", "Desktop", "Mobile", "Tablet"])
                add("  ses := gen_random_uuid();\n")
                add("  insert into public.viewer_sessions\n"
                    "    (id, space_id, share_link_id, visitor_email, device,\n"
                    "     started_at, last_heartbeat, ended_at, total_seconds)\n"
                    "  values (ses, s_id, lnk, '%s', '%s', timestamptz '%s',\n"
                    "          timestamptz '%s' + interval '%d seconds',\n"
                    "          timestamptz '%s' + interval '%d seconds', %d);\n"
                    % (iemail, dev, ts(day, 10 + k), ts(day, 10 + k), secs,
                       ts(day, 10 + k), secs, secs))
                add("  insert into public.file_page_views\n"
                    "    (id, file_id, space_id, visitor_email, session_id, page_number,\n"
                    "     seconds_viewed, viewed_at)\n"
                    "  select gen_random_uuid(), f.id, s_id, '%s', ses, g.pg,\n"
                    "         (8 + (random()*70)::int), timestamptz '%s'\n"
                    "    from public.files f\n"
                    "    cross join generate_series(1, 6) as g(pg)\n"
                    "   where f.space_id = s_id and f.name like '%%Pitch Deck%%'\n"
                    "      or (f.space_id = s_id and f.name like '%%One Pager%%' and g.pg = 1);\n"
                    % (iemail, ts(day, 10 + k)))

            add("  insert into public.share_link_access_logs (id, share_link_id, email, action, created_at)\n"
                "  values (gen_random_uuid(), lnk, '%s', 'opened', timestamptz '%s');\n"
                % (iemail, ts(max(sent - 1, 1), 11)))

    # A couple of investor questions, because a live room gets them.
    add("""
  -- Questions investors actually asked, which is what a live room looks like.
  insert into public.space_questions
    (id, space_id, file_id, file_name, visitor_name, visitor_email, question, asked_at, answer, answered_at)
  select gen_random_uuid(), f.space_id, f.id, f.name, q.who, q.em, q.qn,
         timestamptz '%s', q.ans,
         case when q.ans is null then null else timestamptz '%s' end
    from (values
      ('Praan Robotics  ·  Data Room', 'Unit Economics.xlsx', 'Unicorn India Ventures',
       'review@uiv.example',
       'Is the field service cost per robot loaded into the contribution figure, or sitting above it?',
       'It is loaded in, at Rs 4,200 per robot per month. That is one engineer per twelve robots at current density.'),
      ('Verdant Climate  ·  Data Room', 'Customers.xlsx', 'Malabar Angel Network',
       'deals@malabarangels.example',
       'What happens to the Coorg project if Verra validation is refused?',
       null),
      ('Sarva Health AI  ·  Data Room', 'Traction Report.pdf', 'Malabar Angel Network',
       'deals@malabarangels.example',
       'Acceptance is 89 percent. What is the Malayalam number on its own?',
       null)
    ) as q(sp, fl, who, em, qn, ans)
    join public.spaces s on s.name = q.sp and s.created_by = v_own
    join public.files  f on f.space_id = s.id and f.name = q.fl;
""" % (ts(4, 15), ts(3, 9)))

    add("end $$;\n")
    return "".join(L)


if __name__ == "__main__":
    print("Generating IIMK LIVE portfolio rooms")
    rooms = generate()
    if "--upload" in sys.argv:
        print("Uploading")
        upload(rooms)
    if "--sql" in sys.argv:
        out = os.path.join(os.path.dirname(os.path.dirname(HERE)), "sql",
                           "iimk_workspace.sql")
        sql = build_sql_compact(rooms)
        with open(out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(sql)
        print("  wrote %s (%d lines)" % (out, sql.count("\n") + 1))
