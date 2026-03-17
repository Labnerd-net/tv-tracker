# Plan: Async Episode Fetch on Add Show

## Context

`POST /api/user/tvshow/:id` currently blocks the response while making 2-3 sequential HTTP requests to TVMaze to resolve next/prev episode airdates. These fetches happen inside `TvMazeData.updateEpisodes()` after the show data is fetched from TVMaze. The user doesn't need episode dates to receive confirmation that the show was added — returning immediately after the DB insert and fetching episode dates in the background improves perceived responsiveness.

## Key Findings

- **`apps/api/src/routes/user.ts:102-124`** — add-show handler: fetches TVMaze, constructs `TvMazeData`, calls `updateEpisodes()`, then inserts. `updateEpisodes()` must be moved to run after the response.
- **`apps/api/src/tvmaze.ts:52-74`** — `updateEpisodes()` fetches next/prev airdates via HTTP if not already embedded; returns empty strings on failure.
- **`apps/api/src/db/dbShowFunctions.ts`** — `addOneShow()` inserts, `updateOneShow()` patches. Need a new targeted update function for episode fields only.
- **`apps/api/src/db/schema.ts:25-26`** — `prevEpisode` and `nextEpisode` are nullable text columns. No schema change needed.
- **UI null handling** — `SingleShow.tsx:23-24` and `OneShow.tsx:209-217` both cascade through `??` / `||` operators with `'—'` fallbacks. No crash risk with null/empty episode fields.

## Implementation Plan

### 1. `apps/api/src/db/dbShowFunctions.ts`

Add a new function `updateShowEpisodes(id: number, next: string, prev: string)` that issues a targeted `UPDATE` setting only `nextEpisode` and `prevEpisode` by show `id`.

### 2. `apps/api/src/tvmaze.ts` — `updateEpisodes()`

Change the return type from `Promise<void>` to `Promise<{ next: string; prev: string }>` and return `{ next: this.nextEpisode, prev: this.prevEpisode }` at the end.

### 3. `apps/api/src/routes/user.ts` — `POST /api/user/tvshow/:id`

1. Fetch TVMaze data and construct `TvMazeData` (no change).
2. Insert the show immediately via `addOneShow()` **without** calling `updateEpisodes()` first.
3. Send the response (`ok(newShow)`).
4. Fire a background task after response:
   ```
   tvData.updateEpisodes()
     .then(({ next, prev }) => updateShowEpisodes(newShow.id, next, prev))
     .catch(e => logger.error(e, 'background episode fetch failed'))
   ```

### 4. `apps/api/tests/user.test.ts`

- Mock `TvMazeData.updateEpisodes` to verify it is called but does not block the response.
- Add a test asserting the DB record is updated with episode data after the background fetch settles.

## Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/tvmaze.ts` | Return `{ next, prev }` from `updateEpisodes()` |
| `apps/api/src/db/dbShowFunctions.ts` | Add `updateShowEpisodes(id, next, prev)` |
| `apps/api/src/routes/user.ts` | Decouple insert from episode fetch; fire background update after response |
| `apps/api/tests/user.test.ts` | Add/update tests per spec |

## Verification

1. `pnpm build` — no TypeScript errors.
2. `pnpm --filter @tv-tracker/api test` — all tests pass.
3. Manual: add a show via the UI; response should be immediate; refresh the show and confirm episode dates populate.
