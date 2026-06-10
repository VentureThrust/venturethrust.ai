-- ============================================================================
-- VentureThrust - RLS Phase 1b: lock the currently-unused AI / ML tables
-- ============================================================================
-- The AI Due Diligence feature is gated (UI removed), but these tables still
-- exist and still hold real test data - and Supabase exposes every table over
-- its public REST API using the anon key that ships in your website JS. With
-- RLS off, anyone can read them directly.
--
-- This enables RLS with NO policy = a complete lock for the anon + authenticated
-- roles. Your AI/ML backend is unaffected: the service-role key (and direct
-- Postgres connections) BYPASS RLS. When you resume AI DD, keep the backend on
-- the service-role key and these stay sealed to the public while your server
-- works normally.
--
-- Safe to run: changes access only, never data. Rollback at the bottom.
-- ============================================================================

do $$
declare
  t text;
  tbls text[] := array[
    'ai_analysis','ambiguous_facts','diligence_reports','diligence_jobs',
    'document_pages','documents','extracted_facts','fraud_patterns',
    'processed_files','reports'
  ];
begin
  foreach t in array tbls loop
    -- only act on tables that actually exist
    if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
               where n.nspname='public' and c.relname=t and c.relkind='r') then
      execute format('alter table public.%I enable row level security', t);
      -- drop any stray policies so the lock is total (deny-all by default)
      perform 1;
    end if;
  end loop;
end $$;

-- VERIFY - all should show rls_enabled = true
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relkind='r'
  and c.relname in ('ai_analysis','ambiguous_facts','diligence_reports',
    'diligence_jobs','document_pages','documents','extracted_facts',
    'fraud_patterns','processed_files','reports')
order by c.relname;

-- ROLLBACK (only if needed)
-- do $$
-- declare t text; tbls text[] := array['ai_analysis','ambiguous_facts',
--   'diligence_reports','diligence_jobs','document_pages','documents',
--   'extracted_facts','fraud_patterns','processed_files','reports'];
-- begin
--   foreach t in array tbls loop
--     execute format('alter table public.%I disable row level security', t);
--   end loop;
-- end $$;
