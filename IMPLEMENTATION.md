# IMPLEMENTATION.md — Frontend Copy & Text Cleanup

## Goal
Audit and correct all user-facing text in the frontend. Three categories of issues:
1. **Language mixing** — Romanian strings mixed into an otherwise English UI
2. **Stale references** — text that references deleted features (donate, trade)
3. **Copy quality** — unprofessional, vague, or inconsistent phrasing

---

## Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | All user-facing text must be English | Consistency with app language policy |
| 2 | Remove all donate/trade copy references | Feature was removed |
| 3 | Standardize tone: professional but warm | Target audience is fashion-conscious users |
| 4 | Remove emojis from UI labels | Emojis belong in marketing, not functional UI labels |
| 5 | Fix "Investment" as price label — use "Price" | "Investment" is misleading in a marketplace context |

---

## Changes Per File

### `frontend/components/NotificationsView.tsx`
| Before | After |
|--------|-------|
| "Activitate" (header tag) | "Activity" |
| "Notificări" (title) | "Notifications" |
| "Reîmprospătează" (button) | "Refresh" |
| "Nu ai nicio notificare momentan." | "You have no notifications yet." |
| "Apasă pentru a evalua" | "Tap to rate" |
| "Evaluare trimisă ✅" | "Review submitted" |
| "Sfârșitul actualizărilor" | "You're all caught up" |
| "Recent" | "Just now" |

### `frontend/components/AuthUI.tsx`
| Before | After |
|--------|-------|
| "Se încarcă..." | "Loading..." |

### `frontend/app/register.tsx` (RegisterScreen)
| Before | After |
|--------|-------|
| "Se încarcă..." (loading state) | "Loading..." |

### `frontend/components/ProfilePage.tsx`
| Before | After |
|--------|-------|
| "Istoric (cumpărări / vânzări)" (settings item) | "Purchase & Sales History" |
| "TRADES" (stat label) | Remove stat or rename to "RESALES" |
| "DONATIONS" (stat label) | Remove stat |
| "My Wardrobe ♻️" (section title) | "My Wardrobe" |
| "Coming soon!" (edit profile) | "Edit Profile" (disable button gracefully instead) |

### `frontend/components/CartView.tsx`
| Before | After |
|--------|-------|
| "FREE / TRADE" (item price display) | "—" |
| "Explore the wardrobe and add clothes you love by Swiping Right ❤️" | "Browse the feed and swipe right on items you want to buy." |

### `frontend/app/item/[id].tsx`
| Before | After |
|--------|-------|
| "Investment" (price label) | "Price" |
| "This item doesn't have a description, but it's certainly waiting for a fresh start!" | "No description provided." |
| "Back to Wardrobe" (error back button) | "Go Back" |

### `frontend/app/add-item.tsx`
| Before | After |
|--------|-------|
| "New in Wardrobe" (screen title) | "List an Item" |
| "Item Story (Description)" (label) | "Description" |
| "Where can we find you?" (section title) | "Location" |
| "Help the buyer know where the item is located." | "Set a pickup or reference location for buyers." |
| "Fields pre-filled by AI — feel free to edit" | "AI-suggested fields — review before saving." |
| "Uploading Item..." | "Uploading..." |

### `frontend/app/resale/[id].tsx`
| Before | After |
|--------|-------|
| "Your resale price (RON)" (label) | "Resale Price (RON)" |
| "Relisting will move the product to your buy list and make it visible to others." | "This item will be listed in your wardrobe and visible to other users." |
| "The item was relisted with new details! ✨" (alert) | "Item relisted successfully." |
| "Awesome!" (alert button) | "Done" |

### `frontend/app/(tabs)/notifications.tsx`
| Before | After |
|--------|-------|
| "Your donation request was accepted." (hardcoded example) | Remove or replace with relevant example |
| "Activity" (title) | "Notifications" |

### `frontend/components/SwipeView.tsx`
| Before | After |
|--------|-------|
| "Wardrobe explored!" (empty state title) | "You're all caught up" |
| "We checked everything within a radius of {radius}km. Check back soon for updates!" | "No new items within {radius} km. Check back soon." |
| "Nothing yet..." (community empty title) | "Nothing here yet" |
| "Follow users in the Network tab to see their items here!" | "Follow users in the Network tab to see their listings." |
| "Finalizing addition..." | "Finishing up..." |

### `frontend/app/user/[id].tsx`
| Before | After |
|--------|-------|
| "Digital Nomad" (fallback location) | "Location not set" |

### `frontend/components/RatingModal.tsx`
| Before | After |
|--------|-------|
| "Product Rating" (title) | "Rate Your Purchase" |
| "How was the purchase for {itemName}?" | "How was your experience with {itemName}?" |
| "Very poor" | "Poor" |
| "Excellent! ✨" | "Excellent" |

---

## Files NOT Changing
- `FilterModal.tsx` — copy is clean
- `SwipeCard.tsx` — minimal text, correct
- `LoginScreen.tsx` — copy is acceptable
- `RegisterScreen.tsx` — copy is acceptable (except loading state)
- `RadiusSelector.tsx` — minimal, correct

---

## Execution Order
1. `NotificationsView.tsx` — highest density of Romanian text
2. `AuthUI.tsx` — quick single fix
3. `ProfilePage.tsx` — stale feature references
4. `CartView.tsx` — stale trade reference
5. `item/[id].tsx` — copy quality fixes
6. `add-item.tsx` — copy quality fixes
7. `resale/[id].tsx` — copy quality fixes
8. `SwipeView.tsx` — empty state improvements
9. `notifications.tsx` tab — stale donation reference
10. `user/[id].tsx` — minor fix
11. `RatingModal.tsx` — tone improvements

---

# [C] Zero-Touch Redeploy — Deployment Hardening

## Goal
A full redeploy (frontend, backend, AI engine) must come up healthy with no manual intervention (no model refresh, no manual warm-up).

## Changes
| # | File | Change | Reason |
|---|------|--------|--------|
| 1 | `ai_engine/Dockerfile` | Pre-download `openai/clip-vit-base-patch32` at build time | Model was downloaded on the first `/classify` call, exceeding the backend's 30s timeout |
| 2 | `ai_engine/service.py`, `ai_engine/classifier.py` | Eager model load in `lifespan`; `/health` reports `ready` only after CLIP is loaded; `/classify/*` return 503 when not ready | Previously `/health` reported ready before any model was loaded |
| 3 | `.github/workflows/deploy-ai-hf.yml` | `lfs: true` checkout, `git lfs install --local`, `git init -b main`, `workflow_dispatch` | CI checkout shipped an LFS pointer instead of the `.pt` checkpoint; default branch could be `master`, breaking `push main` |
| 4 | `.github/workflows/deploy-render.yml` | `workflow_dispatch` forces both deploys; `curl -f` fails the job on a bad hook | Redeploy was impossible without a path change; hook failures were silent |
| 5 | `.github/workflows/keep-alive.yml` | Cron every 10 min pings backend `/ping` and AI `/health` | Render free web services sleep after ~15 min idle; HF Spaces after ~48h |

## [C] Manual prerequisites (one-time)
- Repo variables: `BACKEND_URL`, `AI_ENGINE_URL`.
- Secrets: `HF_TOKEN` (rotate if it is the leaked one), `RENDER_DEPLOY_HOOK_FRONTEND`, `RENDER_DEPLOY_HOOK_BACKEND`.
- Render env: `EXPO_PUBLIC_API_URL` (build-time), `AI_ENGINE_URL`, `ALLOWED_ORIGINS`.

## [C] Edge cases
- Scheduled workflows only run from the default branch (`main`) and GitHub disables them after 60 days of repo inactivity.
- Cron runs can be delayed by several minutes under GitHub load — keep-alive reduces, not eliminates, cold starts.
- AI container startup is now slower (model load before serving), but no request ever hits an unloaded model.

---

# [C] Final Stage — Repo Cleanup & Single-VPS Docker Deployment

## Step 1 — Repo cleanup (approved: groups A–D) — DONE
| Group | Files | Reason |
|---|---|---|
| A | `git`, `scripts/dev/localhost)`, `check_db.js`, `test_api.js`, `test_pagination.js`, `test_hf_classify.py`, `backend/fix-cors.js`, `backend/debug_*.js`, `ai_engine/debug.log`, `ai_engine/dummy2.jpg`, `backend/render.yaml`, `frontend/render.yaml`, `frontend/vercel.json`, `*.git_remote`, `ai_engine/.git/` | Dead, broken (Firebase/GCS era), leaked token, or duplicate config |
| B | `sync.bat`, `backend/sync.bat`, `ai_engine/sync.bat`, `scripts/git/`, `.github/workflows/sync_modules.yml`, `ai_engine/.github/` | Multi-repo mirroring no longer used |
| C | `run.bat`, `run_tests.bat`, `setup_project.bat`, `bootstrap_wearwise.bat`, `scripts/dev/` | Replaced by `docker compose` |
| D | `PROMPT.md`; fix `ARCHITECTURE.md` directory map | Non-English doc; map lists non-existent dirs |
| — | `.gitignore`: `.expo/`, `.idea/`, `.pytest_cache/`, `__pycache__/`, `dist/` | DONE |

Follow-up docs that reference deleted tooling and must be rewritten in Step 3: `README.md`, `DEVELOPER_GUIDE.md`, `docs/GIT_WORKFLOW.md`, `docs/TESTING.md`, module READMEs. `backend/.env.example` still documents Firebase — replace with Supabase vars.

## Step 2 — Production Docker stack
Target: one Linux VPS (min. 2 vCPU / 4 GB RAM — CLIP + torch need ~1.5–2 GB resident), Docker + Compose plugin.

| # | File | Change |
|---|------|--------|
| 1 | `backend/Dockerfile` | `node:20-alpine`, `npm ci --omit=dev`, non-root `node` user, `HEALTHCHECK` on `/ping`, port 3000 |
| 2 | `ai_engine/Dockerfile` | Install torch from the CPU wheel index (`--index-url https://download.pytorch.org/whl/cpu`) — default wheels pull CUDA (~2.5 GB extra); keep CLIP pre-download; `HEALTHCHECK` on `/health` |
| 3 | `frontend/Dockerfile` (new) | Multi-stage: `node:20` runs `npx expo export --platform web` with `EXPO_PUBLIC_*` as build args → copy `dist/` into `nginx:alpine` with SPA fallback |
| 4 | `docker-compose.yml` | Rewrite for production: no bind mounts, `restart: unless-stopped`, `env_file`, internal network, AI engine NOT exposed publicly (backend reaches it at `http://ai-engine:7860`), backend `depends_on` AI with `condition: service_healthy` |
| 5 | `deploy/Caddyfile` (new) + `caddy` service | Reverse proxy with automatic HTTPS: `app.<domain>` → frontend, `api.<domain>` → backend |
| 6 | `.dockerignore` per module (new) | Exclude `node_modules`, `.venv`, `.env`, `.expo`, logs |
| 7 | `.env.production.example` (root, new) | Single documented env template for the stack |

## Step 3 — Docs & CI
- Rewrite `README.md` / `DEVELOPER_GUIDE.md` around `docker compose up --build`.
- `ci.yml`: Node 20, Python 3.10 (match Dockerfiles), add `docker compose build` job.
- Render/HF deploy path REMOVED (2026-11-08): `render.yaml`, `deploy-render.yml`, `deploy-ai-hf.yml`, `keep-alive.yml` deleted. Rows 3–5 of the Zero-Touch Redeploy section above are obsolete; rows 1–2 (CLIP baked into image, eager load + `/health` readiness) still apply to the VPS stack.
- Dead Firebase code deleted: `frontend/components/ImageUploader.tsx`, `backend/middlewares/syncUserMiddleware.js`. `backend/database/seeds/sql_seed*.js` kept but still broken (require non-existent `config/firebase`) — needs a Supabase Storage rewrite.

## [C] Open questions / edge cases
- `EXPO_PUBLIC_*` vars are baked at build time — changing the API URL requires rebuilding the frontend image.
- `frontend/app.json` deep links still point to `wearwise-web.vercel.app`; must be updated to the new domain.
- A domain name with DNS A records pointing to the VPS is required for HTTPS.
- Supabase stays managed — no Postgres container.
