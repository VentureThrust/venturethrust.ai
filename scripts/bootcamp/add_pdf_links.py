# -*- coding: utf-8 -*-
"""
Put the clickable link back into the exported PDF.

PowerPoint's SaveAs to PDF drops hyperlinks, and ExportAsFixedFormat is
awkward to drive over COM from PowerShell. Rather than fight that, the link
is re-attached here: find the anchor text on the page and lay a link
annotation over its rectangle.

  python scripts/bootcamp/add_pdf_links.py
"""

import os
import sys

import fitz

PDF = os.path.join(os.path.expanduser("~"), "Desktop", "om",
                   "VentureThrust_Sales_Deck.pdf")
URL = os.environ.get(
    "VT_REPORT_LINK",
    "https://venturethrust.com/shared/0c4126bb89e54760bca1646ef9fc1d6a")
DEMO = os.environ.get(
    "VT_DEMO_LINK",
    "mailto:omprakash@venturethrust.com?subject=Deal%20Watch%20demo")

# Anchor text -> where it goes. Each one is searched on every page.
ANCHORS = [
    ("Read the full report here", URL),
    (URL, URL),
    ("Or see it working first: book a fifteen minute demo", DEMO),
    ("Or see it working first: email me for a fifteen minute demo", DEMO),
]


def main(path=PDF):
    doc = fitz.open(path)
    added = 0
    for page in doc:
        for anchor, uri in ANCHORS:
            for rect in page.search_for(anchor):
                page.insert_link({"kind": fitz.LINK_URI, "from": rect, "uri": uri})
                added += 1
    if not added:
        print("WARNING: no anchor text found, no links added")
        return 1
    doc.saveIncr()
    doc.close()

    # Read it back and prove the annotations are really there.
    check = fitz.open(path)
    live = [(p.number + 1, l["uri"]) for p in check for l in p.get_links() if l.get("uri")]
    for n, u in live:
        print("slide %d -> %s" % (n, u))
    print("%d clickable link(s) in the PDF" % len(live))
    return 0 if live else 1


if __name__ == "__main__":
    sys.exit(main())
