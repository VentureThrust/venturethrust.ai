# -*- coding: utf-8 -*-
"""Render a few generated pages to PNG so they can be eyeballed."""
import os
import sys
import fitz

OUT = sys.argv[1]
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

JOBS = [
    ("anvaya-ai", "Anvaya Pitch Deck.pdf", [0, 3]),
    ("anvaya-ai", "Quality Benchmark Report.pdf", [0]),
    ("thooval-studios", "One Pager.pdf", [0]),
    ("metricon-interconnect", "Quality and PPAP Record.pdf", [0]),
]

for slug, name, pages in JOBS:
    doc = fitz.open(os.path.join(BASE, slug, name))
    for pi in pages:
        pix = doc[pi].get_pixmap(dpi=100)
        fn = os.path.join(OUT, "%s__%s__p%d.png" % (slug, name.replace(".pdf", ""), pi))
        pix.save(fn)
        print(fn, "of", doc.page_count, "pages")
