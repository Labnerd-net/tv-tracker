# Plan: Minor Code Quality Fixes (#16, #17, #18, #21)

## Context

Four low-priority housekeeping items from the backlog. All are non-behavioral: dead interface fields, inconsistent cookie deletion API usage, import extension style drift, and an unnecessarily wide prop type. No new functionality, no logic changes.

---

## Changes

### #16 — Remove dead fields from `DataProps`
**File:** `apps/ui/src/types/data.ts`

Remove the four fields that are not part of `ShowContext` and are confirmed unused via context:
- `sortOrder`, `setSortOrder`, `sortCol`, `setSortCol`

These are used as local `useState` inside `ShowsTable.tsx`, never via the `DataProps` interface.

**Result:**
```ts
export interface DataProps {
    tvShows: ShowData[]
    addShow: (show: ShowData) => void
    updateShow: (show: ShowData) => void
    removeShow: (showId: number) => void
}
```

---

### #17 — Consistent cookie deletion in logout
**File:** `apps/api/src/routes/auth.ts` (~line 169)

Replace `setCookie(c, 'accessToken', '', { maxAge: 0, ... })` with `deleteCookie(c, 'accessToken', { path: '/api' })`.

---

### #18 — Fix import extensions in `useShowActions.ts`
**File:** `apps/ui/src/hooks/useShowActions.ts` (lines 2–5)

Change `.ts`/`.tsx` → `.js`.

---

### #21 — Narrow `alertProps` prop to `showAlert` in `Result`
**Files:** `apps/ui/src/components/Result.tsx`, `apps/ui/src/pages/SearchResults.tsx`

- `Result`: prop changes from `alertProps: AlertProps` to `showAlert: (type: string, message: string) => void`; remove `AlertProps` import; update 4 call sites.
- `SearchResults`: destructure `{ showAlert }` directly from `useAlert()`; pass `showAlert={showAlert}` to `<Result>`.

---

## Verification

1. `pnpm build` — must pass with zero errors.
2. `pnpm --filter @tv-tracker/api test` — all tests must pass.
3. Manual smoke test: search and verify "+ Add" alerts still fire.
