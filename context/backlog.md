# Project Backlog

> Generated: 2026-03-28
> Focus: Full audit

---

## Security

### High
_None identified._

### Medium
_None identified._

### Low
_None identified._

---

## Bugs

### High
_None identified._

### Medium
_None identified._

### Low
_None identified._

---

## Performance

### High
_None identified._

### Medium
_None identified._

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
_None identified._

---

## Feature Ideas

### High
- **#19 [Calendar / Upcoming Episodes View]**: A 1–2 week view showing each tracked show's next episode on its airdate. Data is already available via `nextAirdate`. Key consideration: timezone normalization (TVMaze returns show-local dates) and handling stale `nextAirdate` values (past dates should be filtered or flagged). Requested by user.

### Medium
- **#20 [Episode Watch Tracking]**: Add a `watched_episodes` table (FK to `tv_shows`) and let users mark episodes as watched on the show detail page. Natural next step given the app already surfaces next/prev episode data.
- **#21 [Show Collections / Custom Lists]**: Let users organize shows into custom lists (e.g., "Sci-Fi", "Watching now"). Collections are a tagging layer on the existing `tvShows` table — medium scope (new DB table, filter UI).

### Low
- **#23 [Dashboard Stats Widgets]**: Quick computed stats on the AllShows page: "airing this week", "show statuses breakdown", etc. No new DB schema — derived from existing show data.
- **#24 [Episode Preview in Search]**: Show 3–5 upcoming episodes inline on SearchResults before the user adds a show. Small TVMaze API extension.
- **#25 [Notifications]**: User preference for notification type (browser push, email, Discord webhook) when a tracked show's episode airs. Requires background job system and user preferences storage.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 0 | 0 | 0 | 0 |
| Bugs | 0 | 0 | 0 | 0 |
| Performance | 0 | 0 | 2 | 2 |
| Improvements & Refactors | 0 | 2 | 0 | 2 |
| Feature Ideas | 1 | 3 | 3 | 7 |
| **Total** | **1** | **5** | **5** | **11** |
