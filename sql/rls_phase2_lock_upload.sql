-- ============================================================================
-- VentureThrust - RLS Phase 2: close the anonymous-upload hole
-- ============================================================================
-- RUN THIS ONLY AFTER the Phase-2 app code is live (the new routes
--   /api/file-requests/resolve  and  /api/file-requests/upload).
--
-- The public upload page no longer touches file_requests / file_request_uploads
-- / files / alerts with the anon key - it goes through those service-role routes
-- (which validate the token, the request's state, the batch size and the storage
-- path prefix). So we can now DROP the three temporary anon policies created in
-- Phase 1. After this, those tables are readable/writable only by their owner
-- (and your service-role routes, which bypass RLS).
--
-- Safe to run: changes access only. To undo, re-run the matching CREATE POLICY
-- lines from rls_phase1.sql.
-- ============================================================================

drop policy if exists "vt_TEMP_anon_upload_insert" on public.files;
drop policy if exists "vt_TEMP_anon_read_active"   on public.file_requests;
drop policy if exists "vt_TEMP_anon_insert"        on public.file_request_uploads;

-- VERIFY - these tables should now have NO policy granted to the `anon` role.
-- (Each row returned is an anon-facing policy that should be gone; expect 0 rows.)
select tablename, policyname, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('files','file_requests','file_request_uploads')
  and 'anon' = any(roles);

-- NOTE (separate surface, not table RLS): the browser still uploads file BYTES
-- to the Storage `documents` bucket using the anon key. That's governed by
-- Storage policies, not these table policies. Hardening that (scoping anon
-- INSERT to the file-requests/ path prefix, blocking reads) is a good follow-up
-- but is independent of everything above.
