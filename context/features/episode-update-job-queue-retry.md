# Plan: Episode Update Job Queue with Retry

## Overview

Introduce a single new module (`jobQueue.ts`) that owns all queue logic, replace the two lines in `scheduleEpisodeUpdate()` in `user.ts`, and add a dedicated test file. No external dependencies needed.

---

## Step 1 — Define constants and types in the new module

**File to create:** `apps/api/src/utils/jobQueue.ts`

Constants (internal, not exported):
```
MAX_ATTEMPTS    = 3
BACKOFF_MS      = [5_000, 15_000, 45_000]   // index = attempt number (0-based)
MAX_QUEUE_DEPTH = 100
```

Type:
```ts
type EpisodeUpdateJob = {
  showData: TvMazeData;
  showId: number;
  attemptsRemaining: number;
}
```

Queue is a plain module-level array `const queue: EpisodeUpdateJob[] = []`. No locking needed (Node.js single-threaded). Track in-flight count by incrementing on enqueue and decrementing at the start of `runJob`.

---

## Step 2 — Implement the internal runner

Private async function `runJob(job: EpisodeUpdateJob, attemptNumber: number): Promise<void>`:

1. Decrement the in-flight counter.
2. Call `job.showData.updateEpisodes()`. On success, call `updateShowEpisodes(db, job.showId, next, prev)` and log `logger.info({ showId }, 'episode update succeeded')`.
3. On error:
   - Log `logger.warn({ showId, attempt: attemptNumber, err }, 'episode update attempt failed')`.
   - If `attemptsRemaining > 1`: schedule retry via `setTimeout(() => runJob(...), BACKOFF_MS[attemptNumber])`, decrement `attemptsRemaining`.
   - If `attemptsRemaining === 1`: log `logger.error({ showId, err }, 'episode update failed after all retries')`.

---

## Step 3 — Implement the exported enqueue function

Export `enqueueEpisodeUpdate(showData: TvMazeData, showId: number): void`:

1. If `queue.length >= MAX_QUEUE_DEPTH`: log `logger.warn({ showId }, 'job queue full, dropping episode update job')` and return.
2. Push new job with `attemptsRemaining: MAX_ATTEMPTS`.
3. Call `runJob(job, 0)` — fire-and-forget, no `await`. Returns immediately.

---

## Step 4 — Modify `scheduleEpisodeUpdate()` in `user.ts`

**File to change:** `apps/api/src/routes/user.ts`

1. Add import: `import { enqueueEpisodeUpdate } from '../utils/jobQueue.js';`
2. Replace body of `scheduleEpisodeUpdate` (lines 19–23) with: `enqueueEpisodeUpdate(showData, newShowId);`

The two call sites at lines 98 and 134 are unchanged.

---

## Step 5 — Create the test file

**File to create:** `apps/api/tests/jobQueue.test.ts`

Use `vi.useFakeTimers()` for retry tests. Spy on `logger.info/warn/error` and mock `dbShowFunctions.updateShowEpisodes`. Reset with `vi.clearAllMocks()` in `beforeEach`. Restore real timers in `afterEach` for timer-dependent tests.

Test cases:
1. Success on first attempt — `updateShowEpisodes` called once, `logger.info` called once, no warn/error.
2. Fails once then succeeds on retry — `logger.warn` once, advance timers by `BACKOFF_MS[0]`, `updateShowEpisodes` called once, `logger.info` once.
3. Fails all retries — `logger.warn` called `MAX_ATTEMPTS - 1` times, `logger.error` once, `updateShowEpisodes` never called.
4. Queue at max depth — fill queue with slow-resolving stubs, enqueue one more, verify `logger.warn` with "job queue full" message.
5. `scheduleEpisodeUpdate` integration — mock `enqueueEpisodeUpdate`, POST to `/api/user/tvshow`, verify it was called once and the HTTP response is not delayed.

---

## Step 6 — Verify no new dependencies

Uses only: pino logger, existing db modules, Node.js `setTimeout`, `TvMazeData` type. No `package.json` changes needed.

---

## Sequencing

| Order | Action | Depends on |
|-------|--------|------------|
| 1 | Create `jobQueue.ts` | Nothing |
| 2 | Edit `user.ts` | Step 1 |
| 3 | Create `jobQueue.test.ts` | Steps 1 & 2 |

---

## Critical Files

- `apps/api/src/utils/jobQueue.ts` _(new)_
- `apps/api/src/routes/user.ts` _(two-line change)_
- `apps/api/tests/jobQueue.test.ts` _(new)_
- `apps/api/src/utils/logger.ts` _(reference for log shape)_
- `apps/api/tests/user.test.ts` _(reference for test conventions)_

---

## Potential Challenges

- **Fake timer leakage:** Tests using `vi.useFakeTimers()` must call `vi.useRealTimers()` in `afterEach` to avoid leaking into other tests.
- **Queue depth counter accuracy:** In-flight counter covers the full retry lifetime (up to ~65 s per job). Acceptable — 100 slots is generous for expected load.
- **Logger mock:** Spy with `vi.spyOn(logger, 'info')` etc. to match existing test patterns.
