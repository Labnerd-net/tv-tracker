# Spec for OneShow Error Handling and Param Guard Fixes

Title: OneShow Error Handling and Param Guard Fixes
Branch: claude/fix/oneshow-error-handling-fixes
Spec file: context/specs/oneshow-error-handling-fixes.md

## Summary

Two small bug fixes in `apps/ui/src/pages/OneShow.tsx`:

1. **Silent API failure (#5):** When `getOneShow()` returns `response.success === false` (e.g., 404 show not found), the component currently does nothing — `tvShow` stays `undefined`, `setError` and `showAlert` are never called, and the user sees a silent "Show not found" text with no feedback. The `catch` block only handles network/thrown errors, not API-level failures.

2. **Missing `showID` guard (#6):** `refreshData` and `deleteOneShow` callbacks guard on `tvShow` being defined but not on `showID`. `showID` comes from `useParams()` and is typed `string | undefined`. If the component were ever rendered on a route without the param, passing `undefined` to action functions would be a silent bug.

## Functional Requirements

- When `response.success` is false, call `setError` with an appropriate message and call `showAlert` with `'danger'` severity — matching the behavior of the `catch` block.
- Both `refreshData` and `deleteOneShow` must check that `showID` is defined in addition to the existing `tvShow` check before invoking action functions.

## Possible Edge Cases

- The `response.success === false` path may also include a non-empty `response.error` string — use it in the alert message if available, falling back to a generic message.
- `deleteOneShow` currently derives the show ID from `tvShow.showId` (not `showID` from params), so the `showID` guard there is about consistency and future-proofing rather than fixing a live data flow bug.

## Acceptance Criteria

- Navigating to `/tvshow/:id` with a valid route but an ID that returns a non-success API response (e.g., a show that was deleted from the DB) shows the danger alert and sets the error state.
- No regression: a successful fetch still populates the page normally.
- `refreshData` and `deleteOneShow` both have `showID` in their guard condition.

## Open Questions

- None.

## Testing Guidelines

Add/update tests in the existing API test suite is not applicable here (UI-only). If there is an existing RTL test file for `OneShow`, add:
- A test that mocks `getOneShow` returning `{ success: false, error: 'Not found' }` and asserts `showAlert` is called and error state renders.
- Optionally a test confirming no action fires when `showID` is undefined.

## Personal Opinion

Both fixes are straightforward and low-risk. #5 is a real UX bug — silent failures confuse users. #6 is defensive but worth doing for correctness. The change to `OneShow.tsx` will be minimal (2–4 lines total). Good to combine into one commit.
