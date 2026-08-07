-- ============================================================================
-- share_links.notify_email  ·  "someone opened your link" alerts
-- ============================================================================
-- When this column holds an address, every fresh open of the link emails it.
-- Built for links with NO email gate: the visitor is never asked who they are,
-- so the open itself is the only signal the sender gets.
--
-- Throttled in the app to one mail per link per visitor IP per 30 minutes, so
-- a refresh is not counted as a second visitor.
--
-- Safe to re-run.
-- ============================================================================

alter table public.share_links
  add column if not exists notify_email text;

comment on column public.share_links.notify_email is
  'Email to alert on every open of this link. Null = no alerts.';

-- The sales deck's public sample brief: alert Omprakash on every open.
update public.share_links
   set notify_email = 'omprakashborkar611@gmail.com'
 where token = '0c4126bb89e54760bca1646ef9fc1d6a';

select token, link_name, email_required, notify_email, open_count
  from public.share_links
 where notify_email is not null;
