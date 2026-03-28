# Plan: Search UX Fixes (Backlog #8, #19)

## Context

Two small UX issues in the search flow:
- **#8**: All search result cards block on a single shared `episodesLoading` boolean. A slow TVMaze episode fetch holds every card in the loading state even after the others have resolved.
- **#19**: The navbar search form can trigger a redundant route transition when the user submits the same query while already on that search results page.

## Fix 1 — Per-Card Episode Loading (#8)

**File: `apps/ui/src/pages/SearchResults.tsx`**

Current approach:
- `episodesLoading: boolean` — one shared flag
- `Promise.allSettled([...all fetches...])` — writes all dates at once, then clears the flag

New approach:
- `episodesLoading: Record<number, boolean>` — one entry per show ID
- After `setSearchResults(data)`, initialize the map: `Object.fromEntries(data.map(item => [item.show.id, true]))`
- Fire each `fetchNextEpisodeDate` individually with `.then()` instead of batching in `Promise.allSettled`. In each `.then()`:
  - Check `controller.signal.aborted` and return early if true
  - `setEpisodeDates(prev => ({ ...prev, [showId]: date }))`
  - `setEpisodesLoading(prev => ({ ...prev, [showId]: false }))`
- Remove the `setEpisodesLoading(true/false)` calls at the outer level
- Pass `episodeLoading={episodesLoading[data.show.id] ?? false}` to each `<Result>` (type at call site is already `boolean`)

`Result.tsx` receives `episodeLoading: boolean` — no changes needed there.

## Fix 2 — Submit Guard (#19)

**File: `apps/ui/src/components/Navbar.tsx`**

- Add `useParams` to the import from `react-router`
- Destructure `const { showName } = useParams();` inside the component
- In `startSearch`, add an early return before `navigate()`:
  ```ts
  if (showName && userInput.trim() === showName) return;
  ```
- `showName` is `undefined` on non-search routes, so the guard only fires on `/search/:showName` routes.

## Files Modified

- `apps/ui/src/pages/SearchResults.tsx`
- `apps/ui/src/components/Navbar.tsx`

## Verification

1. Run `pnpm build` — must pass with no errors.
2. Search for a term with multiple results; observe cards populating episode dates one at a time rather than all at once.
3. On a search results page, submit the same term — page does not remount (no loading flash).
4. On a search results page, submit a different term — navigates to new results normally.
5. Navigate away from search results while episode fetches are in flight — no state updates after unmount (abort signal check).
