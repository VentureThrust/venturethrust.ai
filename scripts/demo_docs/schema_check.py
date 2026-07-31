# -*- coding: utf-8 -*-
"""
Can a space be owned by a profile that has no auth.users row?

If yes, the demo founders can be plain profile rows and no login capable
accounts need to exist. Everything this writes is deleted again before exit.
"""
import os
import sys
import uuid
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import env  # noqa: E402

e = env()
BASE = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = e["SUPABASE_SERVICE_ROLE_KEY"]
H = {"Authorization": "Bearer %s" % KEY, "apikey": KEY,
     "Content-Type": "application/json", "Prefer": "return=representation"}

fake = str(uuid.uuid4())
made_profile = made_space = False

try:
    r = requests.post("%s/rest/v1/profiles" % BASE, json={
        "id": fake, "email": "schema.probe@example.invalid",
    }, headers=H, timeout=60)
    print("profile insert:", r.status_code, r.text[:400])
    made_profile = r.status_code in (200, 201)

    if made_profile:
        sid = str(uuid.uuid4())
        r = requests.post("%s/rest/v1/spaces" % BASE, json={
            "id": sid, "name": "Schema probe", "title": "Schema probe",
            "created_by": fake,
        }, headers=H, timeout=60)
        print("space insert:  ", r.status_code, r.text[:400])
        made_space = r.status_code in (200, 201)
        if made_space:
            requests.delete("%s/rest/v1/spaces?id=eq.%s" % (BASE, sid), headers=H, timeout=60)
finally:
    if made_profile:
        requests.delete("%s/rest/v1/profiles?id=eq.%s" % (BASE, fake), headers=H, timeout=60)
    print("cleaned up")
