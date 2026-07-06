-- Visitor questions toggle per space.
--
-- Powers "Turn off visitor questions" in the space options menu: when OFF,
-- the shared space view hides the Ask a question buttons. Default ON keeps
-- the historic behaviour for every existing space.
--
-- Run once in the Supabase SQL editor. Additive and safe to re-run.

alter table public.spaces
  add column if not exists questions_enabled boolean not null default true;
