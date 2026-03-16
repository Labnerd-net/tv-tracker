# Spec for Error Response Hardening

Title: Error Response Hardening
Branch: claude/fix/error-response-hardening
Spec file: context/specs/error-response-hardening.md

## Summary

Three related cleanup items in the API error response layer:

1. **[46]** `admin.ts` catch block leaks the raw DB/internal error message (`e.message`) to the client. Auth routes already follow the correct pattern (log server-side, return a generic message). Admin should match.

2. **[14]** The `err()` helper in `response.ts` embeds a `code` field in the JSON body alongside the HTTP status. These can drift — a caller could pass mismatched values, or omit the second arg entirely (most auth/user routes already do). The `code` field in the body is redundant with the HTTP status and should be removed.

3. **[user.ts]** `user.ts` has the same `e.message` leak as [46] in every catch block across all six routes. Apply the same fix: log server-side, return a generic message.

## Functional Requirements

- `admin.ts` catch block: log the error server-side with `logger.error`, return `err('An unexpected error occurred')` with HTTP 500. Do not return `e.message` to the client.
- `user.ts` catch blocks (all six routes): same fix — log server-side, return generic message. Remove the `if (e instanceof Error)` branch that currently leaks `e.message`.
- `response.ts` `err()` helper: remove the `code` parameter and the `code` field from the returned object. Signature becomes `err(msg: string)`.
- Update all call sites that currently pass a second argument to `err()` to drop the second argument. The HTTP status must still be passed explicitly to `c.json(data, status)`.
- The `ok: false` and `error` fields in error responses remain unchanged.

## Possible Edge Cases

- The UI does not appear to consume the `code` field from error bodies, but confirm no UI code reads `response.data.code` or similar before removing.

## Acceptance Criteria

- `admin.ts` and `user.ts` catch blocks no longer send `e.message` to the client.
- `response.ts` `err()` no longer includes a `code` field in the response body.
- No call site passes a second argument to `err()`.
- All error responses still send the correct HTTP status code via `c.json(data, status)`.
- Build passes with no TypeScript errors.

## Open Questions

- None.

## Testing Guidelines

Tests in `apps/api/tests/`:

- `admin.test.ts` (already exists): add a test that simulates a DB error on `GET /api/admin/users` and asserts the response body does not contain an internal error message.
- `user.test.ts` (if it exists) or a new test file: add equivalent tests for at least one user route (e.g. `GET /api/user/tvshows`) to confirm `e.message` is not returned.
- Verify existing tests still pass — no regressions from the `err()` signature change.

## Personal Opinion

All three fixes are straightforward and low risk. The `e.message` leaks in admin and user routes are real information leaks — raw DB errors can expose table names, column names, or constraint details. The `code` removal in `err()` is maintenance hygiene but worth doing in the same pass. Scope is well-defined and contained to three files.
