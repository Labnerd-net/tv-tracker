# Plan: Fix AllShows Double Fetch and Optimistic Delete Bug

## Overview

Two targeted fixes across two files. No new files, no API changes.

---

## Fix #5 — Remove redundant fetch from AllShows

**File:** `apps/ui/src/pages/AllShows.tsx`

`ShowProvider` already fetches all shows in its own `useEffect` keyed on `[user, isLoading]`, which runs on mount and on auth state change. `AllShows` duplicates this with its own `useEffect` that calls `Api.getAllShows()` and writes into the same context via `setTvShows`. Every dashboard mount fires both concurrently.

**Changes:**
1. Remove the entire `useEffect` block (lines 25–35) that calls `fetchShows`.
2. Remove `setTvShows` from the `useShow()` destructure on line 22 — it is only used in the removed effect.
3. Remove the `import * as Api from '../apis/userRequests.ts'` line (line 9) — it is only used in the removed effect.
4. Remove `useEffect` from the React import if it is no longer used elsewhere in the file (line 1 — check after step 1; `useState` is still used so only `useEffect` may be dropped).

After the fix, `AllShows` only reads `tvShows` from context and renders.

---

## Fix #6 — Gate context update on API success in deleteShow

**File:** `apps/ui/src/hooks/useShowActions.ts`

`deleteShow` calls `await Api.deleteShow(showId)` but ignores the return value. It then unconditionally calls `setTvShows(prev => prev.filter(...))` and `showAlert('success', ...)`. If the API returns `{ success: false }` without throwing, the show disappears from the UI but still exists in the DB.

`Api.deleteShow` returns `Promise<StringResponse>` which resolves to `{ success: true, data }` or `{ success: false, error }`. It only throws on network-level errors (caught by the existing `catch` block).

**Changes:**
1. Capture the return value: `const response = await Api.deleteShow(showId);`
2. Wrap `setTvShows` and the success alert inside `if (response.success)`.
3. Add an `else` branch that calls `showAlert('danger', response.error ?? \`Failed to delete ${title}\`)` so the user sees an error message on `ok: false` responses.
4. Keep the existing `catch` block unchanged — it still handles network/throw errors.

The `onSuccess?.()` callback should also be gated inside the `if (response.success)` block.

---

## Step-by-step

1. Edit `apps/ui/src/pages/AllShows.tsx`:
   - Remove lines 25–35 (the `useEffect` / `fetchShows` block).
   - Remove `setTvShows` from the `useShow()` destructure.
   - Remove the `import * as Api` line.
   - Remove `useEffect` from the React import.

2. Edit `apps/ui/src/hooks/useShowActions.ts`:
   - Change `await Api.deleteShow(showId)` to `const response = await Api.deleteShow(showId)`.
   - Wrap `setTvShows`, `showAlert('success', ...)`, and `onSuccess?.()` in `if (response.success) { ... } else { showAlert('danger', response.error ?? \`Failed to delete ${title}\`) }`.

3. Run `pnpm build` from the repo root and fix any TypeScript errors.
