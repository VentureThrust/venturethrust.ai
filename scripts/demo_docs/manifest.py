# -*- coding: utf-8 -*-
"""
The exact file list for every demo data room.

One source of truth: build.py generates and uploads from this, and writes the
SQL from this, so the rows in the database and the objects in storage can
never drift apart.

Each entry: (folder_number, filename, builder, payload)
  folder_number  1..5, matching FOLDERS below
  builder        pdf_deck | pdf_doc | xlsx_table | xlsx_model
  payload        builder specific content
"""

FOLDERS = [
    "01 Company Overview",
    "02 Financials",
    "03 Product and Technology",
    "04 Customers and Traction",
    "05 Legal and Compliance",
]


def deck(slides):
    return ("pdf_deck", {"slides": slides})


def doc(subtitle, sections):
    return ("pdf_doc", {"subtitle": subtitle, "sections": sections})


def table(sheet, rows_key=None, rows=None, note=""):
    return ("xlsx_table", {"sheet": sheet, "rows_key": rows_key, "rows": rows, "note": note})


def model(note=""):
    return ("xlsx_model", {"note": note})


# ── Nellara AgriChain ────────────────────────────────────────────────────────

NELLARA = [
    (1, "Nellara Pitch Deck v5.pdf", *deck([
        ("Nellara AgriChain",
         ["Farm to retail supply chain for Kerala produce",
          "Seed round, July 2026",
          "Kozhikode, Kerala"]),
        ("The problem",
         ["A tomato leaves a Wayanad farm at Rs 14 and reaches a Kochi kitchen at Rs 46.",
          "Between them sit four intermediaries and two days without cold storage.",
          "Roughly a fifth of the crop never gets sold at all.",
          "The farmer takes the price risk. The buyer takes the quality risk. Nobody owns the middle."]),
        ("What we do",
         ["We buy directly from 34 farmer collectives on a daily indent.",
          "We move it on our own cold chain, four vehicles, two hubs.",
          "We deliver graded, weighed and invoiced produce to retailers, hotels and restaurants.",
          "One price, agreed the night before. No auction, no rejection at the gate."]),
        ("Why it works now",
         ["Kerala imports over 70 percent of its vegetables from Tamil Nadu and Karnataka.",
          "Retail chains in tier 2 Kerala have doubled outlet counts in three years.",
          "Collectives are already digitised through state programmes, so indenting is possible.",
          "Cold chain vehicle leasing has become available below Rs 60,000 a month."]),
        ("Traction",
         ["Monthly GMV Rs 1.42 crore in July 2026, up from Rs 78 lakh in February.",
          "61 retail accounts and 38 hotel and restaurant outlets live.",
          "Repeat order rate 84 percent.",
          "1,240 farmers supplying across 34 collectives."]),
        ("The number that changed",
         ["Wastage 22.1 percent in January 2026. 7.4 percent in July 2026.",
          "Gross margin 8.0 percent to 21.3 percent over the same period.",
          "Three changes did it: daily indenting, pre cooling at the Wayanad hub, and route sequencing.",
          "Every point of wastage is worth about Rs 1.4 lakh a month at current volume."]),
        ("Unit economics",
         ["Blended contribution Rs 9.40 per kg across the SKU mix.",
          "Logistics cost Rs 3.10 per kg, down from Rs 4.80.",
          "Contribution positive on every SKU we currently carry.",
          "Break even at Rs 2.6 crore monthly GMV on the current cost base."]),
        ("Competition",
         ["Traditional mandi chain: cheaper on paper, unreliable on quality and payment terms.",
          "National agri marketplaces: strong in Bengaluru and Chennai, thin in Kerala.",
          "Retail chain direct procurement: works only for their own outlets, not for restaurants.",
          "Our edge is the collective relationships and a cold chain sized for Kerala routes."]),
        ("Use of funds",
         ["Rs 6.0 crore, expected to last 14 months.",
          "Rs 2.4 crore: two more cold chain hubs, Malappuram and Thrissur.",
          "Rs 1.6 crore: working capital for farmer payments within 48 hours.",
          "Rs 1.2 crore: sales team for the Kochi and Thrissur retail corridor.",
          "Rs 0.8 crore: technology and reserve."]),
        ("The team",
         ["Nithin Raveendran, CEO. Seven years running Kerala category at a national agri marketplace.",
          "Fahad Musthafa, COO. Third generation produce trader at Palayam market.",
          "Reshma Pillai, Head of Cold Chain. Nine years in temperature controlled logistics.",
          "18 full time, 34 on field contracts."]),
    ])),
    (1, "One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Nellara does", [
            "Nellara AgriChain buys produce directly from farmer collectives in Wayanad and Malappuram, "
            "moves it on its own cold chain, and delivers graded and invoiced produce to retailers, "
            "hotels and restaurants in Kozhikode, Thrissur and Kochi."]),
        ("Why buyers switch", [
            "A single agreed price fixed the night before delivery.",
            "Graded and weighed at the hub, so no rejection at the receiving gate.",
            "GST compliant invoicing, which the mandi chain cannot offer.",
            "Delivery windows of two hours, not two days."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "Two additional cold chain hubs, working capital to keep farmer payment inside 48 hours, "
            "and a dedicated retail sales team for the Kochi corridor."]),
    ])),
    (1, "Founder Profiles.pdf", *doc("Founding team and key hires", [])),
    (1, "Board Update Q1 FY27.pdf", *doc("Quarterly update to shareholders, 12 July 2026", [
        ("Headline", [
            "Wastage closed the quarter at 7.4 percent and gross margin at 21.3 percent. Both are past "
            "the thresholds we set with the board in January. The business is now contribution "
            "positive on every SKU we carry."]),
        ("Operations", [
            "The Wayanad pre cooling unit went live on 3 May and is the single largest reason wastage fell.",
            "Route sequencing moved from manual to software on 19 May, cutting logistics cost per kg from "
            "Rs 3.90 to Rs 3.10.",
            "Vehicle four joined the fleet on 22 June, on a 36 month lease."]),
        ("Commercial", [
            "Eleven net new accounts this quarter, including Lulu Convenience in Kozhikode.",
            "Nesto Hypermarket has extended from one store to four.",
            "Two accounts lost, both on payment terms we were not willing to extend to 60 days."]),
        ("People", [
            "Two hires in field quality, one in finance. Headcount is 18 full time.",
            "We are searching for a Head of Retail Sales, with an offer out."]),
        ("Cash", [
            "Rs 11.4 lakh monthly burn against Rs 1.9 crore in the bank. Runway to September 2027 "
            "before this round."]),
        ("Ask of the board", [
            "Introductions to institutional buyers in Thrissur and Palakkad, and to seed investors "
            "who have backed supply chain businesses outside metros."]),
    ])),
    (2, "Financial Model FY27.xlsx", *model("Monthly P&L build, FY27 to FY29")),
    (2, "Unit Economics by SKU.xlsx", *table("Unit economics", rows_key="unit_rows",
                                             note="Contribution per kilogram, July 2026 actuals")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (2, "GST Returns FY26.pdf", *doc("GSTR 3B filing summary, FY 2025 to 2026", [
        ("Filing status", [
            "All twelve monthly GSTR 3B returns for FY26 were filed within the due date. No notices "
            "received. GSTIN 32AAJCN4419K1ZP, registered in Kerala."]),
        ("Summary of outward supplies", None),
        ("Input tax credit", [
            "Credit availed of Rs 18.4 lakh against eligible inward supplies, principally cold chain "
            "leasing, fuel and packaging. Reversal of Rs 62,000 under rule 42 on exempt supplies."]),
        ("Auditor note", [
            "Reviewed by Menon and Associates, Chartered Accountants, Kozhikode. Membership 214477. "
            "No qualifications."]),
    ])),
    (3, "Cold Chain Route Plan.pdf", *doc("Network design and daily routing, July 2026", [
        ("Network", [
            "Two hubs: Kalpetta in Wayanad, the collection point for the collectives, and Feroke near "
            "Kozhikode, the distribution point for the retail and hotel corridor."]),
        ("Daily cycle", [
            "17:00 to 20:00, indent closes for the next day and collectives confirm quantities.",
            "04:00 to 07:00, collection runs across Wayanad, produce reaches Kalpetta pre cooling.",
            "07:00 to 09:30, grading, weighing and crate loading.",
            "09:30 to 12:00, line haul to Feroke.",
            "12:00 to 18:00, last mile in three sequenced loops across Kozhikode, Thrissur and Kochi."]),
        ("Temperature discipline", [
            "Leafy produce is held at 2 to 4 degrees, fruit vegetables at 8 to 10 degrees, and "
            "ginger and coconut at ambient. Every vehicle logs temperature every four minutes and the "
            "log is attached to the delivery note."]),
        ("What the next two hubs change", [
            "Malappuram removes 61 km from the Kozhikode to Thrissur leg.",
            "Thrissur brings same day delivery to Kochi, which today is next morning.",
            "Together they take an estimated 1.1 points off wastage and Rs 0.40 off cost per kg."]),
    ])),
    (3, "Wastage Tracking Method.pdf", *doc("How wastage is measured and audited", [
        ("Definition", [
            "Wastage is measured as the weight difference between produce accepted at the Kalpetta hub "
            "and produce invoiced to a buyer, expressed as a percentage of accepted weight. Produce "
            "rejected at collection is not counted, because it was never bought."]),
        ("Measurement points", [
            "Weight at collection, recorded on a calibrated platform scale at the collective.",
            "Weight at hub acceptance, after grading, recorded per crate.",
            "Weight at buyer delivery, from the signed delivery note.",
            "Any difference is attributed to one of five causes: transit damage, temperature excursion, "
            "grading loss, shelf loss at hub, or buyer rejection."]),
        ("Audit", [
            "A 5 percent sample of crates is re weighed at Feroke daily by a person who does not report "
            "to operations. Monthly variance between the sampled and reported figures has stayed under "
            "0.6 points since April 2026."]),
        ("Twelve month history", None),
    ])),
    (3, "Procurement App Overview.pdf", *doc("Collective facing application, version 2.4", [
        ("Purpose", [
            "The application is used by 34 collective secretaries to confirm the next day indent, "
            "record collection weights, and see payment status. It is Malayalam first and works "
            "offline, syncing when a signal is available."]),
        ("Core screens", [
            "Indent: tomorrow's requested quantity per SKU, with a confirm or revise action.",
            "Collection: per farmer weight entry with a printed slip.",
            "Payment: what is due, what was paid, and when the next transfer lands.",
            "Price: the agreed rate for each SKU for the next 24 hours."]),
        ("Why offline matters", [
            "Nine of the 34 collectives sit in areas with no reliable data signal before 09:00. Weight "
            "entry has to work without a connection or the collection stops."]),
        ("Adoption", [
            "34 of 34 collectives active. 1,240 farmers have a payment record in the system. Median "
            "time from collection to payment is 41 hours against a 48 hour commitment."]),
    ])),
    (4, "Hotel Supply Agreements.pdf", *doc("Executed supply agreements, hospitality accounts", [
        ("Scope", [
            "This document summarises the three executed hospitality supply agreements. Full signed "
            "counterparts are available in the legal folder on request."]),
        ("Common commercial terms", [
            "Twelve month term, auto renewing unless either party gives 60 days notice.",
            "Price fixed weekly against an agreed basket, revised every Monday.",
            "Delivery six days a week, two hour window, penalty of 2 percent of invoice for a miss.",
            "Payment 30 days from invoice, with a 1 percent early settlement discount at 10 days."]),
        ("Agreement one, Grand Hyatt Bolgatty", [
            "Signed 14 January 2026. Estimated Rs 4.10 lakh per month across 22 SKUs. Includes a "
            "quality specification annexure and a monthly review meeting."]),
        ("Agreement two, Malabar Palace Group", [
            "Signed 2 November 2025. Four properties in Kozhikode. Estimated Rs 3.60 lakh per month."]),
        ("Agreement three, Paragon Restaurants", [
            "Signed 19 December 2025. Seven outlets. Estimated Rs 2.80 lakh per month, 21 day terms."]),
    ])),
    (4, "Farmer Collective MOUs.pdf", *doc("Memoranda of understanding with 34 collectives", [
        ("What the MOU commits", [
            "Nellara commits to a minimum weekly offtake, payment within 48 hours of collection, and "
            "publication of the next day price by 20:00.",
            "The collective commits to grading at source, exclusive supply of the contracted SKUs "
            "during the season, and access for a Nellara quality officer."]),
        ("Coverage", [
            "22 collectives in Wayanad, principally Kalpetta, Sulthan Bathery and Mananthavady blocks.",
            "12 collectives in Malappuram, principally Nilambur and Wandoor blocks.",
            "Together they represent 1,240 registered farmers and about 640 acres under contract."]),
        ("Termination", [
            "Either side may exit on 30 days notice. Two collectives exited in FY26, both because a "
            "state procurement scheme offered a higher notified price for paddy rotation."]),
        ("Dispute handling", [
            "Weight disputes go to a joint re weigh within 24 hours. Price disputes are escalated to "
            "the collective's board. No dispute has gone to arbitration."]),
    ])),
    (4, "Customer List Jul 2026.xlsx", *table("Customers", rows_key="customers",
                                              note="Active accounts as at 31 July 2026")),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
    (5, "FSSAI License.pdf", *doc("Food Safety and Standards Authority of India", [
        ("License", [
            "State license number 11225334001987, issued for wholesale and storage of fresh fruits and "
            "vegetables. Valid to 31 March 2029."]),
        ("Premises covered", [
            "Kalpetta collection and pre cooling hub, Wayanad district.",
            "Feroke distribution hub, Kozhikode district."]),
        ("Inspections", [
            "Two routine inspections in FY26, both closed with no adverse observation. Third party "
            "hygiene audit conducted in April 2026, score 91 of 100."]),
        ("Conditions", [
            "Temperature logs to be retained for 12 months, staff medical fitness records to be "
            "current, and any product recall to be reported within 24 hours."]),
    ])),
    (5, "Shareholder Agreement.pdf", *doc("Executed SHA, angel round of November 2025", [
        ("Parties", [
            "The company, the three founders, and the seven angel investors of the November 2025 round."]),
        ("Key terms", [
            "One investor director seat, currently held by the lead angel.",
            "Reserved matters covering new share issues, borrowings above Rs 50 lakh, related party "
            "transactions and any change of business.",
            "Founder vesting over 48 months from November 2025 with a 12 month cliff, already served.",
            "Tag along rights for investors on any founder secondary. Drag along above 75 percent."]),
        ("Anti dilution", [
            "Broad based weighted average, applying only to the CCPS issued in the angel round."]),
        ("Information rights", [
            "Monthly management accounts within 21 days, quarterly board pack, and audited accounts "
            "within 120 days of year end. The company has met all three in every period."]),
    ])),
]

# ── Zylo Health ──────────────────────────────────────────────────────────────

ZYLO = [
    (1, "Zylo Pitch Deck.pdf", *deck([
        ("Zylo Health",
         ["AI assisted radiology triage for tier 2 and tier 3 hospitals",
          "Seed round, July 2026",
          "Kochi, Kerala"]),
        ("The problem",
         ["A 180 bed hospital in Kottakkal runs 6,000 scans a month and has one visiting radiologist.",
          "Studies are read in the order they arrive, not in the order they matter.",
          "A bleed found on Thursday was often taken on Tuesday.",
          "India has roughly one radiologist for every 100,000 people. Tier 2 has far fewer."]),
        ("What we do",
         ["Zylo reads every study as it lands and ranks the worklist by urgency.",
          "Critical findings are pushed to the radiologist's phone with the key slice attached.",
          "The radiologist still reads and still signs. We change the order, not the diagnosis.",
          "Median time to flag a critical study is 48 seconds."]),
        ("Why this is the right wedge",
         ["Triage does not require us to be right about everything. It requires us to be right about urgency.",
          "It fits the regulatory path: a Class B software device, not a diagnostic claim.",
          "It is bought by the hospital administrator, whose problem is coverage, not accuracy.",
          "It makes one radiologist safely cover more hospitals, which is the actual constraint."]),
        ("Traction",
         ["46,200 scans processed in July 2026.",
          "11 hospitals live across Kerala and Tamil Nadu, plus a four hospital district pilot.",
          "Contracted ARR of Rs 1.87 crore.",
          "889 critical findings flagged in July alone."]),
        ("Clinical evidence",
         ["Internal validation on 24,000 held out studies: sensitivity 94.1 percent, specificity 88.7 percent.",
          "Prospective arm at two hospitals since March 2026, 11,400 studies.",
          "Mean reduction in time to radiologist review for critical studies: 3 hours 41 minutes.",
          "Two peer reviewed abstracts submitted, one accepted."]),
        ("Regulatory",
         ["CDSCO Class B application filed 14 April 2026, acknowledgement MD 15 2026 0417.",
          "Quality management system audited to ISO 13485 in February 2026.",
          "Clinical evaluation report and risk file complete.",
          "Expected decision window is 6 to 9 months from filing."]),
        ("Business model",
         ["Annual hospital contract, priced per scan on committed volume.",
          "Realised price Rs 34 per scan. Gross contribution Rs 25.80.",
          "No hardware. Deployment is a PACS integration, median 9 days.",
          "Net revenue retention 131 percent, driven by scan volume growth inside existing hospitals."]),
        ("Use of funds",
         ["Rs 8.0 crore, expected to last 20 months post round.",
          "Rs 3.0 crore: regulatory completion and the prospective multi site study.",
          "Rs 2.4 crore: clinical sales team for Tamil Nadu and Karnataka.",
          "Rs 1.8 crore: engineering, principally scanner vendor calibration.",
          "Rs 0.8 crore: reserve."]),
        ("The team",
         ["Dr Ann Mary Varghese, CEO. Consultant radiologist, over 90,000 studies read.",
          "Sreejith Nair, CTO. Six years building imaging models, two cleared CDSCO.",
          "Dr Vivek Menon, Clinical Affairs. Two prospective device studies to submission.",
          "14 full time, including three radiologists on retainer."]),
    ])),
    (1, "Clinical One Pager.pdf", *doc("Clinical summary for medical directors", [
        ("Intended use", [
            "Zylo is a triage and prioritisation aid for non contrast head CT and chest radiography. "
            "It reorders the radiologist worklist by suspected urgency and notifies on suspected "
            "critical findings. It does not produce a diagnosis and does not replace radiologist review."]),
        ("Findings covered", [
            "Head CT: intracranial haemorrhage, midline shift, hydrocephalus.",
            "Chest radiograph: pneumothorax, pleural effusion, consolidation, cardiomegaly."]),
        ("Performance", None),
        ("Workflow", [
            "The study leaves the modality, reaches PACS, and is mirrored to Zylo in the same second. "
            "Inference completes in a median 14 seconds. A critical suspicion raises the study to the "
            "top of the worklist and sends a push notification with the key slice."]),
        ("Safety", [
            "Every notification is advisory. The worklist remains fully accessible in arrival order. "
            "A radiologist can dismiss a flag in one tap, and every dismissal is logged and reviewed "
            "weekly as part of the post market surveillance plan."]),
    ])),
    (1, "Founding Team.pdf", *doc("Founding team and clinical advisors", [])),
    (2, "Financial Model.xlsx", *model("Monthly build, FY27 to FY29, scan volume driven")),
    (2, "Per Scan Unit Economics.xlsx", *table("Unit economics", rows_key="unit_rows",
                                               note="Blended across live hospital contracts, July 2026")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Triage Algorithm Overview.pdf", *doc("Model architecture and validation approach", [
        ("Architecture", [
            "A 3D convolutional backbone for volumetric head CT and a 2D backbone for chest "
            "radiography, each followed by a finding specific classification head. Studies are "
            "normalised per scanner vendor before inference."]),
        ("Training data", [
            "218,000 studies in total. 61 percent from Indian sites under data sharing agreements, "
            "the remainder from public research datasets. Every Indian study was de identified at "
            "source before transfer."]),
        ("Labelling", [
            "Each training study carries a label from the original report plus, for 24,000 studies in "
            "the validation set, an independent read by two radiologists with a third breaking ties."]),
        ("Calibration per site", [
            "In the first 30 days at a new hospital the model runs in shadow mode. Thresholds are "
            "tuned to that site's scanner and protocol mix before any notification is enabled."]),
        ("Known limitations", [
            "Paediatric studies are excluded. Post operative heads are flagged as low confidence. "
            "Portable chest films at very low exposure show a measurable drop in specificity, which "
            "is why those are held to a higher notification threshold."]),
    ])),
    (3, "Clinical Validation Summary.pdf", *doc("Retrospective and prospective results to July 2026", [
        ("Retrospective validation", [
            "24,000 held out studies from six sites not used in training. Sensitivity 94.1 percent, "
            "specificity 88.7 percent, area under the curve 0.961 for the combined critical finding "
            "endpoint."]),
        ("Prospective arm", [
            "Two hospitals, March to July 2026, 11,400 consecutive studies. Sensitivity held at 92.8 "
            "percent in live conditions. Twelve false negatives were reviewed case by case, of which "
            "nine were subtle findings the original report also missed."]),
        ("Clinical impact", [
            "Mean time from image acquisition to radiologist review for critical studies fell from "
            "4 hours 12 minutes to 31 minutes at the two prospective sites."]),
        ("Detailed results", None),
        ("Publications", [
            "One abstract accepted at the Indian Radiological and Imaging Association annual "
            "conference 2026. A full manuscript is in preparation for submission in Q3 FY27."]),
    ])),
    (3, "Product Overview.pdf", *doc("Deployment, integration and support", [
        ("Deployment", [
            "Zylo installs as a DICOM node beside the hospital PACS. No change to the modality, no "
            "change to the reporting workstation. Median time from kick off to first live study is "
            "nine days."]),
        ("Integration", [
            "Supported PACS: Synapse, Centricity, dcm4chee, Orthanc and two Indian vendors. "
            "HL7 ORM and ORU messaging for order and result flow where the hospital has an HIS."]),
        ("Where data sits", [
            "Inference runs in the hospital's region on Indian cloud infrastructure. Images are held "
            "for 90 days for audit and then archived in encrypted form. No image leaves India."]),
        ("Support", [
            "A named clinical success manager for every hospital, weekly review in the first month "
            "and monthly thereafter. Response commitment of four working hours on any triage outage."]),
    ])),
    (4, "Hospital Contracts.pdf", *doc("Summary of executed hospital agreements", [
        ("Contract structure", [
            "Twelve month term with a committed monthly scan volume and a per scan rate. Overage is "
            "billed at the same rate. Underage is not refunded but rolls forward one month."]),
        ("Rate card", [
            "Up to 3,000 scans a month: Rs 42 per scan.",
            "3,001 to 6,000 scans: Rs 36 per scan.",
            "Above 6,000 scans: Rs 30 per scan.",
            "Blended realised rate across the book is Rs 34."]),
        ("Live contracts", None),
        ("Termination and clinical safety", [
            "Either party may terminate on 60 days notice. The hospital may suspend immediately on a "
            "clinical safety concern, in which case billing pauses. This clause has never been invoked."]),
    ])),
    (4, "Scan Volume Report Jul 2026.xlsx", *table("Hospitals", rows_key="customers",
                                                   note="Live hospitals and contracted volume, July 2026")),
    (4, "Radiologist Coverage Study.pdf", *doc("Field study on coverage economics", [
        ("Question", [
            "Does worklist triage let one radiologist safely cover more hospitals, and by how much?"]),
        ("Method", [
            "Six radiologists across five hospitals were observed for eight weeks, four weeks before "
            "Zylo and four weeks after. Studies read per session, time to first read of a critical "
            "study, and self reported end of session fatigue were recorded."]),
        ("Findings", [
            "Studies read per session rose 19 percent, from 61 to 73.",
            "Time to first read of a critical study fell by 3 hours 41 minutes on average.",
            "Self reported fatigue was unchanged, which matters: throughput did not come from strain.",
            "Two of the six radiologists took on an additional hospital during the study window."]),
        ("What this means commercially", [
            "The buyer is not paying for accuracy. The buyer is paying because one radiologist can now "
            "cover two hospitals where before they covered one, and the second hospital is revenue "
            "that did not exist."]),
    ])),
    (5, "CDSCO Filing Acknowledgement.pdf", *doc("Central Drugs Standard Control Organisation", [
        ("Application", [
            "Application for manufacturing licence in Form MD 3 for a Class B software as a medical "
            "device, filed through the ONDLS portal on 14 April 2026. Acknowledgement reference "
            "MD 15 2026 0417."]),
        ("Device particulars", [
            "Generic name: radiological image processing software for triage.",
            "Risk class: B, per the Medical Devices Rules 2017 classification for software intended "
            "to inform clinical management without immediate diagnostic claim.",
            "Manufacturing site: Kochi, Kerala, audited to ISO 13485 in February 2026."]),
        ("Documents submitted", [
            "Device master file, plant master file, essential principles checklist, risk management "
            "file to ISO 14971, clinical evaluation report, software lifecycle documentation to "
            "IEC 62304, and the post market surveillance plan."]),
        ("Status", [
            "Under technical review by the state licensing authority as at 31 July 2026. One query "
            "raised on 9 June regarding the labelling of the notification screen, responded to on "
            "17 June. No further queries received."]),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
    (5, "Data Protection Policy.pdf", *doc("Patient data handling, version 3.1", [
        ("Principle", [
            "Zylo processes imaging data as a data processor on behalf of the hospital, which remains "
            "the data fiduciary. Every deployment has a signed data processing agreement before the "
            "first study is transferred."]),
        ("De identification", [
            "Patient identifiers are stripped at the hospital edge before transfer. Zylo receives a "
            "study identifier, the pixel data, and the technical DICOM tags required for calibration. "
            "The mapping back to the patient stays inside the hospital."]),
        ("Storage and retention", [
            "Studies are held 90 days for audit and post market surveillance, then moved to encrypted "
            "cold storage for the period the hospital specifies, default 24 months, and then deleted."]),
        ("Access control", [
            "Role based access with named accounts only. Engineering access to production imaging "
            "requires a ticket, a second approver, and is time boxed to four hours. All access is logged."]),
        ("Breach handling", [
            "Any suspected breach is notified to the hospital within 24 hours of detection and to the "
            "relevant authority within the statutory window. No breach has occurred to date."]),
    ])),
]

# ── Voltaneer ────────────────────────────────────────────────────────────────

VOLTANEER = [
    (1, "Voltaneer Pitch Deck v3.pdf", *deck([
        ("Voltaneer",
         ["Energy monitoring for small and mid sized factories",
          "Seed round, July 2026",
          "Coimbatore, Tamil Nadu"]),
        ("The problem",
         ["A spinning mill in Tiruppur pays Rs 14 lakh a month for power and gets one number for it.",
          "Nobody knows which motor wasted it, or when.",
          "Idle load, failing bearings and peak demand penalties are invisible until the bill arrives.",
          "For a factory on 6 percent net margin, 8 percent of the power bill is a third of the profit."]),
        ("What we do",
         ["Clamp on sensors on every major load, reporting every second.",
          "Software that names the waste: this motor, this shift, this much money.",
          "A weekly action list the plant engineer can actually execute.",
          "Average verified saving across 88 factories is 8.4 percent of the power bill."]),
        ("What changed in the business",
         ["Recurring revenue was 24 percent of the total in February. It is 47 percent in July.",
          "Median sales cycle was 264 days in February. It is 71 days in July.",
          "We did one thing: we stopped selling sensors and started leasing them inside the subscription.",
          "That moved the buying decision out of capex and into the plant operating budget."]),
        ("Traction",
         ["ARR of Rs 2.34 crore in July 2026, up from Rs 1.42 crore in February.",
          "88 factories live across Coimbatore, Tiruppur, Erode and Pollachi.",
          "Net revenue retention 118 percent. Logo churn 6 percent.",
          "Largest account is Rs 5.4 lakh a year, so no single customer is over 3 percent of ARR."]),
        ("Unit economics",
         ["Year one contribution per factory Rs 2.60 lakh, year two Rs 2.21 lakh.",
          "Customer acquisition cost Rs 1.34 lakh, recovered in month seven.",
          "Gross margin on the software line is 84 percent.",
          "Hardware is now leased, so it sits on our balance sheet and off the customer's."]),
        ("Why the cluster matters",
         ["Coimbatore, Tiruppur and Erode hold over 25,000 registered factories inside a 90 km radius.",
          "One field engineer can service 40 sites without an overnight stay.",
          "Owners talk to each other. 31 of our 88 factories came from a referral.",
          "The same density exists in Rajkot, Ludhiana and Surat, which is where we go next."]),
        ("Competition",
         ["Utility provided meters: one number, monthly, no diagnosis.",
          "Global industrial IoT platforms: priced for plants ten times this size.",
          "Energy audit consultants: a report once a year, no continuous measurement.",
          "Our edge is the price point and a field team that lives inside the cluster."]),
        ("Use of funds",
         ["Rs 7.0 crore, expected to last 18 months.",
          "Rs 2.6 crore: sensor lease fleet, roughly 300 factories of inventory.",
          "Rs 2.0 crore: field sales and service in Rajkot and Ludhiana.",
          "Rs 1.6 crore: engineering, principally automated anomaly detection.",
          "Rs 0.8 crore: reserve."]),
        ("The team",
         ["Karthik Subramanian, CEO. Twelve years in industrial power electronics.",
          "Aravind Rangaswamy, CTO. Metering firmware shipped on 40,000 units.",
          "Divya Balan, VP Sales. Nine years selling capital equipment into this exact cluster.",
          "26 full time, of whom 11 are field engineers."]),
    ])),
    (1, "One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Voltaneer does", [
            "Voltaneer installs clamp on sensors across the major electrical loads in a factory and "
            "runs software that identifies where power is being wasted, by machine and by shift. It is "
            "sold as an annual subscription with the hardware leased inside it."]),
        ("Why factories buy", [
            "Average verified saving of 8.4 percent of the monthly power bill.",
            "No capital expenditure, so no board approval and no depreciation schedule.",
            "Peak demand penalties are predicted before they are incurred, not explained afterwards.",
            "Failing motors are caught by their current signature weeks before they stop."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "The sensor lease fleet, a field team in two new clusters, and automated anomaly detection "
            "so a factory gets its action list without an engineer reading the data first."]),
    ])),
    (1, "Team and Advisors.pdf", *doc("Leadership team and advisory board", [])),
    (2, "Financial Model.xlsx", *model("Monthly build, FY27 to FY29, subscription driven")),
    (2, "ARR Bridge FY27.xlsx", *table("ARR bridge", rows_key="traction_rows",
                                       note="Monthly ARR movement and recurring mix, FY27 to date")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Sensor Spec Sheet.pdf", *doc("VT 200 series current and power sensor", [
        ("Overview", [
            "The VT 200 is a clamp on current transformer with an integrated edge module. It installs "
            "on a live panel without shutting the line down, which is the single most important "
            "property in a factory that cannot stop."]),
        ("Specification", None),
        ("Installation", [
            "One field engineer installs 18 to 24 sensors in a day. A typical factory takes two days "
            "for main incomer, distribution boards and every motor above 7.5 kW."]),
        ("Certification", [
            "BIS registered, tested to IS 16444. IP65 enclosure rating. Operating range minus 10 to "
            "70 degrees Celsius, tested against the ambient conditions inside a spinning shed."]),
    ])),
    (3, "Dashboard Overview.pdf", *doc("What the plant engineer sees", [
        ("Home", [
            "One number at the top: rupees wasted this week, against last week. Under it, the three "
            "biggest contributors by machine, each with the shift and the time band."]),
        ("Idle load", [
            "Machines drawing power while producing nothing. This is consistently the largest single "
            "recovery, averaging 3.1 of the 8.4 points of saving."]),
        ("Peak demand", [
            "A live forecast of the month's maximum demand against the contracted limit, with an alert "
            "when the plant is on track to breach it. A breach in Tamil Nadu costs roughly twice the "
            "normal tariff on the excess."]),
        ("Machine health", [
            "Current signature analysis flags bearing wear and phase imbalance. In FY26 this predicted "
            "31 motor failures across the base, of which 27 were confirmed on inspection."]),
        ("Weekly action list", [
            "Five items, ranked by rupees, each with the machine, the fix and the estimated recovery. "
            "This is the artefact the plant engineer actually uses, and it is emailed every Monday."]),
    ])),
    (3, "Firmware Release Notes.pdf", *doc("Edge module firmware, releases 4.2 to 4.7", [
        ("4.7, released 8 July 2026", [
            "Sub second sampling on the main incomer for harmonic capture.",
            "Reduced buffer flush interval, cutting data loss on network drops from 40 seconds to 4.",
            "Fixed a rare timestamp drift on modules running over 90 days without a reboot."]),
        ("4.6, released 2 June 2026", [
            "Over the air update support, removing the need for a site visit for firmware.",
            "Added phase imbalance calculation at the edge instead of in the cloud."]),
        ("4.5, released 21 April 2026", [
            "Support for the VT 210 higher range clamp used on incomers above 800 amps.",
            "Local storage extended to 72 hours of buffered readings."]),
        ("4.3 and 4.4, February and March 2026", [
            "Power quality event capture, watchdog hardening, and a fix for a boot loop seen on nine "
            "modules exposed to sustained supply flicker."]),
        ("Update policy", [
            "Firmware is staged across 5 percent of the fleet for seven days before general release. "
            "No release has been rolled back since 4.1."]),
    ])),
    (4, "Annual SaaS Agreement Template.pdf", *doc("Standard subscription agreement, version 2026.2", [
        ("Structure", [
            "Twelve month subscription, auto renewing. Sensors are leased to the customer for the term "
            "and remain Voltaneer property. Installation is a one time fee."]),
        ("Commercials", [
            "Subscription is banded by connected load: up to 500 kVA Rs 2.40 lakh, 500 to 1,500 kVA "
            "Rs 3.60 lakh, above 1,500 kVA Rs 4.80 lakh a year, payable half yearly in advance."]),
        ("The savings clause", [
            "If verified saving over the first twelve months is below 4 percent of the baseline power "
            "bill, the customer may terminate and pay only for months used. Baseline is the twelve "
            "months of utility bills preceding installation. This clause has been invoked twice in "
            "88 deployments."]),
        ("Data", [
            "Consumption data belongs to the customer. Voltaneer may use it in anonymised and "
            "aggregated form for benchmarking. Any named use requires written consent."]),
        ("Service levels", [
            "99 percent monthly platform availability. Sensor replacement within three working days. "
            "A named field engineer for every site."]),
    ])),
    (4, "Customer Savings Report.xlsx", *table("Customers", rows_key="customers",
                                               note="Live factories and verified saving, July 2026")),
    (4, "Sales Cycle Export Jul 2026.xlsx", *table("Sales cycle", rows=[
        ["Opportunity", "Cluster", "Connected load", "First meeting", "Closed", "Days", "Source"],
        ["Sri Kumaran Textiles, unit 3", "Tiruppur", "1,200 kVA", "2026-04-18", "2026-06-26", "69", "Referral"],
        ["Vetri Knits, expansion", "Tiruppur", "600 kVA", "2026-05-02", "2026-07-04", "63", "Existing customer"],
        ["Sakthi Auto, plant 2", "Erode", "1,800 kVA", "2026-03-29", "2026-06-21", "84", "Field visit"],
        ["Nachimuthu Mills", "Pollachi", "900 kVA", "2026-04-11", "2026-06-19", "69", "Referral"],
        ["KG Denim, unit 2", "Coimbatore", "2,200 kVA", "2026-03-14", "2026-05-30", "77", "Trade association"],
        ["Suguna Feeds, plant 4", "Udumalpet", "1,100 kVA", "2026-04-22", "2026-06-28", "67", "Referral"],
        ["Precision Castings, unit 2", "Coimbatore", "1,400 kVA", "2026-05-16", "2026-07-21", "66", "Existing customer"],
        ["Anand Pumps, foundry", "Coimbatore", "800 kVA", "2026-05-09", "2026-07-25", "77", "Field visit"],
    ], note="Closed won opportunities, Q1 FY27. Median 71 days.")),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Coimbatore", [])),
    (5, "IP Assignment Deed.pdf", *doc("Founder and employee intellectual property assignment", [
        ("Founder assignment", [
            "All three founders executed a deed on 26 June 2023 assigning to the company every right "
            "in work created before incorporation that relates to the business, including the original "
            "metering firmware written by Aravind Rangaswamy in 2022."]),
        ("Employee terms", [
            "Every employment contract contains a present assignment of inventions clause and a "
            "confidentiality undertaking surviving three years from exit. 26 of 26 employees have "
            "signed the current version."]),
        ("Contractors", [
            "Two industrial design contractors were engaged in FY25. Both signed work for hire terms "
            "with full assignment on payment. Both invoices are settled."]),
        ("Registrations", [
            "One design registration granted for the VT 200 enclosure, number 389442. Two trade mark "
            "applications, class 9 and class 42, both accepted and advertised with no opposition. "
            "No patents filed and none pending."]),
        ("Encumbrances", [
            "No intellectual property is charged, licensed exclusively, or subject to any dispute."]),
    ])),
    (5, "ESOP Policy.pdf", *doc("Employee stock option plan, adopted March 2025", [
        ("Pool", [
            "1,20,000 options, 12 percent of the fully diluted capital, approved by shareholders on "
            "18 March 2025. 74,000 granted, 46,000 unallocated as at 31 July 2026."]),
        ("Vesting", [
            "Four years with a one year cliff, monthly thereafter. Acceleration on a change of control "
            "is single trigger for the leadership team and double trigger for everyone else."]),
        ("Exercise", [
            "Exercise price is the fair market value at grant, most recently Rs 141 per share. "
            "Exercise window of 36 months after a good leaver exit, which is deliberately longer than "
            "market so that leaving does not force a purchase."]),
        ("Grants to date", None),
    ])),
]

# ── Aegis Drone Systems ──────────────────────────────────────────────────────

AEGIS = [
    (1, "Aegis Pitch Deck.pdf", *deck([
        ("Aegis Drone Systems",
         ["Drone inspection for ports, transmission lines and plantation estates",
          "Seed round, July 2026",
          "Kochi, Kerala"]),
        ("The problem",
         ["Inspecting a wharf crane means a rope access team, a shutdown, and three days.",
          "Inspecting 40 km of 132 kV line means a patrol on foot and a subjective report.",
          "Most owners inspect on a calendar, not on condition, because condition is expensive to know.",
          "The failures that matter happen between inspections."]),
        ("What we do",
         ["Automated flight plans over the asset, repeated identically every cycle.",
          "Defect detection on the imagery, with every finding located and measured.",
          "A report the asset owner's engineer can act on, delivered in 72 hours.",
          "46 inspection cycles delivered across ports, transmission and plantations."]),
        ("Why repeatability is the product",
         ["A drone photograph is a commodity. The same flight path flown twelve times is not.",
          "Change between cycles is what tells an owner whether a crack is growing.",
          "Our flight plans are stored per asset, so cycle twelve is comparable to cycle one.",
          "This is why the two customers who came back are worth more than the twelve who did not."]),
        ("Traction",
         ["Rs 1.10 crore revenue in FY26, up from Rs 22 lakh in FY25.",
          "14 clients including Cochin Port Authority, KSEB and Harrisons Malayalam.",
          "Average project value Rs 2.39 lakh, contribution 42.3 percent.",
          "Three annual retainers in negotiation, none signed yet."]),
        ("The honest gap",
         ["Everything to date is project revenue. Nothing recurs.",
          "Two of 14 clients have come back for a second cycle.",
          "This is the problem the round is meant to fix, and we are not going to dress it up.",
          "Our target is three signed retainers before the end of Q3 FY27."]),
        ("Regulatory",
         ["DGCA BVLOS permission applied for on 2 March 2026, still pending.",
          "Within visual line of sight operations are fully permitted and cover ports and estates.",
          "Transmission line inspection at scale needs BVLOS, and that pipeline is the largest.",
          "Chief pilot is a DGCA certified remote pilot instructor with 1,900 UAS hours."]),
        ("Business model",
         ["Per cycle pricing today, Rs 1.8 lakh to Rs 6.4 lakh depending on asset size.",
          "Target model is an annual retainer of four cycles at a 15 percent discount to per cycle.",
          "Retainer converts a Rs 2.4 lakh transaction into an Rs 8.2 lakh relationship.",
          "Analytics is the margin: the flying is 30 percent of the cost, the reading is 70 percent."]),
        ("Use of funds",
         ["Rs 5.5 crore, expected to last 16 months.",
          "Rs 1.8 crore: two additional airframes and a thermal payload.",
          "Rs 1.6 crore: analytics team, to bring report turnaround from 72 hours to 24.",
          "Rs 1.4 crore: enterprise sales for retainer conversion.",
          "Rs 0.7 crore: reserve, including a second insurance layer."]),
        ("The team",
         ["Rohan Fernandes, CEO. Ran industrial inspection for a Bengaluru drone services company.",
          "Capt. Ismail Haq, Chief Pilot. Eighteen years flying with the Indian Air Force.",
          "Meera Nambiar, Head of Analytics. Built rail track defect models for a public sector client.",
          "12 full time, including four certified remote pilots."]),
    ])),
    (1, "Capability Statement.pdf", *doc("Services, assets covered and delivery", [
        ("Assets we inspect", [
            "Port infrastructure: wharf structures, quay cranes, breakwaters and jetty piling.",
            "Power transmission: towers, conductors, insulators and right of way encroachment.",
            "Plantation estates: canopy health, gap analysis, yield estimation and boundary survey.",
            "Industrial structures: flare stacks, chimneys, storage tanks and overhead water tanks."]),
        ("What a cycle includes", [
            "A pre flight survey and permission handling, the flight itself against a stored plan, "
            "defect detection on the imagery, and a report with every finding located, measured, "
            "photographed and severity ranked."]),
        ("Turnaround", [
            "Flight to report in 72 hours as standard, 24 hours on the expedited tier. Raw imagery is "
            "handed over in every case, so the client is never locked in."]),
        ("Safety record", [
            "46 cycles, 1,100 sorties, zero reportable incidents. Every flight carries public liability "
            "cover of Rs 5 crore and every pilot holds a valid DGCA remote pilot certificate."]),
    ])),
    (1, "Pilot Team Credentials.pdf", *doc("Flight crew, certifications and logged hours", [])),
    (2, "Financial Model.xlsx", *model("Quarterly build, FY27 to FY29, project and retainer mix")),
    (2, "Project Level P and L.xlsx", *table("Unit economics", rows_key="unit_rows",
                                         note="Average across 46 delivered cycles")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Inspection Platform Overview.pdf", *doc("Flight planning, capture and analytics", [
        ("Flight planning", [
            "Each asset gets a stored plan: waypoints, altitudes, camera angles and overlap. The plan "
            "is version controlled, so cycle twelve is flown exactly as cycle one and the imagery is "
            "directly comparable."]),
        ("Capture", [
            "Visual capture at 45 megapixels with 80 percent forward overlap. Thermal capture on "
            "electrical assets. Every frame carries position, altitude and heading metadata."]),
        ("Defect detection", [
            "Models trained on 41,000 annotated defect instances across corrosion, cracking, "
            "insulator damage, conductor strand breakage and vegetation encroachment. Precision "
            "88.6 percent on the internal test set at the operating threshold."]),
        ("Change detection", [
            "The value of the second cycle is the difference from the first. Findings are matched "
            "across cycles by position so an owner sees which defects grew, which are stable and "
            "which are new."]),
        ("Human review", [
            "Every report is reviewed by an analyst before it is released. No finding reaches a client "
            "unread. This is why report turnaround is 72 hours rather than 2, and it is also why no "
            "client has disputed a finding."]),
    ])),
    (3, "Sample Defect Report.pdf", *doc("Cochin Port Authority, wharf 4, cycle 2, June 2026", [
        ("Scope", [
            "Wharf 4 north face, 380 metres of quay structure, two rail mounted quay cranes and the "
            "associated fendering. Flown 11 June 2026 against the plan stored from cycle 1 in March."]),
        ("Summary of findings", None),
        ("Critical finding, F 07", [
            "Corrosion with section loss on the seaward face of bollard mounting plate 14, position "
            "9.9678 N 76.2603 E. Measured affected area 340 by 210 millimetres. Growth of 18 percent "
            "in area since cycle 1. Recommended action: structural assessment within 30 days."]),
        ("Change since cycle one", [
            "Of 34 findings in cycle 1, 9 were repaired and closed, 21 are stable within measurement "
            "tolerance, and 4 have grown. 12 new findings were raised in cycle 2."]),
        ("Method note", [
            "Measurements are photogrammetric with a stated accuracy of plus or minus 8 millimetres "
            "at the flown standoff distance. This report is an aid to inspection and does not replace "
            "a structural engineer's assessment."]),
    ])),
    (3, "Fleet and Payload Specs.pdf", *doc("Airframes, payloads and maintenance", [
        ("Fleet", [
            "Three airframes in service. Two multirotor platforms for close structural work with a "
            "28 minute endurance, and one fixed wing VTOL for corridor mapping with a 74 minute "
            "endurance and a 42 km range."]),
        ("Payloads", [
            "45 megapixel full frame visual, 640 by 512 radiometric thermal, and a survey grade RTK "
            "module giving 2 centimetre positional accuracy."]),
        ("Maintenance", [
            "Every airframe is logged per sortie. Scheduled inspection at 50 flight hours, motor and "
            "propeller replacement at 200 hours, battery retirement at 180 cycles or 80 percent "
            "capacity, whichever comes first."]),
        ("Redundancy risk", [
            "Three airframes is thin. The loss of the fixed wing VTOL would remove corridor mapping "
            "capability entirely until replacement, a lead time of nine weeks. Two additional "
            "airframes are the first line item in the use of funds."]),
    ])),
    (4, "Port Authority Work Order.pdf", *doc("Cochin Port Authority, work order and scope", [
        ("Work order", [
            "Reference CPA ENG 2026 0219, issued 4 March 2026 for structural inspection of wharf 4 "
            "and associated crane infrastructure. Value Rs 6.40 lakh across two cycles."]),
        ("Scope of work", [
            "Two inspection cycles, March and June 2026, each covering 380 metres of quay structure, "
            "two quay cranes, fendering and bollards. Deliverables are a defect register, an "
            "orthomosaic, and a change report from cycle two onward."]),
        ("Performance to date", [
            "Both cycles delivered on schedule. Cycle 1 report accepted 21 March, cycle 2 report "
            "accepted 17 June. Payment received against both invoices within 45 days."]),
        ("Renewal position", [
            "The port has indicated an intent to move to a four cycle annual retainer covering wharves "
            "3, 4 and 5 from Q3 FY27. Indicative value Rs 18 lakh a year. Not yet signed and not "
            "counted in any forecast in this data room."]),
    ])),
    (4, "Client List.xlsx", *table("Clients", rows_key="customers",
                                   note="Engagements delivered to 31 July 2026")),
    (5, "DGCA Application Status.pdf", *doc("Directorate General of Civil Aviation", [
        ("Current permissions", [
            "Operator registration active. Four DGCA certified remote pilots on staff. All three "
            "airframes hold a unique identification number and are registered on the Digital Sky "
            "platform. Within visual line of sight operations are fully permitted in green zones."]),
        ("BVLOS application", [
            "Application for beyond visual line of sight operations filed 2 March 2026 under the "
            "Drone Rules 2021 experimental framework. Reference DS BVLOS 2026 0341."]),
        ("What is pending", [
            "A site specific safety case for the Thrissur transmission corridor was requested on "
            "28 April and submitted 12 May. No decision as at 31 July 2026."]),
        ("Commercial consequence", [
            "Transmission line inspection at any useful scale requires BVLOS. Until it is granted, the "
            "largest single line in the pipeline, estimated at Rs 40 lakh of annual value with KSEB, "
            "cannot be executed. Every forecast in this data room excludes it."]),
    ])),
    (5, "Aviation Insurance Certificate.pdf", *doc("Public liability and hull cover", [
        ("Policy", [
            "Public liability cover of Rs 5 crore per occurrence for unmanned aircraft operations, "
            "policy number UAV 2026 114872, valid 1 April 2026 to 31 March 2027."]),
        ("Hull cover", [
            "All three airframes and their payloads are insured at replacement value, aggregate "
            "Rs 46 lakh, with a Rs 50,000 excess per claim."]),
        ("Exclusions", [
            "Cover excludes operations outside DGCA permissions, night operations without specific "
            "approval, and operations in red zones. Every flight plan is checked against the policy "
            "conditions before dispatch."]),
        ("Claims history", [
            "One claim in FY26 for a payload gimbal damaged during transport, settled at Rs 1.9 lakh. "
            "No liability claim has ever been made against the company."]),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
]

# ── Kadal Systems ────────────────────────────────────────────────────────────

KADAL = [
    (1, "Kadal Pitch Deck.pdf", *deck([
        ("Kadal Systems",
         ["Satellite messaging and distress alerts for small fishing vessels",
          "Seed round, July 2026",
          "Kollam, Kerala"]),
        ("The problem",
         ["A 32 foot fishing boat loses mobile signal about 18 km from shore.",
          "From there until it returns, nobody on land knows where it is or whether it is safe.",
          "Kerala lost 41 fishermen at sea in 2025. Most were found late, not never.",
          "A boat owner who cannot reach his crew also cannot tell them where the fish are."]),
        ("What we do",
         ["A satellite terminal fitted on the vessel, Rs 14,500, plus Rs 1,800 a year for airtime.",
          "One button distress alert that reaches the coast guard and the harbour society.",
          "Weather warnings pushed to the vessel before the boat commits to a run.",
          "Catch logging, which is what actually makes the owner switch it on every day."]),
        ("Proof it works",
         ["3,100 units deployed across five harbour societies.",
          "37 distress alerts relayed since launch, of which 9 became rescues.",
          "71 percent of year one subscribers renewed in year two.",
          "The safety case is settled. The commercial case is what this round is about."]),
        ("The honest problem",
         ["2,860 of 3,100 units were bought under a state subsidy scheme.",
          "Only 240 owners have paid full price out of their own pocket.",
          "Until that number is in the thousands, this is a government programme, not a business.",
          "We are telling you this on slide five, not slide nineteen."]),
        ("Why we think full price works",
         ["Full price units grew from 12 in Q1 FY26 to 65 in Q1 FY27, with no subsidy involved.",
          "The buyers are owners of three or more boats, who treat it as fleet equipment.",
          "Renewal on full price units is 88 percent against 68 percent on subsidised units.",
          "The catch log, not the distress button, is what they say they are paying for."]),
        ("Unit economics",
         ["Hardware contribution Rs 3,500 per unit at full price, 24.1 percent.",
          "Subscription contribution Rs 1,160 per vessel per year, 64 percent.",
          "A vessel that stays four years is worth Rs 8,140 of contribution.",
          "Airtime is bought wholesale on a one year contract, which is our largest single risk."]),
        ("Market",
         ["Kerala has roughly 21,000 registered mechanised and motorised fishing vessels.",
          "Tamil Nadu has about 33,000, Gujarat about 28,000.",
          "At full price penetration of 10 percent in Kerala alone the subscription base is Rs 3.8 crore.",
          "We are not counting subsidy driven volume in any of these numbers."]),
        ("Use of funds",
         ["Rs 4.5 crore, expected to last 15 months.",
          "Rs 1.6 crore: working capital for terminal inventory ahead of the post monsoon season.",
          "Rs 1.2 crore: a direct sales team working harbour by harbour on full price sales.",
          "Rs 1.0 crore: next generation terminal at a target bill of materials of Rs 6,400.",
          "Rs 0.7 crore: reserve."]),
        ("The team",
         ["Sujith Kumar, CEO. Marine engineer, eight years at sea, grew up in a fishing family.",
          "Anas Rahman, CTO. Designed terminals for a maritime tracking provider.",
          "Lakshmi Menon, Field Operations. Ran a state fisheries extension programme.",
          "16 full time, of whom 7 are field installers across five harbours."]),
    ])),
    (1, "Product One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Kadal does", [
            "Kadal Systems makes a satellite terminal for small fishing vessels that provides distress "
            "alerting, weather warnings and catch logging beyond mobile coverage. Hardware is sold once "
            "and connectivity is sold annually."]),
        ("Why an owner buys", [
            "A crew that can be reached, and reached quickly, in the 37 events where it mattered.",
            "Weather warnings before the boat commits to a run, not after.",
            "A catch log per trip, which is what settles the crew share argument on shore.",
            "Position history, which owners of three or more boats use to manage their fleet."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "Terminal inventory ahead of the post monsoon season, a direct sales team focused entirely "
            "on full price sales, and a next generation terminal at less than half the current bill "
            "of materials."]),
    ])),
    (1, "Founders.pdf", *doc("Founding team and field leadership", [])),
    (2, "Financial Model.xlsx", *model("Quarterly build, FY27 to FY29, hardware and subscription")),
    (2, "Unit Cost Breakdown.xlsx", *table("Unit economics", rows_key="unit_rows",
                                           note="Per terminal, July 2026 costing")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Device Spec Sheet.pdf", *doc("KS 100 vessel terminal", [
        ("Overview", [
            "A fixed mount satellite terminal for vessels between 24 and 58 feet. Powered from the "
            "vessel's 12 volt supply with a 36 hour internal battery. Designed to survive a wheelhouse "
            "that is wet, hot and vibrating."]),
        ("Specification", None),
        ("Distress function", [
            "A physical guarded button, held for three seconds, transmits position and vessel "
            "identifier to the coast guard relay and to the registered harbour society simultaneously. "
            "Transmission is acknowledged back to the vessel so the crew knows it was received."]),
        ("Environmental", [
            "IP67 rated. Salt spray tested to 720 hours. Operating range 0 to 60 degrees Celsius. "
            "Field failure rate 2.1 percent over the first 24 months across 3,100 units."]),
    ])),
    (3, "Satellite Coverage Map.pdf", *doc("Coverage, latency and airtime", [
        ("Coverage", [
            "The service uses a low earth orbit short burst data constellation with continuous coverage "
            "of the Arabian Sea and Bay of Bengal, including the full extent of the Indian exclusive "
            "economic zone at 200 nautical miles."]),
        ("Latency", [
            "Median time from button press to relay receipt is 41 seconds. The 95th percentile is "
            "2 minutes 18 seconds, driven by satellite pass geometry. Position beacons are sent every "
            "10 minutes by default and every 60 seconds after a distress event."]),
        ("Message budget", [
            "The Rs 1,800 annual subscription covers 4,400 short messages, which is roughly 220 fishing "
            "days at the default beacon rate. Distress traffic is never metered."]),
        ("Supplier concentration", [
            "Airtime is bought wholesale from a single provider under a contract running to 31 March "
            "2027 at Rs 640 per vessel per year. A second provider has been technically qualified but "
            "not contracted. This is disclosed as a material dependency."]),
    ])),
    (3, "Field Trial Report.pdf", *doc("Neendakara and Munambam, October 2025 to March 2026", [
        ("Design", [
            "220 vessels across two harbours were fitted and observed for six months. Usage, message "
            "volume, failure events and owner interviews were recorded throughout."]),
        ("Usage", [
            "Terminals were powered on for 91 percent of fishing days. Catch logging was used on 78 "
            "percent of trips. Weather warnings were acknowledged on 94 percent of pushes."]),
        ("Events", [
            "Eleven distress activations, of which two were accidental and nine were genuine. Of the "
            "nine, four involved engine failure, three involved a man overboard recovered safely, and "
            "two involved sudden weather."]),
        ("Failures", [
            "Five terminal failures, of which three were antenna cable damage from crew activity and "
            "two were water ingress through a wheelhouse mount installed against guidance. All five "
            "were replaced under warranty and the mount guidance was rewritten."]),
        ("Owner interviews", [
            "Asked what they would pay for if the subsidy disappeared, 14 of 22 interviewed owners "
            "named the catch log first and the distress button second. That finding is the reason the "
            "product roadmap now leads with fleet reporting."]),
    ])),
    (4, "Unit Sales Register Jun 2026.xlsx", *table("Sales register", rows_key="customers",
                                                    note="Units by channel and subsidy status, to 30 June 2026")),
    (4, "Fisheries Dept Subsidy Order.pdf", *doc("Department of Fisheries, Government of Kerala", [
        ("The order", [
            "Government order reference GO Rt 412 2025 FISH dated 8 September 2025, sanctioning a "
            "75 percent subsidy on approved marine safety communication equipment for registered "
            "mechanised fishing vessels, subject to an annual budget ceiling."]),
        ("Kadal's position", [
            "The KS 100 was included on the approved equipment list on 22 September 2025 after "
            "technical evaluation. Owner contribution is Rs 3,625 against the Rs 14,500 list price."]),
        ("Settlement", [
            "The subsidy portion is claimed by the company against installation certificates counter "
            "signed by the harbour society. Median settlement time from claim to receipt has been "
            "68 days. Rs 1.14 crore is outstanding as at 30 June 2026."]),
        ("Budget risk", [
            "The scheme is renewed annually in the state budget. The FY27 allocation was Rs 9 crore "
            "against Rs 14 crore requested. There is no assurance of continuation beyond FY27, and no "
            "revenue after March 2027 in the financial model assumes it."]),
    ])),
    (5, "WPC Equipment License.pdf", *doc("Wireless Planning and Coordination Wing", [
        ("Licence", [
            "Equipment type approval and dealer possession licence for satellite short burst data "
            "terminals operating in the 1616 to 1626.5 MHz band, reference ETA 2025 SAT 20881."]),
        ("Scope", [
            "Covers import, possession, sale and installation of the KS 100 terminal within India. "
            "Vessel operators are covered under the general licence exemption for maritime mobile "
            "satellite terminals fitted to registered vessels."]),
        ("Validity", [
            "Valid to 31 December 2027. Renewal is administrative provided the equipment specification "
            "is unchanged. The next generation terminal will require a fresh type approval, budgeted "
            "at Rs 4.2 lakh and eleven weeks."]),
        ("Compliance", [
            "Annual returns of equipment sold have been filed for FY25 and FY26. No show cause notice "
            "has been received."]),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
    (5, "Founder Agreement.pdf", *doc("Founders agreement, executed May 2023", [
        ("Parties and roles", [
            "Sujith Kumar as Chief Executive Officer, Anas Rahman as Chief Technology Officer, and "
            "Lakshmi Menon as Head of Field Operations, with defined decision rights for each."]),
        ("Equity and vesting", [
            "Founder shareholding of 35, 30 and 9 percent respectively, vesting over 48 months from "
            "1 May 2023 with a 12 month cliff. As at 31 July 2026, 81 percent of founder equity has "
            "vested."]),
        ("Leaver provisions", [
            "A good leaver retains vested shares. A bad leaver, defined as termination for cause or a "
            "breach of the restrictive covenants, forfeits unvested shares and sells vested shares "
            "back at the lower of cost and fair value."]),
        ("Restrictive covenants", [
            "Non compete in marine communications equipment for 18 months after exit, limited to "
            "India, and non solicitation of employees and customers for 24 months."]),
        ("Deadlock", [
            "Any deadlock between the founders is referred first to the board, and failing resolution "
            "within 30 days, to a single arbitrator in Ernakulam under the Arbitration and "
            "Conciliation Act 1996."]),
    ])),
]

# ── New inbound: sent recently, not yet opened, not yet on the watchlist ─────

ANVAYA = [
    (1, "Anvaya Pitch Deck.pdf", *deck([
        ("Anvaya AI",
         ["Expert reviewed Indian clinical and legal data for frontier model training",
          "Seed round, July 2026",
          "Kochi, Kerala"]),
        ("The problem",
         ["Frontier labs have run out of the easy internet.",
          "What they need now is judgement: a doctor saying this reasoning is wrong, and why.",
          "That data does not exist on the web and cannot be scraped.",
          "India has the experts. Nobody had organised them into a delivery pipeline."]),
        ("What we do",
         ["We run a panel of 612 practising doctors and 140 advocates.",
          "They review, correct and rank model output in their own domain, paid per item.",
          "We deliver it as a versioned dataset with full provenance on every item.",
          "1.84 million reviewed items delivered so far."]),
        ("Why India and why now",
         ["An Indian specialist costs a fraction of a US one and the judgement is the same.",
          "English medical and legal practice here maps directly onto what the labs need.",
          "Indian court judgments and clinical notes are an untouched corpus in English.",
          "Data protection rules mean the labs need an Indian partner, not a scraper."]),
        ("Traction",
         ["Contracted ARR of Rs 3.10 crore in July 2026, from Rs 0 in October 2025.",
          "Three frontier lab customers, two in the United States and one in India.",
          "Two further evaluation pilots running on coding and agentic tasks.",
          "Inter annotator agreement of 0.89, which is what buys the renewal."]),
        ("Quality is the product",
         ["Every item is reviewed once, and 18 percent go to a second independent adjudicator.",
          "Reviewer rejection rate fell from 9.1 percent to 4.1 percent as we tightened selection.",
          "We publish our disagreement statistics to customers. Nobody else in this market does.",
          "A lab that trusts your labels does not re run the tender next quarter."]),
        ("Unit economics",
         ["Rs 41 realised per reviewed item, Rs 22.20 gross contribution.",
          "Reviewers are paid per item, so cost scales with revenue and not with headcount.",
          "Gross margin 58 percent and improving as adjudication rates fall.",
          "No long term reviewer liability, which keeps the balance sheet clean."]),
        ("The honest risk",
         ["Three customers are 92 percent of our revenue.",
          "Frontier lab budgets move fast in both directions and we have no contractual minimums.",
          "If the labs shift decisively to synthetic data this market compresses.",
          "We are telling you this before you find it in diligence."]),
        ("Use of funds",
         ["Rs 9.0 crore, expected to last 20 months.",
          "Rs 3.4 crore: reviewer acquisition, to 2,000 experts across four domains.",
          "Rs 2.6 crore: platform, principally provenance and adjudication tooling.",
          "Rs 2.0 crore: a United States facing commercial team.",
          "Rs 1.0 crore: reserve."]),
        ("The team",
         ["Nandita Rajagopal, CEO. Ran the medical vertical at a US labelling company, 400 reviewers.",
          "Basil Thomas, CTO. Built the evaluation harness for three model releases.",
          "Adv. Shruti Nayar, Legal Domain. Eleven years in the Kerala High Court, runs the advocate panel.",
          "31 full time, plus 752 experts active on the panel."]),
    ])),
    (1, "One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Anvaya does", [
            "Anvaya AI organises Indian domain experts, principally practising doctors and "
            "advocates, into a reviewed data pipeline for frontier AI labs. Experts correct and "
            "rank model output in their own field, and Anvaya delivers it as a versioned dataset "
            "with provenance on every item."]),
        ("Why labs buy", [
            "Judgement data in medicine and law that cannot be scraped from the open web.",
            "Published inter annotator agreement, currently 0.89, rather than an unverified claim.",
            "Indian cost base at the same standard of professional judgement.",
            "An Indian entity handling Indian source material, which the rules increasingly require."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "Reviewer acquisition to 2,000 experts across four domains, provenance and adjudication "
            "tooling, and a United States facing commercial team."]),
    ])),
    (1, "Founding Team.pdf", *doc("Founding team and domain leads", [])),
    (2, "Financial Model.xlsx", *model("Monthly build, FY27 to FY29, item volume driven")),
    (2, "Unit Economics.xlsx", *table("Unit economics", rows_key="unit_rows",
                                      note="Per reviewed item, July 2026 actuals")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Data Pipeline and Provenance.pdf", *doc("How an item moves and what is recorded", [
        ("The pipeline", [
            "A customer task arrives as a batch. It is routed to reviewers qualified in that "
            "sub domain, reviewed once, sampled for adjudication, then packaged and delivered with "
            "a manifest."]),
        ("Reviewer selection", [
            "Every doctor is verified against the National Medical Commission register and every "
            "advocate against the Bar Council roll. Both then pass a paid qualification batch that "
            "is graded against a gold set before they see customer work."]),
        ("Provenance", [
            "Every item carries the reviewer identifier, timestamp, time on task, the gold set score "
            "of that reviewer at the time, and whether it went to adjudication. Customers can trace "
            "any single label back to the person who made it."]),
        ("Quality control", [
            "A hidden gold set is mixed into every batch at 4 percent. A reviewer whose gold score "
            "drops below threshold is paused and re qualified, not silently dropped."]),
        ("Data handling", [
            "Source material stays in an Indian cloud region. Reviewers work in a browser workspace "
            "with no download and no copy. Personally identifying content is stripped before it "
            "reaches a reviewer."]),
    ])),
    (4, "Customer Contracts.xlsx", *table("Customers", rows_key="customers",
                                          note="Contracted work as at 31 July 2026")),
    (4, "Quality Benchmark Report.pdf", *doc("Agreement and accuracy, Q1 FY27", [
        ("Why we publish this", [
            "Every labelling vendor claims high quality. Almost none publish the number. We send "
            "this report to every customer monthly, including the results we would rather not show."]),
        ("Results", None),
        ("Where we are weakest", [
            "Multilingual medical items, where a reviewer works from a Malayalam or Tamil clinical "
            "note, run about six points below our English agreement. We have paused expansion on "
            "that line until it closes."]),
        ("What changed this quarter", [
            "Tighter qualification cut the reviewer rejection rate from 6.4 percent to 4.1 percent, "
            "and adjudication load fell from 24 percent of items to 18 percent, which is where most "
            "of the margin improvement came from."]),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
    (5, "Reviewer and Data Agreements.pdf", *doc("Contracts with experts and customers", [
        ("Reviewer agreement", [
            "Every reviewer signs an independent contractor agreement with a present assignment of "
            "all rights in the work produced, a confidentiality undertaking, and a bar on using any "
            "customer material outside the platform."]),
        ("Payment terms to reviewers", [
            "Paid per accepted item, settled fortnightly. No claw back once an item is accepted. "
            "Adjudicated corrections are paid to both reviewers, which is deliberate: we do not want "
            "reviewers guessing what the adjudicator wants."]),
        ("Customer terms", [
            "Work for hire. All delivered data and derived rights vest in the customer on payment. "
            "Anvaya retains no licence to resell any customer specific dataset."]),
        ("Confidentiality", [
            "Two of three customers are named only under NDA in this data room. Their identity can "
            "be disclosed to a lead investor under a separate confidentiality undertaking."]),
    ])),
]

THOOVAL = [
    (1, "Thooval Pitch Deck.pdf", *deck([
        ("Thooval Studios",
         ["AI assisted dubbing and subtitling for Indian language streaming",
          "Seed round, July 2026",
          "Kozhikode, Kerala"]),
        ("The problem",
         ["A Malayalam series that would work in Tamil usually never gets dubbed.",
          "Traditional dubbing costs about Rs 1.4 lakh a finished hour and takes 6 to 9 days.",
          "So platforms dub only their biggest titles and the back catalogue sits unwatched.",
          "The content already exists. The economics of translating it do not."]),
        ("What we do",
         ["Rs 38,000 a finished hour, delivered in 31 hours, across nine Indian languages.",
          "Synthesis does the first pass. A dubbing director and a voice artist do the last one.",
          "The voice artist is paid, credited and holds a royalty. That is not optional for us.",
          "4,180 hours delivered to four OTT platforms and eleven production houses."]),
        ("Why the last pass matters",
         ["A pure machine dub is detectably wrong within about forty seconds.",
          "Lip sync fails on plosives, and emotion collapses in an argument scene.",
          "Our director marks the scenes that need a human take, usually 12 to 18 percent.",
          "That is the whole difference between a demo and something a platform will publish."]),
        ("Traction",
         ["ARR of Rs 1.64 crore in July 2026, up from Rs 89 lakh in February.",
          "868 hours delivered in July alone.",
          "13 of 17 customers have come back for a second title.",
          "Nine languages live, from an initial five."]),
        ("Why voice artists work with us",
         ["90 artists on panel, every one under a consent and royalty agreement.",
          "They earn on the first dub and again every time their voice model is reused.",
          "An artist can withdraw consent for any title or any language at any time.",
          "This is why we have a panel at all. The industry is watching how this is done."]),
        ("Unit economics",
         ["Rs 38,000 revenue a finished hour, Rs 14,500 gross contribution.",
          "Voice artist fees and royalty are Rs 11,200 of that, and we do not intend to cut it.",
          "Compute is Rs 2,100 a hour, which is noise next to the creative cost.",
          "A traditional studio makes Rs 26,000 a hour on Rs 1.4 lakh. We make more on less."]),
        ("Market",
         ["Indian OTT localisation spend is estimated at over Rs 1,400 crore a year and growing.",
          "Every regional platform has a back catalogue it cannot afford to translate.",
          "Education publishers are a second market we did not plan for and now serve.",
          "Kozhikode gives us a creative talent pool at a fraction of Mumbai cost."]),
        ("Use of funds",
         ["Rs 6.5 crore, expected to last 16 months.",
          "Rs 2.2 crore: three more language pairs and the voice model work behind them.",
          "Rs 1.8 crore: studio capacity, a second mixing suite in Kozhikode.",
          "Rs 1.6 crore: sales into Mumbai and Hyderabad platform teams.",
          "Rs 0.9 crore: reserve."]),
        ("The team",
         ["Rahul Panicker, CEO. Nine years in post production, ran localisation delivery for three OTT platforms.",
          "Divya Krishnan, CTO. Published on low resource Indian language speech synthesis.",
          "Ameer Haris, Creative. Dubbing director on fourteen feature releases.",
          "22 full time, plus 90 voice artists on panel."]),
    ])),
    (1, "One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Thooval does", [
            "Thooval Studios dubs and subtitles streaming content into nine Indian languages using "
            "speech synthesis for the first pass and a dubbing director plus voice artist for the "
            "final one. Rs 38,000 a finished hour against roughly Rs 1.4 lakh traditionally, in "
            "31 hours rather than 6 to 9 days."]),
        ("Why platforms buy", [
            "The back catalogue becomes economic to translate, not just the flagship titles.",
            "Turnaround fits a weekly release schedule instead of blocking it.",
            "Every voice artist is under a consent and royalty agreement, so the rights are clean.",
            "Nine languages from one vendor with one delivery specification."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "Three more language pairs, a second mixing suite in Kozhikode, and a sales team calling "
            "on platform localisation heads in Mumbai and Hyderabad."]),
    ])),
    (1, "Founding Team.pdf", *doc("Founding team and creative leadership", [])),
    (2, "Financial Model.xlsx", *model("Monthly build, FY27 to FY29, delivered hours driven")),
    (2, "Unit Economics.xlsx", *table("Unit economics", rows_key="unit_rows",
                                      note="Per finished hour, against a traditional studio")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Localisation Pipeline.pdf", *doc("How an episode becomes nine episodes", [
        ("Step one, transcription and timing", [
            "The source audio is transcribed and time aligned at the phrase level. A language lead "
            "corrects names, places and any dialect the model mishears, which for Malayalam source "
            "material is the single largest error class."]),
        ("Step two, adaptation not translation", [
            "A writer adapts the script for length and lip closure rather than translating it "
            "literally. A line that is accurate but two syllables too long is a failed line."]),
        ("Step three, synthesis", [
            "Voice models built from consented artist recordings generate the first pass. The "
            "director reviews every scene and marks the ones that need a human take."]),
        ("Step four, the human pass", [
            "Typically 12 to 18 percent of runtime is re recorded by the artist. Arguments, crying, "
            "singing and anything with overlapping dialogue almost always go to a human."]),
        ("Step five, mix and deliver", [
            "Dialogue is mixed back against the original music and effects stems, checked against "
            "the platform delivery specification, and shipped with subtitles in the same language."]),
    ])),
    (4, "Customer List.xlsx", *table("Customers", rows_key="customers",
                                     note="Active customers as at 31 July 2026")),
    (4, "Platform Delivery Record.pdf", *doc("On time delivery and rejections, FY27 to date", [
        ("Delivery record", [
            "868 hours delivered in July 2026 against 902 committed, with 34 hours rolled into "
            "August at the customer's request. On time delivery across Q1 FY27 was 97.2 percent."]),
        ("Rejections", [
            "Eleven hours were rejected on first delivery in Q1 FY27, 0.5 percent of volume. Nine "
            "were lip sync failures on rapid dialogue and two were terminology errors in a medical "
            "drama. All were re delivered inside 24 hours."]),
        ("What customers escalate", [
            "The most common note is not accuracy, it is performance. A line can be correct and "
            "still land flat. This is why the creative director sits above the pipeline rather than "
            "beside it."]),
        ("Track record by customer", None),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
    (5, "Voice Artist Consent Framework.pdf", *doc("Consent, royalty and withdrawal", [
        ("The principle", [
            "No voice model is built without the artist's written, specific and revocable consent. "
            "Not implied consent, not a clause buried in a session release."]),
        ("What the artist signs", [
            "A consent that names the languages, the content types and the term. Anything outside "
            "that scope requires a fresh consent. Political content and advertising are excluded by "
            "default and require an explicit opt in."]),
        ("Royalty", [
            "The artist is paid a session fee for the recordings used to build the model, and a "
            "royalty on every finished hour their voice model appears in. Royalty is paid whether "
            "the line was synthesised or re recorded."]),
        ("Withdrawal", [
            "An artist may withdraw consent for any title, language or content type on 30 days "
            "notice. On withdrawal the model is retired and not used on any new work. Titles already "
            "published are unaffected, which is disclosed to the artist before they sign."]),
        ("Why this is in the data room", [
            "An investor should assume this becomes a regulated area. We would rather be early and "
            "conservative than have to retrofit consent across 90 artists later."]),
    ])),
]

KALPANA = [
    (1, "Kalpana Pitch Deck.pdf", *deck([
        ("Kalpana Robotics",
         ["Placement linked robotics and embedded training for tier 2 engineering colleges",
          "Seed round, July 2026",
          "Kozhikode, Kerala"]),
        ("The problem",
         ["A tier 2 engineering college in Kerala places maybe a third of its electronics batch.",
          "The syllabus was written before the jobs existed.",
          "Employers in Coimbatore and Hosur cannot fill embedded roles and hire from Bengaluru instead.",
          "Both sides of the market are unhappy and they are ninety minutes apart."]),
        ("What we do",
         ["We run a two semester robotics and embedded lab inside the college, on our kit.",
          "The curriculum is written from live job descriptions, not from a textbook.",
          "We bring the employers to the campus and run the hiring rounds ourselves.",
          "71 percent of students on the placement track are placed within six months."]),
        ("Who pays and why",
         ["The college pays, not the student. Rs 4,860 per student per term.",
          "A college sells its placement rate to next year's admissions, so this is a growth cost.",
          "That makes it a budget line, not a discretionary purchase, which is why renewal is 88 percent.",
          "Students pay nothing, which is the only way this works in a Kerala government college."]),
        ("Traction",
         ["ARR of Rs 2.06 crore in July 2026, from Rs 18 lakh two years ago.",
          "34 colleges under contract across Kerala and Tamil Nadu.",
          "4,820 students trained, 2,487 placed.",
          "46 employer partners actively hiring from the programme."]),
        ("The number that sells it",
         ["Median first salary on the programme is Rs 4.6 lakh.",
          "The campus baseline in the same colleges is Rs 2.8 lakh.",
          "That gap is what a principal repeats to parents at the admission counter.",
          "We track it per college and publish it back to them every term."]),
        ("Unit economics",
         ["Rs 4,860 revenue per student per term, Rs 1,680 gross contribution.",
          "One trainer covers 40 students, which is the main lever on margin.",
          "Lab kits are ours, amortised over three years, and move between colleges.",
          "A 34 college base is contribution positive today at 64 percent trainer utilisation."]),
        ("Why this scales in tier 2",
         ["Kerala and Tamil Nadu together hold over 700 engineering colleges.",
          "Employers in Coimbatore, Hosur and Kochi are hiring embedded talent continuously.",
          "One trainer can cover three colleges inside a 60 km radius with no overnight stay.",
          "The same density exists in coastal Andhra and western Maharashtra."]),
        ("Use of funds",
         ["Rs 5.0 crore, expected to last 15 months.",
          "Rs 1.8 crore: trainer hiring and a residential trainer academy.",
          "Rs 1.4 crore: lab kits for 40 more colleges.",
          "Rs 1.2 crore: employer side team, because placements are the product.",
          "Rs 0.6 crore: reserve."]),
        ("The team",
         ["Sreelakshmi Menon, CEO. Ran campus hiring for an automotive electronics supplier.",
          "Vishnu Prasad, Curriculum. Embedded engineer, wrote the lab now running in 34 colleges.",
          "Jerin Sebastian, Employers. Six years staffing electronics manufacturing.",
          "38 full time, of whom 26 are trainers."]),
    ])),
    (1, "One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Kalpana does", [
            "Kalpana Robotics runs a two semester robotics and embedded systems lab inside tier 2 "
            "engineering colleges, on its own equipment, with a curriculum written from live job "
            "descriptions. It then runs the hiring rounds with its employer partners on campus."]),
        ("Why colleges buy", [
            "Placement rate is what a college sells to next year's admissions.",
            "Median first salary on the programme is Rs 4.6 lakh against a Rs 2.8 lakh baseline.",
            "No capital cost. The lab equipment belongs to Kalpana.",
            "The college is billed per student per term, so the cost tracks the intake."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "Trainer hiring and a residential trainer academy, lab kits for forty more colleges, and "
            "an employer side team, because the placement is the product."]),
    ])),
    (1, "Founding Team.pdf", *doc("Founding team and academic advisors", [])),
    (2, "Financial Model.xlsx", *model("Term by term build, FY27 to FY29, college and student driven")),
    (2, "Unit Economics.xlsx", *table("Unit economics", rows_key="unit_rows",
                                      note="Per student per term, Odd 2026 actuals")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Curriculum and Lab Setup.pdf", *doc("What is installed and what is taught", [
        ("The lab", [
            "Twenty workstations, each with a microcontroller development board, a motor and sensor "
            "kit, a small robotic arm and a shared vision rig. The equipment stays Kalpana property "
            "and is insured by Kalpana."]),
        ("Semester one", [
            "Embedded C, microcontroller peripherals, sensor interfacing, motor control and serial "
            "protocols. Assessed by a working build, not by a written paper."]),
        ("Semester two", [
            "Robot kinematics, PID control, computer vision basics, industrial communication and a "
            "capstone build specified by an employer partner."]),
        ("Why it is written from job descriptions", [
            "The curriculum is rebuilt every year from the actual postings our 46 employer partners "
            "publish. In 2026 that added CAN bus and battery management, because every EV supplier "
            "in Hosur was asking for it and no syllabus in the state covered it."]),
        ("Assessment", [
            "Every student ends with a portfolio of six working builds and a capstone. That "
            "portfolio, not the marksheet, is what goes to the employer."]),
    ])),
    (4, "College Contracts.xlsx", *table("Colleges", rows_key="customers",
                                         note="Colleges under contract, Odd 2026 term")),
    (4, "Placement Outcomes Report.pdf", *doc("Placements by term and employer", [
        ("Headline", [
            "2,487 students placed of 3,502 on the placement track, a 71 percent rate within six "
            "months of programme completion. Median first salary Rs 4.6 lakh."]),
        ("Term by term", None),
        ("Where students go", [
            "Automotive electronics and EV suppliers in Hosur and Coimbatore take about 38 percent.",
            "Industrial automation and pumps in Coimbatore take about 24 percent.",
            "Electronics manufacturing services in Chennai and Kochi take about 21 percent.",
            "The remainder go to product startups, mostly in Bengaluru and Kochi."]),
        ("What we do not claim", [
            "The 71 percent is on the placement track, not on total enrolment. About 28 percent of "
            "trained students opt out of placement, mostly for higher studies or the government exam "
            "route. We report both numbers to every college and we report them here."]),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
    (5, "College Agreement Template.pdf", *doc("Standard institutional agreement, 2026 edition", [
        ("Term and fee", [
            "Two semester programme, billed per student per term at Rs 4,860, invoiced at the start "
            "of each term against the confirmed enrolment list. Auto renewing annually unless either "
            "party gives 90 days notice before the term begins."]),
        ("What the college provides", [
            "A dedicated lab room with power and network, a faculty coordinator, and timetable slots "
            "of four hours a week per batch. Nothing else."]),
        ("What Kalpana provides", [
            "All equipment, the trainer, the curriculum, assessment, the student portfolio platform, "
            "and the employer hiring rounds on campus."]),
        ("The placement clause", [
            "If the placement rate for a cohort falls below 50 percent within six months, the college "
            "pays half the following term's fee. This has been triggered once, at a college in the "
            "Even 2025 term, and was honoured."]),
        ("Equipment", [
            "All lab equipment remains Kalpana property and is removed on termination. The college "
            "carries no capital cost and no depreciation."]),
    ])),
]

METRICON = [
    (1, "Metricon Pitch Deck.pdf", *deck([
        ("Metricon Interconnect",
         ["Precision connectors for electric vehicles and industrial automation",
          "Seed round, July 2026",
          "Coimbatore, Tamil Nadu"]),
        ("The problem",
         ["An Indian EV maker designs in India and then buys its connectors from China.",
          "Lead times run 10 to 14 weeks and a design change means starting again.",
          "The few Indian suppliers are either too small to qualify or too slow to iterate.",
          "A connector is two rupees of copper and the reason a line stops."]),
        ("What we do",
         ["We design, tool and manufacture connectors in Coimbatore, close to the customer.",
          "41 part numbers approved across nine customers, from 18 a year ago.",
          "22 to 31 percent below landed Chinese cost, at four week lead times.",
          "184 parts per million defect rate against a 500 limit from our automotive customers."]),
        ("Why now",
         ["EV two wheeler volume in India has made connector demand large enough to be worth serving.",
          "Customers actively want a second source that is not Chinese.",
          "Production linked incentives have moved battery and drivetrain assembly into Tamil Nadu.",
          "Coimbatore already has the tool room ecosystem. It did not have the connector design."]),
        ("Traction",
         ["Rs 6.40 crore revenue in FY26, Rs 9.80 crore annualised in July 2026.",
          "EV is 58 percent of revenue, from 21 percent five quarters ago.",
          "Nine customers, none more than 33 percent of revenue.",
          "Near EBITDA breakeven at the current run rate."]),
        ("Why qualification is the moat",
         ["An automotive connector takes 9 to 14 months to qualify into a platform.",
          "Once it is in, it stays for the life of that platform, usually four to six years.",
          "That makes growth slow to start and very hard for a competitor to reverse.",
          "41 approved part numbers is 41 doors nobody else has to walk through again."]),
        ("Unit economics",
         ["Rs 41,200 per thousand units, Rs 9,100 gross contribution.",
          "Copper is 61 percent of material cost and moves straight through to us.",
          "Scrap and rework fell from Rs 3,400 to Rs 1,100 per thousand as tooling matured.",
          "Bringing moulding and stamping in house took Rs 4,900 out of cost per thousand."]),
        ("The honest risk",
         ["Plating is outsourced to a single vendor in Coimbatore.",
          "If that vendor stops, we stop, and we have not yet qualified a second.",
          "Copper repricing happens twice a year while the metal moves weekly.",
          "Both are fixable with this round and both are in the use of funds."]),
        ("Use of funds",
         ["Rs 8.5 crore, expected to last 18 months.",
          "Rs 3.2 crore: in house plating line, removing the single point of failure.",
          "Rs 2.4 crore: two more moulding machines and tooling for 20 new part numbers.",
          "Rs 1.8 crore: working capital, because automotive pays in 60 to 90 days.",
          "Rs 1.1 crore: reserve."]),
        ("The team",
         ["Ramesh Venkataraman, CEO. Sixteen years in connectors, plant head for a Japanese maker in India.",
          "Priya Sundaram, Engineering. Two granted design registrations on high current terminals.",
          "Naveen Kumar, Quality. Took two plants through IATF 16949.",
          "64 full time across design, tool room and production."]),
    ])),
    (1, "One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Metricon does", [
            "Metricon Interconnect designs, tools and manufactures precision electrical connectors in "
            "Coimbatore for electric vehicle and industrial automation customers, replacing imported "
            "parts at 22 to 31 percent below landed cost with four week lead times."]),
        ("Why customers switch", [
            "Four week lead times against 10 to 14 weeks on an import.",
            "Design changes handled in the same city rather than across a language and a time zone.",
            "184 parts per million defect rate against a customer limit of 500.",
            "A second source that is not exposed to Chinese supply or tariff risk."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "An in house plating line to remove the single vendor dependency, two more moulding "
            "machines with tooling for twenty new part numbers, and working capital for automotive "
            "payment terms."]),
    ])),
    (1, "Founding Team.pdf", *doc("Founding team and plant leadership", [])),
    (2, "Financial Model.xlsx", *model("Quarterly build, FY27 to FY29, part number driven")),
    (2, "Unit Economics.xlsx", *table("Unit economics", rows_key="unit_rows",
                                      note="Per thousand units, blended across 41 part numbers")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Product Catalogue and Tooling.pdf", *doc("Part families, tooling and capacity", [
        ("Part families", [
            "High current battery and drivetrain terminals rated 80 to 400 amps.",
            "Signal and sensor connectors, 2 to 24 way, sealed to IP67.",
            "Charging interface contacts for AC and DC equipment.",
            "Industrial rectangular connectors for drives and control panels."]),
        ("Tooling", [
            "Eleven progressive stamping tools and nine injection moulds, all designed in house and "
            "cut in the Coimbatore tool room. Average tool development is fourteen weeks from "
            "drawing release to first article."]),
        ("Capacity", [
            "Current capacity is roughly 14 million contacts a year on two shifts. The two additional "
            "moulding machines in the use of funds take that to about 24 million."]),
        ("Intellectual property", [
            "Two granted design registrations on high current terminal geometry. No patents filed. "
            "The real protection is the customer qualification, not the registration."]),
    ])),
    (4, "Customer Approvals.xlsx", *table("Customers", rows_key="customers",
                                          note="Approved customers and part numbers, July 2026")),
    (4, "Quality and PPAP Record.pdf", *doc("Production part approval and defect history", [
        ("Approval status", [
            "41 part numbers at PPAP level 3 approval across nine customers. Six further parts are "
            "in the sample and validation stage with two customers."]),
        ("Defect history", None),
        ("Systems", [
            "IATF 16949 certified in March 2026 following an eighteen month preparation. ISO 14001 "
            "certified. Full traceability from copper coil lot to shipped box, retained for seven "
            "years as the automotive customers require."]),
        ("Customer complaints", [
            "Four customer complaints in FY26, all closed. Two were plating thickness variation from "
            "the outsourced vendor, one was a packaging damage issue in transit, and one was a "
            "drawing revision our side had not picked up. The plating complaints are the direct "
            "reason the in house line is the first line item in this round."]),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Coimbatore", [])),
    (5, "Certifications and Compliance.pdf", *doc("Plant certifications, licences and lending", [
        ("Certifications", [
            "IATF 16949:2016 certified March 2026, certificate number IN 26 04471, valid to March 2029.",
            "ISO 14001:2015 certified September 2025.",
            "RoHS and REACH declarations on file for every shipped part number."]),
        ("Plant approvals", [
            "Factories Act registration for the Kurichi unit, consent to operate from the Tamil Nadu "
            "Pollution Control Board valid to March 2028, and a hazardous waste authorisation "
            "covering plating chemical handling for the planned in house line."]),
        ("Borrowings", [
            "A machinery term loan of Rs 2.10 crore outstanding, secured on the moulding and stamping "
            "equipment, repayable to November 2029. The lender holds a warrant for 7 percent, which "
            "is reflected in the cap table."]),
        ("Litigation", [
            "None. No customer claim, no supplier dispute and no labour matter pending."]),
    ])),
]

PUZHA = [
    (1, "Puzha Pitch Deck.pdf", *deck([
        ("Puzha Foods",
         ["Minimally processed Kerala produce for modern trade and direct to consumer",
          "Seed round, July 2026",
          "Thrissur, Kerala"]),
        ("The problem",
         ["Kerala grows jackfruit, tender coconut and banana in quantities it cannot consume.",
          "A large share of the jackfruit crop is never harvested because there is no buyer.",
          "Meanwhile a Bengaluru household buys imported packaged snacks made from the same crops.",
          "The produce and the demand exist. The processing between them does not."]),
        ("What we do",
         ["We buy directly from 620 contracted farmers in Thrissur and Palakkad.",
          "We process at our own plant: cold pressing, freezing, drying and packing.",
          "We sell through 410 modern trade doors and direct to consumer through our own app.",
          "Rs 78 lakh a month in July 2026, at 38 percent gross margin."]),
        ("Why both channels",
         ["Modern trade gives volume and gives the brand shelf credibility.",
          "Direct to consumer gives margin, repeat data and pricing freedom.",
          "62 percent modern trade and 38 percent direct today.",
          "The direct channel is what tells us which SKU to put in the next store, not the other way round."]),
        ("Traction",
         ["Revenue up from Rs 34 lakh in February to Rs 78 lakh in July 2026.",
          "410 retail doors across Kerala, Bengaluru and Chennai.",
          "47 percent of direct customers reorder inside 60 days.",
          "Gross margin up from 31 percent to 38 percent over the same six months."]),
        ("What we fixed",
         ["Gross margin was 31 percent in February and it was killing us.",
          "Three changes: we moved jackfruit from bought pulp to own processing, dropped two SKUs "
          "that never covered their freight, and renegotiated cold storage.",
          "Seven points of margin in six months, with no price increase to the consumer.",
          "That is the single number a food investor should look at, so we lead with it."]),
        ("Unit economics",
         ["Contribution positive on all six SKUs, from Rs 9.20 to Rs 52.60 a unit.",
          "Banana flour and frozen jackfruit carry the mix and are the direct channel favourites.",
          "Tender coconut water is the traffic driver and the thinnest line, deliberately.",
          "Plant is at 64 percent of a single shift, so volume growth is nearly free."]),
        ("The honest problem",
         ["Modern trade pays in 45 to 60 days. Farmers are paid in 7.",
          "Every rupee of growth in that channel consumes working capital before it returns any.",
          "This is the reason for the round, and it is the first line in the use of funds.",
          "We would rather show you the cash conversion cycle than the revenue chart."]),
        ("Use of funds",
         ["Rs 5.5 crore, expected to last 15 months.",
          "Rs 2.2 crore: working capital for the modern trade receivable.",
          "Rs 1.4 crore: a second processing line, taking capacity to two shifts.",
          "Rs 1.2 crore: brand and performance marketing on the direct channel.",
          "Rs 0.7 crore: reserve."]),
        ("The team",
         ["Anjali Warrier, CEO. Ran the south India business for a spices brand. IIM Kozhikode.",
          "Deepak Nair, Operations. Food processing engineer, set up two fruit pulping lines.",
          "Farhan Ali, Sourcing. Twelve years buying coconut, jackfruit and banana in Thrissur.",
          "41 full time, of whom 26 are at the plant."]),
    ])),
    (1, "One Pager.pdf", *doc("Company summary, July 2026", [
        ("What Puzha does", [
            "Puzha Foods buys directly from 620 contracted farmers in Thrissur and Palakkad, "
            "processes at its own plant into six minimally processed SKUs, and sells through 410 "
            "modern trade doors plus its own direct to consumer channel."]),
        ("Why it works", [
            "Kerala grows more jackfruit, tender coconut and banana than it consumes, and a large "
            "share is never harvested for want of a buyer.",
            "Own processing rather than bought pulp, which is where seven points of margin came from.",
            "The direct channel tells the company which SKU to put in which store.",
            "Farmers are paid in seven days, which is why the contracted base keeps growing."]),
        ("Where the business stands", None),
        ("What the round funds", [
            "Working capital against the modern trade receivable, a second processing line taking "
            "the plant to two shifts, and marketing on the direct channel."]),
    ])),
    (1, "Founding Team.pdf", *doc("Founding team and plant leadership", [])),
    (2, "Financial Model.xlsx", *model("Monthly build, FY27 to FY29, channel and SKU driven")),
    (2, "SKU Economics.xlsx", *table("SKU economics", rows_key="unit_rows",
                                     note="Contribution per unit, July 2026 costing")),
    (2, "Cap Table.xlsx", *table("Cap table", rows_key="cap",
                                 note="Fully diluted, before the proposed seed round")),
    (3, "Plant and Process Overview.pdf", *doc("Thrissur facility, lines and capacity", [
        ("The plant", [
            "An 11,000 square foot facility at Koratty, Thrissur, commissioned in August 2024. Four "
            "process lines: cold pressing, blast freezing, low temperature drying, and cut and pack."]),
        ("Capacity", [
            "Current throughput is roughly 42 tonnes of raw produce a month at 64 percent of a "
            "single shift. The second line in the use of funds and a second shift together take that "
            "to about 140 tonnes."]),
        ("Cold chain", [
            "Two blast freezers and 60 tonnes of cold storage on site. Outbound to modern trade moves "
            "on contracted reefer vehicles with temperature logging attached to each delivery note."]),
        ("Seasonality", [
            "Jackfruit runs March to July and tender coconut peaks in summer. Banana and coconut milk "
            "run year round and are deliberately weighted to cover the Q2 trough. Frozen inventory "
            "built in season carries the jackfruit line through to December."]),
        ("Food safety", [
            "FSSAI manufacturing licence, HACCP implemented, and a third party audit in May 2026 "
            "scoring 88 of 100. Two observations, both on documentation, closed within 30 days."]),
    ])),
    (4, "Channel Performance.xlsx", *table("Channels", rows_key="customers",
                                           note="Channel performance, July 2026")),
    (4, "Working Capital and Collections.pdf", *doc("Cash conversion, the honest version", [
        ("The cycle", [
            "Farmers are paid in 7 days. Raw produce becomes finished stock in 3 to 9 days depending "
            "on the SKU. Modern trade pays in 45 to 60 days. Direct to consumer is prepaid. The "
            "blended cash conversion cycle is 41 days and it lengthens as modern trade grows."]),
        ("Collections", [
            "Rs 94 lakh of receivables outstanding at 31 July 2026, of which Rs 11 lakh is over 60 "
            "days, all with one chain that is renegotiating terms across all its suppliers."]),
        ("Why we do not just shift to direct only", [
            "The direct channel is higher margin but its acquisition cost rises as it scales. Modern "
            "trade is the cheapest awareness we can buy, and it is what makes the direct channel "
            "convert at the rate it does. The two are not alternatives."]),
        ("What the round changes", [
            "Rs 2.2 crore of working capital lets us take modern trade to about 900 doors without "
            "the receivable strangling the farmer payment commitment, which is the one thing we will "
            "not compromise on."]),
    ])),
    (5, "Certificate of Incorporation.pdf", *doc("Registrar of Companies, Ernakulam", [])),
    (5, "FSSAI and Farmer Contracts.pdf", *doc("Licences and the farmer contracting model", [
        ("FSSAI", [
            "Central manufacturing licence number 10024051000318, covering fruit and vegetable "
            "processing, valid to 31 March 2029. Separate storage endorsement for the Koratty cold "
            "store."]),
        ("Farmer contracts", [
            "620 farmers on a written annual contract specifying a minimum offtake, a floor price "
            "agreed before the season, and payment within seven days of delivery. The floor price is "
            "the reason farmers plant for us rather than for the open market."]),
        ("Floor price mechanics", [
            "The floor is set before planting against the previous three seasons. If the market price "
            "rises above the floor, Puzha pays the market price. If it falls below, Puzha pays the "
            "floor. This has cost the company Rs 14 lakh across two seasons and it is the single "
            "biggest reason the contracted base grew from 180 farmers to 620."]),
        ("Other approvals", [
            "Organic certification under NPOP for the banana flour and jackfruit lines. Legal "
            "metrology packer registration. Trade mark registered in classes 29 and 30."]),
    ])),
]

MANIFEST = {
    "nellara-agrichain": NELLARA,
    "zylo-health": ZYLO,
    "voltaneer": VOLTANEER,
    "aegis-drone-systems": AEGIS,
    "kadal-systems": KADAL,
    "anvaya-ai": ANVAYA,
    "thooval-studios": THOOVAL,
    "kalpana-robotics": KALPANA,
    "metricon-interconnect": METRICON,
    "puzha-foods": PUZHA,
}
