-- Admin signup notifications
--
-- Run once in the Supabase SQL editor. Additive and safe to re-run.
--
-- signup_notified: set true the first time we email the owner about this
-- account, so each new user produces exactly one notification no matter how
-- many times they sign in or which signup path they used (email, Google,
-- invite link).

alter table public.profiles
  add column if not exists signup_notified boolean not null default false;

-- Existing accounts are treated as already announced, so turning this on does
-- not email the owner about every user who signed up before today.
update public.profiles set signup_notified = true where signup_notified = false;
