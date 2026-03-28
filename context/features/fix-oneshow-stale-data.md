# Plan: Fix OneShow Stale Data After Refresh

## Context

`OneShow.tsx` maintains its own local `tvShow` state populated by a `getOneShow()` fetch on mount. `refreshShow()` in `ShowProvider` patches the show and updates `tvShows` via `updateShow()`, but `OneShow` never reads from context — so the detail page stays stale after a refresh. The fix is to remove the local fetch entirely and derive `tvShow` from `tvShows` in `ShowProvider`.

## File to Change

**`apps/ui/src/pages/OneShow.tsx`** — single file change.

## Implementation Steps

1. **Import `useShow`** from `../contexts/show/ShowContext.tsx` and destructure `tvShows` and `loading` from it.

2. **Remove local state and fetch:**
   - Delete `const [tvShow, setTvShow] = useState<ShowData>()` (line 20)
   - Delete `const [loading, setLoading] = useState(true)` (line 21)
   - Delete `const [error, setError] = useState('')` (line 22)
   - Delete the entire `useEffect` block (lines 25–47) that calls `Api.getOneShow`
   - Remove the `* as Api` import (line 6) — `getOneShow` is the only call site

3. **Derive `tvShow` from context:**
   ```ts
   const { tvShows, loading } = useShow();
   const tvShow = tvShows.find(s => s.showId === Number(showID));
   ```

4. **Update guards:**
   - Skeleton guard: `if (loading)` — unchanged, now uses context `loading`
   - Error guard: `if (!tvShow)` — replaces the old `if (error || !tvShow)` check; the message can stay as `'Show not found'`

5. **`refreshData` and `deleteOneShow`** — no changes needed; they already check `tvShow && showID` before acting.

6. **`showAlert` import** — still needed for existing `deleteOneShow`/`refreshData` flow via `useShowActions`; keep it.

## Result

- On mount: skeleton shown while `loading` is true, then show data rendered from context — no extra network call.
- After refresh: `ShowProvider.refreshShow` calls `updateShow()` → `tvShows` updates → `OneShow` re-renders with new data automatically.
- Direct URL navigation: works because `ShowProvider` fetches all shows on mount before `loading` goes false.

## Verification

1. `pnpm build` — must pass with no TypeScript errors.
2. Navigate to a show detail page from the dashboard → detail renders correctly.
3. Navigate directly to `/tvshow/:id` via URL → detail renders correctly.
4. Click "Refresh Data" → next/prev episode dates update in place without reload.
5. Navigate to `/tvshow/99999` → "Show not found" is displayed after loading.
