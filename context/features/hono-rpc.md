# Plan: Hono RPC Type-Safe Client

## Context

The API and UI are in the same monorepo but their type contract is maintained manually — `userRequests.ts` and `authRequests.ts` have hand-typed return shapes that can silently drift from what the API actually returns. Hono RPC lets the UI import `AppType` from the server and creates a typed client; TypeScript then enforces the contract at build time so drift is caught before it reaches runtime.

## Approach

8 files change. No component files change. Axios stays in the project for the TVMaze-direct calls; the API calls switch to a Hono RPC client with a custom `fetch` wrapper that replicates the existing 401/refresh/retry interceptor logic.

---

## Step 1 — Fix `response.ts` helpers (API)

**File:** `apps/api/src/utils/response.ts`

Make `ok()` generic so TypeScript can infer the response type through the route handler into `AppType`:

```typescript
export const ok = <T>(data: T) => ({ ok: true as const, data });
export const err = (msg: string) => ({ ok: false as const, error: msg });
```

`as const` on the discriminant is required — without it, TypeScript widens `ok` to `boolean` and type narrowing breaks in the client.

---

## Step 2 — Export `AppType` (API)

**File:** `apps/api/src/app.ts`

Add one line after the existing `export default app`:

```typescript
export type AppType = typeof app;
```

No other changes to `app.ts`.

---

## Step 3 — Add path alias for `@api/*`

**File:** `tsconfig.base.json`

Add `@api/*` alongside the existing `@shared/*` alias:
```json
"paths": {
  "@shared/*": ["apps/shared/*"],
  "@api/*": ["apps/api/src/*"]
}
```

**File:** `apps/ui/vite.config.ts`

Add `@api` alias alongside the existing `@shared` alias:
```typescript
alias: {
  '@shared': path.resolve(__dirname, '../shared'),
  '@api': path.resolve(__dirname, '../api/src'),
},
```

This follows the exact same pattern already used for `@shared`.

---

## Step 4 — Add `hono` to UI dependencies

**File:** `apps/ui/package.json`

Add `hono` at the same version already used by the API (currently `^4.11.3`). `hono/client` is part of the main `hono` package — no separate install needed.

---

## Step 5 — Replace Axios interceptor with custom fetch (UI)

**File:** `apps/ui/src/utils/requests.ts`

Remove: `apiClient` (axios instance) and the response interceptor.
Keep: `setLogoutCallback`, `handleApiError` (still needed for the TVMaze Axios calls in `userRequests.ts`).
Add: `authenticatedFetch` — a native fetch wrapper with the same queue-based 401/refresh/retry logic.

The queue logic maps directly from Axios to fetch:
- `isRefreshing` flag and `refreshQueue` array stay identical
- On 401: if already refreshing, queue and await; otherwise start refresh via plain `fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })`
- On refresh success: process queue, retry original request
- On refresh failure: reject queue, call `logoutCallback?.()`, rethrow
- `credentials: 'include'` on every request (replaces `withCredentials: true`)

The refresh call uses a plain `fetch` (not `authenticatedFetch`) to avoid recursion.

---

## Step 6 — Create Hono RPC client (UI)

**File:** `apps/ui/src/utils/honoClient.ts` (new)

```typescript
import { hc } from 'hono/client';
import type { AppType } from '@api/app';
import { authenticatedFetch } from './requests';

export const client = hc<AppType>('/', { fetch: authenticatedFetch });
```

Base URL `'/'` works because the Vite proxy forwards `/api/*` to the API server in dev, and nginx does the same in production. The hono client builds paths by combining the base URL with the route path.

---

## Step 7 — Rewrite `authRequests.ts` internals (UI)

**File:** `apps/ui/src/apis/authRequests.ts`

Replace `apiClient.post/delete` calls with typed hono client calls. Function signatures stay identical (`loginUser`, `registerUser`, `deleteUser` with the same `ApiVoidResponse` return type). The response shape from the API (`{ ok: true, data: {} }` / `{ ok: false, error: string }`) maps to `{ success: true }` / `{ success: false, error }` in the same translation step.

Error handling: replace `handleApiError` (which uses `axios.isAxiosError`) with a simple catch block returning `{ success: false, error: 'An unexpected error occurred' }` — the only errors that reach the catch block are network failures, since 4xx/5xx responses come back as typed responses, not throws.

---

## Step 8 — Rewrite `userRequests.ts` internals (UI)

**File:** `apps/ui/src/apis/userRequests.ts`

Same approach as Step 7 for the 6 API-bound functions (`getUserProfile`, `getAllShows`, `getOneShow`, `addNewShowJson`, `updateShow`, `deleteShow`).

The 4 TVMaze-direct functions (`fetchNextEpisodeDate`, `fetchPrevEpisodeDate`, `tvShowResults`, `returnSearchShow`) are **unchanged** — they use axios directly to `api.tvmaze.com` and are unrelated to our typed client. Keep the `handleApiError` import for these.

---

## Verification

1. `pnpm build` — must pass with no TypeScript errors
2. `pnpm --filter @tv-tracker/api test` — all existing tests pass (no API logic changed)
3. Browser smoke test: login, view shows, add/refresh/delete a show, run a search
4. Type-safety validation: temporarily change a route's `c.json(ok({ ... }))` shape in `user.ts` and confirm `userRequests.ts` shows a TypeScript error at the call site
5. Token refresh: let the access token expire and confirm automatic refresh still works

---

## Files Changed Summary

| File | Change |
|------|--------|
| `apps/api/src/utils/response.ts` | Make `ok<T>()` generic |
| `apps/api/src/app.ts` | Export `AppType` |
| `tsconfig.base.json` | Add `@api/*` path alias |
| `apps/ui/vite.config.ts` | Add `@api` Vite alias |
| `apps/ui/package.json` | Add `hono` dependency |
| `apps/ui/src/utils/requests.ts` | Replace Axios interceptor with `authenticatedFetch`, keep `handleApiError` |
| `apps/ui/src/utils/honoClient.ts` | New file — exports typed `client` |
| `apps/ui/src/apis/authRequests.ts` | Rewrite internals to use hono client |
| `apps/ui/src/apis/userRequests.ts` | Rewrite API call internals; TVMaze calls unchanged |
