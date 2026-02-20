# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

pnpm workspace with three packages under `apps/`:
- `apps/api` — Hono + Node.js REST API (`@tv-tracker/api`)
- `apps/ui` — React + Vite frontend (`@tv-tracker/ui`)
- `apps/shared` — shared TypeScript types consumed by both apps (`@tv-tracker/shared`)

## Commands

Run from the repo root unless noted.

```bash
# Dev (both apps in parallel)
pnpm dev

# Dev (individual)
pnpm dev:api
pnpm dev:ui

# Build
pnpm build          # both
pnpm build:api
pnpm build:ui

# Lint (ui only)
pnpm lint

# Start built API
pnpm --filter @tv-tracker/api start

# Database (run from apps/api/)
pnpm db:generate    # generate migration files from schema changes
pnpm db:migrate     # apply migrations
```

There are no tests at this time.

## Environment Setup

Copy `.env.sample` to `.env` in each app before running:

**`apps/api/.env`** — `DB_FILE_NAME`, `SERVER_PORT` (default 3000), `CLIENT_URL` (CORS), `JWT_SECRET`

**`apps/ui/.env`** — `VITE_API_URL` (default `http://localhost:3000`)

The SQLite database file is created at `apps/api/data/local.db` by default (directory must exist).

## Architecture

### API (`apps/api/src/`)

- **`index.ts`** — Hono app entry. Defines all routes. Two sub-routers: `api` (mounted at `/api`) and `auth` (mounted at `/api/auth`).
- **`tvmaze.ts`** — `TvMazeData` class. Wraps TVMaze API responses, resolves next/prev episode airdates via additional fetches to the episode links embedded in the show data.
- **`db/schema.ts`** — Drizzle ORM schema. Two tables: `users` and `tv_shows`. Also exports the `db` client (libsql/SQLite).
- **`db/dbShowFunctions.ts`** / **`db/dbUserFunctions.ts`** — Thin wrappers around Drizzle queries, one function per operation.
- **`utils/auth.ts`** — bcrypt password hashing and JWT sign/verify. `authMiddleware` is a Hono middleware that validates Bearer tokens and attaches `userId` to context.
- **`utils/envVars.ts`** — Single place to read and export env vars.
- **`utils/logger.ts`** — Pino logger instance, level driven by `logLevel` from `envVars.ts`.

**Shared types (`apps/shared/types/tv-tracker.ts`):** `Role`, `Credentials`, `RegistrationData`, `JwtData`, `ProfileData`, `UserData`, `UserDbData`. Imported by the API as `@shared/types/tv-tracker.js`.

**Data flow for adding a show:** client sends TVMaze ID → API fetches show from TVMaze → constructs `TvMazeData` (resolves episode links) → inserts into SQLite.

**Auth flow:** register/login return a JWT (7-day expiry). Protected routes use `authMiddleware`. Token is sent as `Authorization: Bearer <token>`.

### UI (`apps/ui/`)

React 19, React Router 7, Formik + Yup for forms, Axios for HTTP, `jwt-decode` for reading the token client-side. Source lives in `src/` (not yet written at time of writing).

## Key Constraints

- API uses ES modules (`"type": "module"`); imports must use `.js` extensions even for `.ts` source files.
- The `db` client in `schema.ts` is instantiated at module load time — env vars must be set before import.
- `scheduleDay` in the DB schema stores only the first element of the TVMaze `schedule.days` array (multi-day shows lose that data).
