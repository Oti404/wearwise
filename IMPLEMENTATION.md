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

Follow-up docs that reference deleted tooling are rewritten in Step 5.

Also removed in Step 1 (2026-11-08): the Render/HF deploy path (`render.yaml`, `deploy-render.yml`, `deploy-ai-hf.yml`, `keep-alive.yml`). Rows 3–5 of the Zero-Touch Redeploy section above are obsolete; rows 1–2 still apply. Dead Firebase code: `frontend/components/ImageUploader.tsx`, `backend/middlewares/syncUserMiddleware.js`.

## Decisions (2026-11-08)
| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Drop Supabase and Firebase entirely; self-host Postgres in the Docker stack | Single self-contained deployment, no external services |
| 2 | Frontend becomes **web-only**; existing Expo code is kept and Expo is used only as the web build tool. No EAS, no native builds | Avoids a 12.5k-line rewrite |
| 3 | Start with an **empty database** + demo seed; no data migration from Supabase | No production data worth keeping |
| 4 | Uploaded images stored on a **Docker volume**, served by the backend at `/uploads` | Simplest option; backed up together with the DB |

## Step 2 — Backend: own database, auth and storage
| # | File | Change |
|---|------|--------|
| 1 | `backend/drizzle/schema.ts` / `schema.js` | **DONE.** [C] Changed during implementation: password hash lives in a separate `user_credentials` table (1:1 with `users`) instead of a `users.password_hash` column — services return whole `users` rows in API responses, so a column there would leak the hash. Also added `unique_follow` + follower/followed indexes to `follows` (were only in the old hand-run SQL). Keep `auth_uid` and set it equal to `users.id` on register; avoids touching ~59 `authUid` references in 10 files; a rename can be a later refactor |
| 2 | `backend/drizzle/migrations/` | **DONE** (`0000_extensions`, `0001_baseline`, `0002_triggers_and_vector_search`). Replace the Supabase-era migration set with one fresh baseline (`drizzle-kit generate`) + one hand-written SQL migration: `CREATE EXTENSION vector`, `updated_at` triggers, HNSW index, match function. **Drop all RLS policies** (they call `auth.uid()`, which only exists in Supabase; ownership is already enforced in the backend) |
| 3 | `backend/drizzle/migrate.js` (new) | **DONE** (placed in `drizzle/` next to `db.js`; wired into `npm start` / `npm run dev`; `db.js` now reads `DATABASE_URL` with SSL opt-in via `DB_SSL=require`). Run migrations with `drizzle-orm/postgres-js/migrator` on container start, before `server.js` |
| 4 | `backend/routes/authRoutes.js`, `controllers/authController.js`, `services/authService.js`, `validators/authSchemas.js`, `config/auth.js` (new) | **DONE.** [C] Also: legacy `POST /register` removed (it created password-less accounts for any caller-supplied `uid`); `PATCH /user/:uid` now returns 403 unless the token owns that profile (the old comment claimed `verifyToken` checked this — it did not); server refuses to start without a ≥32-char `JWT_SECRET`; login is timing-safe for unknown emails. Integration tests: `npm run test:integration` (node:test, no new deps). `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. Passwords hashed with `bcryptjs` (cost 12); JWT (`jsonwebtoken`, HS256, `JWT_SECRET`, 7-day expiry). Rate-limited with the existing limiter |
| 5 | `backend/middlewares/verifyToken.js` | **DONE.** Verify our JWT instead of `supabase.auth.getUser()`; keep the `req.user = { uid, id, email }` shape so downstream code is unchanged |
| 6 | `backend/services/storageService.js` | **DONE.** [C] File type detected from magic bytes, not the client MIME header. Write files to `UPLOAD_DIR` (volume) with random names, validate MIME (jpeg/png/webp) and size (5 MB); return `${PUBLIC_API_URL}/uploads/<file>` |
| 7 | `backend/routes/uploadRoutes.js` (new) + `app.js` | **DONE.** [C] `/uploads` static is mounted before the rate limiter (a feed page loads many images) and sends `Cross-Origin-Resource-Policy: cross-origin` (helmet blocks other origins by default). Own `uploadLimiter` (60/15 min). Dead base64 branch removed from `createClothesItem`. `POST /uploads` (auth, `multer` memory storage) → storageService; `express.static(UPLOAD_DIR)` at `/uploads` with long cache headers |
| 8 | `services/clothesSqlService.js`, `services/userService.js` | **DONE.** Remove `supabase.auth.admin.getUserById` fallbacks — users always exist in SQL after register |
| 9 | Delete `config/supabase.js`, `services/supabaseService.ts`, `types/supabase.ts`, `supabase/`, `scripts/test_add_product.js`, `database/seeds/sql_seed.js`, `sql_seed_manual.js` | **DONE** (also `drizzle/db.ts`, `setup_storage_policy.js`, `test_seed.js`). Supabase/Firebase-only code |
| 10 | `database/seeds/seed.js` (new) | **DONE.** [C] Demo catalog moved from `frontend/assets/wardrobe` (never imported by the app) to `backend/database/seeds/wardrobe` so the seed can run inside the backend container. Creates `demo@wearwise.app` (password from `SEED_PASSWORD`) + 21 listings; idempotent. Demo users + listings against the new schema (replaces the broken seeds) |
| 11 | `package.json` | **DONE.** Remove `@supabase/supabase-js`, `googleapis`, `@opentelemetry/api`; add `bcryptjs`, `jsonwebtoken`; scripts `migrate`, `seed`, `db:generate` |
| 12 | `.env.example` | **DONE.** Replace Firebase/Supabase vars with `DATABASE_URL`, `JWT_SECRET`, `UPLOAD_DIR`, `PUBLIC_API_URL`, `AI_ENGINE_URL`, `ALLOWED_ORIGINS` |

## Step 3 — Frontend: web-only, backend auth and uploads
| # | File | Change |
|---|------|--------|
| 1 | `frontend/config/apiClient.ts` (new) replaces `config/supabaseClient.ts` | **DONE.** `fetch` wrapper adding `Authorization: Bearer <token>`; token stored in `AsyncStorage` (localStorage on web) |
| 2 | `hooks/useAuth.ts`, `app/_layout.tsx` | **DONE.** Register/login/logout call `/auth/*`; session restored from the stored token via `GET /auth/me` instead of `supabase.auth.getSession/onAuthStateChange`. Register becomes one request (the current two-step Supabase signUp + `/register` goes away) |
| 3 | `hooks/useClothes.ts`, `hooks/useUser.ts`, `hooks/useFollow.ts` | **DONE.** [C] checkout, re-list, ratings and profile PATCH now send the token — they never did, so those calls always got 401. Image uploads → `POST /uploads` (multipart); token from apiClient |
| 4 | Delete `components/LocationPicker.tsx` (native, `react-native-maps`), `components/haptic-tab.tsx` (unused), `eas.json` | **DONE.** [C] `LocationPicker.web.tsx` renamed to `LocationPicker.tsx` (TypeScript does not resolve platform suffixes). Native-only; `LocationPicker.web.tsx` becomes the only implementation |
| 5 | `package.json` | **DONE.** Remove `@supabase/supabase-js`, `react-native-maps`, `expo-haptics`, `react-native-image-picker`, `react-native-image-resizer`, `expo-symbols`. Keep `expo-image-picker`, deck-swiper and slider (they work on web) |
| 6 | `app.json` | **DONE** (`platforms: ["web"]`; Render origin and EAS project id removed; domain added in Step 4). Remove `ios`/`android` blocks (Vercel deep links), set `web.output`, update origin to the new domain |

## Step 3b — AI engine hardening (2026-11-08)
| # | File | Change |
|---|------|--------|
| 1 | `ai_engine/Dockerfile` | **DONE.** Python 3.12 (3.10 reached end-of-life in Oct 2026); CPU-only torch; no `git` in the image; build fails if the checkpoint is a Git LFS pointer; `HF_HUB_OFFLINE=1` at runtime; `HEALTHCHECK` on `/health` `ready` |
| 2 | `ai_engine/requirements.txt`, `requirements-dev.txt` (new) | **DONE.** Pinned to the versions verified locally; removed the unused `openai/CLIP` git package plus `accelerate`, `ftfy`, `regex`; training-only `tqdm` moved to dev requirements |
| 3 | `ai_engine/service.py` | **DONE.** Removed `/classify/path` (unused; it could probe arbitrary server paths); 5 MB limit on `/classify/file` (413); one CLIP encoding shared by type and safety prediction; readiness requires both models |
| 4 | `ai_engine/binary_clothing_model.py`, `hybrid_classifier.py`, `classifier.py` | **DONE.** [C] Inference built MobileNet with `weights=DEFAULT`, downloading ImageNet weights on the first request only to overwrite them with the checkpoint; now `pretrained=False`. Exposed module-level `build_binary_model` (the training script imported it but it did not exist). Binary model is loaded eagerly at startup |
| 5 | `backend/routes/aiRoutes.js`, `services/aiService.js` | **DONE.** `/ai/analyze` now requires a token, uses `uploadLimiter` and a 5 MB limit; `HF_TOKEN` header dropped; engine 400/413 passed through instead of masked as 503. Frontend `add-item.tsx` sends the token. Tests: `tests/integration/ai.test.js` |
| 6 | Cleanup | **DONE.** Deleted dead `config.py`, `utils/logger.py`, `backend/scripts/test_ai_connection.js` (Hugging Face Spaces probe); `.dockerignore` excludes training tools, datasets and venvs; README rewritten in English |
| 7 | `.github/workflows/ci.yml` | **DONE.** AI job checks out LFS, builds the image and waits for `/health` → `ready: true` (old job used Python 3.9, which cannot run this code) |
- [C] Not done: image embeddings are never stored, so `clothing_images.ai_embedding` and `get_similar_clothes` are unused. Wiring "similar items" is a post-launch feature.
- [C] Deploy note: the VPS needs `git-lfs` installed before cloning.
- [C] Verified: image builds; container with `--network none` becomes healthy in 11 s and classifies correctly (no runtime downloads). Image trimmed by ~600 MB by fetching only the CLIP files the service loads.

## Step 4 — Production Docker stack
Target: one Linux VPS (2 vCPU / 4 GB RAM recommended; [C] measured AI engine: ~350 MB RAM, ready in ~11 s, ~0.6 s per image on CPU), Docker + Compose plugin.

| # | File | Change |
|---|------|--------|
| 1 | `docker-compose.yml` — `db` service | **DONE.** `pgvector/pgvector:pg16`, named volume `pgdata`, healthcheck `pg_isready`, not exposed publicly |
| 2 | `backend/Dockerfile` | **DONE.** [C] `node:24-alpine` (Node 20 reached end-of-life in April 2026); un-ignore and commit `backend/package-lock.json` (currently in `backend/.gitignore`) so `npm ci` works;, `npm ci --omit=dev`, non-root user, runs `migrate` then `server.js`, `HEALTHCHECK` on `/ping`, `uploads` volume mounted at `UPLOAD_DIR` |
| 3 | `ai_engine/Dockerfile` | **DONE in Step 3b.** |
| 4 | `frontend/Dockerfile` (new) | **DONE.** [C] nginx also proxies `/api/` → backend, so the site is single-origin (`EXPO_PUBLIC_API_URL=/api`): no CORS, no `api.` subdomain, and the same build works locally and online. Multi-stage: `npx expo export --platform web` with `EXPO_PUBLIC_API_URL` build arg → `nginx:alpine` with SPA fallback |
| 5 | `docker-compose.yml` | **DONE** (only nginx publishes a port, bound to 127.0.0.1 by default; backend `TRUST_PROXY` so rate limits see real client IPs). Rewrite for production: no bind mounts, `restart: unless-stopped`, `env_file`, internal network; only Caddy publishes ports; backend `depends_on` db + ai-engine with `condition: service_healthy` |
| 6 | `deploy/Caddyfile` (new) + `caddy` service | PENDING (needs domain). Caddy now only terminates TLS for `<domain>` → nginx. Automatic HTTPS: `<domain>` → frontend, `api.<domain>` → backend |
| 7 | `.dockerignore` per module (new) | **DONE.** Exclude `node_modules`, `.venv`, `.env`, `.expo`, `dist`, logs |
| 8 | `.env.example` (root, new) | **DONE** (one file for local and server; root `/.env` git-ignored). Single documented env template (`POSTGRES_PASSWORD`, `JWT_SECRET`, domain, …) |
| 9 | `deploy/backup.sh` (new) | Nightly `pg_dump` + tar of the `uploads` volume |

- [C] Verified locally (2026-11-08): `docker compose up -d --build` → all 4 services healthy; seed loads 21 listings; 23/23 end-to-end checks through nginx on :8080 (register, login, session restore, demo login, real AI analysis, upload + serve, create listing, feed images, closet, follow, profile ownership, checkout). `/ai/analyze` now detects the image type from file bytes instead of trusting the client header.

## Step 5 — Docs & CI
- Rewrite `README.md`, `DEVELOPER_GUIDE.md` and module READMEs around `docker compose up --build`; delete `docs/GIT_WORKFLOW.md` and `docs/TESTING.md` (they describe removed tooling); translate `backend/docs/DATA_FLOW.md`; update the `ARCHITECTURE.md` topology (no Supabase/EAS).
- `ci.yml`: Node 20, Python 3.10, add a `docker compose build` job and an auth smoke test against a Postgres service container.

## Execution order & commits
Each item is at least one commit. The app runs locally after Step 3 (`docker compose up db` + local backend/frontend).
1. Step 2 rows 1–3 (schema, migrations, migrator) → 2. rows 4–5 (auth) → 3. rows 6–7 (uploads) → 4. rows 8–12 (Supabase removal, seed) → 5. Step 3 → 6. Step 4 → 7. Step 5.

## [C] Open questions / edge cases
- **Domain + VPS provider still undecided** — needed for the Caddyfile, `PUBLIC_API_URL`, CORS and `app.json`. Not blocking until Step 4.
- `EXPO_PUBLIC_*` vars are baked in at build time — changing the API URL requires rebuilding the frontend image.
- No password reset / email verification in this scope (Supabase used to provide it). Adding it needs an SMTP provider — proposed as a follow-up.
- JWT is stateless: logout only deletes the token client-side, and a stolen token stays valid until expiry (7 days). Acceptable for launch; refresh tokens can come later.
- Uploads on a volume are lost if the VPS disk is lost — `deploy/backup.sh` must copy off-server to be a real backup.
- [C] Demo catalog product names/codes look like a real retailer's catalog; if the photos are theirs, use the seed only for local/demo environments, not the public site.
- [C] FIXED 2026-11-08 (`abaa8e3`): `GET /user/:uid` looks up by uid only and returns email/phone to the owner only; phone sign-in moved into `POST /auth/login` (`identifier` = email or phone, phones unique); `GET /notifications/:userId` requires the owner's token; `POST /ratings` requires a token and must answer the rater's own pending `rating_request` (seller/item taken from it, no double rating); user search no longer matches or leaks email. 14 access-control integration tests (`tests/integration/security.test.js`).
- [C] DONE: all backend messages, stored notification texts, frontend UI strings and code comments translated to English; rate-limit errors use the standard `{ status, message }` shape.
- [C] Still open: `middlewares/security.js` is unused and requires packages that are not installed; `CODING_STANDARDS.md` requires `deleted_at` on all tables, none has it; checkout checks `status = 'active'` before updating without a conditional update, so two simultaneous buyers could both succeed.
- The live Render/HF/Supabase deployment will drift from the code and should be shut down once the VPS is live.
