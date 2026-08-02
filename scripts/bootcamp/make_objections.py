# -*- coding: utf-8 -*-
"""
Every question they can throw at you tomorrow, and the answer, short.

Rule for using this: the answer in bold is what you say out loud. The line
under it is only there if they push. Never say both at once.

  python scripts/bootcamp/make_objections.py
"""

import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, KeepTogether,
)

OUT = os.path.join(os.path.expanduser("~"), "Desktop", "om",
                   "VentureThrust_Bootcamp_Objections.pdf")

NAVY = colors.HexColor("#0D1B3E")
CRIMSON = colors.HexColor("#8B1E2D")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6B7280")
RULE = colors.HexColor("#D1D5DB")


ST = {
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=21, leading=25,
                         textColor=NAVY, spaceAfter=3),
    "sub": ParagraphStyle("sub", fontName="Helvetica-Oblique", fontSize=10.5,
                          leading=14, textColor=MUTED, spaceAfter=16),
    "sec": ParagraphStyle("sec", fontName="Helvetica-Bold", fontSize=10,
                          leading=13, textColor=CRIMSON, spaceBefore=16,
                          spaceAfter=8),
    "q": ParagraphStyle("q", fontName="Helvetica-Bold", fontSize=12,
                        leading=15.5, textColor=NAVY, spaceAfter=5),
    "a": ParagraphStyle("a", fontName="Helvetica-Bold", fontSize=11,
                        leading=15.5, textColor=INK, spaceAfter=4),
    "note": ParagraphStyle("note", fontName="Helvetica", fontSize=10,
                           leading=14, textColor=MUTED, spaceAfter=13),
    "lead": ParagraphStyle("lead", fontName="Helvetica", fontSize=11,
                           leading=15.5, textColor=INK, spaceAfter=9),
}


class Doc(BaseDocTemplate):
    def __init__(self, path):
        BaseDocTemplate.__init__(
            self, path, pagesize=A4,
            leftMargin=20 * mm, rightMargin=20 * mm,
            topMargin=24 * mm, bottomMargin=18 * mm,
            title="Bootcamp objection handling", author="VentureThrust")
        f = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="b")
        self.addPageTemplates([PageTemplate(id="s", frames=[f], onPage=self._chrome)])

    def _chrome(self, c, d):
        w, h = A4
        c.saveState()
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(NAVY)
        c.drawString(20 * mm, h - 15 * mm, "VENTURETHRUST")
        c.setFont("Helvetica", 8.5)
        c.setFillColor(MUTED)
        c.drawRightString(w - 20 * mm, h - 15 * mm,
                          "IIMK LIVE IDEA VAULT  ·  3 and 4 August 2026")
        c.setStrokeColor(RULE)
        c.setLineWidth(0.6)
        c.line(20 * mm, h - 18 * mm, w - 20 * mm, h - 18 * mm)
        c.line(20 * mm, 14 * mm, w - 20 * mm, 14 * mm)
        c.setFont("Helvetica", 8)
        c.drawString(20 * mm, 10 * mm,
                     "Bold line is what you say. The line under it is only if they push.")
        c.drawRightString(w - 20 * mm, 10 * mm, "Page %d" % c.getPageNumber())
        c.restoreState()


def qa(q, a, note=None):
    parts = [Paragraph(q, ST["q"]), Paragraph(a, ST["a"])]
    if note:
        parts.append(Paragraph(note, ST["note"]))
    else:
        parts.append(Spacer(1, 8))
    return KeepTogether(parts)


BLOCKS = [
    ("THE ONE THEY WILL ALL ASK", [
        ("I passed on that startup for a reason. Why would I want to look at it again?",
         "Because you did not reject the company. You rejected the company at that moment.",
         "Then give the example back to them: you said no because there was no regulatory "
         "clearance, or the margin was negative, or there was one customer. That is a "
         "condition, not a verdict. My product watches the condition, not the company. "
         "The day the condition changes I tell you, and you are still free to say no again."),

        ("If the deal is good, it will find me anyway. Good companies do not stay hidden.",
         "The good ones find you at the new price. I am offering the old one.",
         "By the time a startup is visible again it has a lead, a term sheet and a valuation "
         "set by somebody else. The window where your original relationship is worth "
         "something is before that, and it is short."),

        ("The founder will just come back to me himself when he is doing well.",
         "Founders do not go back to the people who said no. They go forward.",
         "Ask them honestly whether a founder they rejected has ever come back to them "
         "unprompted with good news. Almost nobody has that story."),
    ]),

    ("ON THE PRODUCT", [
        ("Is this not just a Google Alert?",
         "An alert tells you a name appeared in the news. I tell you a number crossed the "
         "line you drew.",
         "Alerts fire on press coverage, which is the last thing to happen. I read the "
         "documents inside the data room, which is the first."),

        ("How do you get the startup's data? Is this legal?",
         "The founder is on my platform and gives consent. I never take anything from "
         "outside it.",
         "The startup uses VentureThrust as its data room. When it updates a document my "
         "system sees the change. What is shared with an investor is only what the founder "
         "has agreed to share. No scraping and nothing behind anybody's back."),

        ("What if the founder does not want the investor who rejected him to keep watching?",
         "Then he switches it off, and the investor hears nothing. The founder holds that "
         "control.",
         "In practice founders want it on. Being watched by someone who already knows the "
         "business is a warm second meeting, not a cold first one."),

        ("Why do you need a human? Should this not be fully automated?",
         "Because the cost of a wrong alert is that you stop reading the next one.",
         "The software catches the change and the AI reads it, but a person confirms before "
         "anything is sent. One useless brief and I have lost the investor for good."),

        ("What stops an investor doing this himself with a spreadsheet and a calendar?",
         "Nothing stops him. He just never does it.",
         "Every investor already knows he should follow up on passes. The reason it does not "
         "happen is that it is nobody's job on a Tuesday afternoon."),
    ]),

    ("ON THE BUSINESS", [
        ("There is no direct competitor. Does that not mean nobody wants this?",
         "The adjacent products all serve the founder. I am the first one pointed at the "
         "investor.",
         "DocSend, Papermark and the rest sell to the person sending documents. Deal "
         "sourcing tools sell databases of companies you have never met. Nobody sells the "
         "investor a second look at the companies he already met."),

        ("Who exactly is your first customer?",
         "The solo angel and the small network. Not the large fund.",
         "A large fund has an analyst whose job is partly this. A solo angel writing four "
         "cheques a year has nobody, and passes on fifty startups to write those four."),

        ("How big can this get?",
         "A hundred angels in one network is one and a half crore a year. There are hundreds "
         "of networks.",
         "Do not reach for a global number. Give them the arithmetic of the room they "
         "personally run and let them do the multiplication."),

        ("Why will this not be copied the moment it works?",
         "The software is copyable. The archive of why each investor said no is not.",
         "Every note an investor writes makes the next brief sharper and makes leaving more "
         "expensive. That compounds, and it cannot be bought."),

        ("You are one person. What happens when you get ten customers?",
         "At ten customers I am still the account manager, and that is the right answer.",
         "The human review is the product at this size. I will hire the second manager at "
         "the point where reading is taking more than a day a week, not before."),
    ]),

    ("ON YOU", [
        ("You have no paying customers. Why should I take this seriously?",
         "Because I am not asking you to buy. I am asking for three names.",
         "Say the zero out loud before they find it. Then move immediately to the ask so the "
         "conversation does not sit on the weakness."),

        ("You are not from this ecosystem and you have no network. How will you sell?",
         "That is exactly why I am sitting in front of you.",
         "Do not defend it. Turn it into the reason the conversation is happening."),

        ("Why are you the person to build this?",
         "I built the whole thing myself, and I found the problem by being told no.",
         "The product exists and works today. That is the credential in this room, not the "
         "CV."),
    ]),

    ("IF THEY GO QUIET, ASK THESE", [
        ("To PK Gopalakrishnan",
         "Would Malabar Angel Network pilot this for its members?",
         "He co-founded a hundred member network and teaches angel investing. Sell the "
         "network, never the single seat. Close with the three free briefs."),

        ("To Ajayan K Anat",
         "If you and PKG both find this useful, how does it get in front of Malabar members?",
         "His frame is regional. Lead with Kerala startups getting written off after one "
         "badly timed meeting, not with your revenue."),

        ("To Ashish Ranjan",
         "Is the investor the right side of this market to sell first, or am I wrong?",
         "He is running the product market fit workshop. Ask him for the judgement, not for "
         "money. It is the most flattering question you can ask a workshop leader."),

        ("To Ashutosh Vikram, on Day 2",
         "How many investors passed on Ninjacart early and then wanted in later at a much "
         "higher price?",
         "He will have the story. That story is your product told in his own voice, and he "
         "sits on the IIMK LIVE investment committee."),
    ]),
]


LEAD = (
    "Tomorrow is not a pitch. It is three one to one conversations and one workshop where "
    "you can ask a question in front of the room. Your job in each is to get them talking "
    "about the startups they said no to. The moment they tell you one of those stories, you "
    "have already won the meeting, because the story is the product."
)


def build():
    doc = Doc(OUT)
    flow = [
        Paragraph("Objection handling", ST["h1"]),
        Paragraph("IDEA VAULT Bootcamp, IIM Kozhikode, 3 and 4 August 2026", ST["sub"]),
        Paragraph(LEAD, ST["lead"]),
    ]
    for head, items in BLOCKS:
        flow.append(Paragraph(head, ST["sec"]))
        for q, a, *rest in items:
            flow.append(qa(q, a, rest[0] if rest else None))
    doc.build(flow)
    print("OBJECTIONS: %s" % OUT)


if __name__ == "__main__":
    build()
