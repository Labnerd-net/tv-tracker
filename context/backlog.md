# Project Backlog

> Generated: 2026-03-14
> Focus: Full audit

---

## Security

### High

### Medium

### Low

---

## Bugs

### High

### Low

---

## Performance

### High
- **[16] [apps/ui/src/components/Result.tsx:18-32, apps/ui/src/pages/SearchResults.tsx:130-133]**: N+1 pattern — each `Result` component fires an independent `fetchNextEpisodeDate()` call to TVMaze on mount. 20 results = 20 concurrent external API calls. Fetch episode dates in bulk in `SearchResults` after initial search completes, or defer to hover/expand.
- **[17] [apps/ui/src/components/SingleShow.tsx:19-33, apps/ui/src/components/ShowsTable.tsx:67-77, apps/ui/src/pages/OneShow.tsx:42-57]**: Full `getAllShows()` re-fetch triggered after every refresh or delete action across 3 components. Update context state directly from returned data (for refresh) or filter the array (for delete) instead of re-fetching.

### Medium
- **[18] [apps/api/src/db/schema.ts]**: No indexes on `tvShows` table. Queries like `WHERE user_id = ?` and `WHERE tvmaze_id = ? AND user_id = ?` run full scans. Add indexes: `idx_user_shows` on `userId`, `idx_tvmaze_user` on `(tvMazeId, userId)`.

### Low
- **[19] [apps/api/src/routes/user.ts:101]**: `TvMazeData.updateEpisodes()` makes 2-3 sequential HTTP requests synchronously during the add-show request. Consider returning the show to the user immediately and updating episode data asynchronously.

---

## Improvements & Refactors

### High
- **[20] [apps/ui/src/components/SingleShow.tsx, ShowsTable.tsx, pages/OneShow.tsx]**: Refresh and delete logic duplicated across 3 components with near-identical implementations. Extract a `useShowActions()` custom hook to consolidate this logic and serve as the single point of change when batch ops are added.

### Medium
- **[21] [apps/api/src/db/schema.ts:7]**: `DB_FILE_NAME` is read from `process.env` directly, independent of `envVars.ts` which already exports `dbUrl`. Import `dbUrl` from `envVars.ts` to avoid divergent defaults.
- **[22] [apps/api/src/utils/validationHook.ts:2-3, apps/api/src/routes/auth.ts:35-46]**: Multiple `any` type suppressions with comments. Use proper types from `@hono/zod-validator` and `hono` (`Context`).
- **[23] [apps/api/src/tvmaze.ts:23]**: Only first element of `schedule.days[]` is stored. Store the full array as JSON to avoid data loss for multi-day shows.
- **[24] [apps/ui/src/apis/userRequests.ts:9-13]**: API response types are loose. Adopt a discriminated union `ApiResponse<T>` type for all API calls for safer exhaustive handling.
- **[25] [apps/api/package.json:22]**: `jsonwebtoken` and `@types/jsonwebtoken` are listed as dependencies but never used — the app uses `hono/jwt`. Remove them.

### Low
- **[26] [apps/ui/src/components/SingleShow.tsx:127, 140, 154]**: Several color values are hardcoded hex strings instead of CSS custom properties (`var(--cream)`, `var(--amber)`, etc.). This breaks the light/dark theme toggle for those elements.
- **[27] [apps/ui/src/pages/Navbar.tsx:35]**: Logo uses `<Box component="a" href="/dashboard">` — full page reload in an SPA. Replace with `<Link to="/dashboard">` from `react-router`.
- **[28] [apps/ui/src/utils/requests.ts:16-17]**: `refreshQueue` entries typed as `any`. Type as `{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }`.
- **[29] [apps/ui/src/components/ShowsTable.tsx:55-56]**: Sort preference resets on page reload. Persist to localStorage (like view mode) so preference survives navigation.

---

## Feature Ideas

### High
- **[30]** **Advanced filtering within library**: Client-side filters for show status (Running/Ended), network/platform, "has upcoming episode". Search box within the user's tracked shows. Referenced in `AllShows.tsx` toolbar area and `sortShows.ts` (currently single-column sort only).
- **[31]** **Episode / watch progress tracking**: Allow users to mark which episodes they've watched. Requires new `UserEpisodes` DB table, API endpoints, and a "Mark as caught up" action on `OneShow.tsx`. TVMaze data already provides episode links.

### Medium
- **[32]** **Watchlist / list status**: Add `listStatus` field to `tvShows` (`tracking | watchlist | completed | dropped`). Separate Watchlist section in `AllShows.tsx`. Low DB/API effort, good UX value.
- **[33]** **Genre storage and filtering**: TVMaze provides `genres[]` (visible in `tvmaze.ts:70`) but it's discarded. Store as JSON field in DB, display as badges on cards, use as filter dimension in `AllShows`.
- **[34]** **Upcoming episode notifications**: Display a visual badge on `SingleShow.tsx` when a show airs today/tomorrow. More involved: server-side notification preferences with a scheduled check.
- **[35]** **Batch operations**: Checkbox multi-select on table/cards for bulk refresh or bulk delete. Complements the `useShowActions()` refactor above.
- **[36]** **Stats/insights page**: New `/stats` route + `GET /api/user/stats` endpoint. Shows by platform, by status, added-over-time. Show count is already displayed in the toolbar — a natural extension.

### AI Features
- **[37]** **"Why should I watch this?" summary**: On the show detail page (`OneShow.tsx`) and search results (`OneShowSearch.tsx`), call Claude with the TVMaze synopsis, genres, network, and rating to generate a 2-3 sentence personalized pitch. TVMaze provides the raw data; Claude provides the opinion layer. New API endpoint `GET /api/user/tvshow/:id/summary` proxies to Claude to avoid exposing the API key client-side.
- **[38]** **Smart show recommendations**: On the dashboard or a new `/recommendations` route, send the user's tracked show list (titles, genres, networks, statuses) to Claude and return 3-5 TVMaze shows they are likely to enjoy. Requires a new `POST /api/user/recommendations` endpoint and a TVMaze search step to resolve Claude's suggestions into real show data.
- **[39]** **Catch-up summary**: For shows not refreshed in over 30 days, generate a brief "what happened recently" blurb from the show description and last-aired episode data. Most useful once episode progress tracking (already backlogged) is in place. Surface as a dismissible card on `OneShow.tsx`.
- **[40]** **Natural language library search**: Replace or augment the exact-title filter on `AllShows.tsx` with a Claude-backed query (e.g. "sci-fi shows still running", "shows I added this year"). Maps directly to the Advanced Filtering backlog item and can reuse the same UI entry point.

### Low
- **[41]** **Export/Import**: `GET /api/user/export` (JSON) and `POST /api/user/import` for portability. Low effort on the API side.
- **[42]** **Better empty state / onboarding**: Empty state in `AllShows.tsx` (line 131) tells users to search but doesn't guide them there. Add a CTA button linking to search, or show TVMaze trending shows.
- **[43]** **Rating system**: TVMaze `rating.average` is available but unused. Add user ratings and display alongside TVMaze rating on `OneShow.tsx`.
- **[44]** **User-to-user show sharing**: Share a show with another user. Requires new `SharedShows` table and social UI surface. Higher complexity, lower priority for a personal tracker.

---

## Summary

| Category               | High | Medium | Low | Total |
|------------------------|------|--------|-----|-------|
| Security               |  0   |   0    |  1  |   1   |
| Bugs                   |  0   |   0    |  0  |   0   |
| Performance            |  2   |   1    |  1  |   4   |
| Improvements & Refactors |  1  |   5    |  4  |  10   |
| Feature Ideas          |  2   |   5    |  8  |  15   |
| **Total**              | **5** | **10** | **14** | **29** |
