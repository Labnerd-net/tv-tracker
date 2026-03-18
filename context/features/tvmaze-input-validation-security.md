# Plan: TVMaze Input Validation Security Fixes

## Context

Two security gaps exist where TVMaze data is consumed without validation:

- **#2 (UI):** `fetchNextEpisodeDate` (and the prev-episode equivalent) in `userRequests.ts` calls `axios.get(href)` where `href` comes from `_links.nextepisode.href` / `_links.previousepisode.href` in a TVMaze response. No hostname check is performed, so a tampered response could send the browser to an arbitrary URL.
- **#3 (API):** `POST /tvshow/:id` and `PATCH /tvshow/:id` in `user.ts` call `response.json()` and feed the result straight into `new TvMazeData()`. The `tvMazeShowBodySchema` validation that the body-based `POST /tvshow` route already uses is not applied here.

---

## Fix 1 — UI hostname validation

**File:** `apps/ui/src/apis/userRequests.ts`

In `fetchNextEpisodeDate` (line ~113) and the equivalent prev-episode call (line ~129), add a hostname guard before the `axios.get()` call:

```
try {
  if (new URL(href).hostname !== 'api.tvmaze.com') return null;
} catch {
  return null;           // malformed URL — skip
}
const response = await axios.get(href);
```

Both the next and prev episode fetches need this guard. Return `null` / treat as unavailable on any failure.

---

## Fix 2 — API schema validation on TVMaze fetch paths

**File:** `apps/api/src/routes/user.ts`

After `const showDataJson = await response.json()` in **both** `POST /tvshow/:id` (line ~120) and `PATCH /tvshow/:id` (line ~150), parse through the existing schema before constructing `TvMazeData`:

```
const parsed = tvMazeShowBodySchema.safeParse(showDataJson);
if (!parsed.success) {
  return c.json(err('Invalid response from TVMaze'), 502);
}
const showData = new TvMazeData(parsed.data as unknown as TvMazeShow);
```

`tvMazeShowBodySchema` is already imported and used in the same file for the body route — no new import needed.

---

## Tests

**File:** `apps/api/tests/user.test.ts`

Extend existing test blocks (TVMaze fetch already mocked via `vi.spyOn(global, 'fetch')`):

- `POST /tvshow/:id` — mock fetch returns an invalid body (e.g. `{}`) → expect 502
- `POST /tvshow/:id` — mock fetch returns a valid body → still succeeds (regression)
- `PATCH /tvshow/:id` — mock fetch returns an invalid body → expect 502
- `PATCH /tvshow/:id` — mock fetch returns a valid body → still succeeds (regression)

UI tests for the hostname guard are manual verification (no UI test framework in place for API functions).

---

## Critical Files

| File | Change |
|------|--------|
| `apps/ui/src/apis/userRequests.ts` | Add hostname guard in `fetchNextEpisodeDate` and prev-episode fetch |
| `apps/api/src/routes/user.ts` | Add `tvMazeShowBodySchema.safeParse()` in `POST /tvshow/:id` and `PATCH /tvshow/:id` |
| `apps/api/tests/user.test.ts` | Add 4 test cases for invalid/valid TVMaze responses on both routes |

**Not changing:**
- `apps/api/src/schemas/show.ts` — schema is correct as-is; hostname validation is handled at call sites
- `apps/api/src/tvmaze.ts` — already has correct URL guards for server-side fetches

---

## Verification

1. `pnpm --filter @tv-tracker/api test` — all tests pass including the 4 new ones
2. `pnpm build` — no TypeScript errors
3. Manual: search for a show in the UI, verify next-episode dates still load normally
