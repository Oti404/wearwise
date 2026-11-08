# WearWise Coding Standards (CODING_STANDARDS.md)

The technical rules for the WearWise monorepo: a web-only Expo frontend, an Express backend, a Python AI engine and a self-hosted PostgreSQL database, all running in Docker.

## 1. Frontend Conventions
- **Platform**: The app is **web-only**. Expo is the build tool (`npx expo export --platform web`); there are no native iOS or Android builds. Native-only packages must not be added.
- **State Management**: Use **Zustand** for global client state. Persist only what must survive a reload (session, cart, filters).
- **API Access**: All backend calls go through `config/apiClient.ts` (`API_URL`, `authHeaders()`, `uploadImage()`, `errorMessage()`). Never hardcode backend URLs or read tokens directly.
- **Styling Policy**: Use React Native **`StyleSheet`** objects. Keep styling lean and functional.
- **Routing**: Use **Expo Router** file-based routing inside `/app`.
- **Error Handling**: Use React Error Boundaries around major features so one failing component can't take down the page. Show backend `message` texts to users; they are written to be user-facing.
- **Type Safety**: `npm run typecheck` must pass with zero errors.

## 2. Backend Conventions
- **Architecture**: Follow `Route → middleware (rate limit, auth, validation) → Controller → Service → Drizzle`. Business logic and database access live only in services.
- **Validation**: Validate every request body with a **zod** schema through `validate()`. Unknown fields are stripped.
- **Errors**: Throw `AppError(message, status)` for expected failures. Messages are English, user-facing, and must not leak internals. Responses use `{ "status": "error", "message": "..." }`.
- **Pagination**: Use **cursor-based pagination** for list endpoints.
- **Resilience**: Multi-step writes must use **transactions**. State transitions that must happen once (selling an item, answering a rating request) use a single conditional update (`UPDATE … WHERE status = '…' RETURNING`), never read-then-write.

## 3. Security Rules
- **Identity from the token only**: The acting user always comes from `req.user.uid` (set by `verifyToken`), never from the request body or a URL parameter.
- **Ownership checks**: Any endpoint that reads or changes a user's private data (profile edits, notifications, ratings) must verify that the token's user owns it and return 403 otherwise.
- **No PII in public responses**: Email, phone and password hashes are never returned to anyone but the owner. Password hashes live only in `user_credentials`. Search and lookup endpoints must not accept or match email/phone.
- **Uploads**: Decide the file type from its bytes, enforce size limits, and store files under random names.
- **Rate limiting**: Public auth and write endpoints use the strict limiters in `config/rateLimit.js`.
- **Secrets**: Never commit secrets. Every variable goes into the matching `.env.example` with an empty value; real `.env` files are git-ignored.

## 4. Performance Budgets
- **Web Bundle**: Keep the main JS bundle under **5 MB** (currently ~3.9 MB). Prefer lazy-loaded routes for heavy features.
- **API Response Target**: Standard endpoints must achieve `p95 < 500ms`. AI-enriched endpoints must target `p95 < 2s` (currently ~0.6 s per image on CPU).
- **Database Efficiency**: Detect and remove N+1 query patterns by using Drizzle relations (`with`) or batched queries.

## 5. Code Comments Policy
- **Explain Intent**: Comments must explain *why* the code exists, not *what* the code is doing.
- **No Dead Code**: Commented-out code and unused files are not allowed on main branches.
- **TODO References**: All `TODO` comments must include a ticket reference or GitHub issue number.
- **Language**: Code, comments, documentation and user-facing text are written in English.

## 6. Environment & Dependency Rules
- **Environment Variables**: Never hardcode secrets or environment-specific URLs. Document every new variable in the relevant `.env.example` (root for Docker, module-level for running outside Docker).
- **Dependency Management**: Adding a package requires a justification, a size assessment and a check that its license is permissive. Lockfiles (`package-lock.json`) are committed, and Python runtime dependencies are pinned in `requirements.txt`.
- **Runtime Versions**: Node.js 24 (backend, frontend build), Python 3.12 (AI engine), PostgreSQL 16 with pgvector. Docker images and CI must use the same versions.

## 7. Database Rules (Drizzle ORM)
- **Tooling**: All PostgreSQL access goes through **Drizzle ORM**, schema-first. `drizzle/schema.ts` is the migration source; `drizzle/schema.js` mirrors it for runtime and must be updated in the same change.
- **Auditing**: Every table has `created_at`; every mutable table also has `updated_at`, maintained by the `update_updated_at_column()` trigger.
- **Data Deletion**: User-generated content is **soft-deleted**. Listings use `status = 'deleted'`; new tables that need deletion add a `deleted_at` column. Hard deletes are reserved for cascades when an account is removed.
- **Migrations**: Generate them with `npm run db:generate` (or `drizzle-kit generate --custom` for raw SQL). They are sequentially numbered, **forward-only**, and applied automatically on backend start. Every migration must apply cleanly to an empty database; CI verifies this.

## 8. Logging & Observability
- **Structured Logging**: Use tagged log lines with explicit levels (`info`, `warn`, `error`). Never log tokens, passwords or full request bodies.
- **Tracing**: Attach **Correlation IDs** to requests where the structure allows it.

## 9. Git & Branching Strategy
- **Branch Naming**: Use `feat/`, `fix/`, `chore/` and `hotfix/` prefixes.
- **Commit Messages**: Use single-line **Conventional Commits** (e.g., `feat: add listing search`).
- **Merge Strategy**: Use **Squash and Merge** for clean commit histories.

## 10. Testing Policy
- **Integration Tests**: Backend behaviour is tested with Node's built-in runner (`node:test`) against a real PostgreSQL in `backend/tests/integration/`. Run them with `npm run test:integration`.
- **Mandatory Coverage**: Changes to authentication, access control, uploads or anything involving orders and ratings must come with integration tests, including the negative cases (unauthenticated, wrong owner, double submission).
- **Coverage Exceptions**: Generated files, configuration files, `.d.ts` files and seed scripts don't need tests.
- **Naming Conventions**: `describe('ServiceName') → it('should [expected behavior] when [condition]')`.

## Definition of Done
- [ ] `npm run typecheck` passes and the web export builds.
- [ ] Backend integration tests pass (`npm run test:integration`), with new tests for new behaviour.
- [ ] `docker compose up -d --build` brings every service up healthy.
- [ ] UI stays accessible, with standard touch/click target sizes.
- [ ] Related documentation (READMEs, API reference, `.env.example`) is updated.
- [ ] Code review approval received.
