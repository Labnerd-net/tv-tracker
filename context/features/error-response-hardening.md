# Plan: Error Response Hardening

## Context

Three related issues in the API error response layer. Two are information leaks (raw `e.message` returned to clients in `admin.ts` and `user.ts` catch blocks — exposes DB internals). One is maintenance hygiene (`err()` helper embeds a `code` field in the JSON body that can drift from the actual HTTP status and is not consumed anywhere). Auth routes already follow the correct pattern. This brings admin and user routes into alignment.

## Files to Modify

- `apps/api/src/utils/response.ts` — remove `code` param
- `apps/api/src/routes/admin.ts` — fix catch block (1 route)
- `apps/api/src/routes/user.ts` — fix catch blocks (6 routes)
- `apps/api/tests/admin.test.ts` — add error body assertion

---

## Step 1 — `response.ts`: Remove `code` from `err()`

Change `err(msg: string, code = 400)` to `err(msg: string)`, removing `code` from the returned object.

## Step 2 — `admin.ts`: Fix catch block

Remove the `if (e instanceof Error)` branch that leaks `e.message`. Collapse to a single `logger.error` + generic message, matching auth.ts pattern.

## Step 3 — `user.ts`: Fix all 6 catch blocks

Same fix as admin across all 6 routes: remove `if (e instanceof Error)` branch, keep `logger.error` + generic message.

## Step 4 — `admin.test.ts`: Add error body assertion

Extend the existing DB-error test to assert `body.error === 'An unexpected error occurred'` (not the raw DB message).

## Verification

```bash
pnpm build
pnpm --filter @tv-tracker/api test
```
