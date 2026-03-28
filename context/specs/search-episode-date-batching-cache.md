# Spec for Search Episode Date Batching and Cache

Title: Search Episode Date Batching and Cache
Branch: claude/feature/search-episode-date-batching-cache
Spec file: context/specs/search-episode-date-batching-cache.md

## Summary

Two related performance issues with `fetchNextEpisodeDate()` in the UI:

1. **Unbounded parallelism (#6):** `SearchResults.tsx` fires one `fetchNextEpisodeDate()` per result with no concurrency limit. A 20-result search launches 20 parallel TVMaze requests simultaneously, which can exhaust browser connection limits and hammer the external API.

2. **No caching (#22):** The same episode URLs are re-fetched on every search and every dashboard mount with no local cache. Episode airdates change infrequently (weekly at most), so repeated fetches within a session are wasteful.

The fix is to add a module-level in-memory cache with a TTL in `userRequests.ts`, and batch the per-card calls in `SearchResults.tsx` to a max concurrency of 5.

## Functional Requirements

- `fetchNextEpisodeDate()` caches responses keyed by episode URL (`href`) with a 24-hour TTL.
  - Cache hit: return the cached value immediately without making a network request.
  - Cache miss or expired entry: fetch normally, store the result before returning.
  - Cache is module-level (lives for the lifetime of the browser tab) using a plain `Map<string, { date: string; expiry: number }>`.
  - Only successful responses (i.e., those with a valid `airdate`) are cached. Errors and "no next episode" results are not cached.
- `SearchResults.tsx` processes episode date fetches in batches of 5 (using `Promise.allSettled`) rather than launching all concurrently.
  - Per-card loading state should continue to work as it does now — cards that resolve within a batch become visible before the next batch starts.

## Possible Edge Cases

- AbortSignal fired mid-batch: already-cached results for the aborted search should not pollute the next search's display state (the existing `controller.signal.aborted` guard handles this, but verify the batching wrapper respects it too).
- Cache key is the full episode `href` URL. Two shows with the same next episode (unlikely but possible) will share a cache entry correctly.
- TTL is compared at read time using `Date.now()`, not at write time, so there is no background cleanup needed.
- Batch size 5 is a reasonable heuristic. The last batch may be smaller; that is fine.

## Acceptance Criteria

- [ ] A second search for the same show does not fire network requests for episode dates whose `href` was already fetched in the previous search (within the cache TTL).
- [ ] A search with 10+ results launches at most 5 simultaneous `fetchNextEpisodeDate` network requests at a time.
- [ ] Per-card loading spinners still resolve incrementally (first 5 cards populate before last 5 start).
- [ ] Aborting a search (navigating away) cancels in-flight requests and does not update state (existing behaviour unchanged).
- [ ] Cache does not grow unbounded across many searches — expired entries are evicted on read, not stored permanently.

## Open Questions

- Should `fetchPrevEpisodeDate()` also be cached? It is called from `OneShow.tsx` and `OneShowSearch.tsx` (one call at a time), so unbounded parallelism is not a concern there, but caching would still reduce redundant fetches. Keeping it in scope is low-effort since the same cache map can be reused. - sure

## Testing Guidelines

Tests in `apps/api/tests/` are server-side only. The cache and batching logic lives in the UI (`apps/ui/src/apis/userRequests.ts` and `SearchResults.tsx`). No new API tests are needed. If a UI test suite exists (or is added), cover:

- Cache hit: calling `fetchNextEpisodeDate` twice with the same URL fires the network only once.
- Cache expiry: an entry older than the TTL triggers a re-fetch.
- Batch limit: with 12 results, no more than 5 requests are in-flight at any point.

## Personal Opinion

This is a good, well-scoped fix. The two items are tightly coupled — caching reduces load from repeated fetches, batching reduces burst load from a single large search — and implementing them together avoids two separate PRs touching the same function.

The only risk is over-engineering the cache. A plain `Map` with a TTL check on read is sufficient; there is no need for LRU eviction, persistence, or a dedicated cache abstraction. Keep it simple.

Combining `fetchPrevEpisodeDate` caching in the same PR is a small addition worth doing to avoid a follow-up.
