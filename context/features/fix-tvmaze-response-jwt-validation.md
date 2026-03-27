# Plan: Fix TVMaze Response Check and JWT Payload Validation

## Context

Two defensive API fixes from backlog items #7 and #11:

- **#7**: `fetchAirdate` in `tvmaze.ts` calls `response.json()` unconditionally. A non-200 TVMaze response (429, 404, 5xx) produces no log entry and silently returns `''`, making failures invisible.
- **#11**: `authMiddleware` casts the JWT verify result directly to `JwtData` with no runtime field checks. A valid-signature token missing `sub`, `email`, `displayName`, or `roles` would pass through and cause downstream `undefined` access in route handlers.

---

## Fix #7 — Check `response.ok` in `fetchAirdate`

**File:** `apps/api/src/tvmaze.ts` (lines 61–63)

Add an `response.ok` guard between the `fetch` call and `response.json()`:

```
const response = await fetch(link);
if (!response.ok) {
  logger.warn({ link, status: response.status }, `Non-OK response from TVMaze for ${label} episode`);
  return '';
}
const data = await response.json();
```

No other changes to this file.

---

## Fix #11 — Runtime JWT payload validation in `authMiddleware`

**Files:**
- `apps/api/src/schemas/auth.ts` — add `jwtDataSchema`
- `apps/api/src/utils/middleware.ts` — import schema and use `safeParse`

### Step 1: Add `jwtDataSchema` to `apps/api/src/schemas/auth.ts`

Zod is already imported and used in this file. Add a new export below the existing schemas:

```typescript
export const jwtDataSchema = z.object({
  sub: z.number(),
  email: z.string(),
  displayName: z.string(),
  roles: z.array(z.enum(['user', 'admin'])),
  exp: z.number(),
});
```

Note: `Role` type is `"user" | "admin"` per `apps/shared/types/tv-tracker.ts`.

### Step 2: Update `authMiddleware` in `apps/api/src/utils/middleware.ts`

Replace the unsafe cast:
```typescript
// before
c.set('jwtPayload', payload as unknown as JwtData);
```
With a Zod parse:
```typescript
// after
const parsed = jwtDataSchema.safeParse(payload);
if (!parsed.success) {
  return c.json(err('Unauthorized'), 401);
}
c.set('jwtPayload', parsed.data);
```

Import `jwtDataSchema` from `../schemas/auth.js`. The `JwtData` type import can stay (it's still used by `requireRole`).

---

## Tests

### tvmaze.test.ts — add to `updateEpisodes` suite

Mock `fetch` to return `{ ok: false, status: 429 }` (no `json` method needed since code returns before calling it). Assert:
- `updateEpisodes()` resolves with `{ next: '', prev: '' }`
- `logger.warn` was called with an object containing `status: 429`

Use the existing `vi.spyOn(globalThis, 'fetch')` + `vi.spyOn(logger, 'warn')` pattern already established in this file.

### New file: `apps/api/tests/middleware.test.ts`

Integration test using `app.request()` (same pattern as auth.test.ts). Steps:
- Import `app` from `../src/app.js`
- Mock DB/rate-limiter modules with `vi.mock()` so the route itself doesn't throw
- Use Hono's `sign()` utility (`hono/jwt`) to mint JWTs with the test `JWT_SECRET` (set in `tests/setup.ts`) but with intentionally missing or wrong-typed fields
- Hit `GET /api/user/profile` (a simple protected route)
- Assert HTTP 401 for malformed payloads, and that a well-formed payload passes through (200 or whatever the mocked profile route returns)

Test cases:
1. Valid JWT with complete payload → not 401
2. JWT missing `sub` → 401
3. JWT where `roles` is a string instead of an array → 401
4. JWT where `sub` is a string instead of a number → 401

---

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/tvmaze.ts` | Add `response.ok` guard in `fetchAirdate` |
| `apps/api/src/schemas/auth.ts` | Export `jwtDataSchema` |
| `apps/api/src/utils/middleware.ts` | Import `jwtDataSchema`, replace unsafe cast with `safeParse` |
| `apps/api/tests/tvmaze.test.ts` | Add non-200 fetch mock test |
| `apps/api/tests/middleware.test.ts` | New file: JWT shape validation integration tests |

## Verification

```bash
pnpm --filter @tv-tracker/api test
pnpm build
```

All existing tests must pass. The 4 new middleware tests and 1 new tvmaze test should pass.
