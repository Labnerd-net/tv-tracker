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
_None identified._

---

## Improvements & Refactors

### High
_None identified._

### Medium
- **#10 [apps/ui/src/contexts/show/ShowProvider.tsx]**: `actionLoading: Record<number, boolean>` is a single context value — any loading state change re-renders every `SingleShow` card. Fix: atomize loading state per `showId` via a context getter function, so only the affected card re-renders.

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
| Performance | 0 | 0 | 0 | 0 |
| Improvements & Refactors | 0 | 1 | 0 | 1 |
| Feature Ideas | 1 | 3 | 3 | 7 |
| **Total** | **1** | **4** | **3** | **8** |
