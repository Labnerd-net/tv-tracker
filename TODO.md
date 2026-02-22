# TODO

Potential issues, improvements, and edits identified during code review.

---

## Backend

### Issues

- **`/api/auth/refresh` has no rate limit** — the register and login routes apply `authRateLimit`, but the refresh endpoint does not. A stolen refresh token cookie could be used to issue access tokens indefinitely without hitting any limit.

- **`/api/auth/deleteUser` deletes without clearing the refresh cookie** — the user's DB record is deleted but the `refreshToken` cookie is not cleared and no logout is performed. The cookie persists on the client until it expires.

- **`scheduleDay` data loss** — only the first element of TVMaze's `schedule.days` array is stored. Shows that air on multiple days (e.g. Mon/Tue) lose that data silently. Storing as a JSON array (same pattern as `roles`) would be correct.

- **First registered user auto-promoted to admin** — role assignment is based on `returnUsers()` returning an empty array. If the DB is wiped in production and a non-admin re-registers first, they get admin. No mitigation in place.

- **`POST /tvshow` body schema is too loose** — `tvMazeShowBodySchema` only requires `id` (number). The rest of the TVMaze shape is unchecked. Downstream code in `TvMazeData` constructor does optional chaining, so missing fields silently produce empty strings rather than a validation error.

### Improvements

- **In-memory rate limiter** — `rateLimiter.ts` stores state in-process. A server restart resets all counters. Not suitable for multi-instance deployments. Redis or a DB-backed store would be the production-grade fix.

- **Serial TVMaze fetch in `updateEpisodes`** — fixed, but worth noting that `POST /tvshow/:id` and `PATCH /tvshow/:id` also make a separate fetch to TVMaze before calling `updateEpisodes`, meaning each operation hits TVMaze up to three times sequentially. These could be partially parallelised.

- **No pagination on `GET /tvshows` or `GET /users`** — both return all records. This is fine at small scale but will become a problem as data grows.

- **Admin has no endpoint to delete a user** — `DELETE /api/admin/user/:id` does not exist. User deletion is only self-service via `DELETE /api/auth/deleteUser`. An admin delete route may be intentionally omitted, but worth confirming.

- **`validationHook` is duplicated** — identical `any`-typed validation hook is defined in both `routes/auth.ts` and `routes/user.ts`. Could be extracted to a shared utility.

---

## Frontend

### Issues

- **JWT stored in `localStorage`** — accessible to any JavaScript on the page, making it vulnerable to XSS. `httpOnly` cookies are the safer alternative, but that requires API changes to set and forward the token server-side.

- **`ShowProvider` is only populated when `AllShows` mounts** — if a user navigates directly to `/tvshow/:id` without visiting `/dashboard` first, the show context will be empty and the page may behave unexpectedly depending on how it uses the context vs. fetching directly.

### Improvements

- **`ThemeProvider` is outside `BrowserRouter`** — unlikely to matter since themes don't navigate, but it cannot use router hooks if that ever changes. Low priority.
