# Plan: Minor Type and Constant Fixes (Backlog #14, #15, #18)

## Context

Three low-risk housekeeping fixes:
- **#14** — `alertVariant` is typed as `string` everywhere in the alert system, allowing invalid variant strings to pass TypeScript unchecked. All actual call sites use only `'danger' | 'warning' | 'success'`.
- **#15** — Cookie paths `'/api/auth'` and `'/api'` appear as hardcoded string literals in `utils/auth.ts` (inside `setAuthCookies`) and again in `routes/auth.ts` (logout and deleteUser handlers). Four total occurrences.
- **#18** — Four functions in `dbShowFunctions.ts` each call `Number()` inline to coerce a string ID. Identical pattern, no shared abstraction.

---

## Fix #14 — AlertVariant Union Type

**Files to change:**
- `apps/ui/src/types/alert.ts`
- `apps/ui/src/contexts/alert/AlertProvider.tsx`
- `apps/ui/src/components/AppAlert.tsx`

**Steps:**

1. In `alert.ts`, add `export type AlertVariant = 'danger' | 'warning' | 'success';` above `AlertProps`. Change `alertVariant: string` → `alertVariant: AlertVariant | ''` and `showAlert: (variant: string, ...)` → `showAlert: (variant: AlertVariant, ...)`.

2. In `AlertProvider.tsx`, change `useState('')` to `useState<AlertVariant | ''>('')` and update the `showAlert` callback parameter type to `AlertVariant`.

3. In `AppAlert.tsx`, change the prop type of `alertVariant` from `string` to `AlertVariant | ''`. The VARIANTS lookup already handles unknown keys with a fallback to `VARIANTS.info`, so no logic changes needed.

No call sites need changes — all existing `showAlert()` calls already pass `'danger'`, `'warning'`, or `'success'`.

---

## Fix #15 — Cookie Path Constants

**Files to change:**
- `apps/api/src/utils/auth.ts`
- `apps/api/src/routes/auth.ts`

**Steps:**

1. In `utils/auth.ts`, add and export two constants above `setAuthCookies`:
   ```ts
   export const AUTH_COOKIE_PATH = '/api/auth';
   export const API_COOKIE_PATH = '/api';
   ```
   Replace the two hardcoded strings inside `setAuthCookies` with these constants.

2. In `routes/auth.ts`, import `AUTH_COOKIE_PATH` and `API_COOKIE_PATH` from `../utils/auth.js`. Replace all four hardcoded path occurrences:
   - `deleteCookie(c, 'refreshToken', { path: '/api/auth' })` → use `AUTH_COOKIE_PATH`
   - `deleteCookie(c, 'accessToken', { path: '/api' })` → use `API_COOKIE_PATH`
   - The two `setCookie` calls inside `deleteUser` with `path: '/api/auth'` and `path: '/api'`

---

## Fix #18 — ensureNumericId Helper

**Files to change:**
- `apps/api/src/db/helpers.ts` *(new file)*
- `apps/api/src/db/dbShowFunctions.ts`

**Test to add:**
- `apps/api/tests/helpers.test.ts` *(new file)*

**Steps:**

1. Create `apps/api/src/db/helpers.ts`:
   ```ts
   export function ensureNumericId(id: string): number {
     const n = Number(id);
     if (Number.isNaN(n)) throw new Error(`Invalid numeric ID: "${id}"`);
     return n;
   }
   ```

2. In `dbShowFunctions.ts`, import `ensureNumericId` from `./helpers.js` and replace the four inline `Number()` coercions:
   - `returnOneShowId`: `const showIdNumber = Number(showId)` → `const showIdNumber = ensureNumericId(showId)`
   - `deleteOneShowId`: same
   - `returnOneShowTvMazeId`: `const tvMazeIdNumber = Number(tvMazeId)` → `const tvMazeIdNumber = ensureNumericId(tvMazeId)`
   - `updateOneShow`: `const showIdNumber = Number(showId)` → `const showIdNumber = ensureNumericId(showId)`

3. In `helpers.test.ts`, add one test: verify `ensureNumericId('abc')` throws and `ensureNumericId('42')` returns `42`.

---

## Verification

```bash
# API tests must still pass
pnpm --filter @tv-tracker/api test

# Full build must pass clean
pnpm build
```
