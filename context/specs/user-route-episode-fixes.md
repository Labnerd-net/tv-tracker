# Spec for User Route Episode Fixes

Title: User Route Episode Fixes
Branch: claude/fix/user-route-episode-fixes
Spec file: context/specs/user-route-episode-fixes.md

## Summary

Two related fixes to `apps/api/src/routes/user.ts` targeting the episode-update background logic:

1. **(#15 Refactor)** The fire-and-forget episode update block is copy-pasted identically in both `POST /tvshow` and `POST /tvshow/:id`. Extract it into a named helper `scheduleEpisodeUpdate(showData, newShowId, db)`.

2. **(#45 Bug)** `POST /api/user/tvshow` returns `showId: undefined` in its success response body when `addOneShow()` yields no rows (silent DB insert failure). The UI then silently skips `addShow()` and the new show never appears until the next full dashboard refresh. An explicit error response must be returned when `newShowId` is undefined.

## Functional Requirements

- Extract the repeated `.then(...).catch(...)` episode-update block from both `POST /tvshow` and `POST /tvshow/:id` into a single helper function named `scheduleEpisodeUpdate`.
- The helper accepts `showData`, `newShowId`, and `db` as parameters and encapsulates the background `updateEpisodes()` call plus the `updateShowEpisodes()` patch on success.
- Both routes call the helper after insert instead of inlining the block.
- In `POST /api/user/tvshow`, after calling `addOneShow()`, check whether `newShowId` is defined before proceeding.
- If `newShowId` is undefined, return an explicit error response (e.g. HTTP 500 with `err('Failed to save show')`) rather than continuing and returning `{ showId: undefined }`.

## Possible Edge Cases

- `addOneShow()` returns an empty array (no rows) — must be treated as a failure, not a no-op.
- The helper is fire-and-forget; errors inside it must be caught and logged without affecting the HTTP response that has already been sent.
- Both `POST /tvshow` (body-based) and `POST /tvshow/:id` (ID-based) must call the same helper and behave consistently.

## Acceptance Criteria

- The duplicated episode-update block no longer exists in the route file; only the extracted helper remains.
- `POST /api/user/tvshow` returns a non-2xx error response when the DB insert yields no rows.
- `POST /api/user/tvshow` returns the correct `showId` in the response when the insert succeeds.
- Existing behavior for the success path is unchanged.
- TypeScript compiles without errors (`pnpm build`).

## Open Questions

- None.

## Testing Guidelines

Add or update tests in `apps/api/tests/`:

- `POST /api/user/tvshow` with a mocked `addOneShow()` that returns no rows → expect a 5xx error response, not `{ ok: true, data: { showId: undefined } }`.
- `POST /api/user/tvshow` success path still returns `{ ok: true, data: { showId: <number> } }`.
- Verify no regression on `POST /api/user/tvshow/:id` success path.

## Personal Opinion

Both changes are straightforward and clearly correct. #45 is a real bug — returning `showId: undefined` in a success response is a contract violation that silently breaks the UI. #15 is low-risk deduplication with no behavior change. Combining them in one fix is sensible since they touch the same lines of the same file. No concerns.
