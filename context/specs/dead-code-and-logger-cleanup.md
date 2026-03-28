# Spec for dead-code-and-logger-cleanup

Title: Dead Code and Logger Cleanup
Branch: claude/fix/dead-code-and-logger-cleanup
Spec file: context/specs/dead-code-and-logger-cleanup.md

## Summary

Three small housekeeping fixes targeting backlog #12, #13, and #16:
- Delete the unused `DataProps` interface from `apps/ui/src/types/data.ts`
- Verify and delete the unused `ViewProps` interface from `apps/ui/src/types/view.ts`
- Replace `console.error` + eslint-disable comment in `ErrorBoundary.tsx` with the project `logger` utility

## Functional Requirements
- `DataProps` is removed from the codebase entirely (file deleted if it becomes empty)
- `ViewProps` is removed from the codebase entirely after confirming no imports exist (file deleted if it becomes empty)
- `ErrorBoundary.tsx` imports `logger` and calls `logger.error(...)` in place of `console.error(...)`; the `eslint-disable-next-line no-console` comment is removed

## Possible Edge Cases
- `ViewProps` may be imported somewhere non-obvious (dynamic import, re-export barrel). Grep the full codebase before deleting.
- The `logger` utility used elsewhere in the UI may not be available/compatible inside a class component's `componentDidCatch` — verify the import path works in that context.

## Acceptance Criteria
- No reference to `DataProps` exists in the codebase after the change.
- No reference to `ViewProps` exists in the codebase after the change.
- `ErrorBoundary.tsx` contains no `console.error` call and no eslint-disable comment.
- `pnpm build` passes with no TypeScript or lint errors.
- No unrelated files are modified.

## Open Questions
- None.

## Testing Guidelines
No new tests needed — these are pure deletions and a one-line substitution with no logic change. Confirm the build and lint pass as the verification step.

## Personal Opinion
All three are straightforward and clearly correct. #12 and #13 are pure dead-code removal with zero risk. #16 is a one-line swap that makes the codebase internally consistent. Good fixes to batch together. No concerns.
