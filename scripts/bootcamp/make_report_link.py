# -*- coding: utf-8 -*-
"""
A permanent public link to the sample Deal Watch brief, for the sales deck.

Creates a small space owned by the manager account, puts the already uploaded
brief in it, and opens a share link with no email gate and no expiry. Anyone
who clicks the line in the deck reads the real report, no login, no form.

  python scripts/bootcamp/make_report_link.py
"""

import os
import sys
import uuid

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "demo_docs"))
from build import env  # noqa: E402

OWNER_EMAIL = "omprakash@venturethrust.com"
SPACE_NAME = "Deal Watch sample brief"
REPORT_PATH = "demo/reports/Nellara AgriChain - Priority brief - Jul 2026.pdf"
FILE_NAME = "VentureThrust Deal Watch sample brief.pdf"
SITE = "https://venturethrust.com"

e = env()
BASE = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = e["SUPABASE_SERVICE_ROLE_KEY"]
H = {"Authorization": "Bearer %s" % KEY, "apikey": KEY,
     "Content-Type": "application/json", "Prefer": "return=representation"}


def get(path):
    r = requests.get("%s/rest/v1/%s" % (BASE, path), headers=H, timeout=60)
    return r.json() if r.status_code == 200 else []


def post(table, payload):
    r = requests.post("%s/rest/v1/%s" % (BASE, table), headers=H,
                      json=payload, timeout=60)
    if r.status_code not in (200, 201):
        raise SystemExit("insert into %s failed: %s %s" % (table, r.status_code, r.text[:300]))
    return r.json()


def main():
    users = requests.get(
        "%s/auth/v1/admin/users?page=1&per_page=200" % BASE,
        headers={"Authorization": "Bearer %s" % KEY, "apikey": KEY}, timeout=60).json()
    owner = next((u["id"] for u in users.get("users", [])
                  if (u.get("email") or "").lower() == OWNER_EMAIL), None)
    if not owner:
        raise SystemExit("No auth user for %s" % OWNER_EMAIL)

    # Reuse the space if this has been run before, so the link is stable.
    existing = get("spaces?select=id&name=eq.%s&created_by=eq.%s"
                   % (requests.utils.quote(SPACE_NAME), owner))
    if existing:
        space_id = existing[0]["id"]
        for t in ("share_links", "files", "folders"):
            requests.delete("%s/rest/v1/%s?space_id=eq.%s" % (BASE, t, space_id),
                            headers=H, timeout=60)
    else:
        space_id = str(uuid.uuid4())
        post("spaces", {
            "id": space_id, "name": SPACE_NAME, "title": SPACE_NAME,
            "description": "A sample Deal Watch brief, shared publicly for the sales deck.",
            "created_by": owner,
        })

    folder_id = str(uuid.uuid4())
    post("folders", {"id": folder_id, "user_id": owner, "name": "Sample",
                     "space_id": space_id, "parent_id": None, "position": 1})

    file_id = str(uuid.uuid4())
    post("files", {
        "id": file_id, "user_id": owner, "folder_id": folder_id, "space_id": space_id,
        "name": FILE_NAME, "type": "PDF", "storage_path": REPORT_PATH,
        "size_bytes": 138417, "views": 0, "position": 1,
    })

    # No email gate and no expiry: a link in a deck has to open on the first
    # click or it does not get clicked at all.
    token = uuid.uuid4().hex
    post("share_links", {
        "id": str(uuid.uuid4()), "space_id": space_id, "file_id": file_id,
        "token": token, "is_active": True, "email_required": False,
        "created_by": owner, "link_name": "Sales deck sample brief",
        "allow_download": True,
    })

    url = "%s/shared/%s" % (SITE, token)
    print("REPORT LINK: %s" % url)
    return url


if __name__ == "__main__":
    main()
