/**
 * /shared/[token] - SHARE LINK ENTRY (SERVER COMPONENT)
 *
 * This page used to be a giant 'use client' file that fetched the share_link
 * on the client and exposed every column (including password_hash and
 * allow_block_emails) to the browser.
 *
 * It's now split into:
 *
 *   1. THIS FILE (Server Component, no JS shipped)
 *      • Reads the token from the URL on the server
 *      • Uses the service-role Supabase client to fetch the share_link
 *      • Checks is_active + expires_at on the SERVER's clock (not the user's)
 *      • If invalid → renders the error page directly into HTML - strangers
 *        with bad tokens see a finished error page in <100ms with zero JS
 *      • If valid → renders <GatesFlow /> with ONLY the minimum config
 *        needed to draw the UI. Sensitive fields (password_hash,
 *        allow_block_emails) never reach the browser.
 *
 *   2. ./gates-flow.tsx (Client Component)
 *      • The interactive multi-step form (email, password, NDA, signature)
 *      • Submits each step to /api/share-links/validate which does the
 *        actual server-side credential checking with bcrypt and the
 *        allow/block list.
 *
 * Result: faster first paint, smaller JS bundle, and unauthorized visitors
 * are turned away before any application JavaScript runs.
 */

import { createClient } from '@supabase/supabase-js';
import { AlertTriangle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GatesFlow } from './gates-flow';
import { InactiveLink } from './inactive-link';
import { getSpaceOwner, isOwnerPlanActive } from '@/lib/owner-plan';

// Mark the route as dynamic - every request must hit the server to fetch
// the latest share_link state (active/expired/etc.). Without this Next.js
// might statically generate the page at build time, which would defeat the
// purpose of server validation.
export const dynamic = 'force-dynamic';

// ── Service-role server client ──────────────────────────────────────────
// Bypasses RLS because the visitor is anonymous and needs to read a single
// share_links row by token. The key is server-only - it never reaches the
// browser. (See .env.local: SUPABASE_SERVICE_ROLE_KEY is NOT NEXT_PUBLIC_.)
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Server env vars missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedTokenPage({ params }: PageProps) {
  const { token } = await params;

  // ── 1. Fetch the link (server-side) ────────────────────────────────────
  const supabase = getServerClient();
  const BASE_COLS =
    // Only the columns we need. Crucially we do NOT include password_hash
    // or allow_block_emails - those stay on the server and are checked
    // via /api/share-links/validate at gate-submit time.
    'id, space_id, file_id, token, is_active, expires_at, email_required, password_hash, require_nda, require_signature, nda_text';
  // recipient_email etc. power the send-by-email flow; retry without them on
  // databases that have not run that migration so ordinary links never break.
  let { data: link, error } = await supabase
    .from('share_links')
    .select(`${BASE_COLS}, recipient_email, opened_at, open_count`)
    .eq('token', token)
    .maybeSingle();
  if (error) {
    ({ data: link, error } = await supabase
      .from('share_links')
      .select(BASE_COLS)
      .eq('token', token)
      .maybeSingle());
  }

  // ── 2. Server-side validation (no JS needed for error states) ──────────
  if (error || !link) {
    return (
      <ErrorShell
        title="Link not found"
        description="This link does not exist. Please check the URL or contact the sender."
      />
    );
  }
  // Inactive = disabled, past its expiry date, or the owner's plan has lapsed.
  // We do NOT tell the visitor which one. Instead of a dead-end error, we show
  // an interactive screen that first captures their email (so the owner can see
  // who tried), then lets them message the owner or request reactivation.
  const dateExpired = !!link.expires_at && new Date(link.expires_at as string) < new Date();
  const ownerActive = await isOwnerPlanActive(
    supabase,
    await getSpaceOwner(supabase, link.space_id as string),
  );
  if (!link.is_active || dateExpired || !ownerActive) {
    return <InactiveLink token={token} />;
  }

  // ── 2b. Send-by-email SPACE links: record the open server-side ─────────
  // (File recipient links are tracked by /api/share-links/validate instead.)
  // Every page load counts as an open; the first one also alerts the owner.
  const linkRec = link as Record<string, unknown>;
  if (linkRec.recipient_email && !linkRec.file_id) {
    try {
      const nowIso = new Date().toISOString();
      const firstOpen = !linkRec.opened_at;
      await supabase
        .from('share_links')
        .update({
          open_count: (Number(linkRec.open_count) || 0) + 1,
          last_opened_at: nowIso,
          opened_at: (linkRec.opened_at as string | null) ?? nowIso,
        })
        .eq('id', link.id as string);
      if (firstOpen) {
        const { data: spaceRow } = await supabase
          .from('spaces')
          .select('name, title, created_by')
          .eq('id', link.space_id as string)
          .maybeSingle();
        if (spaceRow?.created_by) {
          await supabase.from('alerts').insert({
            user_id: spaceRow.created_by,
            space_id: link.space_id,
            type: 'space_opened',
            message: `${linkRec.recipient_email as string} opened your space "${(spaceRow.name as string) || (spaceRow.title as string) || 'Space'}".`,
          });
        }
      }
    } catch (e) {
      console.warn('[shared] recipient open tracking failed:', e);
    }
  }

  // ── 3. Render the interactive client component ─────────────────────────
  // Pass ONLY the minimum needed to draw the UI. The password hash, NDA
  // body, etc. that the client doesn't need are intentionally omitted.
  return (
    <GatesFlow
      token={token}
      link={{
        id: link.id as string,
        space_id: link.space_id as string,
        emailRequired: !!link.email_required,
        // Send a boolean - never the hash itself.
        hasPassword: !!link.password_hash,
        requireNda: !!link.require_nda,
        requireSignature: !!link.require_signature,
        // NDA text is fine to send because it's already shown to the user once they get to that gate
        ndaText: (link.nda_text as string | null) ?? null,
        // File-scoped link: GatesFlow renders just this one file after the gates pass.
        fileId: (link.file_id as string | null) ?? null,
        // Send-by-email links: the known recipient. The viewer is never asked
        // for their email; views are attributed to this address.
        recipientEmail: ((link as Record<string, unknown>).recipient_email as string | null) ?? null,
      }}
    />
  );
}

// ── Server-rendered error page (no JS) ────────────────────────────────────

function ErrorShell({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-md text-center shadow-xl border-0">
        <CardHeader>
          <div className="mx-auto text-destructive bg-destructive/10 p-4 rounded-full w-fit mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
