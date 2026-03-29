# Plan: Rate Limiter Probabilistic Cleanup (Backlog #8)

## Context

`rateLimiter.ts` uses `setInterval` (every 5 minutes) to purge expired entries from the in-memory store. This keeps the Node process alive indefinitely, fires even when the server is idle, and cannot be cancelled if multiple instances were ever created. The fix is to remove the interval and instead do a probabilistic sweep on each request — the same technique used by many in-memory rate limiter libraries.

## Files to Modify

- `apps/api/src/utils/rateLimiter.ts` — remove `setInterval`, add probabilistic cleanup
- `apps/api/tests/rateLimiter.test.ts` — add cleanup tests

## Implementation Steps

### 1. `rateLimiter.ts`

- Remove the `setInterval` block (lines 19–30).
- Add a module-level constant just above `rateLimit()`:
  ```
  const CLEANUP_PROBABILITY = 0.01;
  ```
- Inside `rateLimit()`, after `entry.count++` and before the limit check, add:
  ```
  if (Math.random() < CLEANUP_PROBABILITY) {
    for (const [k, e] of store.entries()) {
      if (e.resetAt < now) store.delete(k);
    }
  }
  ```
  Note: `now` is already declared earlier in the function — reuse it, don't redeclare.

### 2. `rateLimiter.test.ts`

Add a new `describe('probabilistic cleanup')` block:

- **Cleanup removes expired entries**: Populate the store with entries that have a past `resetAt` by making requests with a very short `windowMs` and then advancing time via `vi.useFakeTimers` / `vi.setSystemTime`. Mock `Math.random` to return `0` (below threshold) to force a sweep. Assert the store is empty (via `resetForTesting` reading 0 entries — or verify indirectly by confirming a previously-limited IP can make requests again after its window expires and a sweep runs).
- **No setInterval registered**: Spy on `globalThis.setInterval` before module import (or use `vi.spyOn`) and assert it was never called by the module. This prevents regression.

## Verification

```bash
pnpm --filter @tv-tracker/api test tests/rateLimiter.test.ts
pnpm build
```

All existing rate limiter tests must pass. New cleanup tests must pass.
