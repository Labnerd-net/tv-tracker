# Spec: Migrate from Dokploy to Cloudflare Workers

## Goal

Move the entire tv-tracker stack (API + UI) off Dokploy onto Cloudflare Workers as a single deployment unit. No separate Pages deployment — the Worker serves both the Hono API (`/api/*`) and the Vite-built SPA as static assets via the Workers asset binding.

## Motivation

All other projects are already on Cloudflare. Dokploy is running solely for this app and is not worth maintaining for one service. Cloudflare is now the recommended platform for full-stack apps (Workers over Pages).

## Target Architecture

```
Single Cloudflare Worker
├── /api/*          → Hono app (D1 DB binding, env bindings)
└── /*              → Static asset serving (Vite-built SPA)
```

- `wrangler.jsonc` at repo root ties it together
- D1 database replaces file-based SQLite
- Migrations run via Wrangler CLI (not `migrate.ts` at startup)
- No Pino, no dotenv, no `@hono/node-server`

## What Changes

### 1. Database — `@libsql/client` → Cloudflare D1

- Add Drizzle's D1 adapter (`drizzle-orm/d1`)
- `db` client is no longer instantiated at module load; it's created per-request from `c.env.DB` (the D1 binding)
- `LibSQLDatabase` type replaced with `DrizzleD1Database` throughout `dbShowFunctions.ts` and `dbUserFunctions.ts`
- `db/client.ts` is removed; `db` is passed as a parameter or accessed via context
- `migrate.ts` is removed; migrations applied with `wrangler d1 migrations apply`
- Drizzle config (`drizzle.config.ts`) updated to target D1

### 2. Worker Entry Point

- `apps/api/src/index.ts` currently uses `@hono/node-server` `serve()` — replaced with:
  ```ts
  export default { fetch: app.fetch }
  ```
- `app.ts` needs to accept D1 and other bindings via Hono's typed env (`Bindings` type) rather than module-level singletons
- `@hono/node-server` and `dotenv` removed from dependencies

### 3. Environment Variables → Workers Bindings

- All `process.env.*` reads in `envVars.ts` are replaced with values from `c.env` (typed `Bindings` interface)
- Secrets (`JWT_SECRET`, etc.) set via `wrangler secret put`
- `envVars.ts` becomes a typed `Bindings` interface; consumed via `c.env` in route handlers and middleware

### 4. Logger — Pino → Console

- Pino uses Node.js streams; Workers runtime doesn't support it
- Replace with thin wrapper around `console.log/warn/error` that matches the existing call signature (structured object + message string)
- Workers Logs (Cloudflare dashboard) captures stdout natively

### 5. Job Queue — Drop Retry Delays, Use `waitUntil`

- Current queue retries with 5s/15s backoff — these `setTimeout` delays inside `waitUntil` exceed Workers' CPU budget
- New approach: fire-and-forget background task via `ctx.waitUntil(promise)` — one attempt, no retry
- `jobQueue.ts` simplified or removed; `scheduleEpisodeUpdate()` takes a `ctx: ExecutionContext` parameter and calls `ctx.waitUntil(updateEpisodes(...))`
- Acceptable tradeoff for a personal app

### 6. Rate Limiter — Remove

- In-memory state resets between Worker invocations; the current approach gives no protection in a serverless context
- Remove `rateLimiter.ts` and all middleware references
- Rely on Cloudflare's network-layer rate limiting rules (configured in the dashboard or `wrangler.jsonc` if using the Rate Limiting API)

### 7. UI — Cloudflare Vite Plugin

- Add `@cloudflare/vite-plugin` to `apps/ui`
- Update `vite.config.ts` to use the plugin
- `wrangler.jsonc` `assets.directory` points to `apps/ui/dist`
- The dev proxy in `vite.config.ts` (currently proxying `/api` to localhost:3000) is replaced by the Vite plugin's Workers integration for local dev
- No component or API call changes needed

### 8. `wrangler.jsonc`

New file at repo root:
```jsonc
{
  "name": "tv-tracker",
  "main": "apps/api/dist/api/src/index.js",
  "compatibility_date": "2025-01-01",
  "assets": {
    "directory": "./apps/ui/dist",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "tv-tracker",
      "database_id": "<id after creation>"
    }
  ]
}
```

### 9. Build Process

- `pnpm build` still builds both apps
- Deployment: `wrangler deploy` from repo root after build
- D1 migration: `wrangler d1 migrations apply tv-tracker --remote` (run manually before deploying schema changes)
- Local dev: `wrangler dev` (replaces `pnpm dev` for integrated local testing); `pnpm dev` still works for pure Node dev

## What Does NOT Change

- All Hono route handlers (logic unchanged)
- All Drizzle schema definitions (`schema.ts`)
- All Zod schemas
- All UI components, hooks, contexts, and pages
- Hono RPC typed client in UI
- `hono/jwt` (already uses Web Crypto API)
- `bcryptjs` (pure JS, already Workers-compatible)
- `node:crypto` usage in `utils/auth.ts` — Workers supports `node:crypto` via compatibility flags

## Open Questions

1. Should `node:crypto` compatibility flag be added to `wrangler.jsonc`, or migrate `generateRefreshToken()` to `crypto.randomUUID()` (available natively on Workers)?
2. Local dev story: use `wrangler dev` exclusively, or keep `pnpm dev` (Node) working in parallel for faster iteration?

## Out of Scope

- SSR — the app stays a SPA
- Any feature changes
- Docker / Dokploy cleanup (done separately after confirming Workers deployment is stable)

## Acceptance Criteria

- [ ] `wrangler deploy` succeeds from repo root
- [ ] `pnpm build` passes with no TypeScript errors
- [ ] Login, show list, add show, refresh show, delete show all work end-to-end
- [ ] D1 database contains migrated schema
- [ ] No secrets hardcoded; all env via `wrangler secret`
