# Spec for TVMaze Input Validation Security Fixes

Title: TVMaze Input Validation Security Fixes
Branch: claude/fix/tvmaze-input-validation-security
Spec file: context/specs/tvmaze-input-validation-security.md

## Summary

Two security gaps exist where TVMaze data is consumed without validation:

1. **UI — unvalidated episode link URLs (#2):** In `apps/ui/src/apis/userRequests.ts`, the `fetchNextEpisodeDate` function follows `_links.nextepisode.href` and `_links.previousepisode.href` URLs from TVMaze search results by passing them directly to `axios.get()`. There is no hostname check, so a tampered or unexpected URL could cause the browser to make requests to an arbitrary host. The API-side `tvmaze.ts` already guards against this with a hostname check against `api.tvmaze.com`; the UI needs the same guard.

2. **API — unvalidated TVMaze fetch response body (#3):** In `apps/api/src/routes/user.ts`, the `POST /api/user/tvshow/:id` (add by TVMaze ID) and `PATCH /api/user/tvshow/:id` (refresh) routes fetch show data from TVMaze with `response.json()` and pass it directly into `new TvMazeData()` and then into the DB insert. The `POST /api/user/tvshow` (add by body) route already validates the parsed body with `tvMazeShowBodySchema` before constructing `TvMazeData`. The fetch-based paths should apply the same schema validation to the parsed TVMaze response.

## Functional Requirements

- In `userRequests.ts`, before calling `axios.get(href)` for episode links, validate that the URL hostname is exactly `api.tvmaze.com`. If the check fails, skip the request and treat the episode date as unavailable.
- In `user.ts`, after `response.json()` on the TVMaze fetch in `POST /tvshow/:id` and `PATCH /tvshow/:id`, parse the result through `tvMazeShowBodySchema`. If validation fails, return a 400 or 502 error response rather than proceeding with bad data.
- Both fixes should be minimal — no changes to schemas, no new abstractions unless necessary.

## Possible Edge Cases

- The href field may be `undefined`, `null`, or an empty string — handle gracefully (skip the request).
- The URL constructor throws on malformed strings — wrap in try/catch or check before constructing.
- TVMaze API may return a valid response with an unexpected shape (e.g. missing required fields) — Zod parse should catch this and the route should return an appropriate error.
- Schema validation failure on refresh (`PATCH`) should return an error to the client, not silently succeed.

## Acceptance Criteria

- `fetchNextEpisodeDate` in `userRequests.ts` does not make an HTTP request if the provided href hostname is not `api.tvmaze.com`.
- `POST /api/user/tvshow/:id` returns a non-2xx response if the TVMaze API returns a body that fails `tvMazeShowBodySchema` validation.
- `PATCH /api/user/tvshow/:id` returns a non-2xx response if the TVMaze API returns a body that fails `tvMazeShowBodySchema` validation.
- The existing body-based `POST /api/user/tvshow` route is unchanged.
- All other existing routes and behaviors are unaffected.

## Open Questions

- Should a schema validation failure on the TVMaze fetch return 400 (bad request) or 502 (bad gateway, since TVMaze returned unexpected data)? 502 is more accurate since the client request was valid. Confirm preferred status code. - 502 is good

## Testing Guidelines

Create or extend tests in `apps/api/tests/` for the API changes. For the UI change, add tests in an appropriate test file if one exists, otherwise note it as a manual verification step.

- API: mock a TVMaze fetch that returns an invalid/missing-field body for `POST /tvshow/:id` — expect non-2xx response.
- API: mock a TVMaze fetch that returns an invalid body for `PATCH /tvshow/:id` — expect non-2xx response.
- API: valid TVMaze response body still succeeds for both routes (regression).
- UI: unit test that `fetchNextEpisodeDate` returns `null`/undefined when passed a non-`api.tvmaze.com` href.
- UI: unit test that a malformed/missing href does not throw.

## Personal Opinion

Both fixes are straightforward and clearly correct. The API fix (#3) is the more important one — unvalidated external data flowing into a DB insert is a real risk. The UI fix (#2) is lower severity since the browser's same-origin policy limits the damage, but it's still a good hygiene fix that mirrors what the API already does. Neither change is complex or risky. No concerns.
