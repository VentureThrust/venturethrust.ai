-- ============================================================================
-- VentureThrust - per-account onboarding tour state
-- ============================================================================
-- Makes the guided product tour show ONCE PER ACCOUNT across every device,
-- instead of once per browser. The client records which tours an account has
-- finished in profiles.tours_seen, a jsonb map of tourKey -> true, e.g.
--   { "welcome": true, "spaces": true }
--
-- Writes go through a SECURITY DEFINER function keyed by auth.uid(), so they do
-- NOT depend on a profiles UPDATE policy, and a user can only ever mark their
-- OWN tours seen. Reads use the existing self-select on profiles.
--
-- Safe to run once. Until it is run, the app falls back to per-browser tour
-- state automatically (no breakage).
-- ============================================================================

alter table public.profiles
  add column if not exists tours_seen jsonb not null default '{}'::jsonb;

create or replace function public.vt_mark_tour_seen(p_key text)
returns void language sql security definer set search_path = public as $$
  update public.profiles
     set tours_seen = coalesce(tours_seen, '{}'::jsonb) || jsonb_build_object(p_key, true)
   where id = auth.uid();
$$;

revoke all on function public.vt_mark_tour_seen(text) from public;
grant execute on function public.vt_mark_tour_seen(text) to authenticated;

-- VERIFY - expect one row for the column, and one row for the function.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'tours_seen';

select proname, prosecdef as security_definer
from pg_proc
where proname = 'vt_mark_tour_seen';
