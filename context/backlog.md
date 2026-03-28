# Project Backlog

> Generated: 2026-03-26
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
- **#8 [apps/ui/src/pages/SearchResults.tsx:34]**: One `fetchNextEpisodeDate` Axios call fires per search result via `Promise.allSettled`. For 10 results this is 10 concurrent cross-origin requests to TVMaze, which has undocumented rate limits. A single slow response also blocks the shared `episodesLoading` indicator for all cards. Fix: fetch episode data server-side in a search proxy endpoint, or add per-card loading state for incremental display.
- **#9 [apps/ui/src/components/SingleShow.tsx:9]**: Each card in `AllShows` instantiates its own `useShowActions()` hook — N shows means N independent loading states and N memoized closures in memory. Acceptable for typical usage but degrades with large libraries. Fix: lift action state into `ShowContext` or use `useReducer` if library size becomes a concern.

### Low
_None identified._

---

## Improvements & Refactors

### High
- **#10 [apps/api/src/utils/rateLimiter.ts]**: In-memory rate limiter is per-process. In multi-instance deployments (Docker Swarm, K8s) each instance tracks separately, allowing limit bypass by round-robining. Fix: add a Redis-backed implementation as a drop-in alternative selected via `REDIS_URL` env var; fall back to in-memory when unset.

### Medium
- **#13 [apps/ui/src/]**: No virtual scrolling. With 100+ shows the card grid renders all DOM nodes at once. Add `react-virtual` or `react-window` for the `AllShows.tsx` grid (lines 77–89).
- **#14 [apps/ui/src/]**: Accessibility — interactive `<Box>` elements lack semantic roles/keyboard access. `ShowCard.tsx` card is a `<Box onClick>` without `role="button"` or `tabIndex`. Back button in `OneShow.tsx:115` has no `aria-label`. Action buttons in `ShowsTable.tsx` are missing labels. Fix: convert to semantic elements or add `role`/`tabIndex`/`aria-label` attributes.
- **#15 [apps/ui/src/]**: No error boundary. If any page component throws, the entire app goes blank. Fix: add an `ErrorBoundary` class component wrapping the router in `App.tsx`.

### Low
- **#16 [apps/api/src/db/schema.ts:23]**: `scheduleDay` is typed `string[]` but CLAUDE.md states only the first element is stored. The type and documentation contradict. Fix: either store the full array and remove the caveat, or type as `string` and rename to `scheduleDay` (singular).
- **#19 [apps/ui/src/]**: Search navigation triggers on every keystroke. Add 300ms debounce to the search input before calling `navigate()` to reduce unnecessary route transitions.

---

## Feature Ideas

### High
- **#20 [apps/ui/src/pages/AllShows.tsx]**: Advanced library filtering — filter by `status` (Running/Ended/Cancelled), `platform`, and "has upcoming episode". Text search across titles. Data is already in memory; implement a `useShowFilter()` hook alongside `sortShows.ts`. No API or DB changes needed.
- **#21 [apps/api, apps/ui]**: Watch progress tracking — allow users to mark episodes as watched. Requires new `user_episode_progress` DB table, `PATCH /api/user/tvshow/:id/progress` endpoint, and "Mark as caught up" action on `OneShow.tsx`. TVMaze episode links are already resolved in `TvMazeData`.
- **#22 [apps/api/src/db/schema.ts, apps/ui/src/pages/AllShows.tsx]**: Multi-status list management — add `listStatus` enum (`tracking | watchlist | completed | dropped`) to `tvShows` schema with `tracking` as default. Add tabs in `AllShows.tsx` and `PATCH /api/user/tvshow/:id/status` endpoint.

### Medium
- **#23 [apps/api/src/tvmaze.ts, apps/api/src/db/schema.ts]**: Genre storage — TVMaze provides `genres[]` but `TvMazeData` discards it. Store as a JSON column, display as badges on `OneShow.tsx`, and use as a filter dimension for #20.
- **#24 [apps/ui/src/components/ShowsTable.tsx]**: Batch operations — checkbox multi-select on table/card views for bulk refresh or delete. Extend `useShowActions` with a batch variant using `Promise.allSettled`.
- **#25 [apps/api/src/routes/user.ts, apps/ui/src/]**: Stats/insights page — new `/stats` route and `GET /api/user/stats` endpoint returning counts by status, platform, and upcoming episodes in next 7/30 days. Drizzle aggregation on existing schema; no new tables.

### Low
- **#26 [apps/ui/src/components/ShowCard.tsx]**: Upcoming episode urgency badge — compute `today | tomorrow | this-week | upcoming` from `nextEpisode` airdate and display a colored badge on cards. Client-side utility only.
- **#27 [apps/api/src/routes/user.ts]**: Export/import — `GET /api/user/export` returns JSON of all shows; `POST /api/user/import` bulk-adds from JSON (skip duplicates). Low implementation effort, good portability feature.
- **#28 [apps/ui/src/pages/AllShows.tsx]**: Better empty state — current fallback (line 131) shows no CTA. Add a link to search or surface TVMaze trending shows (public API, no auth).
- **#29 [apps/api/src/routes/user.ts]**: AI show summaries — `GET /api/user/tvshow/:id/summary` proxies a Claude API call using TVMaze synopsis/genres/rating. Cache result for 7 days in a `summaryCache` column. Requires `ANTHROPIC_API_KEY`.
- **#30 [apps/api/src/routes/user.ts]**: Smart recommendations — `POST /api/user/recommendations` sends tracked show list to Claude, resolves suggestions via TVMaze search, and displays on `/recommendations` page.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 0 | 0 | 0 | 0 |
| Bugs | 0 | 2 | 0 | 2 |
| Performance | 0 | 2 | 0 | 2 |
| Improvements & Refactors | 1 | 3 | 2 | 6 |
| Feature Ideas | 3 | 3 | 5 | 11 |
| **Total** | **4** | **10** | **7** | **21** |
