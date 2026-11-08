# WearWise

A second-hand clothing marketplace. Users list items with a photo, an AI model checks that the photo shows clothing and suggests a name and category, and buyers swipe through nearby listings, follow sellers, buy and leave ratings.

The whole stack is self-hosted with Docker. It uses no external services except OpenStreetMap for the location picker.

| Module | Stack | Docs |
|---|---|---|
| [`frontend/`](./frontend/README.md) | Expo (React Native for Web), Expo Router, Zustand, served by nginx | Web app |
| [`backend/`](./backend/README.md) | Node.js, Express, Drizzle ORM, JWT auth | REST API, uploads, migrations |
| [`ai_engine/`](./ai_engine/README.md) | Python, FastAPI, PyTorch (CPU), CLIP | Clothing detection and suggestions |
| database | PostgreSQL 16 + pgvector | Runs as a container |

## Quick start

Requirements: Docker with Compose, and **Git LFS** (the AI model checkpoint is stored in LFS).

```bash
git lfs install
git clone https://github.com/Oti404/wearwise.store.git && cd wearwise.store

cp .env.example .env          # then fill in the three secrets (see below)
docker compose up -d --build  # first build takes a few minutes
docker compose exec backend npm run seed   # optional: demo account + 21 listings
```

Open **http://localhost:8080**. With the seed loaded, sign in as `demo@wearwise.app` with the `SEED_PASSWORD` from `.env`.

Generate each secret in `.env` with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Everyday commands

| Task | Command |
|---|---|
| Status / health | `docker compose ps` |
| Logs | `docker compose logs -f backend` (or `frontend`, `ai-engine`, `db`) |
| Rebuild after code changes | `docker compose up -d --build` |
| Stop (keeps data) | `docker compose down` |
| Stop and **delete all data** | `docker compose down -v` |
| Database shell | `docker compose exec db psql -U wearwise -d wearwise` |

## How it fits together

```text
browser ──► nginx (frontend container, :8080)
              ├─ /        static web app
              └─ /api/ ─► backend (Express, :3000) ──► PostgreSQL + pgvector
                             │                  └──► uploads volume (/api/uploads/*)
                             └──► ai-engine (FastAPI, :7860, internal only)
```

The browser only talks to nginx. The API, database and AI engine are reachable only inside the Docker network. Details are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Documentation

- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md): local development, tests, deployment, troubleshooting
- [ARCHITECTURE.md](./ARCHITECTURE.md): system design, module contracts, data flow
- [CODING_STANDARDS.md](./CODING_STANDARDS.md): coding rules
- [CLAUDE.md](./CLAUDE.md): workflow rules for AI assistants
- [IMPLEMENTATION.md](./IMPLEMENTATION.md): current implementation plan and decision log
