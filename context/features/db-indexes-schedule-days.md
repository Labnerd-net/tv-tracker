# Plan: DB Indexes and Schedule Days Fix

## Context

Two backlog items grouped into one fix:

- **[18]** `tvShows` table has no indexes. Full scans on every `WHERE user_id = ?` (all-shows fetch) and `WHERE tvmaze_id = ? AND user_id = ?` (duplicate check on add).
- **[23]** `schedule.days` array was historically truncated to first element. The data layer is already fixed (migration `0002` converted old strings to JSON arrays; schema uses `mode: 'json'`; `TvMazeData.scheduleDays` stores the full array). Only the UI render is broken — two components pass the raw array where a formatted string is expected.

## Changes

### 1. Add DB indexes — `apps/api/src/db/schema.ts`

Import `index` from `drizzle-orm/sqlite-core`. Add a second argument to `sqliteTable` for `tvShows`:

```ts
import { int, integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const tvShows = sqliteTable('tv_shows', {
  // ... existing columns unchanged ...
}, (table) => [
  index('idx_user_shows').on(table.userId),
  index('idx_tvmaze_user').on(table.tvMazeId, table.userId),
]);
```

Then run `pnpm db:generate` (from `apps/api/`) to produce the migration file, and commit the generated `.sql` file.

### 2. Fix UI — `apps/ui/src/components/ShowsTable.tsx:117`

Replace direct array render with a joined string:

```tsx
// before
<TableCell>{show.scheduleDay}</TableCell>

// after
<TableCell>{show.scheduleDay?.join(', ') ?? ''}</TableCell>
```

### 3. Fix UI — `apps/ui/src/pages/OneShow.tsx:226`

The days array needs to be serialized to a string before being mixed with `scheduleTime`:

```tsx
// before
{[tvShow.scheduleDay, tvShow.scheduleTime].filter(Boolean).join(' at ')}

// after
{[tvShow.scheduleDay?.join(', '), tvShow.scheduleTime].filter(Boolean).join(' at ')}
```

### 4. Tests — `apps/api/tests/`

Extend or add tests in the existing test files:

- **Schema indexes**: In `db.test.ts` (or a new `schema.test.ts`), query `pragma index_list('tv_shows')` after migration and assert both `idx_user_shows` and `idx_tvmaze_user` appear.
- **TvMazeData serialization** (already partly covered in `fix-backend-issues.test.ts:90`): Verify empty array `[]` and single-element array are both stored correctly.

## Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/db/schema.ts` | Add two indexes |
| `apps/api/drizzle/` | New generated migration (do not hand-write) |
| `apps/ui/src/components/ShowsTable.tsx` | `.join(', ')` on `scheduleDay` |
| `apps/ui/src/pages/OneShow.tsx` | `.join(', ')` on days before building the Airs string |
| `apps/api/tests/db.test.ts` (or new file) | Index existence assertions |

## Branch

`claude/fix/db-indexes-schedule-days`

## Verification

1. `pnpm db:generate` — produces a new migration with two `CREATE INDEX` statements.
2. `pnpm db:migrate` — applies cleanly.
3. `pnpm build` — no TypeScript or build errors.
4. `pnpm --filter @tv-tracker/api test` — all tests pass.
5. Manual: add a multi-day show (e.g. TVMaze ID for a show that airs Monday & Wednesday) — UI displays `Monday, Wednesday` not `MondayWednesday` or `["Monday","Wednesday"]`.
