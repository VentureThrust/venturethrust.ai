-- ============================================================================
-- demo_requests  ·  "Book a demo" from a shared document
-- ============================================================================
-- One row per person who asks for a demo from the viewer of a shared file.
-- Written by the server with the service role; nobody reads it from the
-- browser, so there is no public select policy.
--
-- Also adds share_links.show_demo_cta, which decides whether the button is
-- rendered at all. It defaults to FALSE on purpose: a founder sharing their
-- pitch deck through VentureThrust must never see us soliciting their
-- investor. Only our own marketing links turn it on.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.demo_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  firm          text,
  role          text,
  phone         text,
  message       text,
  -- Where the request came from, so a reply can reference what they read.
  share_link_id uuid references public.share_links(id) on delete set null,
  file_id       uuid references public.files(id) on delete set null,
  document_name text,
  source_url    text,
  -- Rough context, no fingerprinting.
  country       text,
  city          text,
  user_agent    text,
  ip            text,
  handled_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists demo_requests_created_idx
  on public.demo_requests (created_at desc);
create index if not exists demo_requests_email_idx
  on public.demo_requests (lower(email));

alter table public.demo_requests enable row level security;

-- No browser policies at all. Inserts come from the API with the service role,
-- which bypasses RLS, and reads happen in the Supabase dashboard.
drop policy if exists demo_requests_no_public on public.demo_requests;

-- ── The button flag ─────────────────────────────────────────────────────────
alter table public.share_links
  add column if not exists show_demo_cta boolean not null default false;

comment on column public.share_links.show_demo_cta is
  'Show the Book a demo button on this shared document. False everywhere '
  'except our own marketing links: never solicit on a customer''s deck.';

-- Turn it on for the sample brief used in investor outreach.
update public.share_links
   set show_demo_cta = true
 where link_name = 'nomi';

select link_name, token, show_demo_cta from public.share_links
 where show_demo_cta is true;
