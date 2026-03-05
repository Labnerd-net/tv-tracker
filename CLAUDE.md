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
pnpm build:api      # runs tsc && tsc-alias
pnpm build:ui

# Lint (ui only)
pnpm lint

# Start built API
pnpm --filter @tv-tracker/api start

# Database (run from apps/api/)
pnpm db:generate    # generate migration files from schema changes
pnpm db:migrate     # apply migrations locally via drizzle-kit
```

Tests exist in `apps/api/tests/`. Run them:

```bash
# Run API tests (from repo root)
pnpm --filter @tv-tracker/api test

# Run a single test file
pnpm --filter @tv-tracker/api test tests/auth.test.ts
```

## Environment Setup

Copy `.env.sample` to `.env` in each app before running:

**`apps/api/.env`** — `DB_FILE_NAME`, `SERVER_PORT` (default 3000), `CLIENT_URL` (CORS), `JWT_SECRET`

**`apps/ui/.env`** — no required variables; API requests are proxied via Vite dev server (local) or nginx (Docker)

The SQLite database file is created at `apps/api/data/local.db` by default (directory must exist).

## Architecture

### API (`apps/api/src/`)

- **`index.ts`** — Entry point. Starts the `@hono/node-server` with the app from `app.ts`.
- **`app.ts`** — Hono app definition. Registers CORS, prettyJSON, logger middleware, and mounts three routers: `authRoutes` at `/api/auth`, `adminRoutes` at `/api/admin`, `userRoutes` at `/api/user`.
- **`routes/auth.ts`** / **`routes/user.ts`** / **`routes/admin.ts`** — Route handlers per domain. Zod validation via `@hono/zod-validator` using schemas from `schemas/`.
- **`schemas/auth.ts`** / **`schemas/show.ts`** — Zod schemas for request validation.
- **`tvmaze.ts`** — `TvMazeData` class. Wraps TVMaze API responses, resolves next/prev episode airdates via additional fetches to the episode links embedded in the show data.
- **`db/schema.ts`** — Drizzle ORM schema. Two tables: `users` and `tv_shows`. Also exports the `db` client (libsql/SQLite).
- **`db/dbShowFunctions.ts`** / **`db/dbUserFunctions.ts`** — Thin wrappers around Drizzle queries, one function per operation.
- **`migrate.ts`** — Programmatic migration runner used in production. Runs `drizzle-orm/libsql/migrator` against `apps/api/drizzle/`.
- **`utils/auth.ts`** — bcrypt password hashing and JWT sign/verify.
- **`utils/middleware.ts`** — `authMiddleware` (validates Bearer tokens, attaches `userId` to context) and Pino request logger.
- **`utils/rateLimiter.ts`** — Rate limiting middleware.
- **`utils/response.ts`** — Helpers for consistent JSON response shapes: `ok(data)` → `{ ok: true, data }`, `err(msg)` → `{ ok: false, error }`.
- **`utils/envVars.ts`** — Single place to read and export env vars.

**API routes summary:**
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/user/profile`
- `GET /api/user/tvshows` — all shows for the authenticated user
- `GET /api/user/tvshow/:id` — single show by DB id
- `POST /api/user/tvshow` — add show from full TVMaze JSON body
- `POST /api/user/tvshow/:id` — add show by TVMaze ID (API fetches from TVMaze)
- `PATCH /api/user/tvshow/:id` — refresh show data from TVMaze
- `DELETE /api/user/tvshow/:id`
- `GET /api/admin/users`, `DELETE /api/admin/user/:id`

**Shared types (`apps/shared/types/tv-tracker.ts`):** `Role`, `Credentials`, `RegistrationData`, `JwtData`, `ProfileData`, `UserData`, `UserDbData`. Imported by the API as `@shared/types/tv-tracker.js`.

**Data flow for adding a show:** client sends TVMaze ID → API fetches show from TVMaze → constructs `TvMazeData` (resolves episode links) → inserts into SQLite.

**Auth flow:** register/login return a JWT (7-day expiry). Protected routes use `authMiddleware`. Token is sent as `Authorization: Bearer <token>`.

### UI (`apps/ui/`)

React 19, React Router 7, MUI (Material UI v7 + Emotion), react-hook-form + `@hookform/resolvers` for forms, Axios for HTTP, `jwt-decode` for reading the token client-side.

**Design system — Broadcast Noir:** The UI uses a custom cinematic dark/light theme defined in `apps/ui/src/utils/theme.ts`. All styling must stay consistent with this system.
- **Fonts:** Cormorant Garamond (display/titles), Space Mono (metadata, UI, monospace elements)
- **Dark palette:** bg `#080b12`, surface `#0f1420`, text `#e8e0d0`, accent `#e63946`, amber `#f2a65a`
- **Light palette:** bg `#f4f0e8`, surface `#ede8de`, text `#1a1510`, accent `#c8102e`, amber `#c8760a`
- All colors are exposed as CSS custom properties (`--bg`, `--surface`, `--accent`, `--amber`, etc.) via `MuiCssBaseline` overrides — prefer these vars over hardcoded hex in component styles.
- Border radius is 0 globally (sharp corners throughout).
- Do not introduce MUI default colors, rounded corners, or generic component styles — they will clash with the theme.

**Context hierarchy** (outermost first): `ThemeProvider` → `AuthProvider` → `AlertProvider` → `ShowProvider` → `AppContent`

- **`AuthProvider`** — stores `ProfileData | null`. On mount, validates any existing `localStorage.jwt` by calling `/api/user/profile`. Exposes `login(token)`, `logout()`.
- **`ShowProvider`** — holds the in-memory `ShowData[]` array; populated by the `AllShows` page on load.
- **`AlertProvider`** — global snackbar/alert state consumed via `useAlert()`.
- **`ThemeProvider`** — MUI theme toggle (light/dark), persisted to `localStorage`.

**`apis/`** — one file per API domain (`authRequests.ts`, `userRequests.ts`, `adminRequests.ts`). All functions return `{ success, data?, error? }`. The UI also calls TVMaze directly (search, episode dates) from `userRequests.ts`.

**Routes:** `/` splash · `/login` · `/register` · `/dashboard` (AllShows) · `/tvshow/:showID` · `/search/:showName` · `/search/show/:showID`

**Token storage:** JWT is stored in `localStorage` under the key `jwt`. `getAuthHeaders()` in `utils/requests.ts` reads it for every authenticated request.

## Key Constraints

- API uses ES modules (`"type": "module"`); imports must use `.js` extensions even for `.ts` source files.
- The `db` client in `schema.ts` is instantiated at module load time — env vars must be set before import.
- `DB_FILE_NAME` must use the `file:` URL prefix (e.g. `file:data/local.db`). A plain path throws `URL_INVALID` from libsql at startup.
- `scheduleDay` in the DB schema stores only the first element of the TVMaze `schedule.days` array (multi-day shows lose that data).
- `apps/shared/` has no build step — TypeScript source only. The API's `tsc` build includes shared files transitively via the `@shared/*` path alias, causing TypeScript to infer `rootDir` as `apps/`. Compiled API output therefore lands at `dist/api/src/` (not `dist/src/`). `tsc-alias` post-processes the output to rewrite `@shared/*` imports to relative paths.
- Migration files in `apps/api/drizzle/` must be committed — they are needed at Docker build time and used by `migrate.ts` at container startup.

## Checking Documentation

- **important:** when implementing any lib/framework-specific features, ALWAYS check the appropriate lib/framework documentation using the Context7 MCP server before writing any code.
