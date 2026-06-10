-- ============================================================================
-- VentureThrust - Storage hardening (storage.objects policies)
-- ============================================================================
-- Audit result:
--   documents     = private  ✓        space-covers = PUBLIC (branding - fine)
--   vdr-files     = private  ✓        space-logos  = PUBLIC (branding - fine)
--
-- CORE fixes (run these):
--   1. "Anyone can read file-request uploads" allowed the PUBLIC to read every
--      file uploaded to ANY file request. Replaced with an OWNER-only read
--      (the request's creator), so the owner still previews uploads but the
--      public can't.
--   2. Dropped ~7 dead policies that referenced a non-existent bucket
--      "VDR-FILES" (uppercase; the real bucket is lowercase "vdr-files").
--
-- OPTIONAL hardening (separate section at the bottom):
--   3. Restrict the anonymous file-request upload so bytes can only be written
--      under an ACTIVE request (stops spamming arbitrary file-requests/ paths).
--
-- Safe to run: access rules only, never data. Rollback notes at the very end.
-- ============================================================================

-- Helper: does the CURRENT user own the file request this object belongs to?
-- Storage path is  file-requests/<requestId>/<fileId>/<filename>
-- so foldername(name) = {file-requests, <requestId>, <fileId>}.
create or replace function public.vt_owns_fr_object(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.file_requests fr
    where fr.id::text = (storage.foldername(object_name))[2]
      and fr.created_by = auth.uid()
  )
$$;
revoke all on function public.vt_owns_fr_object(text) from public;
grant execute on function public.vt_owns_fr_object(text) to authenticated;

-- ── CORE 1: owner-only read of file-request uploads ─────────────────────────
drop policy if exists "Anyone can read file-request uploads" on storage.objects;
create policy "Owner reads own file-request uploads" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'file-requests'
    and public.vt_owns_fr_object(name)
  );

-- ── CORE 2: drop dead policies on the non-existent "VDR-FILES" bucket ───────
drop policy if exists "Allow anon reads"                on storage.objects;
drop policy if exists "Allow anon uploads"              on storage.objects;
drop policy if exists "Authenticated users can delete"  on storage.objects;
drop policy if exists "Authenticated users can read"    on storage.objects;
drop policy if exists "Authenticated users can update"  on storage.objects;
drop policy if exists "Authenticated users can upload"  on storage.objects;
drop policy if exists "private_user_files"              on storage.objects;

-- VERIFY - expect: no PUBLIC/anon read on file-requests, and no VDR-FILES rows.
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;


-- ============================================================================
-- OPTIONAL (run only if the upload test below still passes afterwards)
-- 3) Restrict anonymous file-request uploads to ACTIVE requests.
-- ============================================================================
-- create or replace function public.vt_fr_object_active(object_name text)
-- returns boolean language sql stable security definer set search_path = public as $$
--   select exists (
--     select 1 from public.file_requests fr
--     where fr.id::text = (storage.foldername(object_name))[2]
--       and fr.is_active = true
--   )
-- $$;
-- revoke all on function public.vt_fr_object_active(text) from public;
-- grant execute on function public.vt_fr_object_active(text) to anon, authenticated;
--
-- drop policy if exists "Anyone can upload via file request" on storage.objects;
-- create policy "Public uploads to active file requests" on storage.objects
--   for insert to public
--   with check (
--     bucket_id = 'documents'
--     and (storage.foldername(name))[1] = 'file-requests'
--     and public.vt_fr_object_active(name)
--   );


-- ============================================================================
-- ROLLBACK (only if owner can no longer preview request-uploaded files)
-- ============================================================================
-- drop policy if exists "Owner reads own file-request uploads" on storage.objects;
-- create policy "Anyone can read file-request uploads" on storage.objects
--   for select to public
--   using (bucket_id = 'documents' and (storage.foldername(name))[1] = 'file-requests');
