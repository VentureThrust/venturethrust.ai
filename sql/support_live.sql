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
-- Safe to re-run.
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
-- Knowledge base content. Edit these rows (or add more) in Table Editor any
-- time to make the assistant smarter. Re-running is safe (on conflict do
-- nothing keeps your edits). Group by sort: 10s = getting started, 20s =
-- features, 30s = security, 40s = plans/billing, 50s = account, 60s = fixes.
-- ============================================================================
insert into public.support_kb (title, body, sort) values
-- Getting started
('What VentureThrust is',
 'VentureThrust is a secure virtual data room. You share documents (decks, financials, contracts) with one controlled link, gate access with an NDA, password, or expiry, and see exactly who read what. It is similar to DocSend.', 10),
('Create a Space (data room)',
 'Go to the Spaces page and create a new Space. A Space is your data room: a place to organize files and folders and share them with controlled access.', 11),
('Add and organize files and folders',
 'Open a Space and use the controls to add files, create folders, and drag items to reorder them. Viewers see the same folder structure and order you set up.', 12),
('Share a document or data room',
 'Open a Space and use Share to create a secure link. You can require an NDA, set a password, set an expiry date, and restrict access to specific email addresses. Send the link to your viewer.', 13),
-- Features
('See who viewed your documents',
 'Open the space and go to Analytics. You will see total views, time spent on each page, and exactly who opened what, updating in real time. Click a viewer or a file to drill into per-page time and individual sessions.', 20),
('Gate a link with NDA, password, or expiry',
 'When creating or editing a share link, turn on NDA to require the viewer to accept an agreement before viewing, set a password the viewer must enter, or set an expiry date after which the link stops working.', 21),
('Restrict who can open a link',
 'When you create a share link, add an allow-list of email addresses so only those people can open it. Anyone else is blocked.', 22),
('Set or change a link password',
 'Edit the share link and set a password. The viewer must enter it before they can open the documents. You can remove or change it any time from the same place.', 23),
('Set a link to expire',
 'Edit the share link and set an expiry date. After that date the link stops working and viewers see a link-not-found message until you extend or re-share it.', 24),
('Collect files from someone (File Requests)',
 'Use File Requests to gather documents from other people. Create a request, share its link, and uploads land back in your account. The uploader does not need an account.', 25),
('Questions and answers on a shared space (Q&A)',
 'Viewers can ask questions on a shared space. You get notified, answer from the Q&A page, and the asker is notified of your reply.', 26),
('Invite team members and workspaces',
 'You can invite people to your workspace so they can help manage your data rooms. Invited members get access to the shared workspace. How many members you can add depends on your plan.', 27),
('Custom branding (logo and cover)',
 'On the Growth plan and above you can add your own logo and a cover image so shared data rooms carry your brand instead of the default.', 28),
-- Security
('Watermarks and screenshot protection',
 'On shared views you can enable a dynamic watermark that stamps the viewer email and IP across the document, plus screenshot deterrents. Watermarks are a strong deterrent: no web viewer can fully block screenshots, but the watermark makes any leak traceable back to the viewer.', 30),
('Is my data secure',
 'Your documents are private by default and isolated to your account. You control access with NDA, password, expiry, and email allow-lists, and you can add watermarks and screenshot deterrents on shared views.', 31),
-- Plans and billing
('Plans, billing, and renewal',
 'Choose a plan on the plan page. Paid plans are billed securely through Cashfree and stay active for the billing cycle, then renew to keep access. For exact current prices, open the plan page. For a specific charge or a refund, ask to talk to a human.', 40),
('What each plan includes',
 'Plans differ by team members and storage. Starter has 2 members and 25 GB. Growth has 5 members, 100 GB, custom branding, NDA and e-signatures, and advanced analytics. Business has 15 members, 500 GB, SSO, granular permissions, and priority support. Check the plan page for the latest details.', 41),
('Change or upgrade your plan',
 'Open the plan page and choose a different plan. Upgrades take effect right away. For a downgrade or cancellation, tap Talk to a human and the team will help.', 42),
('A charge, invoice, or refund question',
 'We cannot see your billing records from this chat. For a specific charge, an invoice, or a refund, tap Talk to a human and the team will check your account.', 43),
('Payment did not go through',
 'If a payment fails, check that the card details and billing information are correct and try again. If it keeps failing, tap Talk to a human and we will help.', 44),
('Plan not active after paying',
 'Activation is usually instant. If you paid but the plan is not active after a minute, refresh the page. If it is still not active, tap Talk to a human with the time of payment and we will fix it.', 45),
-- Account and login
('Account, login, and password',
 'Sign in with your email and password, or with a one-time code if you joined a shared workspace by invite. If you cannot get in, ask to talk to a human and we will help recover access.', 50),
('Log in with a one-time code',
 'If you were invited to a workspace and do not have a password yet, choose log in with a code on the login page. We email you a six digit code to sign in.', 51),
('Cannot log in or forgot password',
 'Double check the email address and password. If you still cannot sign in, use the log in with a code option, or tap Talk to a human to recover access.', 52),
-- Troubleshooting (issue then fix)
('Link not found or expired',
 'If a link shows link not found or will not open, it may have expired, been disabled, or require a password or NDA the viewer has not completed. Ask the owner to confirm the link is active and re-share it if needed.', 60),
('A document will not open or preview',
 'If a file does not preview, refresh the page or try another browser. Large PDFs can take a few seconds to render. If it still fails, tap Talk to a human and tell us the file name.', 61),
('Cannot upload to a file request',
 'Uploads work only while the request is active and not expired. Confirm you opened the latest link from the owner. If it still fails, tap Talk to a human.', 62),
('Not receiving notification emails',
 'Check your spam folder and confirm the email on your account is correct. Notifications cover Q&A answers and file-request uploads. If they are still missing, tap Talk to a human.', 63),
('Replay the guided tour',
 'New accounts get a short guided tour of the dashboard. To replay any tour, add ?tour=1 to the end of the page URL.', 64),
-- Meta
('AI due diligence',
 'AI due diligence is coming soon and is not available yet. The current product is the secure data room: sharing, analytics, gates, file requests, and Q&A.', 70),
('Reach a person',
 'Any time the assistant cannot resolve your issue, tap Talk to a human in this window. The team sees your chat and replies here live, and also by email.', 71)
on conflict (title) do nothing;

-- VERIFY
select count(*) as kb_entries from public.support_kb;
select column_name from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='is_admin';
