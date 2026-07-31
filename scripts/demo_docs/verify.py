# -*- coding: utf-8 -*-
"""Confirm the uploaded objects are readable through a signed URL."""
import os
import sys
import urllib.parse
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import env, BUCKET  # noqa: E402
from manifest import MANIFEST  # noqa: E402

CHECK = ["demo/%s/%s" % (slug, entry[1])
         for slug, entries in MANIFEST.items() for entry in entries]

e = env()
base = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
key = e["SUPABASE_SERVICE_ROLE_KEY"]

bad = 0
for path in CHECK:
    r = requests.post(
        "%s/storage/v1/object/sign/%s/%s" % (base, BUCKET, urllib.parse.quote(path, safe="/")),
        json={"expiresIn": 600},
        headers={"Authorization": "Bearer %s" % key, "apikey": key},
        timeout=60)
    if r.status_code != 200:
        bad += 1
        print("SIGN FAILED  %-58s %s %s" % (path, r.status_code, r.text[:120]))
        continue
    url = base + "/storage/v1" + r.json()["signedURL"]
    g = requests.get(url, timeout=60)
    head = g.content[:4]
    ok = (head == b"%PDF" and path.endswith(".pdf")) or \
         (head[:2] == b"PK" and path.endswith(".xlsx"))
    if not ok:
        bad += 1
        print("BAD CONTENT  %-58s %s %r" % (path, g.status_code, head))

print("%d of %d objects serve correctly" % (len(CHECK) - bad, len(CHECK)))
