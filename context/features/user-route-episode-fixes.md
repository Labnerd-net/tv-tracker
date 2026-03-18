# Plan: User Route Episode Fixes

## Overview

Two isolated changes to `apps/api/src/routes/user.ts` and `apps/api/tests/user.test.ts`:
1. Refactor (#15) — Extract the duplicated background episode-update block into a module-level helper.
2. Bug fix (#45) — Guard against `newShowId === undefined` in `POST /tvshow` body route.

Do the refactor first; the bug fix is cleaner to read once the helper call is a single line.

---

## Change 1 — Extract `scheduleEpisodeUpdate` helper (refactor #15)

**Where to define it:** Module level in `apps/api/src/routes/user.ts`, after `const tvMazeAPI` and before `const user = new Hono(...)`.

**Signature:** `function scheduleEpisodeUpdate(showData: TvMazeData, newShowId: number): void`

**Body:** The three-line fire-and-forget block unchanged. `db` is in module scope, no need to pass it.

**Edits:**
- After `const tvMazeAPI = ...`: insert the helper function.
- Lines 94-98 (`POST /tvshow` body route): replace inline block with `scheduleEpisodeUpdate(showData, newShowId)` call.
- Lines 128-132 (`POST /tvshow/:id` route): replace inline block with `scheduleEpisodeUpdate(showData, newShowId)` call.
- The `if (newShowId !== undefined)` guard in both routes remains for now; Change 2 will remove it from the body route.

---

## Change 2 — Guard on `newShowId` in `POST /tvshow` body route (#45)

**Edit location:** Lines 93-99 of `user.ts`, inside `POST /tvshow`.

**Current logic:**
```
const newShowId = result?.[0]?.showId;
if (newShowId !== undefined) { ... fire-and-forget ... }
return c.json(ok({ status: 'added', showId: newShowId }));  // BUG: newShowId may be undefined
```

**New logic:**
1. After `const newShowId = result?.[0]?.showId;`, add: if `newShowId === undefined`, return `c.json(err('Failed to save show'), 500)` and exit.
2. Remove the now-redundant `if (newShowId !== undefined)` wrapper.
3. Call `scheduleEpisodeUpdate(showData, newShowId)` unconditionally (TypeScript narrows to `number` here).
4. Return `c.json(ok({ status: 'added', showId: newShowId }))` — now guaranteed a `number`.

The `POST /tvshow/:id` route is not changed: it does not return `showId` in its response so the silent-skip behavior is acceptable there.

---

## Test changes — `apps/api/tests/user.test.ts`

Add inside `describe('POST /api/user/tvshow (body)')`:

1. **DB failure returns 500** — Mock `addOneShow` to return `[]`. Assert response status is `500` and `body.ok` is `false` with `body.error === 'Failed to save show'`.

2. **showId present in success response** — Extend or add a test to assert `body.data.showId === 1` on the success path (pins the previously broken behaviour).

3. **Background episode update fires for body route** — Spy on `TvMazeData.prototype.updateEpisodes`, post a valid body, assert response arrives before spy resolves, then resolve and wait for `updateShowEpisodes` to be called. (Mirrors the existing equivalent test under the `:id` route.)

No changes needed to `:id` route tests or any other test file.

---

## Sequencing

1. Add `scheduleEpisodeUpdate` helper.
2. Replace both inline blocks with helper calls.
3. Add `newShowId === undefined` early return and remove wrapping `if` in body route.
4. Add the three new test cases.
5. Run `pnpm --filter @tv-tracker/api test` — all should pass.
6. Run `pnpm build` — confirm no TypeScript errors.

---

## Critical Files

- `apps/api/src/routes/user.ts` — Only production file changed.
- `apps/api/tests/user.test.ts` — New and updated tests.
- `apps/api/tests/helpers.ts` — Reference for `makeToken` utility (no changes needed).
