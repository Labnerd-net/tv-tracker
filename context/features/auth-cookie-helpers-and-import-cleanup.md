# Plan: Auth Cookie Helpers and Import Cleanup

## Overview

Two independent, self-contained refactors. Order: cookie helper consolidation (#17) first, then import extension cleanup (#18), then verify.

---

## Step 1 — Add `setAuthCookies` to `apps/api/src/utils/auth.ts`

Add new imports at the top of the file:
- `setCookie` from `'hono/cookie'`
- `type Context` from `'hono'`
- `isProduction`, `refreshTokenExpiryDays`, `accessTokenExpiryMinutes` from `'./envVars.js'`

Export a new function after `generateRefreshToken`:

```
export function setAuthCookies(c: Context, tokens: { accessToken: string; refreshToken: string }): void
```

Body: call `setCookie` for `'refreshToken'` (httpOnly, secure, sameSite, maxAge = refreshTokenExpiryDays * 86400, path `/api/auth`, value `tokens.refreshToken`) and `setCookie` for `'accessToken'` (httpOnly, secure, sameSite, maxAge = accessTokenExpiryMinutes * 60, path `/api`, value `tokens.accessToken`). Reproduces the exact options from the two local helpers being deleted.

---

## Step 2 — Update `apps/api/src/routes/auth.ts`: remove local helpers and clean imports

**2a.** Delete the two local helper functions (`setRefreshCookie` and `setAccessCookie`, lines 33–51).

**2b.** Update `import` from `'../utils/auth.js'` to also import `setAuthCookies`.

**2c.** Drop `type { Context }` from the `hono` import — no longer used after helper removal.

**2d.** Remove `refreshTokenExpiryDays` and `accessTokenExpiryMinutes` from the `envVars.js` import — only used by the deleted helpers. Keep `isProduction` (still used in `deleteUser`).

---

## Step 3 — Replace the three call-site pairs in `apps/api/src/routes/auth.ts`

At each of the three handlers (`register`, `login`, `refresh`), replace the two-line:
```
setRefreshCookie(c, raw);
setAccessCookie(c, token);
```
with:
```
setAuthCookies(c, { accessToken: token, refreshToken: raw });
```
(For `refresh`, the vars are `newRaw`/`token` — use `refreshToken: newRaw`.)

Leave the `deleteUser` handler's direct `setCookie` calls untouched.

---

## Step 4 — Remove explicit extensions from `apps/ui/src/components/Result.tsx`

Four import line changes:
- Line 3: `'../apis/userRequests.ts'` → `'../apis/userRequests'`
- Line 5: `'@shared/types/tvmaze.ts'` → `'@shared/types/tvmaze'`
- Line 6: `'../contexts/show/ShowContext.tsx'` → `'../contexts/show/ShowContext'`
- Line 7: `'./ShowCard.tsx'` → `'./ShowCard'`

Line 4 (`'@shared/utils/tvmaze'`) is already correct — do not touch.

---

## Step 5 — Verify

```
pnpm build
pnpm --filter @tv-tracker/api test
```

All existing auth tests should pass without modification — the refactor is a pure rename/move with identical cookie options.

---

## Critical Files

- `apps/api/src/utils/auth.ts`
- `apps/api/src/routes/auth.ts`
- `apps/ui/src/components/Result.tsx`
