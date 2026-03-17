# Project Backlog

> Generated: 2026-03-16
> Focus: Full audit

---

## Security

### High
- **#1 [apps/api/src/routes/auth.ts:188]**: `DELETE /api/auth/deleteUser` has no rate limit. Every other auth mutation applies `authRateLimit`, but this route only uses `authMiddleware`. Add `authRateLimit` to the handler.
- **#2 [apps/ui/src/apis/userRequests.ts:113-114]**: Episode link URLs from TVMaze search results (`_links.nextepisode.href`, `previousepisode.href`) are followed by the browser without hostname validation. The API-side `tvmaze.ts` already validates against `api.tvmaze.com`; the UI has no equivalent guard. Add `new URL(href).hostname === 'api.tvmaze.com'` check before calling `axios.get(href)`.
- **#3 [apps/api/src/routes/user.ts:120,150]**: TVMaze JSON is parsed with `response.json()` and passed directly to `new TvMazeData()` and then inserted into the DB with no shape validation. The body-based `POST /tvshow` route validates via `tvMazeShowBodySchema` — apply the same schema check to the `POST /tvshow/:id` and `PATCH /tvshow/:id` TVMaze fetch paths.

### Medium
- **#4 [apps/api/src/schemas/auth.ts:4-5]**: `password` field in both `loginSchema` and `registrationSchema` has no upper bound. A multi-megabyte password is fully buffered before bcrypt truncates it at 72 bytes. Add `.max(128)` to both password fields.

### Low
_None identified._

---

## Bugs

### High
- **#5 [apps/ui/src/pages/AllShows.tsx:26-35]**: `AllShows` fires `getAllShows()` in its own `useEffect` on every mount. `ShowProvider` also independently fetches all shows when auth state changes. Every dashboard load triggers two redundant parallel calls to `GET /api/user/tvshows`. Remove the `useEffect` fetch from `AllShows` and rely solely on `ShowProvider`. The component should only read from `useShow()` context.

### Medium
- **#6 [apps/ui/src/hooks/useShowActions.ts:35-38]**: `deleteShow` calls `setTvShows(prev => prev.filter(...))` before confirming API success. If the API returns `ok: false` without throwing, the show disappears from the UI but still exists in the DB. Gate the context update on `response.success`.

### Low
- **#7 [apps/api/src/routes/auth.ts:191]**: Variable named `userIdNumber` holds the result of `String(payload.sub)` — it's a string. Misleading name causes confusion when reading the route. Rename to `userIdString`.
- **#8 [apps/ui/src/pages/OneShow.tsx:24]**: Function named `retreiveTvShow` — missing an 'i'. Rename to `retrieveTvShow`.

---

## Performance

### High
_None identified._

### Medium
- **#9 [apps/ui/src/pages/SearchResults.tsx:32-41]**: Up to 10 parallel `fetchNextEpisodeDate` calls fire on every search with no `AbortController`. If the user types quickly or navigates away, stale in-flight requests update state on an unmounted component. Add cleanup to the `useEffect` to abort the batch when `showName` changes.
- **#10 [apps/ui/src/components/SingleShow.tsx:10]**: Each card instantiates its own `useShowActions()` hook. On any refresh, `setTvShows` triggers a full grid re-render across all cards. For large libraries, consider hoisting the hook to `AllShows` and passing handlers as props, or using `useCallback` to stabilize references.
- **#11 [apps/ui]**: No virtual scrolling. With 100+ shows the card grid renders all DOM nodes at once. Add `react-virtual` or `react-window` windowing for the grid; significant FPS improvement for power users.

### Low
- **#12 [apps/ui/src/utils/logger.ts:14-17]**: `getConfiguredLevel()` reads `import.meta.env.VITE_LOG_LEVEL` and scans a levels array on every log call. The value never changes at runtime — compute it once at module load and cache the result.
- **#13 [apps/ui]**: No `loading="lazy"` or `decoding="async"` on any `<img>` tags (`SingleShow.tsx`, `Result.tsx`, `OneShow.tsx`, `OneShowSearch.tsx`). Trivial one-line fix per image.

---

## Improvements & Refactors

### High
- **#14 [apps/api/src/utils/rateLimiter.ts]**: In-memory rate limiter state is per-process. In a multi-instance deployment (Docker Swarm, K8s), each instance has its own map and users can bypass limits by round-robining. Add a Redis-backed implementation as a drop-in alternative, selected via `REDIS_URL` env var.

### Medium
- **#15 [apps/api/src/routes/user.ts:95-98,124-127]**: The fire-and-forget background episode update block (`showData.updateEpisodes().then(...).catch(...)`) is copy-pasted identically in both `POST /tvshow` and `POST /tvshow/:id`. Extract to a named helper `scheduleEpisodeUpdate(showData, newShowId, db)`.
- **#16 [apps/ui/src/apis/]**: API response types are loose interfaces with optional `data?` and `error?` fields. Consumers must remember to check `response.success` manually. Adopt a discriminated union `type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }` across `authRequests.ts`, `userRequests.ts`, `adminRequests.ts` for safer exhaustive handling.
- **#17 [apps/api/tests/, apps/ui/src/]**: UI test coverage is minimal (`viewToggle.test.ts` only). No integration tests for `SearchResults`, `AllShows`, `OneShow`, or `useShowActions`. Add react-testing-library tests for core UI interactions and cover API edge cases (concurrent requests, partial failures).
- **#18 [apps/ui/src/]**: ESLint is UI-only; API has no lint config. Unify with a shared root-level ESLint config and add pre-commit hooks (husky + lint-staged) to gate commits.
- **#19 [apps/api/src/]**: No OpenAPI/Swagger spec. Add `hono-openapi` or a manual spec at `/api/docs`. All routes and Zod schemas already exist — generating the spec is low-hanging fruit.

### Low
- **#20 [apps/ui/src/types/alert.ts, apps/ui/src/contexts/alert/AlertContext.tsx]**: `AlertProps` is defined identically in both files. Remove the local copy from `AlertContext.tsx` and import from `types/alert.ts`.
- **#21 [apps/ui/src/contexts/show/ShowContext.tsx]**: Raw `setTvShows` setter is exposed on context, allowing any consumer to overwrite the entire array. Replace with named actions (`addShow`, `updateShow`, `removeShow`) for better encapsulation.
- **#22 [apps/ui/src/utils/validationHook.ts:3]**: `Hook<unknown, any, any>` — use a precise Hono generic instead of bare `any` to surface middleware type mismatches at compile time.
- **#23 [apps/ui/src/pages/Splash.tsx:171]**: Hardcoded `'#e8e0d0'` should be `'var(--cream)'`.
- **#24 [apps/ui/src/components/ShowsTable.tsx:59]**: Two instances of hardcoded `'#e63946'` should be `'var(--accent)'`.
- **#25 [apps/ui/src/]**: Audit remaining hardcoded hex strings across all components. Most have been migrated to CSS custom properties; a few stragglers remain.
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
| Security | 3 | 1 | 0 | 4 |
| Bugs | 1 | 1 | 2 | 4 |
| Performance | 0 | 3 | 2 | 5 |
| Improvements & Refactors | 1 | 5 | 11 | 17 |
| Feature Ideas | 2 | 4 | 7 | 13 |
| **Total** | **7** | **14** | **22** | **43** |
