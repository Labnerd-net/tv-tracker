# Spec for Auth Cookie Helpers and Import Cleanup

Title: Auth Cookie Helpers and Import Cleanup
Branch: claude/fix/auth-cookie-helpers-and-import-cleanup
Spec file: context/specs/auth-cookie-helpers-and-import-cleanup.md

## Summary

Two small housekeeping fixes grouped together (backlog #17 and #18):

1. **#17 — Cookie helper consolidation:** The cookie-setting logic (`setRefreshCookie`, `setAccessCookie`) is duplicated across the `register`, `login`, and `refresh` route handlers in `apps/api/src/routes/auth.ts`. This should be extracted into a single `setAuthCookies(c, tokens)` helper in `apps/api/src/utils/auth.ts`.

2. **#18 — Import extension cleanup:** `apps/ui/src/components/Result.tsx` uses explicit `.ts`/`.tsx` file extensions on its imports (`userRequests.ts`, `tvmaze.ts`, `ShowContext.tsx`, `ShowCard.tsx`). The rest of the UI codebase omits extensions. These should be removed to match project convention.

## Functional Requirements

- Extract shared cookie-setting logic from the three auth route handlers into a `setAuthCookies(c, tokens)` helper exported from `apps/api/src/utils/auth.ts`.
- The three call sites (`register`, `login`, `refresh`) must use the new helper with no change in runtime behaviour.
- Remove explicit `.ts`/`.tsx` extensions from the four imports in `Result.tsx`.

## Possible Edge Cases

- The extracted `setAuthCookies` helper must accept the same Hono `Context` type already used in the auth util file — no type widening or narrowing needed.
- Extension removal in `Result.tsx` should have no runtime effect in the Vite build, but the build must be verified afterwards.

## Acceptance Criteria

- [ ] `setRefreshCookie` and `setAccessCookie` calls no longer appear directly inside any route handler body — only the new `setAuthCookies` helper is called.
- [ ] `setAuthCookies` is defined in `apps/api/src/utils/auth.ts` and exported.
- [ ] All four imports in `Result.tsx` omit file extensions.
- [ ] `pnpm build` passes with no errors or new warnings.
- [ ] Existing auth tests continue to pass.

## Open Questions

- None.

## Testing Guidelines

No new tests are required — these are pure refactors with no behaviour change. Verify existing auth tests still pass.

## Personal Opinion

Both changes are straightforward and low risk. #17 removes obvious duplication at a natural abstraction boundary; #18 is a one-line fix. Grouping them in a single commit makes sense given how small they are. No concerns.
