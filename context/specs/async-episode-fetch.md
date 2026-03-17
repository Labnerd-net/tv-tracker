# Spec for Async Episode Fetch on Add Show

Title: Async Episode Fetch on Add Show
Branch: claude/feature/async-episode-fetch
Spec file: context/specs/async-episode-fetch.md

## Summary

When a user adds a show, the API currently performs 2-3 sequential HTTP requests to TVMaze to resolve next/previous episode airdates synchronously before responding. This blocks the response until all external fetches complete. The goal is to return the show to the client immediately after the DB insert, then resolve episode data in the background and update the record.

## Functional Requirements

- The add-show endpoint (`POST /api/user/tvshow/:id`) returns the newly inserted show to the client without waiting for episode airdate resolution.
- Episode airdate fetching (`TvMazeData.updateEpisodes()`) runs after the response is sent.
- Once episode data is resolved, the DB record is updated in place.
- The show is still fully inserted into the DB before the response is sent (id, title, status, etc.) — only episode dates may be null/empty initially.
- No new endpoint is required; this is a backend-only change.

## Possible Edge Cases

- Episode fetch fails after the show is already returned: the record remains with null episode fields. A subsequent manual refresh should recover it.
- User immediately navigates to the show detail page before background fetch completes: UI must gracefully handle null `nextEpisodeAirdate` and `prevEpisodeAirdate`.
- Concurrent add requests: each background fetch operates on its own show record by ID, so no collision risk.
- Server shuts down between insert and background fetch completing: episode fields remain null until the user triggers a refresh.

## Acceptance Criteria

- `POST /api/user/tvshow/:id` responds in under ~300ms (no longer blocked by TVMaze episode fetches).
- The returned show object is valid and contains all non-episode fields populated.
- Episode date fields on the returned object may be null/empty at time of response.
- The DB record is updated with episode data after the background fetch resolves.
- No error is surfaced to the user if the background episode fetch fails.
- The UI show detail and list views handle null episode date fields without crashing.

## Open Questions

- Should the background fetch errors be logged server-side? (Likely yes, for observability.) - yes
- Is there any value in a polling mechanism or WebSocket push to update the client when episode data arrives, or is a manual refresh sufficient? - manual refresh is fine

## Testing Guidelines

Create or extend tests in `apps/api/tests/`:
- `user.test.ts`: assert that `POST /api/user/tvshow/:id` returns a show with the core fields populated and does not time out waiting for episode fetches.
- Mock `TvMazeData.updateEpisodes()` to verify it is called after the response (not before).
- Verify the DB record is updated after the background fetch resolves (check episode fields post-fetch).

## Personal Opinion

This is a straightforward and worthwhile change. The blocking TVMaze fetches are an unnecessary latency hit on what should feel like a fast "add" action — the user doesn't need the episode dates to land on the show detail page.

One concern: the UI currently renders episode date fields unconditionally. A null episode date should already render gracefully (check `SingleShow.tsx` and `OneShow.tsx`) — if it doesn't, that's a small UI fix needed alongside this. Overall low risk, good payoff.
