# -*- coding: utf-8 -*-
"""
The sales deck for an investor evaluating Deal Watch.

Eight slides. The Zenefits deck this was benchmarked against runs to seven,
and length is a cost: every slide past the point of decision is a slide the
reader stops on. The workflow that used to take five pages is now one strip
of four thumbnails, because the sequence is the point, not each screen.

Written in outcomes throughout. What we do internally is our problem, so
there is no line anywhere about reading anyone's documents.

Screenshots live in scripts/bootcamp/shots/ and are picked up by filename.
Drop one in, re-run, and it lands on its slide. Anything missing renders as a
labelled placeholder so the deck is always presentable.

  01_email.png        the deck arriving in Gmail
  02_deck_watch.png   the deck open, with Add to Watchlist
  03_note.png         the note dialog
  04_watchlist.png    the watchlist
  05_report_page.png  the brief itself, cropped out of the viewer

  python scripts/bootcamp/make_sales_deck.py            no recipient named
  python scripts/bootcamp/make_sales_deck.py "Ravi Menon"   names one
"""

import os
import sys

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "shots")
OUT = os.path.join(os.path.expanduser("~"), "Desktop", "om",
                   "VentureThrust_Sales_Deck.pptx")

# The live demo report. Set this and the deck carries a clickable link under
# the brief, so a reader can go from one page to the real thing.
REPORT_LINK = os.environ.get(
    "VT_REPORT_LINK",
    "https://venturethrust.com/shared/0c4126bb89e54760bca1646ef9fc1d6a")

NAVY = RGBColor(0x0D, 0x1B, 0x3E)
INK = RGBColor(0x0F, 0x17, 0x29)
CRIMSON = RGBColor(0x8B, 0x1E, 0x2D)
MUTED = RGBColor(0x0F, 0x17, 0x29)   # was grey; nothing is dimmed now
RULE = RGBColor(0xD8, 0xDD, 0xE4)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
PALE = RGBColor(0xF4, 0xF6, 0xF9)

W, H = Inches(13.333), Inches(7.5)
L = Inches(0.9)
CW = Inches(11.53)


def box(slide, x, y, w, h):
    tf = slide.shapes.add_textbox(x, y, w, h).text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    return tf


def para(tf, text, size, color, bold=False, first=False, after=0, before=0,
         line=None, align=PP_ALIGN.LEFT, italic=False, link=None):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_after = Pt(after)
    p.space_before = Pt(before)
    if line:
        p.line_spacing = line
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    r.font.name = "Calibri"
    if link:
        r.hyperlink.address = link
    return p


def rect(slide, x, y, w, h, fill, line=None):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line:
        s.line.color.rgb = line
        s.line.width = Pt(0.75)
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    return s


def chrome(slide, n, kicker=None):
    rect(slide, L, Inches(6.92), CW, Pt(0.75), RULE)
    tf = box(slide, L, Inches(7.02), Inches(8), Inches(0.3))
    para(tf, "VentureThrust  ·  Deal Watch", 9, MUTED, first=True)
    tf2 = box(slide, Inches(11.6), Inches(7.02), Inches(0.85), Inches(0.3))
    para(tf2, str(n), 9, MUTED, first=True, align=PP_ALIGN.RIGHT)
    if kicker:
        # Read from across a room, so it carries the section on its own rather
        # than sitting under the headline as a caption.
        t = box(slide, L, Inches(0.52), CW, Inches(0.36))
        para(t, kicker.upper(), 15, CRIMSON, bold=True, first=True)


def head(slide, title, y=Inches(0.98), size=30, sub=None, sub_size=15):
    tf = box(slide, L, y, CW, Inches(0.9))
    para(tf, title, size, NAVY, bold=True, first=True, line=1.05)
    if sub:
        t2 = box(slide, L, y + Inches(0.6), CW, Inches(0.5))
        para(t2, sub, sub_size, MUTED, first=True, line=1.3)


def shot(slide, filename, x, y, w, h):
    """Letterbox a screenshot into the box, or draw a labelled placeholder."""
    path = os.path.join(SHOTS, filename)
    if os.path.exists(path):
        iw, ih = Image.open(path).size
        scale = min(w / iw, h / ih)
        dw, dh = int(iw * scale), int(ih * scale)
        dx, dy = x + int((w - dw) / 2), y + int((h - dh) / 2)
        slide.shapes.add_picture(path, dx, dy, dw, dh)
        rect(slide, dx, dy, dw, Pt(0.75), RULE)
        return True
    rect(slide, x, y, w, h, PALE, RULE)
    tf = box(slide, x, y + int(h / 2) - Inches(0.3), w, Inches(0.6))
    para(tf, "screenshot", 11, MUTED, first=True, align=PP_ALIGN.CENTER)
    para(tf, filename, 9, MUTED, align=PP_ALIGN.CENTER, italic=True)
    return False


def bullets(slide, items, top=Inches(2.35), size=16.5, gap=13, width=CW):
    tf = box(slide, L, top, width, Inches(4.2))
    for i, it in enumerate(items):
        if isinstance(it, tuple):
            lead, rest = it
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.space_after = Pt(gap)
            p.line_spacing = 1.25
            r = p.add_run(); r.text = lead + "  "
            r.font.size = Pt(size); r.font.bold = True
            r.font.color.rgb = INK; r.font.name = "Calibri"
            r2 = p.add_run(); r2.text = rest
            r2.font.size = Pt(size); r2.font.color.rgb = MUTED; r2.font.name = "Calibri"
        else:
            para(tf, it, size, INK, first=(i == 0), after=gap, line=1.25)
    return tf


def strip(slide, files, captions, top=Inches(2.6), h=Inches(1.5)):
    """Four thumbnails in a row. The sequence is the message, not each screen."""
    count = len(files)
    gap = Inches(0.3)
    w = int((CW - gap * (count - 1)) / count)
    for i, (f, (num, cap)) in enumerate(zip(files, captions)):
        x = L + i * (w + gap)
        shot(slide, f, x, top, w, h)
        tf = box(slide, x, top + h + Inches(0.28), w, Inches(1.2))
        para(tf, num, 10.5, CRIMSON, bold=True, first=True, after=5)
        para(tf, cap, 13, INK, line=1.3)


def build(network=""):
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    blank = prs.slide_layouts[6]
    n = 0

    # 1 ── Cover ───────────────────────────────────────────────────────────
    # The first line says what the buyer gets. A B2B reader will not decode a
    # clever hook, so value is the headline and mechanism is demoted.
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, Inches(0.42), H, NAVY)
    tf = box(s, Inches(1.35), Inches(1.55), Inches(10.6), Inches(3.2))
    para(tf, "DEAL WATCH", 12.5, CRIMSON, bold=True, first=True, after=18)
    # "for now" is the whole scope of the product. An investor who passed
    # because the business is wrong never wants to hear about it again; this is
    # only for the pile that was a no on timing.
    para(tf, "Never lose track of the startups", 42, NAVY, bold=True, after=0, line=0.92)
    para(tf, "you passed on for now.", 42, NAVY, bold=True, after=22, line=0.92)
    para(tf, "Not every no is forever. You hear from us the day the reason you said "
             "no is no longer true.", 17.5, MUTED, line=1.35)

    rect(s, Inches(1.35), Inches(4.62), Inches(10.6), Pt(0.75), RULE)
    colw = Inches(3.53)
    for i, (a, b) in enumerate([
        ("Deal flow you already own", "No new sourcing. Companies you met and said not yet to."),
        ("One click to start", "Nothing about how you work changes."),
        ("Silence by default", "Most months you hear nothing, and that is the point."),
    ]):
        x = Inches(1.35) + i * colw
        if i:
            rect(s, x - Inches(0.16), Inches(4.85), Pt(0.75), Inches(0.86), RULE)
        t = box(s, x, Inches(4.88), colw - Inches(0.35), Inches(1.0))
        para(t, a, 13.5, NAVY, bold=True, first=True, after=5)
        para(t, b, 11.5, MUTED, line=1.3)

    rect(s, Inches(1.35), Inches(6.08), Inches(10.6), Pt(0.75), RULE)
    tf2 = box(s, Inches(1.35), Inches(6.32), Inches(10.6), Inches(0.9))
    # Only name a recipient when one was actually given. A generic
    # "prepared for your network" reads like a template and also assumes who
    # is reading, which we never know once a deck is forwarded.
    if network:
        para(tf2, "Prepared for %s" % network, 14.5, INK, bold=True, first=True, after=4)
        para(tf2, "Omprakash Borkar  ·  VentureThrust  ·  venturethrust.com", 12.5, MUTED)
    else:
        para(tf2, "Omprakash Borkar  ·  VentureThrust", 14.5, INK, bold=True,
             first=True, after=4)
        para(tf2, "omprakash@venturethrust.com  ·  venturethrust.com", 12.5, MUTED)

    # 2 ── The gap ─────────────────────────────────────────────────────────
    n += 1; s = prs.slides.add_slide(blank); chrome(s, n, "The gap")
    head(s, "An investor says no once, and then goes blind")
    bullets(s, [
        ("The no is usually right.", "Too early, wrong economics, no clearance yet."),
        ("The startup keeps building anyway.", "Six months later the reason for the no is gone."),
        ("Nobody tells the investor.", "The news arrives as a funding announcement, at a higher price."),
        ("So the second look never happens.", "Not because the deal got worse, but because nobody was watching."),
    ], top=Inches(2.25))
    rect(s, L, Inches(5.6), CW, Pt(0.75), RULE)
    tf = box(s, L, Inches(5.85), CW, Inches(0.9))
    para(tf, "An active investor passes on dozens of startups a year. "
             "Not one of them is being watched.", 17, NAVY, bold=True, first=True, line=1.3)

    # 3 ── The difference ──────────────────────────────────────────────────
    # Both columns are outcomes for the reader. Nothing about our machinery.
    n += 1; s = prs.slides.add_slide(blank); chrome(s, n, "The difference")
    head(s, "The same startup, with and without us")
    mid = Inches(6.66)
    rect(s, mid, Inches(2.15), Pt(0.75), Inches(4.1), RULE)
    colw2 = Inches(5.3)

    tf = box(s, L, Inches(2.15), colw2, Inches(0.4))
    para(tf, "TODAY", 12, MUTED, bold=True, first=True)
    tf = box(s, L, Inches(2.65), colw2, Inches(3.6))
    for i, ln in enumerate([
        "You pass on a startup, and it leaves your world.",
        "It keeps building. Nobody tells you.",
        "You hear about it from a funding announcement.",
        "By then the price is set by somebody else.",
        "The relationship you had is worth nothing.",
    ]):
        para(tf, ln, 15, MUTED, first=(i == 0), after=17, line=1.3)

    tf = box(s, mid + Inches(0.42), Inches(2.15), colw2, Inches(0.4))
    para(tf, "WITH DEAL WATCH", 12, CRIMSON, bold=True, first=True)
    tf = box(s, mid + Inches(0.42), Inches(2.65), colw2, Inches(3.6))
    for i, ln in enumerate([
        "You pass, and note why, in one click.",
        "It is watched from that moment on.",
        "You hear the day your own condition is met.",
        "You are early again, at a price nobody has set.",
        "The relationship you had is why you get the call.",
    ]):
        para(tf, ln, 15, INK, bold=(i in (2, 3)), first=(i == 0), after=17, line=1.3)

    # 4 ── The whole flow on one page ──────────────────────────────────────
    n += 1; s = prs.slides.add_slide(blank); chrome(s, n, "How it works")
    head(s, "Four clicks, on the deck the investor already has",
         sub="No new inbox, no new login, no process for anyone to adopt.")
    # Name the role in every step. A reader who has to work out who "they" is
    # stops reading the flow and starts decoding the sentence.
    strip(s,
          ["01_email.png", "02_deck_watch.png", "03_note.png", "04_watchlist.png"],
          [("STEP 1", "The founder emails the deck, exactly as today."),
           ("STEP 2", "Add to Watchlist sits on the page the investor is reading."),
           ("STEP 3", "The investor notes the reason for passing. Optional."),
           ("STEP 4", "It sits on the investor watchlist. Nothing else to do.")],
          top=Inches(2.75))

    # 5 ── The brief ───────────────────────────────────────────────────────
    n += 1; s = prs.slides.add_slide(blank); chrome(s, n, "The deliverable")
    head(s, "Then this arrives, and only when it should",
         sub="Not on a schedule. Only when the reason you passed stops being true.")
    shot(s, "05_report_page.png", L, Inches(2.2), Inches(4.4), Inches(4.55))

    tx, tw = Inches(5.9), Inches(6.7)
    tf = box(s, tx, Inches(2.3), tw, Inches(3.9))
    for i, (a, b) in enumerate([
        ("Why you are getting this", "Quoted from the note you wrote when you passed."),
        ("Then versus now", "The same metrics, at the pass and today, arithmetic shown."),
        ("What changed and what did not", "Durable drivers separated from seasonal luck."),
        ("What we would still watch", "The thing that could still go wrong."),
    ]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(3); p.line_spacing = 1.2
        r = p.add_run(); r.text = a
        r.font.size = Pt(15.5); r.font.bold = True; r.font.color.rgb = INK
        r.font.name = "Calibri"
        p2 = tf.add_paragraph(); p2.space_after = Pt(15); p2.line_spacing = 1.25
        r2 = p2.add_run(); r2.text = b
        r2.font.size = Pt(13.5); r2.font.color.rgb = MUTED; r2.font.name = "Calibri"

    rect(s, tx, Inches(5.55), tw, Pt(0.75), RULE)
    tf2 = box(s, tx, Inches(5.8), tw, Inches(1.1))
    para(tf2, "Every brief ends: we explain, you decide.", 15.5, CRIMSON,
         bold=True, first=True, after=10)

    # The whole brief is three pages. Rather than describe it, link to it, so
    # the reader can go from this page straight to the real thing.
    if REPORT_LINK:
        para(tf2, "Read the full report here", 15, NAVY, bold=True,
             after=3, link=REPORT_LINK)
        para(tf2, REPORT_LINK, 10.5, NAVY, link=REPORT_LINK)

    # 6 ── What they can rely on ───────────────────────────────────────────
    # Guarantees, not a description of how the machine works.
    n += 1; s = prs.slides.add_slide(blank); chrome(s, n, "What you can rely on")
    head(s, "High tech, and high touch")
    tf = box(s, L, Inches(2.25), CW, Inches(2.6))
    for i, (a, b) in enumerate([
        ("Nothing is missed.",
         "Every watched startup is monitored continuously, not reviewed when somebody remembers."),
        ("Nothing is noise.",
         "Everything is measured against the note you wrote, not against general news."),
        ("Nothing reaches you unread.",
         "A person signs off on every brief. One useless alert and you stop reading the next one."),
    ]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(17); p.line_spacing = 1.3
        r = p.add_run(); r.text = a + "  "
        r.font.size = Pt(17); r.font.bold = True; r.font.color.rgb = CRIMSON
        r.font.name = "Calibri"
        r2 = p.add_run(); r2.text = b
        r2.font.size = Pt(17); r2.font.color.rgb = MUTED; r2.font.name = "Calibri"

    rect(s, L, Inches(5.45), CW, Pt(0.75), RULE)
    tf = box(s, L, Inches(5.7), CW, Inches(1.0))
    para(tf, "The founder consents to all of it.", 16, INK, bold=True, first=True, after=6)
    para(tf, "The startup keeps its data room on VentureThrust and controls what is shared.",
         14.5, MUTED, line=1.3)

    # 7 ── The ask ─────────────────────────────────────────────────────────
    # No pricing anywhere. The only thing being asked for is three names, and
    # a price on the page turns a free trial into a purchase decision.
    n += 1; s = prs.slides.add_slide(blank); chrome(s, n, "How to start")
    head(s, "Send three names. Get three reports. Free.", size=34, sub_size=18,
         sub="Startups you passed on in the last year. We will show you where they are now.")

    # This is the slide someone acts on, so it is set larger than the rest.
    # Titles are kept to one line each: at this size a wrapped title pushes the
    # description into the rule below it.
    steps = [
        ("1", "You send three names",
         "Ones you passed on for timing, not because the business was wrong."),
        ("2", "We check where they are",
         "Revenue, customers, funding, milestones. What changed since you passed."),
        ("3", "You get three briefs",
         "Inside a week. Written exactly as the one you just saw, free."),
    ]
    colw3 = int(CW / 3)
    for i, (num, title, desc) in enumerate(steps):
        x = L + i * colw3
        if i:
            rect(s, x - Inches(0.18), Inches(2.4), Pt(0.75), Inches(2.5), RULE)
        rect(s, x, Inches(2.35), Inches(0.66), Inches(0.66), NAVY)
        tn = box(s, x, Inches(2.47), Inches(0.66), Inches(0.48))
        para(tn, num, 24, WHITE, bold=True, first=True, align=PP_ALIGN.CENTER)
        tf = box(s, x, Inches(3.3), Emu(colw3 - Inches(0.3)), Inches(2.0))
        para(tf, title, 22, NAVY, bold=True, first=True, after=10, line=1.15)
        para(tf, desc, 18, MUTED, line=1.3)

    rect(s, L, Inches(5.35), CW, Pt(0.75), RULE)
    tf = box(s, L, Inches(5.65), CW, Inches(1.4))
    para(tf, "If none of the three are worth a second look, you have lost nothing.",
         22, INK, first=True, after=22, line=1.3)
    para(tf, "Omprakash Borkar  ·  omprakash@venturethrust.com  ·  venturethrust.com",
         18, NAVY, bold=True)

    os.makedirs(SHOTS, exist_ok=True)
    prs.save(OUT)

    needed = ["01_email.png", "02_deck_watch.png", "03_note.png",
              "04_watchlist.png", "05_report_page.png"]
    missing = [f for f in needed if not os.path.exists(os.path.join(SHOTS, f))]
    print("DECK:  %s" % OUT)
    print("slides: %d" % len(prs.slides._sldIdLst))
    if missing:
        print("need:  %s" % ", ".join(missing))
    if not REPORT_LINK:
        print("note:  set VT_REPORT_LINK to add the clickable report link")
    return OUT


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "")
