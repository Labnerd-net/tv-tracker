# Spec for Fix TVMaze Response Check and JWT Payload Validation

Title: Fix TVMaze Response Check and JWT Payload Validation
Branch: claude/fix/fix-tvmaze-response-jwt-validation
Spec file: context/specs/fix-tvmaze-response-jwt-validation.md

## Summary

Two API-side defensive fixes:

1. **#7 — TVMaze `response.ok` check in `fetchAirdate`** (`apps/api/src/tvmaze.ts`): The inner `fetchAirdate` function calls `response.json()` unconditionally. A non-200 response from TVMaze (rate limit, 404, 5xx) silently returns an empty string with no log entry — the caller has no visibility into what went wrong. Fix: check `response.ok` before parsing; log the HTTP status on failure and return `''`.

2. **#11 — JWT payload runtime validation in `authMiddleware`** (`apps/api/src/utils/middleware.ts`): After `verify()` succeeds the result is cast with `payload as unknown as JwtData`. Hono's `verify()` only checks the signature and expiry — it does not enforce the presence or types of custom fields (`sub`, `email`, `displayName`, `roles`). A JWT signed with the correct secret but missing those fields passes through and causes downstream `undefined` access in route handlers. Fix: add a runtime field check (Zod schema or manual guard) after `verify()` and return 401 if the shape is invalid.

## Functional Requirements

- In `fetchAirdate`, guard `response.json()` behind `response.ok`. Log the HTTP status code and URL when not `ok`, then return `''`.
- In `authMiddleware`, validate that the verified payload contains `sub` (number), `email` (string), `displayName` (string), and `roles` (array of `"user"|"admin"` strings) before setting the context value. Return 401 on shape mismatch.
- No change to public API contracts — callers that currently receive empty strings or 401 responses continue to do so under the same failure conditions.

## Possible Edge Cases

- TVMaze returns a 429 (rate limit) — should log status 429 and return `''`, not throw.
- TVMaze returns valid JSON with a non-200 status — body should be ignored.
- JWT has correct signature but `roles` is an empty array — this is a valid shape; should pass.
- JWT has correct signature but `roles` is missing entirely or not an array — should fail validation and return 401.
- JWT has `sub` as a string instead of a number (malformed token from an old signing path) — should fail and return 401.

## Acceptance Criteria

- `fetchAirdate` with a mocked non-200 response logs the status and returns `''` without throwing.
- `fetchAirdate` with a mocked 200 response continues to return the `airdate` field.
- `authMiddleware` with a well-formed JWT payload passes through to `next()`.
- `authMiddleware` with a JWT missing `sub` returns HTTP 401.
- `authMiddleware` with a JWT where `roles` is not an array returns HTTP 401.

## Open Questions

- Should we use Zod (already a project dependency) or a manual field guard for the JWT shape check? Zod is already used in route schemas so it's consistent, but a manual guard avoids importing an extra module into `middleware.ts`. Either approach is acceptable. - zod is good

## Testing Guidelines

Add tests to the existing `apps/api/tests/` suite:

- `tvmaze.test.ts`: mock `fetch` to return a non-200 response in the `updateEpisodes` path; assert the returned `next`/`prev` values are empty strings and that the logger received a warning with the status code.
- `auth.test.ts` or a new `middleware.test.ts`: send requests with a JWT whose payload is missing required fields; assert HTTP 401 is returned.

Keep test count minimal — one test per failure mode is sufficient.

## Personal Opinion

Both fixes are straightforward and low-risk. #7 is a one-liner guard that closes a silent failure mode — clear win with no downside. #11 is slightly more involved but important: without it, a crafted JWT could cause unexpected `undefined` behavior in route handlers. Zod is already in the project so adding a `jwtDataSchema.safeParse()` is the cleanest path. Neither change is complex or over-engineered. I'd do both.
