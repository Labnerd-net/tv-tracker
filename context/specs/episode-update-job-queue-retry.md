# Spec for Episode Update Job Queue with Retry

Title: Episode Update Job Queue with Retry
Branch: claude/feature/episode-update-job-queue-retry
Spec file: context/specs/episode-update-job-queue-retry.md

## Summary

`scheduleEpisodeUpdate()` in `apps/api/src/routes/user.ts` runs as a detached promise — failures are caught and logged but never retried. If the TVMaze episode fetch fails transiently (network hiccup, timeout), the show's `nextEpisode`/`prevEpisode` fields are never populated until the user manually refreshes. The fix is a simple in-memory job queue that retries failed episode update jobs a bounded number of times with a short delay, with structured logging on each attempt and on final failure.

## Functional Requirements

- Replace the bare `.then().catch()` in `scheduleEpisodeUpdate()` with a call into a new job queue module.
- The queue runs jobs asynchronously in the background — it must never block or delay the HTTP response.
- Each job retries up to a configurable maximum number of attempts (e.g. 3) on failure.
- Between retries, use a fixed or exponential backoff delay (e.g. 5 s, 15 s, 45 s).
- On each failed attempt, log a structured warning including the show ID, attempt number, and error.
- On final failure (all retries exhausted), log a structured error.
- On success, log a structured info message with the show ID.
- The queue is in-memory only — no persistence, no external dependencies.
- Maximum queue depth should be bounded (e.g. 100 pending jobs) to prevent unbounded memory growth; if full, log a warning and drop the new job.

## Possible Edge Cases

- The queue fills up under burst load (many shows added simultaneously).
- A job succeeds on retry after the show has been deleted from the DB — the `updateShowEpisodes` call should just silently succeed or produce a no-op.
- The server shuts down mid-retry — in-flight jobs are lost. This is acceptable for an in-memory queue; no special shutdown handling needed.
- Concurrent retry attempts for the same `showId` — not a correctness problem given the DB write is idempotent, but worth noting.

## Acceptance Criteria

- `scheduleEpisodeUpdate()` enqueues a job rather than firing a raw promise.
- A job that fails fewer than the max retry count is retried after the configured delay.
- A job that exhausts all retries logs an error and does not crash the process.
- A successful job logs an info-level message with the show ID.
- The queue module is self-contained with no external runtime dependencies.
- Existing tests that cover `scheduleEpisodeUpdate()` behavior continue to pass.

## Open Questions

- Should the retry count and delays be configurable via env vars, or hardcoded constants? (Preference: constants — avoids env var sprawl for a non-critical internal detail.) - constants
- Should there be any observable metric for queue depth (e.g. logged periodically)? (Preference: no — too much noise for a low-volume feature.) - no thanks

## Testing Guidelines

Create or extend test coverage in `apps/api/tests/`:

- Job succeeds on first attempt — `updateShowEpisodes` called once, info logged.
- Job fails once then succeeds — retry fires, `updateShowEpisodes` called on second attempt.
- Job fails all retries — error logged after final attempt, `updateShowEpisodes` never succeeds.
- Queue at max depth — new job is dropped with a warning log, existing jobs unaffected.
- `scheduleEpisodeUpdate()` integration — verify it enqueues correctly (mock the queue's enqueue function).

## Personal Opinion

This is a good, well-scoped fix. The current silent failure is a real UX problem — users add a show and see blank episode dates with no indication of why. The retry logic is low-risk because the job is idempotent and the show is already visible in the UI by the time the queue runs.

One concern: introducing a custom in-memory job queue is more complexity than the current one-liner. If the codebase eventually adds a proper background job system (see backlog #25 for notifications), this queue could be a stepping stone or could become dead code. Keep the implementation minimal — no elaborate abstractions.
