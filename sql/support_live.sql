-- ============================================================================
-- VentureThrust - AI support knowledge base + live human-handoff chat
-- ============================================================================
-- Run this ONCE in the Supabase SQL editor. It creates:
--   1. support_kb            - the AI assistant's editable knowledge base.
--                              Add/edit rows in Table Editor to teach the bot;
--                              no redeploy needed.
--   2. profiles.is_admin     - marks the owner who answers escalated chats.
--   3. support_conversations - one row per escalated (human) chat.
--   4. support_messages      - every message in a conversation (user/ai/owner).
--
-- Writes to conversations/messages go through service-role API routes
-- (/api/support/*), which validate the caller. RLS here is READ-only:
--   - a user can read their own conversation + its messages,
--   - an admin (profiles.is_admin = true) can read all of them.
-- Realtime is enabled on both so the chat updates live on each side.
-- ============================================================================

-- ── 1. Knowledge base (the AI answers from this) ────────────────────────────
create table if not exists public.support_kb (
  id         uuid primary key default gen_random_uuid(),
  title      text not null unique,
  body       text not null,
  is_active  boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.support_kb enable row level security;
drop policy if exists "kb readable by signed-in users" on public.support_kb;
create policy "kb readable by signed-in users" on public.support_kb
  for select to authenticated using (is_active = true);

-- ── 2. Admin flag (the owner who answers chats) ─────────────────────────────
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.vt_is_support_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;
revoke all on function public.vt_is_support_admin() from public;
grant execute on function public.vt_is_support_admin() to authenticated;

-- IMPORTANT: mark yourself as the support admin so the inbox is visible to you.
update public.profiles set is_admin = true
where email = 'omprakash@venturethrust.com';

-- ── 3. Conversations ────────────────────────────────────────────────────────
create table if not exists public.support_conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  user_email      text,
  status          text not null default 'awaiting_human',  -- awaiting_human | live | closed
  summary         text,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index if not exists support_conv_status_idx on public.support_conversations (status, last_message_at desc);
create index if not exists support_conv_user_idx   on public.support_conversations (user_id);

alter table public.support_conversations enable row level security;
drop policy if exists "conv read own or admin" on public.support_conversations;
create policy "conv read own or admin" on public.support_conversations
  for select to authenticated
  using (user_id = auth.uid() or public.vt_is_support_admin());

-- ── 4. Messages ──────────────────────────────────────────────────────────────
create table if not exists public.support_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations (id) on delete cascade,
  sender          text not null,   -- user | ai | owner | system
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists support_msg_conv_idx on public.support_messages (conversation_id, created_at);

alter table public.support_messages enable row level security;
drop policy if exists "msg read own conv or admin" on public.support_messages;
create policy "msg read own conv or admin" on public.support_messages
  for select to authenticated
  using (
    conversation_id in (select id from public.support_conversations where user_id = auth.uid())
    or public.vt_is_support_admin()
  );

-- ── Realtime (live updates on both sides). Safe to re-run. ──────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_messages') then
    alter publication supabase_realtime add table public.support_messages;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_conversations') then
    alter publication supabase_realtime add table public.support_conversations;
  end if;
end $$;

-- ============================================================================
-- Starter knowledge base. Edit these rows (or add more) in Table Editor any
-- time to improve the assistant. Re-running is safe (on conflict do nothing).
-- ============================================================================
insert into public.support_kb (title, body, sort) values
('Share a document or data room',
 'Create a Space (your data room) from the Spaces page, add files or folders, then open it and use Share to create a secure link. You can require an NDA, set a password, set an expiry date, and restrict access to specific email addresses. Send the link to your viewer.', 10),
('See who viewed your documents',
 'Open the space and go to Analytics. You will see total views, time spent on each page, and exactly who opened what, updating in real time. You can drill into a single viewer or a single file.', 20),
('Gate a link with NDA, password, or expiry',
 'When creating or editing a share link, turn on NDA to require the viewer to accept an agreement before viewing, set a password the viewer must enter, or set an expiry date after which the link stops working. You can also limit the link to an allow-list of email addresses.', 30),
('Collect files from someone (File Requests)',
 'Use File Requests to get documents from other people. Create a request, share its link, and uploads land back in your account. The uploader does not need an account.', 40),
('Questions and answers on a shared space (Q&A)',
 'Viewers can ask questions on a shared space. You get notified, answer from the Q&A page, and the asker is notified of your reply.', 50),
('Watermarks and screenshot protection',
 'On shared views you can enable a dynamic watermark that stamps the viewer''s email and IP across the document, plus screenshot deterrents. Documents are private by default and isolated to your account.', 60),
('Plans, billing, and renewal',
 'Choose a plan on the plan page. Paid plans are billed securely through Cashfree and stay active for the billing cycle, then renew to keep access. For exact current prices, open the plan page. For a specific charge or a refund, ask to talk to a human.', 70),
('Trouble viewing a shared link (Link not found / expired)',
 'If a link shows "link not found" or will not open, it may have expired, been disabled, or require a password or NDA the viewer has not completed. Ask the owner to confirm the link is active and to re-share it if needed.', 80),
('AI due diligence',
 'AI due diligence is coming soon and is not available yet. The current product is the secure data room (sharing, analytics, gates, file requests, Q&A).', 90),
('Account, login, and password',
 'Sign in with your email and password, or with a one-time code if you joined a shared workspace by invite. If you cannot get in, ask to talk to a human and we will help recover access.', 100)
on conflict (title) do nothing;

-- VERIFY
select count(*) as kb_entries from public.support_kb;
select column_name from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='is_admin';
