# VentureThrust — project memory

VentureThrust is a DocSend-style **virtual data room (VDR)** for startup ⇄ investor
document sharing, with an **AI due-diligence report** add-on.

## Repos / locations
- **Frontend (this repo):** `C:\dev\om` — Next.js 15 App Router + Supabase.
- **AI backend:** `C:\Users\Omprakash\OneDrive\Desktop\ai-backend` — Express :4000, Azure OpenAI today; `llm.js` router ready for Anthropic.
- **ML risk service:** `C:\Users\Omprakash\OneDrive\Desktop\ml-project` — Python FastAPI :8000, `model.pkl`.

## CURRENT PRODUCT DECISION (June 2026) — ship the VDR; AI DD is "Upcoming"
- The **Virtual Data Room is the live product.** Focus here.
- **AI Due Diligence report = gated as an "Upcoming" feature.** Every "Generate report / run AI scan" trigger opens `UpcomingFeatureDialog` (`src/components/upcoming-feature-dialog.tsx`) — a **pilot waitlist** form → `POST /api/pilot-signup` (emails the team via SMTP; needs `SMTP_*` env, optional `PILOT_NOTIFY_EMAIL`).
- Gated entry points: `spaces/[spaceId]/view` (`openReportDialog`), `dashboard/ai-risk-scanner` and `ai-risk-scanner` (the "Start Analysis" buttons). The old generation code is left dormant (not deleted) for easy re-enable.
- **Why:** not enough labeled data yet, and a wrong risk score would break trust. We must validate accuracy with **pilot users who are real due-diligence professionals** — their feedback (right/wrong score) becomes the ML training label.

## When we RESUME AI Due Diligence (the agreed plan)
1. **Switch LLM** from Azure OpenAI GPT-4.1-mini → **Anthropic direct API** (chosen over Microsoft Foundry, whose deploy failed with `InternalServerError`). Tiered: **Sonnet 4.6** for bulk extraction/claims/evidence, **Opus 4.8** for risk/summary/fraud/entity judgment. Router already built: `ai-backend/llm.js` → `callLLM({task, prompt, maxTokens})` with a GPT fallback. Go-live: set `.env` `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...`, then route the **13** `fetch(AZURE_OPENAI…)` call sites in `index.js` through `callLLM` (prompts/schemas/DB unchanged — a ~15-min transport swap). Then add prompt caching; request a **ZDR** addendum.
2. **ML feedback flywheel** ("gets better with use"): store each report's feature vector + prediction + a human **label** in Supabase (`ml_training_samples` — get SQL from the user, do NOT guess schema); add a 👍/👎 + actual-outcome control on the report; a `retrain.py` periodically rebuilds `model.pkl` from labeled rows (version + promote only if better on holdout). Cold-start: needs ~50–100 labels before it helps.
3. **Already DONE** in `ai-backend/index.js`: `analyzeEntityIntegrity()` — Unknown entity (no guessing), entity/PAN mismatch flag, registration cross-check; model-agnostic, feeds `red_flags` + `companyName` + `report_json.entity_integrity`. Also fixed a missing `report_json` on the space-handler insert.

## HARD RULES (standing)
- **Never guess the database.** Need a table/column? Ask the user or hand them SQL — they run it.
- Discuss / get approval before building large features.
- Keep TypeScript at the established baseline (zero NEW errors). Windows typecheck: `./node_modules/.bin/tsc.cmd --noEmit` (NOT `npx tsc`).
- Privacy: documents are confidential. Anthropic does **not** train on API data; 7-day default retention; **ZDR available**. (Azure OpenAI was the original pick for governance, but data still leaves to Microsoft — same per-token spend as Anthropic direct.)
