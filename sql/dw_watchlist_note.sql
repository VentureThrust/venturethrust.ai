-- Deal Watch: watchlist note + quarterly report opt-in
--
-- Run once in the Supabase SQL editor. Additive and safe to re-run.
--
-- Columns:
--   note              optional note the investor leaves for the account
--                     manager when adding a startup (why they passed, what
--                     would change their mind).
--   quarterly_report  true only if the investor asked for quarterly reports
--                     on THIS startup. Default false: silence until the
--                     startup opens a round.

alter table public.dw_watchlist
  add column if not exists note text,
  add column if not exists quarterly_report boolean not null default false;
