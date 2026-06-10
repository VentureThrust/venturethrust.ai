# VentureThrust - project memory

VentureThrust is a DocSend-style **virtual data room (VDR)** for startup ⇄ investor
document sharing, with an **AI due-diligence report** add-on.

## Repos / locations
- **Frontend (this repo):** `C:\dev\om` - Next.js 15 App Router + Supabase.
- **AI backend:** `C:\Users\Omprakash\OneDrive\Desktop\ai-backend` - Express :4000, Azure OpenAI today; `llm.js` router ready for Anthropic.
- **ML risk service:** `C:\Users\Omprakash\OneDrive\Desktop\ml-project` - Python FastAPI :8000, `model.pkl`.

## CURRENT PRODUCT DECISION (June 2026) - ship the VDR; AI DD is "Upcoming"
- The **Virtual Data Room is the live product.** Focus here.
- **AI Due Diligence report = gated as an "Upcoming" feature.** Every "Generate report / run AI scan" trigger opens `UpcomingFeatureDialog` (`src/components/upcoming-feature-dialog.tsx`) - a **pilot waitlist** form → `POST /api/pilot-signup` (emails the team via SMTP; needs `SMTP_*` env, optional `PILOT_NOTIFY_EMAIL`).
- Gated entry points: `spaces/[spaceId]/view` (`openReportDialog`), `dashboard/ai-risk-scanner` and `ai-risk-scanner` (the "Start Analysis" buttons). The old generation code is left dormant (not deleted) for easy re-enable.
- **Why:** not enough labeled data yet, and a wrong risk score would break trust. We must validate accuracy with **pilot users who are real due-diligence professionals** - their feedback (right/wrong score) becomes the ML training label.

## When we RESUME AI Due Diligence (the agreed plan)
1. **Switch LLM** from Azure OpenAI GPT-4.1-mini → **Anthropic direct API** (chosen over Microsoft Foundry, whose deploy failed with `InternalServerError`). Tiered: **Sonnet 4.6** for bulk extraction/claims/evidence, **Opus 4.8** for risk/summary/fraud/entity judgment. Router already built: `ai-backend/llm.js` → `callLLM({task, prompt, maxTokens})` with a GPT fallback. Go-live: set `.env` `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...`, then route the **13** `fetch(AZURE_OPENAI…)` call sites in `index.js` through `callLLM` (prompts/schemas/DB unchanged - a ~15-min transport swap). Then add prompt caching; request a **ZDR** addendum.
2. **ML feedback flywheel** ("gets better with use"): store each report's feature vector + prediction + a human **label** in Supabase (`ml_training_samples` - get SQL from the user, do NOT guess schema); add a 👍/👎 + actual-outcome control on the report; a `retrain.py` periodically rebuilds `model.pkl` from labeled rows (version + promote only if better on holdout). Cold-start: needs ~50–100 labels before it helps.
3. **Already DONE** in `ai-backend/index.js`: `analyzeEntityIntegrity()` - Unknown entity (no guessing), entity/PAN mismatch flag, registration cross-check; model-agnostic, feeds `red_flags` + `companyName` + `report_json.entity_integrity`. Also fixed a missing `report_json` on the space-handler insert.

## HARD RULES (standing)
- **Never guess the database.** Need a table/column? Ask the user or hand them SQL - they run it.
- Discuss / get approval before building large features.
- Keep TypeScript at the established baseline (zero NEW errors). Windows typecheck: `./node_modules/.bin/tsc.cmd --noEmit` (NOT `npx tsc`).
- **Never use the em-dash character anywhere** (copy, JSX, or comments). The user has asked repeatedly. Use commas, periods, or hyphens; grep for it before finishing a change.
- Privacy: documents are confidential. Anthropic does **not** train on API data; 7-day default retention; **ZDR available**. (Azure OpenAI was the original pick for governance, but data still leaves to Microsoft - same per-token spend as Anthropic direct.)

## SECURITY / data isolation (VDR - must never leak across accounts)
- **Root cause of the June 2026 leak:** file requests were cached in a *browser-global* `localStorage` key (`secureShareFileRequests`), so a new account on the same browser saw the previous user's data. **Fixed:** `src/lib/file-requests-provider.tsx` now loads from Supabase scoped to `created_by = auth user.id` and purges that legacy key. Rule of thumb: **never store user data in a non-user-scoped localStorage key.** (The only safe one is `vt_active_workspace_<userId>` in `workspace.ts`.)
- **RLS (Row-Level Security)** - Supabase auto-exposes every table over a public REST API authorized by the *public* anon key, so any table with RLS off is world-readable. Scripts live in `sql/`:
  - `rls_phase1.sql` - RLS + owner/workspace policies on the 19 core VDR tables. Helper fns: `vt_accessible_owner_ids()`, `vt_accessible_space_ids()`, `vt_coworkspace_user_ids()` (SECURITY DEFINER, avoid recursion). Includes 3 **temporary** anon policies so public upload keeps working, plus an emergency rollback block.
  - `rls_phase1b_lock_ai_tables.sql` - enable-RLS-no-policy (deny-all) on the 10 AI/ML tables (sealed from public API; backend uses service-role which bypasses RLS).
  - `rls_phase2_lock_upload.sql` - drops the 3 temp anon policies; run **after** Phase-2 code is live.
- **Access model in RLS:** a user can touch rows owned by their own id **or** any workspace they're a member of (`workspace_members`) **or** spaces shared via `space_members`. Service-role API routes bypass RLS (that's why public/anon flows go through them).
- **Public anon flows must go through service-role routes, never the anon client.** Pattern: `createClient(URL, SERVICE_ROLE_KEY)` + `consumeRateLimit`/`clientIp` from `@/lib/rate-limit`. File-request upload was migrated to this: `/api/file-requests/resolve` (validate token → request+owner display) and `/api/file-requests/upload` (validate token/expiry/batch/path-prefix/email → insert uploads+files+alert). Bytes still go browser→Storage `documents` bucket (Storage policies, separate surface - a known follow-up to scope).
- **Ownership columns** (confirmed from live schema): `created_by` → spaces, share_links, file_requests, diligence_reports. `user_id` → folders, files, deleted_items, alerts, space_sections, file_permissions, documents, ai_analysis, extracted_facts, ambiguous_facts, processed_files, document_pages. `space_id`-only (owner via parent space) → space_questions/nodes/analytics, viewer_sessions, file_page_views, file_playback_events. Membership → workspace_members(member_user_id, workspace_owner_id), space_members(user_id, space_id). `files.id` and `folders.id` are **text**, not uuid.

## UX - onboarding & empty states
- **Empty states:** list pages use `<EmptyState>` (`src/components/empty-state.tsx`) + a per-page SVG from `src/components/illustrations.tsx` (Spaces / ContentLibrary / Shared / Analytics / FileRequests / Agreements). Wired into spaces, analytics, content-library, file-requests, agreements, shared-with-me.
- **Onboarding = spotlight tour** (`src/components/product-tour.tsx`, `ProductTour`): dims the page and spotlights a REAL element (nav item or button) with a tooltip, one step at a time, DocSend-style. The user explicitly rejected BOTH a carousel of drawings AND a static message banner; the guide must point at the live interface ("this button does this"). Gated by localStorage `vt_tour_<tourKey>` (once per user). `?tour=1` in the URL force-starts it (testing / future "replay" link). The seen flag is written only on Skip/Done, never on a missing target. Targets resolve by CSS selector: nav items by `[href="/..."]`, buttons by `data-tour="..."` added to the real buttons; a step with no selector renders a centered card (welcome). Wired on: dashboard (sidebar nav), spaces, content-library, file-requests, analytics, agreements. New-user flow: signup, then `/choose-role` (this route is actually the plan picker, upserts `profiles.plan`), then `router.replace('/dashboard')`, then the dashboard tour runs.
- The earlier `onboarding-guide.tsx` (carousel) and `page-guide.tsx` (message banner) were DELETED in favor of the spotlight tour.
- localStorage gating keys (`vt_tour_<key>`) are non-sensitive (no user data), fine client-side, unlike the file-requests leak.
