# Spec for TVMaze Image URL Validation

Title: TVMaze Image URL Validation
Branch: claude/fix/tvmaze-image-url-validation
Spec file: context/specs/tvmaze-image-url-validation.md

## Summary

Two related security gaps around `imageLink` URL handling in the API:

**[6]** `POST /api/user/tvshow` (body-based route) constructs a `TvMazeData` from the full client-supplied JSON body. The constructor pulls `imageLink` from `showData.image?.medium`, which in this path comes directly from the client — not from TVMaze. A malicious client can set `image.medium` to any URL, and that value is persisted to the DB unchecked. If `returnImage()` is ever used to proxy or serve that URL, the server would fetch an attacker-controlled host.

**[45]** `returnImage()` in `tvmaze.ts` fetches `this.imageLink` without hostname validation. The pattern for validating episode links already exists in `fetchAirdate()` (rejects non-`api.tvmaze.com` hostnames). `returnImage()` is inconsistent — it should apply the same guard against TVMaze CDN hostnames before fetching.

Both issues share the same root fix: validate that `imageLink` matches an allowed TVMaze hostname before storing or fetching it.

## Functional Requirements

- In `TvMazeData.returnImage()`, validate `this.imageLink` against the TVMaze image CDN hostname (`static.tvmaze.com`) before fetching. Return `null` and log a warning if the hostname does not match.
- In `POST /api/user/tvshow` (body-based route, `user.ts`), strip and re-validate the `imageLink` from the client-supplied body before it is used to construct `TvMazeData`. Accepted values must match the TVMaze CDN pattern; any other value should be cleared to an empty string.
- The validation logic should be consistent with the existing `fetchAirdate()` pattern already in `tvmaze.ts`.
- No changes to routes that fetch data from TVMaze directly (e.g. `POST /api/user/tvshow/:id`, `PATCH /api/user/tvshow/:id`) — those paths are trusted because the data originates server-side.

## Possible Edge Cases

- A valid TVMaze image URL may use HTTP instead of HTTPS — treat this as invalid (reject it).
- `imageLink` may be an empty string (show has no image) — that is fine and should pass through without logging a warning.
- A malformed URL string that throws on `new URL()` — catch the parse error and treat as invalid (clear to empty string).
- TVMaze occasionally uses `null` for `image` — the constructor already handles this via `?? ''`, so no extra handling needed.

## Acceptance Criteria

- `returnImage()` rejects any `imageLink` whose hostname is not `static.tvmaze.com`, logs a warning, and returns `null`.
- `returnImage()` continues to work for valid TVMaze CDN URLs.
- `POST /api/user/tvshow` (body route) stores an empty `imageLink` when the client supplies a non-TVMaze image URL.
- `POST /api/user/tvshow` (body route) stores the URL normally when the client supplies a valid `static.tvmaze.com` URL.
- No regression on the TVMaze-ID-based add and refresh routes.

## Open Questions

- `returnImage()` is currently defined but never called anywhere in the API routes. Should it be removed, or kept and fixed for future use? Assuming keep-and-fix for consistency, but worth confirming. - remove this code

## Testing Guidelines

Add tests to `apps/api/tests/tvmaze.test.ts` (file already exists from a prior fix):

- `returnImage()` returns `null` and does not fetch when `imageLink` is an arbitrary external URL.
- `returnImage()` returns `null` when `imageLink` is empty.
- `returnImage()` proceeds to fetch when `imageLink` is a valid `static.tvmaze.com` URL (mock fetch).
- `POST /api/user/tvshow` with a body containing a non-TVMaze `image.medium` stores an empty `imageLink` in the DB (or assert the stored show has no image link).
- `POST /api/user/tvshow` with a valid `static.tvmaze.com` image URL stores it correctly.

## Personal Opinion

Both fixes are straightforward and well-motivated. The pattern is already established in `fetchAirdate()` so there is no new design work — just apply it consistently.

The [6] fix is the more impactful one: the body-based add route is a real injection vector today, even if current callers are trusted clients. The [45] fix is defensive consistency.

One concern: `returnImage()` is dead code. Fixing dead code is low ROI and can give a false sense of security if the method is later called without the DB-stored URL also being validated. The deeper fix for [6] is validating at write time (when the URL enters the DB), which this spec does — so the `returnImage()` guard is a belt-and-suspenders addition. Worth doing, but note it.

No complexity concerns. These are small, targeted changes.
