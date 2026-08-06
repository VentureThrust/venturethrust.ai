# -*- coding: utf-8 -*-
"""
The monthly founder check in: what to ask, when, and on what condition.

Written to be used by an account manager, not read once. The rule running
through it is that a founder answers a specific question and ignores a general
one, so almost nothing here is open ended.

  python scripts/bootcamp/make_questions.py
"""

import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, KeepTogether,
    Table, TableStyle,
)

OUT = os.path.join(os.path.expanduser("~"), "Desktop", "om",
                   "VentureThrust_Founder_Questions.pdf")

NAVY = colors.HexColor("#0D1B3E")
CRIMSON = colors.HexColor("#8B1E2D")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6B7280")
RULE = colors.HexColor("#D1D5DB")
FAINT = colors.HexColor("#F3F4F6")

ST = {
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=20, leading=24,
                         textColor=NAVY, spaceAfter=3),
    "sub": ParagraphStyle("sub", fontName="Helvetica-Oblique", fontSize=10.5,
                          leading=14, textColor=MUTED, spaceAfter=14),
    "sec": ParagraphStyle("sec", fontName="Helvetica-Bold", fontSize=10,
                          leading=13, textColor=CRIMSON, spaceBefore=15,
                          spaceAfter=7),
    "q": ParagraphStyle("q", fontName="Helvetica-Bold", fontSize=10.5,
                        leading=14, textColor=INK, spaceAfter=3),
    "why": ParagraphStyle("why", fontName="Helvetica", fontSize=9.5,
                          leading=13, textColor=MUTED, spaceAfter=11),
    "lead": ParagraphStyle("lead", fontName="Helvetica", fontSize=10.5,
                           leading=15, textColor=INK, spaceAfter=9),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=9,
                           leading=12, textColor=INK),
    "cellh": ParagraphStyle("cellh", fontName="Helvetica-Bold", fontSize=9,
                            leading=12, textColor=colors.white),
}


class Doc(BaseDocTemplate):
    def __init__(self, path):
        BaseDocTemplate.__init__(
            self, path, pagesize=A4,
            leftMargin=19 * mm, rightMargin=19 * mm,
            topMargin=23 * mm, bottomMargin=17 * mm,
            title="Founder check in questions", author="VentureThrust")
        f = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="b")
        self.addPageTemplates([PageTemplate(id="s", frames=[f], onPage=self._chrome)])

    def _chrome(self, c, d):
        w, h = A4
        c.saveState()
        c.setFont("Helvetica-Bold", 8.5); c.setFillColor(NAVY)
        c.drawString(19 * mm, h - 14 * mm, "VENTURETHRUST  ·  DEAL WATCH")
        c.setFont("Helvetica", 8.5); c.setFillColor(MUTED)
        c.drawRightString(w - 19 * mm, h - 14 * mm, "Founder check in")
        c.setStrokeColor(RULE); c.setLineWidth(0.6)
        c.line(19 * mm, h - 17 * mm, w - 19 * mm, h - 17 * mm)
        c.line(19 * mm, 13 * mm, w - 19 * mm, 13 * mm)
        c.setFont("Helvetica-Oblique", 7.6); c.setFillColor(MUTED)
        c.drawString(19 * mm, 9.5 * mm,
                     "Ask what you will act on. A founder answers a specific question and ignores a general one.")
        c.setFont("Helvetica", 8)
        c.drawRightString(w - 19 * mm, 9.5 * mm, "Page %d" % c.getPageNumber())
        c.restoreState()


def qa(q, why):
    return KeepTogether([Paragraph(q, ST["q"]), Paragraph(why, ST["why"])])


def table(rows, widths):
    data = [[Paragraph(c, ST["cellh"]) for c in rows[0]]]
    for r in rows[1:]:
        data.append([Paragraph(c, ST["cell"]) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), FAINT))
    t.setStyle(TableStyle(style))
    return t


LEAD = (
    "This is the monthly note to a watched founder. It has to be short enough that replying "
    "is easier than ignoring, and specific enough that the reply is usable. The whole set "
    "below is never sent at once. Send the five core questions every month, and add from the "
    "conditional sets only when that condition is actually true."
)

CORE = [
    ("1. What is your revenue for the month just closed, and what was it the month before?",
     "Two numbers, not a trend. Asking for one month invites rounding; asking for two makes "
     "the direction visible and is still trivial to answer."),
    ("2. How many customers are paying you today, and how many were paying last month?",
     "Revenue can move on price or on one large invoice. Customer count is the honest "
     "denominator and it catches churn hiding under growth."),
    ("3. What is your cash balance, and at the current burn, what month does it run out?",
     "Ask for the month, not the runway in months. A founder who says fourteen months has "
     "estimated; a founder who says November 2027 has calculated."),
    ("4. What is the single biggest thing that changed since we last spoke?",
     "The only open question in the core set. It catches what no metric would: a co-founder "
     "leaving, a pilot converting, a regulator responding."),
    ("5. Is anything about the round different from last month?",
     "Amount, instrument, lead, timing. Phrased as a change question so silence is a valid "
     "answer, which is what makes it answerable in ten seconds."),
]

CONDITIONAL = [
    ("If the investor's note named a threshold", [
        ("Where is [the metric] this month, against the [number] you were working towards?",
         "This is the one that produces a priority brief. Name the investor's own number back "
         "to the founder without naming the investor."),
        ("What specifically changed to move it, and is that change repeatable?",
         "Separates a durable driver from a one-off. This answer becomes the 'why it moved' "
         "section of the brief, and it is the part an investor actually reads."),
    ]),
    ("If revenue moved more than 20 percent, up or down", [
        ("Was that one customer or several?",
         "A 40 percent jump from one contract is a different business from the same jump "
         "spread across twelve accounts."),
        ("Is it recurring or one time?",
         "Ask every time. Founders describe a one-off implementation fee as revenue growth "
         "without meaning to mislead."),
    ]),
    ("If they are pre revenue", [
        ("What is the one milestone you are working towards this quarter, and what is left on it?",
         "Pre revenue companies need a milestone clock, not a revenue clock. Deep tech is "
         "read on milestones and always will be."),
        ("Has anything moved on regulatory approval, certification or clearance?",
         "For medtech, drones, marine and semiconductors this is usually the whole story, and "
         "founders forget to mention it because nothing changed for months."),
    ]),
    ("If a regulator, certifier or large customer is in the loop", [
        ("Has the file moved, and what is the next date you are waiting on?",
         "Ask for the date. It converts a vague pending into something you can check next "
         "month without asking again."),
    ]),
    ("If they raised, or are raising", [
        ("Has anything been signed, or is it still conversations?",
         "The single most misreported thing in a founder update. Signed and interested get "
         "described with the same word."),
        ("What valuation is being discussed, and is it set or still open?",
         "Only ask once there is a term sheet. Asking earlier makes you sound like you are "
         "shopping the deal, and the founder goes quiet."),
    ]),
    ("If the team changed", [
        ("Who joined or left, and did anyone in the founding team change their role?",
         "A co-founder leaving is the highest signal event in an early company and rarely "
         "appears in a written update."),
    ]),
    ("If they went quiet last month", [
        ("Just checking you are alright. Anything you want kept out of the report this month?",
         "Silence usually means bad news, not busyness. Explicitly offering to hold something "
         "back is what gets the truth, and it costs nothing because we were not going to "
         "publish an unconfirmed thing anyway."),
    ]),
]

NEVER = [
    ("Never ask for a full deck or an updated model every month.",
     "It is hours of work and they will stop replying by month three. Ask for it once, when "
     "something is actually about to be sent to an investor."),
    ("Never ask a question you will not act on.",
     "Every unnecessary question spends credit you need for the month something real happens."),
    ("Never ask two versions of the same thing.",
     "Revenue and MRR and ARR in one email reads as though you do not know which one matters."),
    ("Never let the founder learn which investor is watching.",
     "Ask for the number, never for the investor's name behind it. The moment a founder knows, "
     "the number stops being reliable."),
    ("Never chase more than twice.",
     "One reminder after five days, one after twelve, then stop and record it. A third chase "
     "turns a monitoring service into a nuisance."),
]

CADENCE = [
    ["When", "What goes out", "Why then"],
    ["Day 3 of the month",
     "The five core questions for the month just closed",
     "Early enough that last month is fresh, late enough that the books are closed."],
    ["Day 8",
     "First reminder, same thread, one line",
     "Same thread so it does not read as a new task."],
    ["Day 15",
     "Second and last reminder",
     "After this, stop and log it. Two silent months in a row is itself worth noting."],
    ["Any day",
     "The conditional questions, when the condition fires",
     "Never batched into the monthly note. A threshold being crossed deserves its own email."],
    ["Quarter end",
     "Only for startups where the investor asked for a quarterly",
     "Everything else stays silent. That is the product."],
]


def build():
    doc = Doc(OUT)
    flow = [
        Paragraph("Founder check in questions", ST["h1"]),
        Paragraph("What to ask a watched startup, when, and on what condition", ST["sub"]),
        Paragraph(LEAD, ST["lead"]),

        Paragraph("THE FIVE CORE QUESTIONS, EVERY MONTH, EVERY STARTUP", ST["sec"]),
    ]
    for q, w in CORE:
        flow.append(qa(q, w))

    flow.append(Paragraph("CONDITIONAL QUESTIONS, ONLY WHEN THE CONDITION IS TRUE", ST["sec"]))
    for head, items in CONDITIONAL:
        flow.append(Paragraph("<b>%s</b>" % head, ST["q"]))
        flow.append(Spacer(1, 3))
        for q, w in items:
            flow.append(qa("&nbsp;&nbsp;" + q, "&nbsp;&nbsp;" + w))

    flow.append(Paragraph("WHAT NOT TO ASK", ST["sec"]))
    for q, w in NEVER:
        flow.append(qa(q, w))

    flow.append(Paragraph("CADENCE", ST["sec"]))
    flow.append(table(CADENCE, [30 * mm, 62 * mm, 80 * mm]))

    doc.build(flow)
    print("QUESTIONS: %s" % OUT)


if __name__ == "__main__":
    build()
