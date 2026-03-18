# Spec for UI Performance and Context Encapsulation Fixes

Title: UI Performance and Context Encapsulation Fixes
Branch: claude/fix/ui-perf-context-fixes
Spec file: context/specs/ui-perf-context-fixes.md

## Summary

Four targeted fixes across the UI:

1. **#9 — AbortController in SearchResults**: In-flight `fetchNextEpisodeDate` requests are never cancelled when the user changes the search query or navigates away. This causes stale responses to update state on an unmounted component and can produce incorrect episode date data from a prior search.

2. **#12 — Cache log level in logger.ts**: `getConfiguredLevel()` reads `import.meta.env.VITE_LOG_LEVEL` and scans a levels array on every single log call. The value is a build-time constant; it should be computed once at module load.

3. **#13 — Lazy image loading**: No `<img>` in the app uses `loading="lazy"` or `decoding="async"`. All show artwork images are eagerly loaded regardless of viewport visibility, wasting bandwidth on large libraries.

4. **#21 — Named ShowContext actions**: The raw `setTvShows` setter is exposed on `ShowContext`, allowing any consumer to overwrite the entire array. Replace with named action functions (`addShow`, `updateShow`, `removeShow`) to encapsulate mutation logic and prevent accidental overwrites.

## Functional Requirements

### #9 AbortController in SearchResults
- The `useEffect` that fires `fetchNextEpisodeDate` calls must return a cleanup function that aborts all in-flight requests when `showName` changes or the component unmounts.
- `fetchNextEpisodeDate` in `userRequests.ts` must accept an optional `AbortSignal` and forward it to the underlying fetch.
- Aborted requests must not update component state (ignore `AbortError`).

### #12 Logger level cache
- The level detection logic must run exactly once at module initialisation, not on every invocation of `getConfiguredLevel()`.
- Runtime behaviour must be identical; only the execution timing changes.

### #13 Lazy image loading
- Every `<img>` element in `SingleShow.tsx`, `Result.tsx`, `OneShow.tsx`, and `OneShowSearch.tsx` must have `loading="lazy"` and `decoding="async"`.
- No other changes to these components.

### #21 Named ShowContext actions
- Remove `setTvShows` from the context value and interface.
- Add three named actions to the context:
  - `addShow(show: ShowData)` — prepend or append a single show.
  - `updateShow(show: ShowData)` — replace the existing entry with the same `showId`.
  - `removeShow(showId: number)` — remove the entry with the matching `showId`.
- Update all existing call sites that currently use `setTvShows` to use the appropriate named action.

## Possible Edge Cases

- **#9**: If `Promise.allSettled` resolves after abort, each settled result must be checked individually; only non-aborted results should update state. The component may render with partial date data if some fetches complete before abort.
- **#21**: `updateShow` receives a show whose `showId` does not exist in the current array (e.g. race condition on rapid add/delete). Should be a no-op rather than pushing a duplicate.
- **#21**: Multiple consumers calling actions concurrently — state updates must use the functional form of `setTvShows` internally to avoid stale closure bugs.

## Acceptance Criteria

- [ ] Changing the search term or navigating away cancels all pending episode date fetches from the previous query; no "Can't perform a React state update on an unmounted component" warnings in the console.
- [ ] Logger level is read from `import.meta.env` zero times after module load completes (build output verifiable by inspection).
- [ ] All four image-bearing components have `loading="lazy" decoding="async"` on their `<img>` elements; no other changes in those files.
- [ ] `ShowContext` no longer exposes `setTvShows`; TypeScript compilation fails if any consumer tries to use it.
- [ ] All existing show-management flows (add, refresh, delete) work correctly end-to-end with the named actions.
- [ ] `pnpm build` passes with no errors or new type errors.

## Open Questions

- **#9**: Should `fetchNextEpisodeDate` and `fetchPrevEpisodeDate` both be updated to accept a signal, or only `fetchNextEpisodeDate` (the one used in `SearchResults`)? Suggest both for consistency, but only `fetchNextEpisodeDate` is strictly required for this fix. - both please
- **#21**: Should `addShow` prepend (show appears first) or append? Current `useShowActions` appears to refetch all shows on add; the named action should match whatever order the current UX implies. - append

## Testing Guidelines

Tests live in `apps/api/tests/` (API) — UI unit tests are minimal by project convention. No new test files are required for these changes. Verify manually in the browser:

- Type quickly in the search box and confirm no stale episode dates appear from cancelled queries.
- Open Network DevTools, search for a show, navigate away mid-load, confirm pending requests are cancelled.
- Open a page with many shows and confirm images outside the viewport are not fetched until scrolled into view.
- Add, refresh, and delete a show; confirm the list updates correctly with no console errors.

## Personal Opinion

These are all good, low-risk fixes. #9 (AbortController) and #21 (named actions) are the most valuable — the abort fix prevents a real class of bugs and the named-action refactor meaningfully improves encapsulation. #12 and #13 are trivial one-liners with no downside. None of them are complex. The only non-trivial part is threading the `AbortSignal` through `fetchNextEpisodeDate` and wiring `Promise.allSettled` correctly, but that is straightforward.

Concern on #21: updating all call sites requires reading every file that touches `setTvShows`. If any are missed, TypeScript will catch it at build time, which is fine — but make sure to search for all usages before removing the export.
