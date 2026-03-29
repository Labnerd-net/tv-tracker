# Spec for Rate Limiter Probabilistic Cleanup

Title: Rate Limiter Probabilistic Cleanup
Branch: claude/feature/perf-rate-limiter-and-prepared-statements
Spec file: context/specs/perf-rate-limiter-and-prepared-statements.md

## Summary

Replace the `setInterval`-based store cleanup in `rateLimiter.ts` with per-request probabilistic cleanup (backlog #8). On each request, with a small probability (1%), scan the store and delete all expired entries. This keeps the store bounded without relying on a background timer that keeps the process alive and can't be cancelled per-instance.

## Functional Requirements

- Remove the `setInterval` block from `rateLimiter.ts`.
- Inside `rateLimit()`, after the entry is read/updated, run a probabilistic sweep controlled by a named constant (e.g. `CLEANUP_PROBABILITY = 0.01`). When triggered, iterate the store and delete entries where `resetAt < now`.
- The existing per-request expiry reset (overwrite stale entry with a fresh window) stays unchanged.
- `resetForTesting()` stays in place.

## Possible Edge Cases

- **Zero-traffic server**: store is never cleaned. Acceptable — no entries accumulate on an idle server either.
- **Tuning**: `CLEANUP_PROBABILITY` as a named constant makes the threshold easy to adjust without hunting through logic.

## Acceptance Criteria

- [ ] `setInterval` is removed; no background timer is started on module load.
- [ ] Probabilistic cleanup runs inside `rateLimit()`, controlled by `CLEANUP_PROBABILITY`.
- [ ] All existing rate limiter tests pass with no behavior changes for consumers.
- [ ] `pnpm build` is clean.

## Open Questions

None.

## Testing Guidelines

Update `rateLimiter.test.ts`:
- Verify expired entries are removed when cleanup is triggered (expose a test hook or mock `Math.random` to force a sweep).
- Verify the store does not grow unbounded when entries expire across many requests.

## Personal Opinion

Good change. `setInterval` in a module is a subtle leak — it keeps the Node process alive, fires even when the server is idle, and can't be cancelled without holding a reference. Probabilistic per-request cleanup is idiomatic for in-memory rate limiters and adds no measurable overhead. Low complexity, clear improvement.
