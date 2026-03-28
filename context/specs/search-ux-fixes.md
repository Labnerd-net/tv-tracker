# Spec for search-ux-fixes

Title: Search UX Fixes (Backlog #8, #19)
Branch: claude/fix/search-ux-fixes
Spec file: context/specs/search-ux-fixes.md

## Summary

Two small UX fixes in the search flow:

1. **#8** — `SearchResults.tsx` blocks all result cards behind a single `episodesLoading` boolean until every TVMaze episode fetch settles. Replace it with per-card loading state so cards render their episode date as soon as their individual fetch resolves.

2. **#19** — The navbar search form can fire redundant route transitions if submitted while already on the same search results page. Guard against it by comparing the trimmed input to the current `showName` route param before navigating.

## Functional Requirements

- **#8**
  - `episodesLoading` changes from `boolean` to `Record<number, boolean>` in `SearchResults.tsx`.
  - When search results arrive, every show ID is initialized to `true` in the loading map.
  - Each `fetchNextEpisodeDate` promise resolves independently: on settle, set that show's entry to `false` and write the date into `episodeDates`.
  - The `Result` component receives `episodeLoading: boolean` per card (derived from the map at the call site).
  - Cards with a resolved date display it immediately; cards still fetching show an inline loading indicator.

- **#19**
  - `Navbar.tsx` reads the current `showName` param via `useParams`.
  - `startSearch` bails early (no `navigate()`) if `userInput.trim() === showName`.
  - No timer or external debounce library is introduced.

## Possible Edge Cases

- **#8**: If `controller.abort()` fires mid-loop (user navigates away), each per-card promise may have already resolved. The existing `controller.signal.aborted` check after `Promise.allSettled` needs to be applied per-promise instead, or the abort guard needs to remain at the outer level after all individual updates.
- **#8**: An empty search result set means the loading map is initialized to `{}` — no cards render, no issue.
- **#19**: `showName` from `useParams` may be `undefined` on non-search pages — the guard must handle that (falsy `showName` should not block navigation).
- **#19**: Case sensitivity — if the user types the same query with different casing, it should still navigate (TVMaze search is case-insensitive but we shouldn't suppress the transition).

## Acceptance Criteria

- Cards in search results show their episode date as soon as their individual TVMaze fetch resolves, not after all fetches complete.
- Submitting the same search term from the same search results page does not trigger a new navigation or remount.
- Submitting a different search term always navigates normally.
- No regressions in abort behavior when navigating away from search results mid-fetch.

## Open Questions

- None.

## Testing Guidelines

No new unit test files needed — both changes are UI behavior with no testable pure-function logic. Verify manually:
- Search for a term, observe cards populating episode dates one at a time.
- On a search results page, submit the same term — page does not remount.
- On a search results page, submit a different term — navigates correctly.

## Personal Opinion

Both changes are straightforward and clearly net-positive. #8 is the more meaningful fix — the current shared loading state gives the wrong impression that results are still pending when most dates have already resolved. The per-card approach is idiomatic React and maps cleanly to the existing data structure.

#19 is a minor guard, not a debounce in the traditional sense. The route-param comparison is the cleanest approach since it's stateless and doesn't require refs or timers. The only caveat is that `useParams` returns `undefined` on non-search routes, which needs a one-line falsy check — trivial.
