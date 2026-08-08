# -*- coding: utf-8 -*-
"""
The IIMK LIVE cohort pilot: what to ask 20 founders, and in what order.

Different job from the investor check in. The founder knows who is asking, so
nothing is hidden, and the report goes to a programme that can actually help
them. That changes the last section entirely: an investor report ends with
"is this worth a second look", an incubator report ends with "here is what
this founder needs from you".

The first call is a baseline. There is only one chance at it, because every
report for the next two months measures against these numbers.

  python scripts/bootcamp/make_cohort_questions.py
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
                   "VentureThrust_IIMK_Cohort_Call_Script.pdf")

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
            title="IIMK LIVE cohort call script", author="VentureThrust")
        f = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="b")
        self.addPageTemplates([PageTemplate(id="s", frames=[f], onPage=self._chrome)])

    def _chrome(self, c, d):
        w, h = A4
        c.saveState()
        c.setFont("Helvetica-Bold", 8.5); c.setFillColor(NAVY)
        c.drawString(19 * mm, h - 14 * mm, "VENTURETHRUST  ·  IIMK LIVE COHORT PILOT")
        c.setFont("Helvetica", 8.5); c.setFillColor(MUTED)
        c.drawRightString(w - 19 * mm, h - 14 * mm, "Founder call script")
        c.setStrokeColor(RULE); c.setLineWidth(0.6)
        c.line(19 * mm, h - 17 * mm, w - 19 * mm, h - 17 * mm)
        c.line(19 * mm, 13 * mm, w - 19 * mm, 13 * mm)
        c.setFont("Helvetica-Oblique", 7.6); c.setFillColor(MUTED)
        c.drawString(19 * mm, 9.5 * mm,
                     "The first call is the baseline. Every report for two months measures against these numbers.")
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
    "Twenty founders, two months, one person doing the calling. That only works if the "
    "call is 40 minutes and never 90. The identity questions go out as a form before the "
    "call so no call time is spent on a website address. Everything below is designed to "
    "produce a line in a report: if an answer cannot be written down as a fact, the "
    "question is wrong."
)

OPENING = (
    "Open every first call with this, in these words, before anything else: <b>everything "
    "you tell me goes into a report that IIMK reads, unless you tell me to hold it back. "
    "If there is something you would rather they did not see, say so and it stays out.</b> "
    "Say it once, at the start. A founder who finds out afterwards that a number reached "
    "the programme will never give you a real number again, and you have nineteen more "
    "calls after this one."
)

FORM = [
    ("Registered company name, and date of incorporation", ""),
    ("DPIIT recognition number, if they have one", ""),
    ("Website, and one social link they actually use", ""),
    ("Every founder: name, role, and full time or not", ""),
    ("City they operate from", ""),
    ("One line: what the company does", ""),
]

SECTIONS = [
    ("WHAT THE BUSINESS ACTUALLY IS  ·  8 minutes", [
        ("Describe what you do in one sentence, to a customer, not to an investor.",
         "The investor sentence is rehearsed and full of market size. The customer "
         "sentence is true. This becomes the opening line of their report, so write it "
         "down exactly as they say it."),
        ("Who pays you, and what exactly are they paying for?",
         "Separates the product from the revenue model. A founder who cannot answer this "
         "in one go is pre revenue in practice whatever the deck says, and that itself is "
         "the finding."),
        ("Walk me through your last sale. Who was the customer, what did they pay, and "
         "when did the money actually arrive in the bank?",
         "The best question in the set. Vague revenue claims do not survive it. The words "
         "doing the work are 'arrived in the bank', so do not soften them."),
    ]),
    ("MONEY IN  ·  8 minutes", [
        ("Revenue for each of the last three months, month by month.",
         "Three points show direction. Asking for one month invites rounding, asking for "
         "a trend invites a story."),
        ("How many customers paid you last month, and how many paid the month before?",
         "Revenue can move on one large invoice or a price change. Customer count is the "
         "honest denominator and it catches churn hiding under growth."),
        ("Of last month's revenue, how much repeats next month without you doing anything?",
         "This is recurring revenue without saying MRR, which founders inflate by habit. "
         "Implementation fees and one off projects fall out here."),
        ("If pre revenue: what is the one milestone you are working towards this quarter, "
         "and what is left on it? Has anyone agreed in writing to pay once it works?",
         "Pre revenue companies need a milestone clock, not a revenue clock. The second "
         "half separates real demand from encouragement."),
    ]),
    ("MONEY OUT  ·  5 minutes", [
        ("What is your bank balance today?",
         "Ask plainly. A founder who will not answer has told you something anyway. Note "
         "the refusal, do not argue with it."),
        ("What did you spend last month, in total?",
         "Total, not burn. Burn is a word founders calculate creatively."),
        ("At that rate, which month does the money run out?",
         "Ask for the month, never the number of months. A founder who says fourteen "
         "months has estimated. One who says March 2027 has calculated."),
    ]),
    ("PEOPLE  ·  5 minutes", [
        ("Who is full time and paid, full time and unpaid, and part time?",
         "Team size is meaningless without this split. Three unpaid co-founders and one "
         "intern is a different company from a team of four."),
        ("Is anyone in the founding team also working a job or running another company?",
         "The most commonly hidden fact in an early team and one of the highest signal "
         "ones. Ask it flatly, without apology, and it usually gets answered."),
        ("Has anyone left the founding team since the cohort started?",
         "A co-founder leaving is the single biggest event in an early company and almost "
         "never appears in a written update."),
    ]),
    ("MONEY RAISED  ·  5 minutes", [
        ("What have you raised so far, from whom, on what instrument, and at what valuation?",
         "Instrument matters. A ₹25 lakh SAFE and a ₹25 lakh priced round say different "
         "things about how far along they really are."),
        ("Are you raising now? Has anything been signed, or is it still conversations?",
         "The most misreported thing in any founder update. Signed and interested get "
         "described with exactly the same word."),
    ]),
    ("THE HONEST BIT  ·  8 minutes", [
        ("What is the single biggest thing that changed since the cohort started?",
         "The only open question worth keeping. It catches what no metric would: a pilot "
         "converting, a regulator responding, a co-founder leaving."),
        ("What is the one thing that could kill this company in the next six months?",
         "A founder who cannot name it has not thought about it, and that is the finding. "
         "A founder who names it immediately is usually the one worth backing."),
        ("What are you working on this month that you were not working on three months ago?",
         "Catches a silent pivot. Founders rarely announce a pivot, they just describe a "
         "different company than last time."),
    ]),
    ("WHAT IIMK CAN ACTUALLY DO  ·  4 minutes", [
        ("What do you need from IIMK that you are not getting right now?",
         "This is the section the coordinator will read first. It converts your report "
         "from information into something the programme can act on this week."),
        ("Which one introduction would change the most for you in the next sixty days? "
         "Name the type of person, or name the company.",
         "Force the specific. 'More investor connects' is not actionable. 'Someone who "
         "has sold to a hospital procurement team' is."),
    ]),
]

UPDATE = [
    "Revenue last month, and the month before.",
    "Paying customers last month, and the month before.",
    "Bank balance, and which month it runs out.",
    "The single biggest thing that changed.",
    "Anything different about the round since we last spoke.",
]

FLAGS = [
    ("Two missed updates in a row",
     "Silence is almost never busyness. Flag it to IIMK as a status, not as a failure."),
    ("A founder takes a full time job",
     "The company is on life support whatever they say. Report it plainly and without "
     "judgement, because the programme needs to know where its attention goes."),
    ("Revenue only ever described as GMV, pipeline or ARR run rate",
     "Three different ways of avoiding the number that landed in the bank."),
    ("Refusal to give a bank balance after trust is established",
     "On call one this is normal. On call three it is a signal."),
    ("A co-founder has gone and it was not mentioned",
     "Not mentioning it is the signal, not the departure."),
    ("A pivot with no customer conversation behind it",
     "Ask who they spoke to before changing direction. If the answer is nobody, that goes "
     "in the report."),
]

PLAN = [
    ["When", "What you do", "What IIMK gets"],
    ["Week 1",
     "Onboard all 20 to the data room, send the pre call form, book every call",
     "Nothing yet. Tell them week 4 is the first delivery so the wait is expected."],
    ["Weeks 2 to 3",
     "Twenty baseline calls, two a day, 40 minutes each, recorded with permission",
     "Nothing yet."],
    ["Week 4",
     "Write 20 baseline reports and the cohort page",
     "20 profiles and one cohort page. This is the delivery that decides the renewal."],
    ["Week 6",
     "The five question update by email, one reminder after five days",
     "A short note on what moved, only for the startups where something did."],
    ["Week 8",
     "Twenty short calls, 15 minutes, then and now",
     "20 progress reports and the second cohort page, showing two months of movement."],
]

COHORT_PAGE = (
    "The twenty individual reports are what you promised. <b>The one page cohort view is "
    "what gets you paid again.</b> A programme coordinator does not have time to read "
    "twenty reports, and does not want to. Give them one page: every startup as a row, "
    "with revenue now against revenue at cohort start, paying customers, runway month, "
    "raising or not, and one column headed 'needs from IIMK'. Sort it so the ones in "
    "trouble are at the top. That single page is the thing they will forward to their own "
    "management, and forwarding is what renews a contract."
)


def build():
    doc = Doc(OUT)
    flow = [
        Paragraph("IIMK LIVE cohort pilot", ST["h1"]),
        Paragraph("What to ask twenty founders, in what order, and what to do with it",
                  ST["sub"]),
        Paragraph(LEAD, ST["lead"]),

        Paragraph("SAY THIS BEFORE ANYTHING ELSE", ST["sec"]),
        Paragraph(OPENING, ST["lead"]),

        Paragraph("SEND AS A FORM BEFORE THE CALL, NEVER ASK ON THE CALL", ST["sec"]),
    ]
    for q, _ in FORM:
        flow.append(Paragraph("&bull;&nbsp;&nbsp;" + q, ST["q"]))
    flow.append(Spacer(1, 6))
    flow.append(Paragraph(
        "Six fields. If you spend call time collecting a website address you will run out "
        "of patience by founder number eight and the last twelve get a worse call.",
        ST["why"]))

    for head, items in SECTIONS:
        flow.append(Paragraph(head, ST["sec"]))
        for q, w in items:
            flow.append(qa(q, w))

    flow.append(Paragraph("THE FORTNIGHTLY UPDATE, BY EMAIL, FIVE QUESTIONS", ST["sec"]))
    flow.append(Paragraph(
        "Never a call. Five questions in the body of the email, same thread every time, "
        "one reminder after five days and then stop.", ST["why"]))
    for i, q in enumerate(UPDATE, 1):
        flow.append(Paragraph("%d.&nbsp;&nbsp;%s" % (i, q), ST["q"]))
    flow.append(Spacer(1, 8))

    flow.append(Paragraph("RED FLAGS TO REPORT, NOT TO HIDE", ST["sec"]))
    for q, w in FLAGS:
        flow.append(qa(q, w))

    flow.append(Paragraph("THE TWO MONTHS", ST["sec"]))
    flow.append(table(PLAN, [24 * mm, 68 * mm, 80 * mm]))

    flow.append(Paragraph("THE PAGE THAT RENEWS THE CONTRACT", ST["sec"]))
    flow.append(Paragraph(COHORT_PAGE, ST["lead"]))

    doc.build(flow)
    print("SCRIPT: %s" % OUT)


if __name__ == "__main__":
    build()
