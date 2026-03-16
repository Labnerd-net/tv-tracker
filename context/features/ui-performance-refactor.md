# Plan: UI Performance Refactor

## Context

Three backlog items are addressed together because they share the same root problem: unnecessary network calls in the UI.

- **[16]** Each `Result` component fires its own `fetchNextEpisodeDate()` on mount — 20 search results = 20 independent TVMaze requests staggered across mounts.
- **[17]** After every refresh or delete, all three components (`SingleShow`, `ShowsTable`, `OneShow`) call `getAllShows()` to repopulate context — a full re-fetch when only one record changed.
- **[20]** Refresh/delete logic is copy-pasted across those three components. Extracting a hook fixes both the duplication and gives a single place to implement the optimised context update.

## Files to Modify

| File | Change |
|---|---|
| `apps/ui/src/hooks/useShowActions.ts` | **CREATE** — new hook |
| `apps/ui/src/components/Result.tsx` | Remove episode fetch effect; accept `nextEpisodeDate` + `episodeLoading` props |
| `apps/ui/src/pages/SearchResults.tsx` | Fetch all episode dates in parallel after search; pass results to `Result` |
| `apps/ui/src/components/SingleShow.tsx` | Replace inline refresh/delete with `useShowActions()` |
| `apps/ui/src/components/ShowsTable.tsx` | Replace inline refresh/delete with `useShowActions()` |
| `apps/ui/src/pages/OneShow.tsx` | Replace inline refresh/delete with `useShowActions()` |

## Step-by-Step Implementation

### Step 1 — Create `useShowActions` hook

Create `apps/ui/src/hooks/useShowActions.ts`:

```
const { tvShows, setTvShows } = useShow();
const { showAlert } = useAlert();
const [loading, setLoading] = useState(false);

refreshShow(showId: string, title: string, onSuccess?: () => void):
  1. setLoading(true)
  2. await Api.updateShow(showId)
  3. await Api.getOneShow(showId) → updatedShow
  4. setTvShows(prev => prev.map(s => s.showId === updatedShow.showId ? updatedShow : s))
  5. showAlert('success', `${title} updated`)
  6. call onSuccess?.()
  catch → showAlert('danger', ...)
  finally → setLoading(false)

deleteShow(showId: string, title: string, onSuccess?: () => void):
  1. setLoading(true)
  2. await Api.deleteShow(showId)
  3. setTvShows(prev => prev.filter(s => String(s.showId) !== showId))
  4. showAlert('success', `${title} removed`)
  5. call onSuccess?.()
  catch → showAlert('danger', ...)
  finally → setLoading(false)

return { loading, refreshShow, deleteShow }
```

Note: `showId` in `ShowData` is `number`; `Api.updateShow`/`getOneShow` expect `string`. Match types carefully. Compare with `String(s.showId) !== showId` for filter.

### Step 2 — Update `SingleShow.tsx`

- Remove `refreshData` and `deleteOneShow` functions.
- Remove `useAlert` and `useShow` direct imports (hook handles both).
- Call `const { loading, refreshShow, deleteShow } = useShowActions()`.
- `refreshData` handler: `refreshShow(String(showData.showId), showData.title)`.
- `deleteOneShow` handler: `deleteShow(String(showData.showId), showData.title, () => navigate('/'))`.

### Step 3 — Update `ShowsTable.tsx`

- Same as SingleShow: replace `refreshData`/`deleteShow` with hook calls.
- No navigation callback needed on delete (stays on dashboard).

### Step 4 — Update `OneShow.tsx`

- Replace `refreshData` and `deleteOneShow` functions with hook calls.
- `refreshData`: `refreshShow(showID!, tvShow.title)`.
- `deleteOneShow`: `deleteShow(String(tvShow.showId), tvShow.title, () => navigate('/'))`.
- Replace local `actionLoading` state with `loading` from hook.
- Keep local `tvShow` state for page rendering — it won't auto-refresh after hook update, but that is acceptable (noted in spec; detail page doesn't need to show updated episode data immediately since the user typically navigates back to dashboard).

### Step 5 — Update `SearchResults.tsx` (N+1 fix)

After `setSearchResults(response.data)`:
1. Add state: `const [episodeDates, setEpisodeDates] = useState<Record<number, string>>({})` and `const [episodesLoading, setEpisodesLoading] = useState(false)`.
2. Once search results are set, run:
   ```
   setEpisodesLoading(true);
   const results = await Promise.allSettled(
     data.map(item => Api.fetchNextEpisodeDate(item.show).then(r => [item.show.id, r.data?.date ?? ''] as const))
   );
   const dateMap: Record<number, string> = {};
   for (const r of results) {
     if (r.status === 'fulfilled') dateMap[r.value[0]] = r.value[1];
   }
   setEpisodeDates(dateMap);
   setEpisodesLoading(false);
   ```
3. Pass `nextEpisodeDate={episodeDates[data.show.id] ?? ''}` and `episodeLoading={episodesLoading}` to each `<Result>`.

### Step 6 — Update `Result.tsx`

- Add props: `nextEpisodeDate: string`, `episodeLoading: boolean`.
- Remove the `useEffect` that calls `fetchNextEpisodeDate`.
- Remove local `loading` and `error` state (keep `adding` state).
- Replace `loading` references with `episodeLoading` prop.
- Replace `nextEpisode` state references with `nextEpisodeDate` prop.
- `episodeText`: `episodeLoading ? '…' : (nextEpisodeDate || showData.show.status || '—')`.

## Key Constraints

- `showId` in `ShowData` is typed as `number`. `Api.updateShow` and `Api.getOneShow` accept `string`. Use `String(showData.showId)` at callsites and compare with `String(s.showId)` in the filter/map inside the hook.
- `getOneShow` can return `undefined` data on error — guard with `if (response.success && response.data)` before updating context.
- `Promise.allSettled` is the right choice for episode fetch batch — a single 404 from TVMaze should not wipe the dates of other results.
- No new API endpoints or API-side changes required.
- `apps/ui/src/hooks/` directory does not exist yet — it will be created by writing the first file into it.

## Verification

1. `pnpm build` — must pass with zero TypeScript errors.
2. Browser: search for a show name → all results load episode dates simultaneously (one loading spinner while batch resolves, then all dates appear at once).
3. Browser: from dashboard (card or table), click Refresh → show updates in place, no full reload, no `getAllShows` network call visible in DevTools.
4. Browser: delete a show from dashboard → card/row disappears immediately, no `getAllShows` call.
5. Browser: delete a show from its detail page → navigates to `/`, show is gone from dashboard.
