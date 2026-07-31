# -*- coding: utf-8 -*-
"""
The reports the account manager has already sent the demo investor.

The PDFs come from the real report generator on the desktop, so they are in
the locked VentureThrust format, not something drawn for the demo.

  python scripts/demo_docs/reports.py --upload
"""

import os
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import env, BUCKET, sqlq   # noqa: E402

SRC = r"C:\Users\Omprakash\Desktop\om\report_generator\out"

# startup, kind, title, period, sent, summary, source filename
REPORTS = [
    ("Nellara AgriChain", "priority",
     "Nellara AgriChain: both your conditions are met",
     "July 2026", "2026-07-26 09:15:00+05:30",
     "Wastage 22 percent to 7.4 percent, gross margin 8 percent to 21 percent. Seed round planned for September.",
     "Nellara AgriChain - Priority brief - Jul 2026.pdf"),

    ("Voltaneer", "priority",
     "Voltaneer: recurring revenue and sales cycle both past your thresholds",
     "July 2026", "2026-07-24 16:40:00+05:30",
     "Recurring revenue 24 percent to 47 percent, median sales cycle 264 days to 71 days.",
     "Voltaneer - Priority brief - Jul 2026.pdf"),

    ("Zylo Health", "quarterly",
     "Zylo Health quarterly, Q2 2026",
     "Q2 2026 (Apr to Jun)", "2026-07-12 11:05:00+05:30",
     "Scan volume up 2.4 times, four hospitals live, CDSCO Class B filed on 14 April.",
     "Zylo Health - Quarterly report - Q2 2026.pdf"),

    ("Zylo Health", "quarterly",
     "Zylo Health quarterly, Q1 2026",
     "Q1 2026 (Jan to Mar)", "2026-04-11 10:20:00+05:30",
     "First quarter after your pass. Volume tripled off a small base, CDSCO still unfiled at quarter end.",
     "Zylo Health - Quarterly report - Q1 2026.pdf"),
]


def storage_path(fname):
    return "demo/reports/%s" % fname


def upload():
    import requests
    e = env()
    base = e["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = e["SUPABASE_SERVICE_ROLE_KEY"]
    ok = 0
    for r in REPORTS:
        fname = r[6]
        src = os.path.join(SRC, fname)
        if not os.path.exists(src):
            print("  MISSING %s" % src)
            continue
        with open(src, "rb") as fh:
            body = fh.read()
        url = "%s/storage/v1/object/%s/%s" % (
            base, BUCKET, urllib.parse.quote(storage_path(fname), safe="/"))
        resp = requests.post(url, data=body, headers={
            "Authorization": "Bearer %s" % key, "apikey": key,
            "Content-Type": "application/pdf", "x-upsert": "true",
        }, timeout=120)
        if resp.status_code in (200, 201):
            ok += 1
            print("  uploaded %-52s %7d bytes" % (fname, len(body)))
        else:
            print("  FAILED   %s -> %s %s" % (fname, resp.status_code, resp.text[:160]))
    print("  %d of %d reports uploaded" % (ok, len(REPORTS)))


def sql_block():
    """The insert appended to the demo seed, run inside the same do block."""
    lines = []
    for startup, kind, title, period, sent, summary, fname in REPORTS:
        src = os.path.join(SRC, fname)
        size = os.path.getsize(src) if os.path.exists(src) else 0
        lines.append(
            "      ('%s','%s','%s','%s','%s','%s',%d,timestamptz '%s')"
            % (sqlq(startup), kind, sqlq(title), sqlq(period), sqlq(summary),
               sqlq(storage_path(fname)), size, sent))
    return (
        "\n  -- ── Reports the account manager has already sent ────────────────────────\n"
        "  -- Nothing for the silent startups. The empty space is the product.\n"
        "  insert into public.dw_reports\n"
        "    (id, investor_id, space_id, startup_name, kind, title, period, summary,\n"
        "     storage_path, size_bytes, sent_at, opened_at)\n"
        "  select gen_random_uuid(), v_inv, sp.id, t.startup, t.kind, t.title, t.period,\n"
        "         t.summary, t.spath, t.sz, t.sent, null\n"
        "    from (values\n"
        + ",\n".join(lines)
        + "\n    ) as t(startup, kind, title, period, summary, spath, sz, sent)\n"
          "    left join public.spaces sp on sp.name = t.startup and sp.id = any(ids);\n")


STANDALONE_HEAD = """-- ============================================================================
-- DEAL WATCH REPORTS  ·  demo investor venturethrust@gmail.com
-- ============================================================================
-- Creates the dw_reports table and loads the four reports the account manager
-- has already sent. The PDFs are uploaded to the vdr-files bucket at the same
-- storage_path, so every one of them opens.
--
-- Safe to run on top of an already seeded demo. It replaces only this
-- investor's report rows.
-- ============================================================================

create table if not exists public.dw_reports (
  id            uuid primary key default gen_random_uuid(),
  investor_id   uuid not null references auth.users(id) on delete cascade,
  space_id      uuid references public.spaces(id) on delete set null,
  startup_name  text not null,
  kind          text not null check (kind in ('priority', 'quarterly')),
  title         text not null,
  period        text,
  summary       text,
  storage_path  text not null,
  page_count    int,
  size_bytes    bigint,
  sent_at       timestamptz not null default now(),
  opened_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists dw_reports_investor_sent_idx
  on public.dw_reports (investor_id, sent_at desc);

alter table public.dw_reports enable row level security;

drop policy if exists dw_reports_select_own on public.dw_reports;
create policy dw_reports_select_own on public.dw_reports
  for select using (investor_id = auth.uid());

drop policy if exists dw_reports_update_own on public.dw_reports;
create policy dw_reports_update_own on public.dw_reports
  for update using (investor_id = auth.uid())
  with check (investor_id = auth.uid());

do $$
declare
  v_inv uuid;
begin
  select id into v_inv from auth.users where lower(email) = 'venturethrust@gmail.com';
  if v_inv is null then
    raise exception 'No auth user for venturethrust@gmail.com.';
  end if;

  delete from public.dw_reports where investor_id = v_inv;
"""

STANDALONE_TAIL = "end $$;\n"


def standalone():
    """
    The same insert, resolving the space with a scalar subquery so it can run
    on its own. A subquery rather than a join, because a leftover duplicate
    room of the same name would otherwise insert the report twice.
    """
    block = (sql_block()
             .replace("select gen_random_uuid(), v_inv, sp.id, t.startup",
                      "select gen_random_uuid(), v_inv,\n"
                      "         (select s.id from public.spaces s"
                      " where s.name = t.startup limit 1),\n"
                      "         t.startup")
             .replace("\n    left join public.spaces sp"
                      " on sp.name = t.startup and sp.id = any(ids);", ";"))
    return STANDALONE_HEAD + block + STANDALONE_TAIL


if __name__ == "__main__":
    if "--upload" in sys.argv:
        print("Uploading reports to %s" % BUCKET)
        upload()
    elif "--standalone" in sys.argv:
        out = os.path.join(os.path.dirname(os.path.dirname(
            os.path.dirname(os.path.abspath(__file__)))), "sql", "dw_reports_demo.sql")
        with open(out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(standalone())
        print("wrote %s" % out)
    else:
        print(sql_block())
