# TODO

Potential issues, improvements, and edits identified during code review.

---

## Backend

### Issues

- ~~**`/api/auth/refresh` has no rate limit**~~ — fixed: `authRateLimit` now applied to the refresh endpoint.

- ~~**`/api/auth/deleteUser` deletes without clearing the refresh cookie**~~ — fixed: `clearRefreshToken` is called before deletion, and `setCookie` with `maxAge: 0` clears the cookie with matching `secure`/`sameSite` flags.

- ~~**`scheduleDay` data loss**~~ — fixed: column now stores a JSON array (`string[]`), same pattern as `roles`. Migration 0002 backfills existing single-day strings.

- ~~**First registered user auto-promoted to admin**~~ — fixed: replaced with `ADMIN_EMAIL` env var. Only the user registering with that exact email receives the admin role; unset means no auto-promotion.

- **`POST /tvshow` body schema is too loose** — partially addressed: `name` is now required, so `{ id: 123 }` alone returns 400. The broader TVMaze shape (network, image, schedule, etc.) remains unchecked; missing fields still produce empty strings via optional chaining in `TvMazeData`.

### Improvements

- **In-memory rate limiter** — `rateLimiter.ts` stores state in-process. A server restart resets all counters. Not suitable for multi-instance deployments. Redis or a DB-backed store would be the production-grade fix. A warning comment and `resetForTesting()` export have been added.

- **Serial TVMaze fetch in `updateEpisodes`** — fixed, but worth noting that `POST /tvshow/:id` and `PATCH /tvshow/:id` also make a separate fetch to TVMaze before calling `updateEpisodes`, meaning each operation hits TVMaze up to three times sequentially. These could be partially parallelised.

- **No pagination on `GET /tvshows` or `GET /users`** — both return all records. This is fine at small scale but will become a problem as data grows.

- **Admin has no endpoint to delete a user** — `DELETE /api/admin/user/:id` does not exist. User deletion is only self-service via `DELETE /api/auth/deleteUser`. An admin delete route may be intentionally omitted, but worth confirming.

- ~~**`validationHook` is duplicated**~~ — fixed: extracted to `utils/validationHook.ts` and imported by both route files.

---

## Frontend

### Issues

- **JWT stored in `localStorage`** — accessible to any JavaScript on the page, making it vulnerable to XSS. `httpOnly` cookies are the safer alternative, but that requires API changes to set and forward the token server-side.

- **`ShowProvider` is only populated when `AllShows` mounts** — if a user navigates directly to `/tvshow/:id` without visiting `/dashboard` first, the show context will be empty and the page may behave unexpectedly depending on how it uses the context vs. fetching directly.

### Improvements

- ~~**`ThemeProvider` is outside `BrowserRouter`**~~ — fixed: `BrowserRouter` is now the outermost wrapper.
