# -*- coding: utf-8 -*-
"""
The US sample brief and its short link, for the investor outreach email.

Uploads the Larkspur Data priority brief and opens a public share link named
"larkspur", which makes it reachable at venturethrust.com/r/larkspur. No email
gate and no expiry: a link in a cold email has to open on the first click.

The link name is also what the open-notification keys off, so opening it mails
omprakashborkar611@gmail.com.

  python scripts/bootcamp/make_larkspur_link.py
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
LINK_NAME = "larkspur"
PDF = os.path.join(os.path.expanduser("~"), "Desktop", "om", "report_generator",
                   "DealWatch_Priority_Larkspur_Data_sample_company.pdf")
# Space files live in vdr-files, but a FILE scoped share link signs against
# the documents bucket, so the brief has to go there or validate returns an
# empty url and the viewer sits on "Loading PDF" forever.
BUCKET = "documents"
STORAGE_PATH = "demo/reports/Larkspur Data - Priority brief - Aug 2026.pdf"
FILE_NAME = "Larkspur Data - Deal Watch brief.pdf"
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
    r = requests.post("%s/rest/v1/%s" % (BASE, table), headers=H, json=payload, timeout=60)
    if r.status_code not in (200, 201):
        raise SystemExit("insert into %s failed: %s %s" % (table, r.status_code, r.text[:300]))
    return r.json()


def main():
    if not os.path.exists(PDF):
        raise SystemExit("Report not found: %s" % PDF)

    users = requests.get("%s/auth/v1/admin/users?page=1&per_page=200" % BASE,
                         headers={"Authorization": "Bearer %s" % KEY, "apikey": KEY},
                         timeout=60).json()
    owner = next((u["id"] for u in users.get("users", [])
                  if (u.get("email") or "").lower() == OWNER_EMAIL), None)
    if not owner:
        raise SystemExit("No auth user for %s" % OWNER_EMAIL)

    with open(PDF, "rb") as fh:
        blob = fh.read()
    up = requests.post(
        "%s/storage/v1/object/%s/%s" % (BASE, BUCKET, requests.utils.quote(STORAGE_PATH)),
        headers={"Authorization": "Bearer %s" % KEY, "apikey": KEY,
                 "Content-Type": "application/pdf", "x-upsert": "true"},
        data=blob, timeout=180)
    if up.status_code not in (200, 201):
        raise SystemExit("upload failed: %s %s" % (up.status_code, up.text[:300]))
    print("uploaded %d bytes to %s/%s" % (len(blob), BUCKET, STORAGE_PATH))

    space = get("spaces?select=id&name=eq.%s&created_by=eq.%s"
                % (requests.utils.quote(SPACE_NAME), owner))
    if space:
        space_id = space[0]["id"]
    else:
        space_id = str(uuid.uuid4())
        post("spaces", {"id": space_id, "name": SPACE_NAME, "title": SPACE_NAME,
                        "description": "Sample Deal Watch briefs, shared publicly.",
                        "created_by": owner})

    # Re-runnable: drop any previous link and file for this brief only.
    requests.delete("%s/rest/v1/share_links?link_name=eq.%s" % (BASE, LINK_NAME),
                    headers=H, timeout=60)
    requests.delete("%s/rest/v1/files?space_id=eq.%s&name=eq.%s"
                    % (BASE, space_id, requests.utils.quote(FILE_NAME)),
                    headers=H, timeout=60)

    folder = get("folders?select=id&space_id=eq.%s&limit=1" % space_id)
    if folder:
        folder_id = folder[0]["id"]
    else:
        folder_id = str(uuid.uuid4())
        post("folders", {"id": folder_id, "user_id": owner, "name": "Sample",
                         "space_id": space_id, "parent_id": None, "position": 1})

    file_id = str(uuid.uuid4())
    post("files", {"id": file_id, "user_id": owner, "folder_id": folder_id,
                   "space_id": space_id, "name": FILE_NAME, "type": "PDF",
                   "storage_path": STORAGE_PATH, "size_bytes": len(blob),
                   "views": 0, "position": 2})

    token = uuid.uuid4().hex
    post("share_links", {"id": str(uuid.uuid4()), "space_id": space_id, "file_id": file_id,
                         "token": token, "is_active": True, "email_required": False,
                         "created_by": owner, "link_name": LINK_NAME, "allow_download": True})

    print("SHORT LINK: %s/r/%s" % (SITE, LINK_NAME))
    print("resolves to: %s/shared/%s" % (SITE, token))
    return token


if __name__ == "__main__":
    main()
