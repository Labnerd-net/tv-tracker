# Project Backlog

> Generated: 2026-03-16
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
- **#10 [apps/ui/src/components/SingleShow.tsx:10]**: Each card instantiates its own `useShowActions()` hook. On any refresh, `updateShow` triggers a full grid re-render across all cards. For large libraries, consider hoisting the hook to `AllShows` and passing handlers as props, or using `useCallback` to stabilize references.
- **#11 [apps/ui]**: No virtual scrolling. With 100+ shows the card grid renders all DOM nodes at once. Add `react-virtual` or `react-window` windowing for the grid; significant FPS improvement for power users.

### Low
_None identified._

---

## Improvements & Refactors

### High
- **#14 [apps/api/src/utils/rateLimiter.ts]**: In-memory rate limiter state is per-process. In a multi-instance deployment (Docker Swarm, K8s), each instance has its own map and users can bypass limits by round-robining. Add a Redis-backed implementation as a drop-in alternative, selected via `REDIS_URL` env var.

### Medium
- **#16 [apps/ui/src/apis/]**: API response types are loose interfaces with optional `data?` and `error?` fields. Consumers must remember to check `response.success` manually. Adopt a discriminated union `type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }` across `authRequests.ts`, `userRequests.ts`, `adminRequests.ts` for safer exhaustive handling.
- **#17 [apps/api/tests/, apps/ui/src/]**: UI test coverage is minimal (`viewToggle.test.ts` only). No integration tests for `SearchResults`, `AllShows`, `OneShow`, or `useShowActions`. Add react-testing-library tests for core UI interactions and cover API edge cases (concurrent requests, partial failures).
- **#18 [apps/ui/src/]**: ESLint is UI-only; API has no lint config. Unify with a shared root-level ESLint config and add pre-commit hooks (husky + lint-staged) to gate commits.
- **#19 [apps/api/src/]**: No OpenAPI/Swagger spec. Add `hono-openapi` or a manual spec at `/api/docs`. All routes and Zod schemas already exist — generating the spec is low-hanging fruit.

### Low
- **#22 [apps/ui/src/utils/validationHook.ts:3]**: `Hook<unknown, any, any>` — use a precise Hono generic instead of bare `any` to surface middleware type mismatches at compile time.
- **#44 [apps/ui/src/contexts/show/ShowProvider.tsx]**: `addShow`, `updateShow`, and `removeShow` are recreated on every `ShowProvider` render — no `useCallback` wrapping. Currently harmless (no consumer puts them in a `useEffect` dep array), but fragile as usage grows. Wrap with `useCallback` to stabilize references.
- **#26 [apps/ui/src/]**: Add skeleton loading screens (`Skeleton.tsx`) to the card grid and detail page instead of bare `CircularProgress` spinners. Improves perceived performance and avoids layout shift.
- **#27 [apps/ui/src/]**: Keyboard shortcuts: `/` to focus search, `?` for help, arrow keys to navigate grid. Implement via global `keydown` listener in `AppContent.tsx`.
- **#28 [apps/ui/src/]**: a11y audit — verify all interactive `<Box>` elements have accessible names/roles, check color contrast on custom theme vars (WCAG AA), ensure form inputs have associated labels.
- **#29 [apps/ui/src/components/SingleShow.tsx, Result.tsx]**: Both share similar card/list item layout but duplicate markup and styles. Extract a `ShowCard.tsx` base component to reduce duplication.
- **#30 [apps/api/src/routes/user.ts:18, apps/ui/src/apis/userRequests.ts]**: `tvMazeAPI` base URL constant is duplicated in both the API and UI. Move to `apps/shared/` if the project expands further.

---

## Feature Ideas

### High
- **#31** **Advanced filtering within library**: Client-side filters for show status (Running/Ended/Cancelled), network/platform, and "has upcoming episode". Text search within tracked shows. `AllShows.tsx` only sorts today; filter logic belongs in a new `useShowFilter()` hook alongside `sortShows.ts`. No DB changes needed.
- **#32** **Episode / watch progress tracking**: Allow users to mark which episodes they've watched (airdate or season/episode). Requires new `user_episode_progress` DB table, `POST /api/user/tvshow/:id/mark-watched` endpoint, and a "Mark as caught up" action on `OneShow.tsx`. TVMaze already provides episode links.

### Medium
- **#33** **Watchlist / list status**: Add `listStatus` enum (`tracking | watchlist | completed | dropped`) to `tvShows` schema. Separate tabs in `AllShows.tsx`. New `PATCH /api/user/tvshow/:id/status` route. Low DB/API effort.
- **#34** **Genre storage and filtering**: TVMaze provides `genres[]` but `TvMazeData` discards it. Store as JSON column, display as badges on cards and detail page, use as a filter dimension alongside #31.
- **#35** **Batch operations**: Checkbox multi-select on table and card views for bulk refresh or bulk delete. `useShowActions` provides individual handlers; add a batch variant using `Promise.allSettled`.
- **#36** **Stats/insights page**: New `/stats` route + `GET /api/user/stats` endpoint returning counts by status, by platform, upcoming episodes in next 7/30 days. Drizzle aggregation queries on existing schema — no new tables needed.

### Low
- **#37** **Upcoming episode air-date badge**: Calculate if `nextEpisode` airdate is today/tomorrow/this week and show a colored badge on `SingleShow.tsx` cards. Client-side utility only — no API/DB changes.
- **#38** **AI — "Why should I watch this?" summary**: On `OneShow.tsx` / `OneShowSearch.tsx`, proxy a Claude call from a new `GET /api/user/tvshow/:id/summary` endpoint using the TVMaze synopsis, genres, and rating. Keeps the API key server-side.
- **#39** **AI — Smart show recommendations**: Send the user's tracked show list to Claude via a new `POST /api/user/recommendations` endpoint; resolve returned suggestions through TVMaze search and display on a `/recommendations` page.
- **#40** **Export/Import**: `GET /api/user/export` (JSON) and `POST /api/user/import` for library portability. Low API effort.
- **#41** **Better empty state / onboarding**: Empty state in `AllShows.tsx` (current text at line 131) gives no CTA. Add a button linking to search or surface TVMaze trending shows.
- **#42** **User ratings**: TVMaze `rating.average` is available but unused. Add per-user rating field and display alongside TVMaze score on `OneShow.tsx`.
- **#43** **User-to-user show sharing**: Share a show with another registered user. Requires new `SharedShows` table and social UI. Higher complexity, lower priority for a personal tracker.

---

## Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 0 | 0 | 0 | 0 |
| Bugs | 0 | 0 | 0 | 0 |
| Performance | 0 | 2 | 0 | 2 |
| Improvements & Refactors | 1 | 4 | 7 | 12 |
| Feature Ideas | 2 | 4 | 7 | 13 |
| **Total** | **3** | **10** | **14** | **27** |
