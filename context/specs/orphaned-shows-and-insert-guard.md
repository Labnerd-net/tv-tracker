# Spec for Orphaned Shows and Insert Guard

Title: Fix Orphaned Shows and Insert Guard
Branch: claude/fix/orphaned-shows-and-insert-guard
Spec file: context/specs/orphaned-shows-and-insert-guard.md

## Summary

Two independent bugs: (1) deleting a user leaves orphaned `tv_shows` rows because the FK lacks `ON DELETE CASCADE`, and (2) `POST /api/user/tvshow/:id` returns a 200 success response even when the DB insert silently fails and `newShowId` is `undefined`.

## Functional Requirements

- **#3 — Cascade delete:** When a user is deleted, all rows in `tv_shows` referencing that user must be deleted automatically by the database. This should be enforced at the schema level via a `ON DELETE CASCADE` foreign key constraint and applied via a migration.
- **#4 — Insert guard:** `POST /api/user/tvshow/:id` must return HTTP 500 with a generic error body when `newShowId` is `undefined` after the DB insert, matching the guard already present on the `POST /api/user/tvshow` route.

## Possible Edge Cases

- SQLite foreign key enforcement is off by default (`PRAGMA foreign_keys = OFF`). The cascade will only fire if FK enforcement is on at connection time. Verify the Drizzle/libsql client enables it, or add the pragma explicitly.
- The `ON DELETE CASCADE` migration must handle existing rows where the referenced user no longer exists (shouldn't happen in practice, but worth noting).
- The insert guard on `POST /tvshow/:id` should not affect the async episode update — `scheduleEpisodeUpdate` must only be called after confirming the insert succeeded.

## Acceptance Criteria

- Deleting a user via `DELETE /api/auth/deleteUser` leaves no orphaned `tv_shows` rows for that user.
- `POST /api/user/tvshow/:id` returns `{ ok: false, error: '...' }` with HTTP 500 when the DB insert returns no row.
- `POST /api/user/tvshow/:id` continues to return `{ ok: true, data: { showId } }` with HTTP 200 on a successful insert.
- A new migration file is generated and committed.

## Open Questions

- Does the libsql client used by Drizzle enable `PRAGMA foreign_keys = ON` automatically, or does it need to be set explicitly? - i don't know

## Testing Guidelines

Create tests in `apps/api/tests/` covering:
- `DELETE /api/auth/deleteUser` — verify the user's shows are gone from the DB after deletion (integration test hitting the real DB).
- `POST /api/user/tvshow/:id` — mock the DB insert to return `undefined`/empty and assert HTTP 500 is returned.
- `POST /api/user/tvshow/:id` — existing happy-path test should still pass.

## Personal Opinion

Both fixes are straightforward and clearly correct. #3 is a real data integrity risk — any user deletion currently leaks rows. #4 is a minor API contract issue that could confuse clients. Neither is complex; they're safe, targeted fixes with low regression risk. Good candidates to batch in one commit.
