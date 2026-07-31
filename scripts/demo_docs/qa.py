# -*- coding: utf-8 -*-
"""Render a few generated pages to PNG so they can be eyeballed."""
import os
import sys
import fitz

OUT = sys.argv[1]
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

JOBS = [
    ("nellara-agrichain", "Nellara Pitch Deck v5.pdf", [0, 4]),
    ("nellara-agrichain", "One Pager.pdf", [0]),
    ("zylo-health", "Clinical Validation Summary.pdf", [0]),
    ("voltaneer", "Sensor Spec Sheet.pdf", [0]),
    ("kadal-systems", "Founders.pdf", [0]),
]

for slug, name, pages in JOBS:
    doc = fitz.open(os.path.join(BASE, slug, name))
    for pi in pages:
        pix = doc[pi].get_pixmap(dpi=100)
        fn = os.path.join(OUT, "%s__%s__p%d.png" % (slug, name.replace(".pdf", ""), pi))
        pix.save(fn)
        print(fn, "of", doc.page_count, "pages")
