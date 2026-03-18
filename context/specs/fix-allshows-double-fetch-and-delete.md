# Spec for Fix AllShows Double Fetch and Optimistic Delete Bug

Title: Fix AllShows Double Fetch and Optimistic Delete Bug
Branch: claude/fix/fix-allshows-double-fetch-and-delete
Spec file: context/specs/fix-allshows-double-fetch-and-delete.md

## Summary

Fix two related UI bugs in the show management flow:

1. **#5 — AllShows double fetch**: `AllShows` has its own `useEffect` that calls `getAllShows()` on every mount, while `ShowProvider` also fetches all shows independently when auth state changes. This causes two parallel `GET /api/user/tvshows` requests on every dashboard load. The fix is to remove the redundant fetch from `AllShows` and let the component read exclusively from `useShow()` context.

2. **#6 — Optimistic delete in useShowActions**: `deleteShow` calls `setTvShows(prev => prev.filter(...))` to update the UI before the API response is confirmed. If the API returns `ok: false` without throwing, the show vanishes from the UI but remains in the database. The fix is to gate the context update on `response.success` being true.

## Functional Requirements

- `AllShows` must not call `getAllShows()` directly; it should only read from `useShow()` context.
- `ShowProvider` remains the single source for fetching and populating show data.
- `deleteShow` in `useShowActions` must only update the context array after a confirmed successful API response.
- If `deleteShow` fails (API returns `ok: false` or throws), the show must remain visible in the UI and an error should be surfaced to the user as it is today.

## Possible Edge Cases

- If `ShowProvider` has not yet loaded shows when `AllShows` mounts (e.g. slow network), the component should show the existing loading/empty state rather than triggering its own fetch.
- A delete that fails partway (network error vs. `ok: false` body) should both be handled — neither should remove the show from context.
- If `deleteShow` is called rapidly in succession, removing the filter-before-confirm logic should not introduce any new race condition.

## Acceptance Criteria

- Dashboard load triggers exactly one `GET /api/user/tvshows` request (verifiable in DevTools Network tab).
- Deleting a show when the API returns a successful response removes it from the UI as before.
- Simulating an API failure on delete (e.g. temporarily breaking the endpoint or returning `{ ok: false }`) leaves the show visible in the UI.
- No regressions to existing show refresh, add, or list behavior.

## Open Questions

- None — both fixes are straightforward and well-scoped.

## Testing Guidelines

Tests live in `apps/api/tests/` (API) — no UI test infrastructure exists beyond `viewToggle.test.ts`.
For these UI-only fixes, manual browser verification is sufficient. No new test files are required unless the reviewer judges it worthwhile to add `useShowActions` unit tests alongside.

If tests are added:
- Verify `deleteShow` does NOT call `setTvShows` when the mock API returns `{ success: false }`.
- Verify `deleteShow` DOES call `setTvShows` when the mock API returns `{ success: true }`.

## Personal Opinion

Both fixes are clearly correct and low-risk. #5 is a straightforward one-line removal with no behavioral change under normal conditions. #6 is a small guard addition that prevents a silent data inconsistency that would confuse users.

Neither fix is complex. They can and should be bundled in a single commit since they touch different files and are both small. No concerns.
