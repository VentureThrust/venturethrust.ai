# -*- coding: utf-8 -*-
"""
Pull the workflow screenshots out of the Windows screenshots folder, trim the
desktop furniture, and drop them into shots/ under the names the deck expects.

The tab strip and the taskbar are cropped off. The address bar stays, because
venturethrust.com being visible is worth more than the extra tidiness.

  python scripts/bootcamp/import_shots.py
"""

import os
import shutil

from PIL import Image

# The report screenshot is mostly PDF viewer chrome. The document itself is a
# tall white page in the middle, and that is what belongs on the slide.
REPORT_PAGE_CROP = (585, 140, 1320, 1080)

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "shots")
SRC = os.path.join(os.path.expanduser("~"), "OneDrive", "Pictures", "Screenshots")

# source file, destination name, crop top, crop bottom
MAP = [
    # The Gmail shot is mostly empty below the Reply button, and dead space
    # forces the whole image small on the slide. Cut it at the content.
    ("Screenshot (837).png", "01_email.png",      48, 420),
    ("Screenshot (838).png", "02_deck_watch.png", 48,  50),
    ("Screenshot (839).png", "03_note.png",       48,  50),
    ("Screenshot (840).png", "04_watchlist.png",  48,  50),
    ("Screenshot (841).png", "05_report.png",      0,   0),
]


def main():
    os.makedirs(SHOTS, exist_ok=True)
    for src_name, dst_name, top, bottom in MAP:
        src = os.path.join(SRC, src_name)
        dst = os.path.join(SHOTS, dst_name)
        if not os.path.exists(src):
            print("  MISSING %s" % src_name)
            continue
        if top or bottom:
            im = Image.open(src)
            w, h = im.size
            im.crop((0, top, w, h - bottom)).save(dst)
            print("  %-22s -> %-20s cropped to %dx%d" % (src_name, dst_name, w, h - top - bottom))
        else:
            shutil.copyfile(src, dst)
            w, h = Image.open(dst).size
            print("  %-22s -> %-20s %dx%d" % (src_name, dst_name, w, h))

    # The report page on its own, for the two column slide.
    full = os.path.join(SHOTS, "05_report.png")
    if os.path.exists(full):
        page = Image.open(full).crop(REPORT_PAGE_CROP)
        page.save(os.path.join(SHOTS, "05_report_page.png"))
        print("  %-22s -> %-20s %dx%d"
              % ("05_report.png", "05_report_page.png", page.size[0], page.size[1]))


if __name__ == "__main__":
    main()
