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

MANIFEST = {
    "nellara-agrichain": NELLARA,
    "zylo-health": ZYLO,
    "voltaneer": VOLTANEER,
    "aegis-drone-systems": AEGIS,
    "kadal-systems": KADAL,
}
