# TV Tracker

A self-hosted TV show tracker. Add shows from TVMaze, see upcoming and previous episode dates, and manage your watchlist.

## Stack

| Layer | Tech |
|---|---|
| API | Hono + Node.js, SQLite via libsql/Drizzle ORM |
| UI | React 19, React Router 7, MUI v7 (Broadcast Noir theme) |
| Auth | JWT (7-day expiry), bcrypt passwords |
| Data source | [TVMaze public API](https://www.tvmaze.com/api) |
| Runtime | Node.js, pnpm workspaces |

## Self-Hosting with Docker

Pre-built images are published to GitHub Container Registry on every release:

- `ghcr.io/labnerd-net/tv-tracker-api:latest`
- `ghcr.io/labnerd-net/tv-tracker-ui:latest`

> **Note on the UI image:** `VITE_API_URL` is baked into the bundle at build time. The pre-built image defaults to `http://localhost:3000`. If your API is hosted elsewhere, you need to build the UI image yourself — the `docker-compose.yml` in this repo handles that automatically.

**1. Clone the repo**

```bash
git clone https://github.com/Labnerd-net/tv-tracker.git
cd tv-tracker
```

**2. Edit `docker-compose.yml`**

At minimum, update these values:

| Variable | Description |
|---|---|
| `JWT_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `CLIENT_URL` | Public URL of the UI (used for CORS on the API) |
| `VITE_API_URL` | Public URL of the API (baked into the UI bundle at build time) |

**3. Start**

```bash
docker compose up -d
```

The UI image is built locally on first run so that your `VITE_API_URL` is embedded correctly. The API runs database migrations automatically on startup. SQLite data is persisted in the named Docker volume `tv-tracker-data`.

---

## Prerequisites

- Node.js 20+
- pnpm 9+

## Local Dev Setup

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment**

```bash
cp apps/api/.env.sample apps/api/.env
cp apps/ui/.env.sample apps/ui/.env
```

Edit `apps/api/.env` — at minimum set a real `JWT_SECRET`:

```
DB_FILE_NAME=file:data/local.db
SERVER_PORT=3000
CLIENT_URL=http://localhost:5173
JWT_SECRET=<your-secret>   # openssl rand -base64 32
```

**3. Create the database directory and run migrations**

```bash
mkdir -p apps/api/data
cd apps/api && pnpm db:migrate && cd ../..
```

**4. Start dev servers**

```bash
pnpm dev
```

UI runs at `http://localhost:5173`, API at `http://localhost:3000`.

## Commands

Run from repo root unless noted.

```bash
pnpm dev              # both apps in watch mode
pnpm dev:api          # API only
pnpm dev:ui           # UI only

pnpm build            # build both
pnpm build:api        # tsc + tsc-alias (output: dist/api/src/)
pnpm build:ui

pnpm lint             # ESLint (UI)

# Tests (API)
pnpm --filter @tv-tracker/api test
pnpm --filter @tv-tracker/api test tests/auth.test.ts

# Database (run from apps/api/)
pnpm db:generate      # generate migration from schema changes
pnpm db:migrate       # apply migrations
```

## Project Structure

```
apps/
  api/        Hono REST API
    src/
      routes/           auth, user, admin route handlers
      db/               Drizzle schema + query wrappers
      schemas/          Zod request schemas
      utils/            auth, middleware, rate limiter, response helpers
      tvmaze.ts         TVMaze API wrapper
    drizzle/            migration files (commit these)
    data/               SQLite DB file (gitignored)
  ui/         React frontend
    src/
      apis/             one file per API domain
      contexts/         Auth, Show, Alert, Theme providers
      pages/            route-level components
      components/       shared UI components
      utils/            theme, request helpers
  shared/     Shared TypeScript types (no build step)
```

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/user/profile
GET    /api/user/tvshows
GET    /api/user/tvshow/:id
POST   /api/user/tvshow           # add by full TVMaze JSON body
POST   /api/user/tvshow/:id       # add by TVMaze show ID
PATCH  /api/user/tvshow/:id       # refresh from TVMaze
DELETE /api/user/tvshow/:id

GET    /api/admin/users
DELETE /api/admin/user/:id
```

All protected routes require `Authorization: Bearer <token>`.

## Admin Account

The first user to register with the email matching `ADMIN_EMAIL` (optional env var) is granted the admin role. If `ADMIN_EMAIL` is not set, no admin account is created automatically.

## Notes

- The SQLite file must be at a path prefixed with `file:` (e.g. `file:data/local.db`). A bare path will throw `URL_INVALID` at startup.
- The rate limiter is in-memory — state resets on server restart and is not suitable for multi-instance deployments.
- Migration files in `apps/api/drizzle/` must be committed; they are applied at container startup in production via `migrate.ts`.
