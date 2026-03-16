# Spec for UI Performance Refactor

Title: UI Performance Refactor
Branch: claude/feature/ui-performance-refactor
Spec file: context/specs/ui-performance-refactor.md

## Summary

Three related frontend improvements grouped into a single focused change:

1. **[16] Eliminate N+1 episode fetches in search results** — `Result.tsx` currently fires an independent `fetchNextEpisodeDate()` call per result on mount. With 20 results, that's 20 concurrent external TVMaze requests. Move episode date fetching up to `SearchResults.tsx`, run all fetches in parallel with `Promise.all` after search completes, and pass each result's date down as a prop.

2. **[20] Extract `useShowActions()` hook** — Refresh and delete logic is duplicated across `SingleShow.tsx`, `ShowsTable.tsx`, and `OneShow.tsx` with near-identical implementations. Extract a single `useShowActions()` custom hook that both components and the page can consume. This also becomes the single site for the context-update fix below.

3. **[17] Update context directly after refresh/delete instead of re-fetching** — All three components call `getAllShows()` after every refresh or delete to repopulate context. For delete: filter the show out of the context array. For refresh: call `getOneShow(showId)` to get the updated record and splice it into the context array in place. The API's `PATCH /api/user/tvshow/:id` returns `{ status: 'updated' }` only, so `getOneShow` is the right follow-up call — no API changes required.

Items 20 and 17 are tightly coupled: the hook is the right place to implement the optimised context updates.

## Functional Requirements

- `SearchResults.tsx` fetches next episode dates for all results after the TVMaze search returns, using `Promise.all`. Individual `Result` components receive the resolved date (or empty string) as a prop and no longer run their own fetch.
- `Result.tsx` removes its `useEffect` episode fetch. It accepts an `nextEpisodeDate` prop (string) and a `loading` boolean prop (or derives loading state from a sentinel value) to retain the existing loading indicator UX during the parent's batch fetch.
- A `useShowActions()` hook lives in `apps/ui/src/hooks/useShowActions.ts`. It exposes `refreshShow(showId, title)` and `deleteShow(showId, title)` functions plus a `loading` boolean.
- `refreshShow` calls `Api.updateShow(showId)`, then calls `Api.getOneShow(showId)` to get the updated record, and updates the show context array in place (replace the matching entry by `showId`).
- `deleteShow` calls `Api.deleteShow(showId)`, then filters the matching entry out of the show context array.
- Both actions call `showAlert` on success and failure. The hook does not navigate — callers are responsible for navigation (e.g. `OneShow` navigates to `/` after delete).
- `SingleShow.tsx`, `ShowsTable.tsx`, and `OneShow.tsx` all replace their inline refresh/delete implementations with calls to `useShowActions()`.

## Possible Edge Cases

- `getOneShow` returns a 404 after a successful `updateShow` (race condition or DB inconsistency): treat as error, show failure alert, do not corrupt context.
- `Promise.all` for episode dates: if one fetch fails, the rest should still resolve. Use `Promise.allSettled` or individual try/catch within the mapped promises so a single failure does not blank out all results.
- `SearchResults` may unmount before all episode fetches complete (user navigates away). The state setter should be guarded or the effect should clean up to avoid a "state update on unmounted component" warning.
- `SingleShow` on the dashboard grid: after a successful delete the user stays on the dashboard — the context filter removes the card without a re-fetch, which is the correct UX.
- `OneShow` on the detail page: after refresh, context is updated in place so navigating back to the dashboard reflects the new data without a re-fetch.

## Acceptance Criteria

- Searching for a show name fires exactly one batch of TVMaze episode-date requests (one per result, all in parallel) rather than one per `Result` mount.
- Result items display the loading state while the parent batch fetch is in progress.
- Refreshing a show updates the context entry for that show only, with no `getAllShows()` call.
- Deleting a show removes it from the context array, with no `getAllShows()` call.
- `useShowActions` is the sole implementation of refresh and delete logic across the three callsites.
- Build passes with no TypeScript errors.

## Open Questions

- Should `Result.tsx` also show the previous episode date (currently it only shows next)? The current behaviour only shows next episode, so keep existing UX unchanged. - only next episode
- Should the episode-date batch fetch in `SearchResults` also fetch previous episode dates? Backlog item [16] only mentions next episode — keep scope to next episode only. - only next episode

## Testing Guidelines

No new test files are needed — these are UI-only, client-side changes with no new API endpoints. Existing API tests are unaffected.

If UI tests are added in the future, useful cases would be:
- `useShowActions`: mock `Api.updateShow`, `Api.getOneShow`, `Api.deleteShow`, and `useShow` context; assert context is updated in place on refresh and filtered on delete.
- `SearchResults`: mock `Api.tvShowResults` and `Api.fetchNextEpisodeDate`; assert `fetchNextEpisodeDate` is called once per result (not zero times), and that results render with dates.

## Personal Opinion

This is a good, well-scoped change. All three items belong together: [20] creates the abstraction, [17] implements the correct logic inside it, and [16] is a parallel improvement that shares the same motivation (unnecessary network calls). The risk is low — the logic change is well-understood and the surface area is limited to three UI components. The `useShowActions` hook will also make the planned batch operations feature ([35]) much easier to build.

One thing to watch: `OneShow.tsx` currently fetches the show's detail from the API on mount using `getOneShow`. After a refresh action, the updated detail is not re-fetched into the page's local `tvShow` state — only the context array is updated. This is acceptable since the detail page doesn't auto-reload; it could be addressed in a follow-up if it becomes confusing UX. Flag it in the implementation if it comes up.
