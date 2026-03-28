# Project Backlog

> Generated: 2026-03-28
> Focus: Full audit

---

## Security

### High
- **#3 [apps/api/src/db/schema.ts:18]**: `tv_shows.userId` FK lacks `ON DELETE CASCADE`. Deleting a user (`DELETE /api/auth/deleteUser`) leaves orphaned show rows. SQLite FK enforcement is off by default so no error is thrown. Fix: add `.references(() => users.userId, { onDelete: 'cascade' })` to the schema and generate a migration, or explicitly delete shows before deleting the user.

### Medium
_None identified._

### Low
_None identified._

---

## Bugs

### High
- **#4 [apps/api/src/routes/user.ts:130]**: `POST /tvshow/:id` returns `ok({ status: 'added' })` with 200 even when `newShowId` is `undefined` (i.e., the DB insert failed). The equivalent guard exists on the `POST /tvshow` (add from body) route (lines 94–96) but is missing here. Fix: return `c.json(err('Failed to save show'), 500)` when `newShowId` is undefined.

### Medium
- **#5 [apps/ui/src/pages/OneShow.tsx:47]**: After a successful `refreshShow` action, the `OneShow` detail page continues to display stale data — it reads from its own fetch-on-mount local state, not from `ShowProvider`. Fix: either derive the show from `tvShows` in `ShowProvider` looked up by `showID`, or trigger a re-fetch after `refreshShow` resolves.

### Low
_None identified._

---

## Performance

### High
- **#6 [apps/ui/src/pages/SearchResults.tsx:33–44]**: After receiving search results, one `fetchNextEpisodeDate()` request is fired per result in an unbounded loop with no concurrency limit (up to 20+ parallel requests). Fix: batch in groups of 5 with `Promise.allSettled`, or document the intentional tradeoff.

### Medium
- **#7 [apps/api/src/tvmaze.ts:74–77]**: `POST /tvshow` (add from body) always fires two extra TVMaze episode fetches because client-sent JSON typically lacks `_embedded`. The `POST /tvshow/:id` route correctly pre-populates `_embedded`. Consider switching the client-side add flow to call `POST /tvshow/:id` instead.

### Low
- **#8 [apps/api/src/utils/rateLimiter.ts:14–30]**: Rate limiter cleanup relies on a 5-minute `setInterval`. Expired entries linger between runs and the store can grow unbounded. Fix: check expiry on every request and do probabilistic cleanup (e.g., 1% of requests) instead of interval-based cleanup.
- **#9 [apps/api/src/db/dbShowFunctions.ts, dbUserFunctions.ts]**: All queries use dynamic SQL builders. Drizzle prepared statements would reduce per-query parse overhead under high concurrency. Low priority given current scale.

---

## Improvements & Refactors

### High
_None identified._

### Medium
- **#10 [apps/ui/src/contexts/show/ShowProvider.tsx]**: `actionLoading: Record<number, boolean>` is a single context value — any loading state change re-renders every `SingleShow` card. Fix: atomize loading state per `showId` via a context getter function, so only the affected card re-renders.
- **#11 [apps/api/src/routes/user.ts]**: Background `scheduleEpisodeUpdate()` calls are fire-and-forget with no error visibility. Failures are silently swallowed. Fix: introduce a simple in-memory job queue with retry and structured logging.

### Low
- **#12 [apps/ui/src/types/data.ts]**: `DataProps` interface is defined but unreferenced anywhere. Delete it.
- **#13 [apps/ui/src/types/view.ts]**: `ViewProps` interface appears unused — view mode is handled locally in `AllShows.tsx`. Verify and delete if orphaned.
- **#14 [apps/ui/src/contexts/alert/AlertContext.tsx:9]**: `alertVariant` is typed as `string` instead of `'danger' | 'warning' | 'success'`. Fix: define an `AlertVariant` union type and apply it to `AlertProps`.
- **#15 [apps/api/src/routes/auth.ts:142–143]**: Cookie paths (`/api/auth`, `/api`) are duplicated across logout and `deleteUser`. Export path constants from `utils/auth.ts` and reference them in all four call sites.
- **#16 [apps/ui/src/components/ErrorBoundary.tsx:21]**: Uses `console.error` directly with an `eslint-disable` comment instead of the project's `logger` utility. Fix: import `logger` and remove the disable comment.
- **#18 [apps/api/src/db/dbShowFunctions.ts]**: Multiple DB functions manually call `Number()` on string IDs. Extract a shared `ensureNumericId(id: string): number` helper to reduce duplication.

---

## Feature Ideas

### High
- **#19 [Calendar / Upcoming Episodes View]**: A 1–2 week view showing each tracked show's next episode on its airdate. Data is already available via `nextAirdate`. Key consideration: timezone normalization (TVMaze returns show-local dates) and handling stale `nextAirdate` values (past dates should be filtered or flagged). Requested by user.

### Medium
- **#20 [Episode Watch Tracking]**: Add a `watched_episodes` table (FK to `tv_shows`) and let users mark episodes as watched on the show detail page. Natural next step given the app already surfaces next/prev episode data.
- **#21 [Show Collections / Custom Lists]**: Let users organize shows into custom lists (e.g., "Sci-Fi", "Watching now"). Collections are a tagging layer on the existing `tvShows` table — medium scope (new DB table, filter UI).
- **#22 [TVMaze Client-Side Cache]**: Cache `fetchNextEpisodeDate()` results in a `Map` with a TTL (e.g., 7 days). Episode airdates change infrequently; this would reduce redundant TVMaze calls on every search and show list mount.

### Low
- **#23 [Dashboard Stats Widgets]**: Quick computed stats on the AllShows page: "airing this week", "show statuses breakdown", etc. No new DB schema — derived from existing show data.
- **#24 [Episode Preview in Search]**: Show 3–5 upcoming episodes inline on SearchResults before the user adds a show. Small TVMaze API extension.
- **#25 [Notifications]**: User preference for notification type (browser push, email, Discord webhook) when a tracked show's episode airs. Requires background job system and user preferences storage.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 1 | 0 | 0 | 1 |
| Bugs | 1 | 1 | 0 | 2 |
| Performance | 1 | 1 | 2 | 4 |
| Improvements & Refactors | 0 | 2 | 6 | 8 |
| Feature Ideas | 1 | 4 | 3 | 8 |
| **Total** | **4** | **8** | **11** | **23** |
