# WearWise Backend

Express REST API: accounts and JWT auth, listings, checkout, follows, notifications, ratings, image uploads, and a proxy to the AI engine. Data is stored in PostgreSQL through Drizzle ORM.

## Run
- **With the whole stack (recommended):** `docker compose up -d --build` from the repo root. The API is served under `/api` through nginx.
- **On its own with hot reload:** see Option B in [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md).

| Script | Purpose |
|---|---|
| `npm start` | Apply migrations, start the server |
| `npm run dev` | Apply migrations, start with nodemon |
| `npm run migrate` | Apply pending migrations only |
| `npm run seed` | Create `demo@wearwise.app` (password `SEED_PASSWORD`) and 21 demo listings; idempotent |
| `npm run db:generate` | Generate a migration from `drizzle/schema.ts` |
| `npm run test:integration` | Integration tests (needs `DATABASE_URL` and `JWT_SECRET`) |

Environment variables are documented in [`.env.example`](./.env.example).

## Structure
`Route → middleware (rate limit, auth, zod validation) → Controller → Service → Drizzle`. Business logic lives only in `services/`; controllers translate HTTP to service calls.

```text
app.js / server.js   Express app and entry point
config/              auth (JWT), CORS, rate limits, storage paths
routes/ controllers/ HTTP layer
services/            business logic and database access
validators/          zod request schemas
middlewares/         verifyToken / optionalToken, validate, error handling, request logging
drizzle/             schema, connection, migrations, migrate.js
database/seeds/      demo seed and its catalog
tests/integration/   node:test suites against a real Postgres
```

## API
All paths are relative to the API root (`/api` behind nginx). 🔒 = requires `Authorization: Bearer <token>`.

**Auth**
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ email, password (8–72), firstName, lastName, phone, city? }` → `{ token, user }`. Email and phone must be unique |
| POST | `/auth/login` | `{ identifier, password }`; identifier = email or phone → `{ token, user }` |
| GET | `/auth/me` 🔒 | Current user |

**Users and social**
| Method | Path | Notes |
|---|---|---|
| GET | `/user/:uid` | Public profile; the owner (with token) also gets email and phone |
| PATCH | `/user/:uid` 🔒 | Own profile only |
| POST / DELETE | `/follows/follow` 🔒 | `{ followedUserId }` |
| GET | `/follows/follow-status/:targetUserId` 🔒 | |
| GET | `/follows/following-feed` 🔒 | Listings from followed users |
| GET | `/follows/community/suggested` 🔒 | |
| GET | `/follows/community/search?q=` | Name search |
| GET | `/follows/followers/:userId`, `/follows/following/:userId`, `/follows/public-profile/:userId` | Public |

**Listings and orders**
| Method | Path | Notes |
|---|---|---|
| GET | `/clothes?excludeUser=&cursor=&limit=` | Active feed, cursor pagination |
| GET | `/clothes/:id` | Item detail |
| POST | `/clothes` 🔒 | Create listing; `images` = URLs from `/uploads` |
| PATCH | `/clothes/:id/sold` 🔒 | Owner marks sold |
| GET | `/user-closet/:userId` | Items listed or bought by a user |
| POST | `/checkout` 🔒 | `{ items: [uuid] }`; all-or-nothing; each item can be sold once |
| POST | `/re-list` 🔒 | Buyer relists a purchased item |

**Notifications and ratings**
| Method | Path | Notes |
|---|---|---|
| GET | `/notifications/:userId` 🔒 | Own notifications only |
| POST | `/ratings` 🔒 | `{ notificationId, rating 1–5, comment? }`; must answer your own pending rating request |
| GET | `/user-ratings/:userId` | Public |

**Media and AI**
| Method | Path | Notes |
|---|---|---|
| POST | `/uploads` 🔒 | Multipart `image` (JPEG/PNG/WebP, ≤ 5 MB) → `{ url }` |
| GET | `/uploads/:file` | Serves stored images (long-lived cache) |
| POST | `/ai/analyze` 🔒 | Multipart `image` → clothing check + name/category suggestions |
| GET | `/ping` | Health check |

Errors: `{ "status": "error", "message": "..." }`. Rate limits: 200 requests / 15 min per IP overall; 30 for register, login and ratings; 60 for uploads and AI analysis.

More on data and flows: [docs/DATA_FLOW.md](./docs/DATA_FLOW.md).
