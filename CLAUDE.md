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
# Dev: builds API and UI, then runs `wrangler dev` (Worker + static assets + local D1) on http://localhost:8787
# Wrangler serves the compiled output, so restart `pnpm dev` after code changes.
pnpm dev

# Vite UI dev server only (no API proxy configured; use `pnpm dev` for a working app)
pnpm dev:ui

# Build
pnpm build          # both
pnpm build:api      # generates worker-configuration.d.ts, then tsc && tsc-alias
pnpm build:ui

# Deploy (builds, then wrangler deploy)
pnpm deploy

# Lint (api + ui)
pnpm lint

# Database
pnpm --filter @tv-tracker/api db:generate        # generate migration files from schema changes
wrangler d1 migrations apply tv-tracker --local   # apply migrations to local D1 (run from repo root)
wrangler d1 migrations apply tv-tracker --remote  # apply migrations to production D1
```

Tests exist for both apps (Vitest). Run them:

```bash
# API tests (from repo root; mocks D1, no wrangler needed)
pnpm --filter @tv-tracker/api test

# UI tests (React Testing Library + jsdom)
pnpm --filter @tv-tracker/ui test -- --run

# A single test file
pnpm --filter @tv-tracker/api test tests/auth.test.ts
pnpm --filter @tv-tracker/ui test -- --run tests/oneShow.test.tsx
```

## Environment Setup

The API runs as a Cloudflare Worker. Config lives in `wrangler.jsonc` (D1 binding `TV_DB`, static assets from `apps/ui/dist`, hourly cron, `ENVIRONMENT=production`).

**Local secrets:** create `.dev.vars` in the repo root (gitignored). Without `JWT_SECRET`, login, register and demo all fail with a 500 when signing tokens.

```
JWT_SECRET=<openssl rand -base64 32>
ENVIRONMENT=development
```

`ENVIRONMENT=development` is required locally: `wrangler.jsonc` sets `production`, which makes auth cookies `Secure` + `SameSite=None`, and these are not stored over plain http.

Optional vars (see `apps/api/src/utils/bindings.ts` / `envVars.ts`): `CLIENT_URL` (comma-separated CORS origins, default `http://localhost:8787`), `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRY_MINUTES` (15), `JWT_EXPIRATION_DAYS` (refresh token lifetime, 7), `BCRYPT_SALT_ROUNDS` (10), `LOG_LEVEL`.

Production: `wrangler secret put JWT_SECRET`.

Before the first `pnpm dev`, run `wrangler d1 migrations apply tv-tracker --local`. Wrangler requires Node 22+ (declared in `engines` in `package.json`).

## Architecture

### API (`apps/api/src/`)

- **`index.ts`** — Worker entry point. Exports `fetch` (the Hono app from `app.ts`) and a `scheduled` handler (hourly cron) that purges expired demo users.
- **`app.ts`** — Hono app definition. Registers CORS, prettyJSON, logger middleware, and mounts three routers: `authRoutes` at `/api/auth`, `adminRoutes` at `/api/admin`, `userRoutes` at `/api/user`.
- **`routes/auth.ts`** / **`routes/user.ts`** / **`routes/admin.ts`** — Route handlers per domain. Zod validation via `@hono/zod-validator` using schemas from `schemas/`.
- **`schemas/auth.ts`** / **`schemas/show.ts`** — Zod schemas for request validation.
- **`tvmaze.ts`** — `TvMazeData` class. Wraps TVMaze API responses, resolves next/prev episode airdates via additional fetches to the episode links embedded in the show data.
- **`db/schema.ts`** — Drizzle ORM schema. Two tables: `users` and `tv_shows`.
- **`db/client.ts`** — `getDb(c.env.TV_DB)` wraps the D1 binding in a Drizzle client. Create it per request; there is no module-level client.
- **`db/dbShowFunctions.ts`** / **`db/dbUserFunctions.ts`** — Thin wrappers around Drizzle queries, one function per operation.
- **`demo/seedShows.ts`** — Demo-mode constants (reserved email domain `demo.invalid`, user cap, TTL) and the static seed show list.
- **`utils/auth.ts`** — Refresh-token generation/hashing (SHA-256) and auth cookie set/clear helpers.
- **`utils/middleware.ts`** — `authMiddleware` (verifies the `accessToken` cookie JWT, attaches `jwtPayload` to context), `requireRole`, and the request logger.
- **`utils/jobQueue.ts`** — `waitUntil` background jobs: episode-date updates after adding a show, and the demo-show refresh.
- **`utils/bindings.ts`** — `Bindings` type for `c.env` (D1 binding and env vars).
- **`utils/response.ts`** — Helpers for consistent JSON response shapes: `ok(data)` → `{ ok: true, data }`, `err(msg)` → `{ ok: false, error }`.
- **`utils/envVars.ts`** — Single place to read and export env vars.

**API routes summary:**
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `DELETE /api/auth/deleteUser`
- `POST /api/auth/demo` — creates an ephemeral, pre-seeded demo user (role `user`, unusable password) and signs it in; 503 when the demo-user cap is reached
- `GET /api/user/profile`
- `GET /api/user/tvshows` — all shows for the authenticated user
- `GET /api/user/tvshow/:id` — single show by DB id
- `POST /api/user/tvshow` — add show from full TVMaze JSON body
- `POST /api/user/tvshow/:id` — add show by TVMaze ID (API fetches from TVMaze)
- `PATCH /api/user/tvshow/:id` — refresh show data from TVMaze
- `DELETE /api/user/tvshow/:id`
- `GET /api/admin/users` (admin role only)

**Shared types (`apps/shared/types/tv-tracker.ts`):** `Role`, `Credentials`, `RegistrationData`, `JwtData`, `ProfileData`, `UserData`, `UserDbData`. Imported by the API as `@shared/types/tv-tracker.js`.

**Data flow for adding a show:** client sends TVMaze ID → API fetches show from TVMaze → constructs `TvMazeData` → inserts into D1 → episode airdates are resolved afterwards in the background (`scheduleEpisodeUpdate` via `ctx.waitUntil`).

**Auth flow:** register/login/demo set two HttpOnly cookies: `accessToken` (JWT, 15 min, path `/api`) and `refreshToken` (opaque, 7 days, path `/api/auth`; only its SHA-256 hash is stored in `users`). Protected routes use `authMiddleware`, which reads the `accessToken` cookie. On a 401 the UI calls `/api/auth/refresh` once and retries. There is no `Authorization` header.

**Demo mode:** `POST /api/auth/demo` creates `demo-<uuid>@demo.invalid` users seeded with 7 shows. The cron in `wrangler.jsonc` deletes demo users older than 24h (shows cascade-delete). Demo users are identified only by the `@demo.invalid` email domain, so that domain is reserved: `registrationSchema` rejects it. When the demo-user cap is hit, the demo route purges expired demo users once and re-checks before returning 503.

### UI (`apps/ui/`)

React 19, React Router 7, MUI (Material UI v7 + Emotion), react-hook-form + `@hookform/resolvers` for forms. API calls go through a typed Hono RPC client (`utils/honoClient.ts`, typed from the API's `AppType`) built on `authenticatedFetch` (`utils/requests.ts`, cookie credentials + refresh-on-401). Axios is used for direct TVMaze calls.

**Design system — Broadcast Noir:** The UI uses a custom cinematic dark/light theme defined in `apps/ui/src/utils/theme.ts`. All styling must stay consistent with this system.
- **Fonts:** Cormorant Garamond (display/titles), Space Mono (metadata, UI, monospace elements)
- **Dark palette:** bg `#080b12`, surface `#0f1420`, text `#e8e0d0`, accent `#e63946`, amber `#f2a65a`
- **Light palette:** bg `#f4f0e8`, surface `#ede8de`, text `#1a1510`, accent `#c8102e`, amber `#c8760a`
- All colors are exposed as CSS custom properties (`--bg`, `--surface`, `--accent`, `--amber`, etc.) via `MuiCssBaseline` overrides — prefer these vars over hardcoded hex in component styles.
- Border radius is 0 globally (sharp corners throughout).
- Do not introduce MUI default colors, rounded corners, or generic component styles — they will clash with the theme.

**Context hierarchy** (outermost first): `ThemeProvider` → `AuthProvider` → `AlertProvider` → `ShowProvider` → `AppContent`

- **`AuthProvider`** — stores `ProfileData | null`. On mount, validates the cookie session by calling `/api/user/profile`. Exposes `login()` (call after a successful auth request; it fetches the profile) and `logout()`.
- **`ShowProvider`** — holds the in-memory `ShowData[]` array; populated by the `AllShows` page on load.
- **`AlertProvider`** — global snackbar/alert state consumed via `useAlert()`.
- **`ThemeProvider`** — MUI theme toggle (light/dark), persisted to `localStorage`.

**`apis/`** — one file per API domain (`authRequests.ts`, `userRequests.ts`). All functions return `{ success, data?, error? }`. The UI also calls TVMaze directly (search, episode dates) from `userRequests.ts`.

**Routes:** `/` splash · `/login` · `/register` · `/dashboard` (AllShows) · `/tvshow/:showID` · `/search/:showName` · `/search/show/:showID`

**Token storage:** tokens live only in HttpOnly cookies set by the API; the UI never reads or stores them. `localStorage` holds UI preferences only (theme, view mode, table sort).

## Key Constraints

- API uses ES modules (`"type": "module"`); imports must use `.js` extensions even for `.ts` source files.
- Runtime env comes from `c.env` (Workers bindings), not `process.env`. Pass `c.env` / `env` into helpers rather than reading globals.
- D1 enforces foreign keys; `tv_shows` rows cascade-delete with their user.
- `wrangler.jsonc` `main` points at the compiled output (`apps/api/dist/api/src/index.js`), so the API must be built before `wrangler dev`; `pnpm dev` and `pnpm deploy` both run a full `pnpm build` first.
- `apps/shared/` has no build step — TypeScript source only. The API's `tsc` build includes shared files transitively via the `@shared/*` path alias, causing TypeScript to infer `rootDir` as `apps/`. Compiled API output therefore lands at `dist/api/src/` (not `dist/src/`). `tsc-alias` post-processes the output to rewrite `@shared/*` imports to relative paths.
- Migration files in `apps/api/drizzle/` must be committed; `wrangler d1 migrations apply` reads them (`migrations_dir` in `wrangler.jsonc`).

## Checking Documentation

- **important:** when implementing any lib/framework-specific features, ALWAYS check the appropriate lib/framework documentation using the Context7 MCP server before writing any code.
