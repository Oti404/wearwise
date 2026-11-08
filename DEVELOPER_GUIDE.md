# WearWise Developer Guide

How to run, develop, test and deploy WearWise. For a first look, the Quick start in [README.md](./README.md) is enough.

## Prerequisites
- **Docker** with the Compose plugin (Docker Desktop on Windows/macOS)
- **Git LFS**: run `git lfs install` once before cloning. Without it the AI checkpoint is only a pointer file and the AI image build stops with an explicit error.
- For working on a module outside Docker: **Node.js 24** (backend, frontend) and **Python 3.12** (AI engine)

## Configuration
All runtime configuration for the Docker stack lives in the root `.env` (copy `.env.example`; git ignores the copy).

| Variable | Purpose |
|---|---|
| `POSTGRES_PASSWORD` | Database password, shared by Postgres and the backend |
| `JWT_SECRET` | Signs login tokens (at least 32 characters). Changing it signs everyone out |
| `SEED_PASSWORD` | Password of `demo@wearwise.app`, created by `npm run seed` |
| `PUBLIC_URL` | Public address of the site without a trailing slash; used for image URLs and CORS |
| `HTTP_BIND`, `HTTP_PORT` | Where nginx listens on the host (default `127.0.0.1:8080`) |
| `TRUST_PROXY` | Number of proxies in front of the backend: `1` locally (nginx), `2` behind Caddy |

## Option A: everything in Docker (closest to production)
```bash
docker compose up -d --build
docker compose exec backend npm run seed
```
The site is at http://localhost:8080. After changing code, run `docker compose up -d --build` again. Always rebuild the whole stack: rebuilding a single service stops the services that depend on it.

## Option B: develop one module with hot reload
Run the database and AI engine in Docker with their ports published on localhost (`docker-compose.dev.yml`), and run the backend and frontend directly on your machine.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db ai-engine
```
The database is published on `localhost:55432` (port 5432 is often reserved on Windows or already used by a local Postgres; override with `DEV_DB_PORT`). The AI engine is on `localhost:7860`.

**Backend** (http://localhost:3000):
```bash
cd backend
cp .env.example .env
# set DATABASE_URL=postgres://wearwise:<POSTGRES_PASSWORD>@localhost:55432/wearwise
# set JWT_SECRET (any 32+ chars) and ALLOWED_ORIGINS=http://localhost:8081
npm install
npm run dev          # applies migrations, then starts nodemon
```

**Frontend** (http://localhost:8081):
```bash
cd frontend
cp .env.example .env # EXPO_PUBLIC_API_URL=http://localhost:3000
npm install
npx expo start --web
```

**AI engine** outside Docker: see [ai_engine/README.md](./ai_engine/README.md).

Run `docker compose up -d` afterwards to return to the normal stack (it drops the published dev ports).

## Database
- **Schema**: `backend/drizzle/schema.ts` is the source of truth for migrations. `schema.js` mirrors it for the CommonJS runtime and must be kept in sync by hand.
- **New migration**: edit `schema.ts`, then `cd backend && npm run db:generate`. For SQL that Drizzle can't express (triggers, functions), use `npx drizzle-kit generate --custom --name=<name>`.
- **Applying migrations**: automatic. The backend runs `drizzle/migrate.js` on every start; applied migrations are tracked in `drizzle.__drizzle_migrations`.
- **Demo data**: `npm run seed` (or `docker compose exec backend npm run seed`) is idempotent and skips if the demo account exists. The catalog lives in `backend/database/seeds/wardrobe/`. Its product photos may come from a retailer's catalog, so use the seed only for local and demo environments.

## Tests
Backend integration tests use Node's built-in test runner against a real Postgres. They create and delete their own users, but use a throwaway database rather than the dev one:

```bash
docker run -d --rm --name ww-pg-test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=wearwise -p 55433:5432 pgvector/pgvector:pg16
cd backend
export DATABASE_URL=postgres://postgres:test@localhost:55433/wearwise
export JWT_SECRET=test-secret-with-at-least-32-characters
npm run migrate && npm run test:integration
docker rm -f ww-pg-test
```

The suites cover auth, uploads, the AI proxy, access control (profiles, notifications, ratings) and checkout concurrency. Without `DATABASE_URL` they are skipped, not failed.

CI (`.github/workflows/ci.yml`) runs on every push and pull request to `main` and `develop`:
- the backend integration tests against a Postgres service
- the frontend web build
- `docker compose config` validation
- an AI image build that waits for `/health` to report `ready: true`

## Deployment (single server)
Target: a Linux VPS with Docker, 2 vCPU / 4 GB RAM recommended. Measured footprint: the AI engine uses about 350 MB RAM, is ready about 11 s after start, and takes about 0.6 s per image.

```bash
sudo apt install git-lfs && git lfs install
git clone https://github.com/Oti404/wearwise.store.git /opt/wearwise && cd /opt/wearwise
cp .env.example .env    # strong secrets; PUBLIC_URL=https://<your-domain>; TRUST_PROXY=2
docker compose up -d --build
```

nginx stays bound to `127.0.0.1`; a TLS reverse proxy (Caddy) in front of it serves the domain over HTTPS. *The Caddy configuration and backups are added once the domain and provider are chosen; see Step 4 in [IMPLEMENTATION.md](./IMPLEMENTATION.md).*

Updating a running server:
```bash
git pull && docker compose up -d --build
```
Data lives in the `pgdata` and `uploads` volumes and survives rebuilds; only `docker compose down -v` deletes it.

## Git workflow
- Branches: `main` (released), `develop` (integration), plus `feat/`, `fix/`, `chore/`, `hotfix/` branches; squash-merge into `develop`.
- Commit messages: single-line [Conventional Commits](https://www.conventionalcommits.org/), e.g. `fix: reject duplicate ratings`.
- Never commit secrets. `.env` files are git-ignored; only `.env.example` files with empty values are tracked.
- History was rewritten on 2026-11-08 to remove leaked credentials. Re-clone any copy made before that date instead of pulling.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| AI build fails with *"Binary checkpoint missing or is a Git LFS pointer"* | Git LFS wasn't installed when cloning: `git lfs install && git lfs pull`, then rebuild |
| `ai-engine` stays `health: starting` | Models are loading; allow up to 3 minutes on a small CPU. `docker compose logs ai-engine` shows the progress |
| Backend exits with *"JWT_SECRET must be set…"* | Set a JWT_SECRET of at least 32 characters in `.env` |
| *"ports are not available"* when publishing a port | The port is reserved or in use; change `HTTP_PORT` or `DEV_DB_PORT` |
| Frontend container `Exited` after rebuilding one service | Rebuilding a single service stops its dependents; run `docker compose up -d` |
| Requests fail with 429 *Too many requests* | Rate limit (200 requests / 15 min per IP, 30 for login and register). Behind extra proxies, set `TRUST_PROXY` correctly or all users share one limit |
| Images don't show after a domain change | Image URLs are stored with `PUBLIC_URL`; existing rows keep the old address |
