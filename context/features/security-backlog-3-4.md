# Plan for security-backlog-3-4

Title: Security Fixes — Backlog #3 and #4
Spec file: context/specs/security-backlog-3-4.md
Branch: claude/fix/security-backlog-3-4

## Overview

Two isolated, low-risk changes:

1. **#3** — Swap `authRateLimit` → `apiRateLimit` on `DELETE /api/auth/deleteUser`
2. **#4** — Move sensitive field exclusion from the `admin.ts` route map down to the `returnUsers()` DB query

---

## Fix #3 — Rate limit on `DELETE /api/auth/deleteUser`

**File:** `apps/api/src/routes/auth.ts`

**Changes:**
- Line 24: add `apiRateLimit` to the named imports from `../utils/rateLimiter.js`
- Line 177: replace `authRateLimit` with `apiRateLimit` in the `.delete('/deleteUser', ...)` handler

`authRateLimit` stays imported — it is still used on `/register`, `/login`, and `/refresh`.

**Verification:** confirm `apiRateLimit` is exported from `rateLimiter.ts` (it is, at line 134).

---

## Fix #4 — Column selection in `returnUsers()`

### Step 1 — `apps/api/src/db/dbUserFunctions.ts`

- Change `returnUsers` to use a Drizzle column-selection object instead of bare `db.select()`:
  ```ts
  return await db.select({
    userId: users.userId,
    email: users.email,
    displayName: users.displayName,
    roles: users.roles,
  }).from(users);
  ```
- Change return type from `Promise<UserDbData[]>` to `Promise<ProfileData[]>`
- `UserDbData` import stays — it is still used by `returnUserByEmail`, `returnUserById`, and `returnUserByRefreshTokenHash`

### Step 2 — `apps/api/src/routes/admin.ts`

- Remove the `.map()` projection — `returnUsers` now returns `ProfileData[]` directly
- Use the result directly:
  ```ts
  const allUserProfiles = await returnUsers(db);
  return c.json(ok({ allUserProfiles }));
  ```
- Remove the `ProfileData` named import (no longer referenced in the file)

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/routes/auth.ts` | add `apiRateLimit` import; swap rate limiter on `DELETE /deleteUser` |
| `apps/api/src/db/dbUserFunctions.ts` | column-select in `returnUsers`; return type → `ProfileData[]` |
| `apps/api/src/routes/admin.ts` | remove `.map()`, remove `ProfileData` import |

No new files. No test files changed (existing `admin.test.ts` assertions still cover field absence).

---

## Validation

- `pnpm build` — must pass
- `pnpm --filter @tv-tracker/api test` — all tests pass, especially `admin.test.ts` field-stripping assertions
