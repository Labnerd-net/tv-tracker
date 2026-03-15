# Spec for fix-backend-issues

branch: claude/feature/fix-backend-issues

## Summary
Address the backend issues listed in TODO.md: rate limiting on the refresh endpoint, cookie cleanup on user deletion, `scheduleDay` data loss, first-user admin promotion risk, and loose request body validation on the `POST /tvshow` route. Improvements (in-memory rate limiter, TVMaze fetch count, pagination, admin delete endpoint, duplicated validation hook) are in scope as secondary items but should not block the primary issues.

## Functional Requirements

### Issues (primary)
- Apply `authRateLimit` middleware to `POST /api/auth/refresh` so it is treated the same as register and login.
- Clear the `refreshToken` cookie in the `DELETE /api/auth/deleteUser` handler after deleting the user record.
- Change the `scheduleDay` DB column to store a JSON array (same approach as `roles`) so that multi-day shows retain all broadcast days instead of only the first.
- Replace the first-registered-user-becomes-admin logic with a safer mechanism (e.g. an explicit env var `ADMIN_EMAIL`, or a flag that is only evaluated once and locked after first use).
- Tighten `tvMazeShowBodySchema` to validate the full required shape so missing/malformed TVMaze fields are rejected with a 400 rather than silently producing empty strings.

### Improvements (secondary)
- Extract the duplicated `validationHook` from `routes/auth.ts` and `routes/user.ts` into a shared utility in `utils/`.
- Document the in-memory rate limiter limitation in code comments so it is not silently assumed to be production-safe.
- Evaluate whether `POST /tvshow/:id` and `PATCH /tvshow/:id` TVMaze fetches can be partially parallelised (at minimum add a comment; ideally refactor if straightforward).

## Possible Edge Cases
- Changing `scheduleDay` from a scalar to a JSON array is a breaking schema change. Existing rows store a plain string; a migration must handle the conversion without data loss.
- Clearing the refresh cookie in `deleteUser` must use the same cookie options (domain, path, sameSite, secure) as the original `Set-Cookie` call, otherwise the browser will not honour the clear.
- Tightening the `POST /tvshow` body schema may break clients or tests that currently send a minimal body — verify no test fixture sends only `{ id }`.
- The admin promotion fix must not lock out legitimate first-time setups. The replacement mechanism must work in both development (env var not set) and production.

## Acceptance Criteria
- `POST /api/auth/refresh` returns 429 when called more times than `authRateLimit` allows within the window.
- After `DELETE /api/auth/deleteUser`, the `refreshToken` cookie is absent in the response (or set to empty with `maxAge: 0`).
- A show with `schedule.days = ["Monday", "Tuesday"]` stored via `POST /tvshow` retains both days in the DB and returns both days via `GET /tvshow/:id`.
- A `POST /tvshow` request with a body that only contains `{ id: 123 }` returns a 400 validation error rather than silently inserting a mostly-empty row.
- The first-user admin promotion logic no longer grants admin based solely on an empty users table; the replacement mechanism is documented.
- The `validationHook` utility exists in one shared location and both route files import it from there.

## Open Questions
- What should the admin promotion replacement look like? Options: (a) env var `ADMIN_EMAIL` checked at registration, (b) a separate `POST /api/admin/seed` that can only run once, (c) remove auto-promotion entirely and require manual DB seeding. User should pick before implementation starts. - I guess option A
- Should the `scheduleDay` migration be additive (new column `scheduleDays` as JSON, old column kept for a period) or should the old column be renamed/removed in the same migration? - remove the old column
- Are there any external clients (mobile app, scripts) that currently send minimal `POST /tvshow` bodies that would break if the schema is tightened? - there are no clients other then this frontend app

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- `POST /api/auth/refresh` is rate-limited after exceeding the allowed threshold.
- `DELETE /api/auth/deleteUser` clears the refresh cookie in the response.
- `POST /api/user/tvshow` with a show that has multiple schedule days stores all days and returns them correctly.
- `POST /api/user/tvshow` with only `{ id }` in the body returns 400.
- The first registered user does not automatically receive the admin role under the new promotion logic.

## Personal Opinion
These fixes are all legitimate and should be made. The rate-limit omission on `/refresh` and the missing cookie clear on delete are genuine security issues, not just cosmetic. The `scheduleDay` data loss is a quiet correctness bug that will be hard to spot in production.

The schema migration for `scheduleDay` is the highest-risk item — SQLite has limited `ALTER TABLE` support, so it will likely require creating a new column and backfilling, or a full table recreation. That should be planned carefully.

The first-user-admin logic is a latent operational risk rather than an active vulnerability, but worth fixing before the app goes anywhere near multi-tenant use.

Tightening the body schema is a good idea but carries the most integration risk — worth checking test fixtures before merging.

Overall, this is the right set of fixes. None of them are over-engineered; all have a clear correct answer. Scope is reasonable for a single PR if the migration is handled carefully.
