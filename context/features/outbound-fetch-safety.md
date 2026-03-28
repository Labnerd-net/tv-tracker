# Plan: Outbound Fetch Safety

## Context
Three outbound HTTP safety gaps:
1. All TVMaze `fetch()` calls have no timeout — a hung upstream holds the request open indefinitely.
2. `response.json()` is called before checking body size — a large payload is buffered unchecked.
3. `OneShowSearch.tsx` useEffect fires episode-date fetches without an `AbortController`, causing state updates on unmounted components.

Backlog items: #1, #2, #17.

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/routes/user.ts` | Add `AbortSignal.timeout(8000)` + body size guard to POST and PATCH |
| `apps/api/src/tvmaze.ts` | Add `AbortSignal.timeout(15000)` to `fetchAirdate` inner function |
| `apps/ui/src/pages/OneShowSearch.tsx` | Add `AbortController` + cleanup to useEffect |
| `apps/api/tests/user.test.ts` | Add timeout and oversized-body tests |

---

## Implementation Steps

### 1. `apps/api/src/routes/user.ts` — POST /tvshow/:id and PATCH /tvshow/:id

**Fetch timeout:** Add `{ signal: AbortSignal.timeout(8000) }` to the `fetch()` call in both routes (lines 115 and 146).

**Body size guard:** Replace `await response.json()` with:
```
const text = await response.text();
if (text.length > 1_000_000) {
  return c.json(err('TVMaze response too large'), 502);
}
const showDataJson = JSON.parse(text);
```

**Timeout error handling:** In each route's catch block, check for timeout before falling through to the generic 500:
```
if (e instanceof DOMException && e.name === 'TimeoutError') {
  return c.json(err('TVMaze request timed out'), 504);
}
```
Add this check before the existing `logger.error` + 500 line.

---

### 2. `apps/api/src/tvmaze.ts` — `updateEpisodes()` → `fetchAirdate`

Add `{ signal: AbortSignal.timeout(15000) }` to the bare `fetch(link)` at line 61.

The existing `try/catch` already returns `''` on any error, so a `TimeoutError` will be swallowed gracefully — no extra handling needed here since this runs in the background.

---

### 3. `apps/ui/src/pages/OneShowSearch.tsx` — useEffect cleanup

`fetchNextEpisodeDate` already accepts `signal?: AbortSignal`. Just wire up the controller:

```typescript
useEffect(() => {
  const controller = new AbortController();

  const searchTvShow = async (showID: string) => {
    // ...existing code...
    const nextEp = await Api.fetchNextEpisodeDate(response.data, controller.signal);
    // ...
  };

  if (showID) searchTvShow(showID);

  return () => controller.abort();
}, [showAlert, showID]);
```

`fetchPrevEpisodeDate` is not called in this component, so no change needed there.

---

### 4. `apps/api/tests/user.test.ts` — New tests

Add three tests using `fetchMock.mockRejectedValue` / `mockResolvedValue`:

- **Timeout on POST /tvshow/:id:** Mock fetch with `new DOMException('The operation timed out', 'TimeoutError')` rejection → expect 504
- **Oversized body on POST /tvshow/:id:** Mock fetch returning `ok: true` and `text()` resolving to a string of length 1,000,001 → expect 502
- **Oversized body on PATCH /tvshow/:id:** Same oversized-body mock on the PATCH route → expect 502

Note: The existing fetch mock uses `mockResolvedValue({ ok: true, json: async () => ... })`. For the body size tests, need to also mock `text()` instead of `json()` since the implementation will switch to `response.text()`.

---

## Verification

1. `pnpm --filter @tv-tracker/api test` — all existing tests plus the 3 new ones pass
2. `pnpm build` — clean build, no TypeScript errors
3. Manual: start the API with a slow-responding TVMaze mock and confirm the request returns a 504 within ~8 seconds
