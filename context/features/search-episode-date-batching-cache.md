# Plan: Search Episode Date Batching and Cache

## Context

Two performance issues with `fetchNextEpisodeDate()` in the UI:
- **Backlog #6:** `SearchResults.tsx` fires all episode date requests simultaneously with no concurrency cap. A 20-result search launches 20 parallel TVMaze calls at once, saturating browser connection limits.
- **Backlog #22:** No caching — identical episode URLs are re-fetched on every search. Airdates change at most weekly, so repeated fetches within a session are wasteful.

The fix: add a module-level TTL cache in `userRequests.ts`, and batch SearchResults calls to 5 at a time.

---

## Files to Change

| File | Change |
|------|--------|
| `apps/ui/src/apis/userRequests.ts` | Add TTL cache; apply in `fetchNextEpisodeDate` and `fetchPrevEpisodeDate` |
| `apps/ui/src/pages/SearchResults.tsx` | Replace fire-all-at-once loop with batched loop (max 5 concurrent) |

---

## Implementation

### 1. Cache in `userRequests.ts`

Add at module level (above the exported functions):

```ts
const EPISODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const episodeCache = new Map<string, { date: string; expiry: number }>();
```

In `fetchNextEpisodeDate`, after the hostname guard passes, check the cache before calling axios:

```ts
const cached = episodeCache.get(href);
if (cached && Date.now() < cached.expiry) {
  return { success: true, data: { date: cached.date } };
}
```

After a successful axios response with a valid `airdate`, store in cache:

```ts
const date = new Date(response.data.airdate).toDateString();
episodeCache.set(href, { date, expiry: Date.now() + EPISODE_CACHE_TTL_MS });
return { success: true, data: { date } };
```

Apply the exact same cache read/write to `fetchPrevEpisodeDate` (same `episodeCache` map).

Only successful responses are cached. Errors, missing `airdate`, and hostname failures are not cached.

### 2. Batching in `SearchResults.tsx`

Replace the `for...of` fire-and-forget loop (lines 33–44) with a batched loop:

```ts
const BATCH_SIZE = 5;
for (let i = 0; i < data.length; i += BATCH_SIZE) {
  if (controller.signal.aborted) break;
  const batch = data.slice(i, i + BATCH_SIZE);
  await Promise.allSettled(
    batch.map(item => {
      const id = item.show.id;
      return Api.fetchNextEpisodeDate(item.show, controller.signal)
        .then(r => {
          if (controller.signal.aborted) return;
          setEpisodeDates(prev => ({ ...prev, [id]: r.success ? r.data.date : '' }));
          setEpisodesLoading(prev => ({ ...prev, [id]: false }));
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setEpisodesLoading(prev => ({ ...prev, [id]: false }));
          }
        });
    })
  );
}
```

The surrounding `searchTvShows` function is already `async` so `await` is valid here. Cards within a batch still update individually as each `.then()` resolves; the next batch of 5 only starts after all 5 in the current batch settle.

The `searchTvShows` function must also be moved to run after `setLoading(false)` is called — or keep the current flow. Looking at the code: `setLoading(false)` happens in the `finally` block, which runs after `setSearchResults` but before the episode-fetch loop can complete (since the loop is awaited now). The `finally` block already runs after the awaited axios search call — the episode fetches are not inside the `try` that feeds `finally`. Actually looking more carefully:

The current structure:
```
try {
  search...
  setSearchResults(data)
  for (const item of data) { ... } // fire-and-forget, returns immediately
} catch {} finally { setLoading(false) }
```

With `await` in the loop, `setLoading(false)` would be deferred until all batches complete. This is actually fine — the search spinner should stay until episode dates are loaded. But check if there's a separate `loading` state for the search vs episodes. There is: `loading` is the main page spinner; `episodesLoading` is per-card.

To preserve UX (search results appear immediately, episode dates load per-card), the batch loop should run after `setLoading(false)`. Move `setLoading(false)` before the batch loop, or restructure the `finally`:

```ts
try {
  const response = await Api.tvShowResults(showName);
  if (controller.signal.aborted) return;
  if (response.success && response.data) {
    const data = response.data;
    setSearchResults(data);
    setLoading(false); // show cards immediately
    setEpisodesLoading(Object.fromEntries(data.map(item => [item.show.id, true])));
    // batched episode fetches...
    for (let i = 0; i < data.length; i += BATCH_SIZE) { ... }
  } else { ... }
} catch { ... } finally {
  if (!controller.signal.aborted) setLoading(false); // catches error path
}
```

This preserves: page spinner until results arrive, per-card spinners while episodes load, and `setLoading(false)` in `finally` as a safety net for the error path.

---

## Verification

1. `pnpm build` must pass with no TypeScript errors.
2. Manual browser test:
   - Search for a show with 10+ results — confirm no more than 5 network requests fire at once (DevTools Network tab, filter by `api.tvmaze.com`).
   - Search for the same term twice — second search should produce 0 TVMaze episode requests (all served from cache).
   - Navigate away mid-search — no state-update errors in console.
3. `pnpm --filter @tv-tracker/api test` — existing API tests must still pass (no server-side changes).
