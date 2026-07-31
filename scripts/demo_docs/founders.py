# -*- coding: utf-8 -*-
"""
Create the demo founder accounts.

  python scripts/demo_docs/founders.py          create or reuse
  python scripts/demo_docs/founders.py --purge  delete them again

profiles.id is foreign keyed to auth.users, so a data room can only show a
distinct sender email if a real auth user owns it. These ten exist purely to
carry an email address on a demo data room:

  * a long random password nobody holds,
  * email already confirmed, so no mail is ever sent,
  * banned for 100 years, so sign in is refused outright.

They are data, not accounts anyone can use. --purge removes them completely.
"""

import os
import secrets
import sys
from datetime import datetime, timedelta, timezone

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import env                # noqa: E402
from profiles import ALL_PROFILES    # noqa: E402

e = env()
BASE = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = e["SUPABASE_SERVICE_ROLE_KEY"]
AUTH = {"Authorization": "Bearer %s" % KEY, "apikey": KEY,
        "Content-Type": "application/json"}
REST = dict(AUTH, Prefer="return=representation")

BAN_FOREVER = "876000h"   # 100 years

# isPlanActive treats a missing expiry as lapsed, so this has to be a real date.
PLAN_EXPIRY = (datetime.now(timezone.utc) + timedelta(days=730)).isoformat()


def find(email):
    r = requests.get("%s/auth/v1/admin/users?page=1&per_page=200" % BASE,
                     headers=AUTH, timeout=60)
    r.raise_for_status()
    for u in r.json().get("users", []):
        if (u.get("email") or "").lower() == email.lower():
            return u["id"]
    return None


def create(p):
    email = p["founder_email"]
    uid = find(email)
    if uid:
        action = "reused"
    else:
        r = requests.post("%s/auth/v1/admin/users" % BASE, headers=AUTH, timeout=60, json={
            "email": email,
            "password": secrets.token_urlsafe(48),
            "email_confirm": True,
            "user_metadata": {
                "full_name": p["founders"][0][0],
                "company": p["name"],
                "demo_seed": True,
            },
        })
        if r.status_code not in (200, 201):
            print("  FAILED %-38s %s %s" % (email, r.status_code, r.text[:200]))
            return None
        uid = r.json()["id"]
        action = "created"

    # Refuse sign in. These carry an email address, nothing else.
    requests.put("%s/auth/v1/admin/users/%s" % (BASE, uid), headers=AUTH, timeout=60,
                 json={"ban_duration": BAN_FOREVER})

    # The profile row is what Shared with me reads the sender email from.
    #
    # It also needs a live plan. The space viewer asks whether the room owner's
    # plan is still active and shows "This link is no longer active" if it is
    # not, which is right in production and wrong here: a founder who really
    # shared a data room on VentureThrust is a paying founder.
    #
    # Only columns that exist. PostgREST rejects the whole patch if one column
    # is unknown, so an extra field here silently loses the plan as well.
    r = requests.patch("%s/rest/v1/profiles?id=eq.%s" % (BASE, uid), headers=REST, timeout=60,
                       json={
                           "email": email,
                           "plan": "vdr_only",
                           "plan_status": "active",
                           "plan_expires_at": PLAN_EXPIRY,
                       })
    if r.status_code not in (200, 204):
        print("  PROFILE PATCH FAILED %-30s %s %s" % (email, r.status_code, r.text[:200]))
        return uid

    print("  %-8s %-38s %s" % (action, email, p["name"]))
    return uid


def purge():
    for p in ALL_PROFILES:
        uid = find(p["founder_email"])
        if not uid:
            print("  absent   %s" % p["founder_email"])
            continue
        r = requests.delete("%s/auth/v1/admin/users/%s" % (BASE, uid), headers=AUTH, timeout=60)
        print("  %-8s %s" % ("deleted" if r.status_code in (200, 204) else str(r.status_code),
                             p["founder_email"]))


if __name__ == "__main__":
    if "--purge" in sys.argv:
        print("Deleting demo founder accounts")
        purge()
    else:
        print("Creating demo founder accounts (sign in blocked)")
        for prof in ALL_PROFILES:
            create(prof)
