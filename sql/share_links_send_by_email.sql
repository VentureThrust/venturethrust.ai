-- Send-by-email (per-recipient deck links).
--
-- Each investor you email gets their OWN share_links row with recipient_email
-- set and the email gate OFF (email_required = false), so the link opens the
-- deck directly with no email prompt (like a Google Drive link), while every
-- open is still attributed to that exact recipient.
--
-- Run this once in the Supabase SQL editor. It is additive and safe to re-run.

alter table public.share_links
  add column if not exists recipient_email  text,
  add column if not exists recipient_name   text,
  add column if not exists sent_message     text,
  add column if not exists sent_at          timestamptz,
  add column if not exists opened_at        timestamptz,
  add column if not exists last_opened_at   timestamptz,
  add column if not exists open_count       integer not null default 0;

create index if not exists share_links_recipient_idx
  on public.share_links (file_id, recipient_email);
