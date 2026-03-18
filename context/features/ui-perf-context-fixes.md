# Plan: UI Performance and Context Encapsulation Fixes

## Context

Four targeted fixes (backlog #9, #12, #13, #21) addressing stale request bugs, a hot-path micro-inefficiency, missing image loading hints, and overly-permissive context exposure.

---

## Fix #9 — AbortController in SearchResults

**Problem:** `useEffect` in `SearchResults.tsx` fires up to 10 parallel `fetchNextEpisodeDate` calls on every `showName` change. No cleanup → stale responses update state on unmounted or re-rendered components.

**Files:**
- `apps/ui/src/apis/userRequests.ts`
- `apps/ui/src/pages/SearchResults.tsx`

**Steps:**

1. **`userRequests.ts`** — Add `signal?: AbortSignal` param to both `fetchNextEpisodeDate` and `fetchPrevEpisodeDate`. Forward it to the inner `fetch()` call (or Axios `config.signal` — verify during impl). Keep existing hostname validation unchanged.

2. **`SearchResults.tsx`** — In the `useEffect` that runs on `showName`:
   - Create `const controller = new AbortController()` at the top of the effect.
   - Pass `controller.signal` to each `fetchNextEpisodeDate(item.show, controller.signal)` call.
   - After `Promise.allSettled` resolves, check `if (controller.signal.aborted) return` before calling `setEpisodeDates` or `setEpisodesLoading`.
   - Return cleanup: `return () => controller.abort()`.

---

## Fix #12 — Cache log level in logger.ts

**Problem:** `getConfiguredLevel()` reads `import.meta.env.VITE_LOG_LEVEL` and scans a levels array on every single log call. The value is a build-time constant.

**File:** `apps/ui/src/utils/logger.ts`

**Step:** Call `getConfiguredLevel()` once at module load and store the result in a module-level `const`:
```ts
const CONFIGURED_LEVEL = getConfiguredLevel();
```
Replace all in-function calls to `getConfiguredLevel()` with `CONFIGURED_LEVEL`. The function itself can remain or be removed if only used internally.

---

## Fix #13 — Lazy image loading

**Problem:** All show artwork images load eagerly regardless of viewport position.

**Files:** (4 files, all use MUI `Box component="img"`)
- `apps/ui/src/components/SingleShow.tsx` — 1 image
- `apps/ui/src/components/Result.tsx` — 1 image (inside conditional)
- `apps/ui/src/pages/OneShow.tsx` — 2 images (blurred hero + poster)
- `apps/ui/src/pages/OneShowSearch.tsx` — 2 images (blurred hero + poster)

**Step:** Add `loading="lazy"` and `decoding="async"` props to every `Box component="img"` in those files. MUI Box forwards unknown props to the DOM element. No other changes.

---

## Fix #21 — Named ShowContext actions

**Problem:** Raw `setTvShows` (a `React.Dispatch<SetStateAction<ShowData[]>>`) is on context, allowing any consumer to overwrite the full array.

**Files:**
- `apps/ui/src/contexts/show/ShowContext.tsx`
- `apps/ui/src/contexts/show/ShowProvider.tsx`
- `apps/ui/src/hooks/useShowActions.ts`
- `apps/ui/src/components/Result.tsx`
- `apps/ui/src/pages/OneShowSearch.tsx`
- `apps/ui/src/types/data.ts` (has a `DataProps` interface with `setTvShows` — update it too)

**Steps:**

1. **`ShowContext.tsx`** — Replace `setTvShows` in `ShowProps` with:
   ```ts
   addShow: (show: ShowData) => void
   updateShow: (show: ShowData) => void
   removeShow: (showId: number) => void
   ```

2. **`ShowProvider.tsx`** — Keep local `setTvShows` state setter. Define three stable functions using functional state updates (no stale closure risk):
   ```ts
   const addShow = (show: ShowData) => setTvShows(prev => [...prev, show]);
   const updateShow = (show: ShowData) => setTvShows(prev => prev.map(s => s.showId === show.showId ? show : s));
   const removeShow = (showId: number) => setTvShows(prev => prev.filter(s => s.showId !== showId));
   ```
   Provide `{ tvShows, addShow, updateShow, removeShow }` — no `setTvShows`.

3. **`useShowActions.ts`** — Replace context destructure `{ setTvShows }` → `{ updateShow, removeShow }`. Update:
   - `refreshShow`: `setTvShows(prev => prev.map(...))` → `updateShow(updated)`
   - `deleteShow`: `setTvShows(prev => prev.filter(...))` → `removeShow(Number(showId))`

4. **`Result.tsx` and `OneShowSearch.tsx`** — Both currently: add show → `getAllShows()` → `setTvShows(allData)`. Replace with: add show → get `showId` from response → `getOneShow(showId)` → `addShow(show)`. This removes the full-list refetch.
   - The add API returns `{ showId }` (confirmed: `addOneShow()` uses `.returning({ showId })`).
   - Use `addShow` from `useShow()` context.

5. **`types/data.ts`** — Update `DataProps` interface: remove `setTvShows`, add `addShow`, `updateShow`, `removeShow` with matching signatures. (Or remove `DataProps` entirely if it's unused after the changes — verify during impl.)

---

## Verification

1. `pnpm build` — must pass with zero type errors.
2. Search page: type quickly, confirm no stale dates; check Network tab for cancelled requests on query change.
3. Dashboard: add, refresh, delete a show — confirm list updates correctly with no console errors.
4. Large library: confirm images outside viewport are not fetched on initial load (Network tab, filter by image type).
