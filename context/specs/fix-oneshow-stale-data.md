# Spec for fix-oneshow-stale-data

branch: claude/fix/fix-oneshow-stale-data

## Summary

`OneShow.tsx` fetches show data on mount via its own `Api.getOneShow()` call and stores it in local state. When the user clicks "Refresh Data", `refreshShow()` in `ShowProvider` patches the show and writes the updated data into `tvShows` via `updateShow()`. But `OneShow` never reads from `tvShows` — it displays its own stale local state. The fix is to derive `tvShow` from `tvShows` in `ShowProvider` (looked up by `showID`) instead of maintaining a separate fetch-on-mount.

## Functional Requirements

- `OneShow` must display the updated show data immediately after `refreshShow` resolves, with no extra fetch or navigation required.
- `OneShow` must still show `<ShowDetailSkeleton />` while shows are loading (use `loading` from `ShowProvider` instead of local loading state).
- If no matching show is found in `tvShows` after loading completes, display the existing error state ("Show not found").
- Direct URL navigation to `/tvshow/:id` must still work (relies on `ShowProvider` fetching all shows on mount before `loading` goes false).

## Possible Edge Cases

- User navigates directly to `/tvshow/:id` — `tvShows` is empty until `ShowProvider` finishes its initial fetch. The `loading` flag from context already covers this; skeleton is shown until loading is false.
- `showID` param is not a valid number — `Number(showID)` returns `NaN`; `find` returns `undefined`; error state is shown.
- Show was deleted by another tab/session while the user is viewing the detail page — show disappears from `tvShows` on next context update; detail page falls into the "Show not found" state.

## Acceptance Criteria

- Navigate to a show detail page. Click "Refresh Data". The next/prev episode dates update in place without a page reload or navigation.
- Navigating directly to `/tvshow/:id` by URL shows the show detail page correctly.
- Navigating to `/tvshow/99999` (non-existent show) shows "Show not found" after loading completes.

## Open Questions

- None.

## Testing Guidelines

No new test file is needed — this is a pure UI data-source swap with no new logic. Manual verification covers the acceptance criteria above. The existing `ShowProvider` unit tests already cover `updateShow` and `refreshShow` behavior.

## Personal Opinion

Good change. The local fetch in `OneShow` was always redundant — `ShowProvider` already has the data. Deriving from context is simpler, eliminates an extra network call on every detail page visit, and makes refresh work correctly for free. No concerns; straightforward single-file change.
