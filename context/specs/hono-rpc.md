# Spec for Hono RPC Type-Safe Client

Title: Hono RPC Type-Safe Client
Branch: claude/feature/hono-rpc
Spec file: context/specs/hono-rpc.md

## Summary

Replace the manually typed Axios request functions in the UI with a Hono RPC client generated from the server's route types. The API exports an `AppType` that the UI imports, giving TypeScript compile-time enforcement of request/response shapes across the monorepo. If a route's input or output changes, the build breaks rather than failing silently at runtime.

The TVMaze-direct calls (`fetchNextEpisodeDate`, `fetchPrevEpisodeDate`, `tvShowResults`, `returnSearchShow`) talk directly to the TVMaze API — not our server — and stay as Axios calls unchanged.

## Functional Requirements

- Each route file (`auth.ts`, `user.ts`, `admin.ts`) exports a typed Hono app instance.
- `app.ts` assembles those routers and exports `AppType` (the inferred type of the composed app).
- The UI creates a Hono RPC client via `hc<AppType>(baseUrl)` (from `hono/client`) and uses it in `userRequests.ts`, `authRequests.ts`, and `adminRequests.ts`.
- The existing wrapper functions (e.g. `getUserProfile()`, `getAllShows()`) remain — only their internals change from Axios to the RPC client. Return types stay `ApiResponse<T>` so no component changes are needed.
- Cookie-based auth continues to work: the RPC client must be configured with `credentials: 'include'` so the browser sends `accessToken` and `refreshToken` cookies.
- The TVMaze-direct functions in `userRequests.ts` are unchanged.

## Possible Edge Cases

- Hono RPC requires route responses to be typed explicitly enough for TypeScript to infer them. Routes that return different shapes depending on a condition (e.g. `POST /api/user/tvshow` returns `{ status: 'added', showId }` or `{ status: 'exists' }`) must have their union type represented in the route definition or the inferred type will be too wide.
- The `ok()` and `err()` helper return types (`{ ok: true, data }` / `{ ok: false, error }`) are what Hono RPC will expose to the client. The UI wrappers currently translate these to `{ success: true, data }` / `{ success: false, error }`. That translation layer must remain so no component-level code changes.
- The Vite dev proxy (`/api` → `localhost:3000`) means the RPC client base URL in development should be `/` or an empty string so requests go through the proxy. In production (Docker/nginx) the same applies. Verify this works identically to the current Axios setup.
- Admin routes are authenticated and role-gated server-side. The RPC client itself doesn't know about roles — it just sends the cookie. No change needed to admin route logic.
- Zod validation via `zValidator` currently uses a `validationHook` for error formatting. This must continue to work after any route typing changes.

## Acceptance Criteria

- `pnpm build` passes with no TypeScript errors.
- All existing API tests pass unchanged (`pnpm --filter @tv-tracker/api test`).
- All UI functionality works as before in the browser (login, show list, add/refresh/delete, search).
- Deliberately changing a route's response shape in `user.ts` causes a TypeScript error in `userRequests.ts` at build time.
- No component files (`.tsx`) need to change — all changes are contained to route files and `apis/*.ts`.

## Open Questions

- None. Approach is clear.

## Testing Guidelines

No new tests are needed. The acceptance test for this feature is the build itself — TypeScript enforcing correctness across the boundary is the entire point. Verify that:
- The existing API test suite still passes after route typing changes.
- A deliberate type mismatch (add a test comment showing the break) would be caught at build time.

## Personal Opinion

This is the right call for a monorepo with a private API. The existing `ApiResponse<T>` discriminated union added in a previous feature was a step in this direction — Hono RPC completes it by making the server the single source of truth for types rather than maintaining parallel type definitions. The scope is moderate: route typing changes plus three `apis/*.ts` file rewrites. No component changes, no DB changes, no schema changes. The risk of regressions is low because the existing test suite covers the API and the UI wrapper functions have the same signatures. Good complexity-to-value ratio.
