# Spec for DB Indexes and Schedule Days Fix

Title: DB Indexes and Schedule Days Fix
Branch: claude/fix/db-indexes-schedule-days
Spec file: context/specs/db-indexes-schedule-days.md

## Summary

Two related DB-layer fixes:

1. **[18] Missing indexes on `tvShows`** — The `tvShows` table has no indexes. Queries that filter by `userId` (fetching all shows for a user) and by `(tvMazeId, userId)` (duplicate-check on add) run full table scans. Add two indexes to cover these access patterns.

2. **[23] Lossy `schedule.days` storage** — TVMaze returns `schedule.days` as an array (e.g. `["Monday", "Wednesday"]`). Currently only the first element is stored in `scheduleDay` (a plain text column), silently discarding data for multi-day shows. The column should store the full array as a JSON string and the display layer should handle deserialization.

## Functional Requirements

- Add a Drizzle index `idx_user_shows` on `tvShows.userId`.
- Add a Drizzle index `idx_tvmaze_user` on `(tvShows.tvMazeId, tvShows.userId)`.
- Generate and apply a migration for the new indexes.
- Rename or repurpose the existing `scheduleDay` column to store a JSON-serialized array of days (e.g. `'["Monday","Wednesday"]'`).
- Update `TvMazeData` to serialize `schedule.days` as a JSON string when building the insert payload.
- Update any read paths that currently read `scheduleDay` as a plain string to parse the JSON array before use or display.
- The shared type for a show should reflect that `scheduleDay` is now a string-encoded JSON array (or document the encoding convention clearly).

## Possible Edge Cases

- Existing rows in the DB have `scheduleDay` as a plain day name string — migration must handle or note that old data is not auto-converted (acceptable for a dev/personal project; note it explicitly).
- `schedule.days` may be an empty array `[]` — store as `'[]'`, not `null` or `''`.
- `schedule.days` may contain a single element — still serialize as a JSON array for consistency.
- UI components that display `scheduleDay` may break if they receive a raw JSON string without parsing.

## Acceptance Criteria

- `pnpm db:generate` produces a migration adding the two indexes.
- `pnpm db:migrate` applies cleanly against a local DB.
- Adding a multi-day show stores all days, not just the first.
- `GET /api/user/tvshows` and `GET /api/user/tvshow/:id` return `scheduleDay` as a JSON array string.
- UI correctly displays the days for a multi-day show (all days, not just the first).
- `pnpm build` passes with no errors or type errors.

## Open Questions

- Should `scheduleDay` be renamed to `scheduleDays` to reflect its new array semantics? Renaming requires a column rename migration and updating all references — worth doing for clarity but adds scope. - sure
- Is there a shared type (`UserDbData` or similar) that needs updating, and does the UI currently render `scheduleDay` anywhere it would break? - I'm not sure

## Testing Guidelines

Create or extend test files in `apps/api/tests/`:

- **Schema / migration**: Verify the two indexes exist after migration (can inspect via `pragma index_list`).
- **TvMazeData serialization**: Unit-test that `TvMazeData` correctly serializes a multi-day `schedule.days` array into a JSON string in the insert payload.
- **TvMazeData edge cases**: Empty `schedule.days`, single-element array.
- **Integration (add show)**: POST a show whose TVMaze fixture has multiple schedule days; assert the stored value is a valid JSON array containing all days.

## Personal Opinion

Both changes are straightforward and clearly correct — no design ambiguity.

The index addition (item 18) is a pure win with zero risk: it speeds up the two most common DB queries and doesn't touch application logic.

The `scheduleDay` → JSON array change (item 23) is also correct but has a small blast radius: any UI component that renders `scheduleDay` as a plain string will display raw JSON until updated. The rename question is worth resolving before starting — I'd recommend doing it since the current name is misleading and we have the migration open anyway.

Neither change is complex. Combined they are about a half-day of work.
