# Spec for Code Cleanup and Minor Fixes

Title: Code Cleanup and Minor Fixes
Branch: claude/fix/code-cleanup-minor-fixes
Spec file: context/specs/code-cleanup-minor-fixes.md

## Summary

Six small housekeeping fixes drawn from backlog items #7, #8, #20, #23, #24, and #25. All are isolated, low-risk changes with no behavioral impact: two variable/function renames, one type deduplication, and migrating remaining hardcoded hex color strings to CSS custom properties.

## Functional Requirements

- **#7** — Rename `userIdNumber` to `userIdString` in `apps/api/src/routes/auth.ts` (line ~191). The variable holds the result of `String(payload.sub)`, so it is a string, not a number.
- **#8** — Rename `retreiveTvShow` to `retrieveTvShow` in `apps/ui/src/pages/OneShow.tsx` (line ~24). Fix the missing 'i' typo; update all call sites in the same file.
- **#20** — Remove the duplicate `AlertProps` interface from `apps/ui/src/contexts/alert/AlertContext.tsx` and import it from `apps/ui/src/types/alert.ts` instead.
- **#23** — Replace hardcoded `'#e8e0d0'` in `apps/ui/src/pages/Splash.tsx` (line ~171) with `'var(--cream)'`.
- **#24** — Replace the two instances of hardcoded `'#e63946'` in `apps/ui/src/components/ShowsTable.tsx` (line ~59) with `'var(--accent)'`.
- **#25** — Audit all remaining UI source files for hardcoded hex strings that should be CSS custom properties (`--bg`, `--surface`, `--accent`, `--amber`, `--cream`, `--cream-muted`, `--cream-dim`, `--accent-dim`, etc.) and replace any stragglers found.

## Possible Edge Cases

- #8: `retrieveTvShow` may be referenced by name in tests or other files — check all call sites before renaming.
- #20: Ensure the exported `AlertProps` from `types/alert.ts` is identical to the removed definition; if they differ, resolve before removing the duplicate.
- #25: Some hardcoded hex values may be intentional one-off overrides unrelated to the theme (e.g. third-party component customization). Only replace values that clearly correspond to a defined CSS custom property.

## Acceptance Criteria

- `userIdNumber` does not appear anywhere in `auth.ts`.
- `retreiveTvShow` (misspelled) does not appear anywhere in the codebase.
- `AlertProps` is defined in exactly one place (`types/alert.ts`); `AlertContext.tsx` imports it.
- No hardcoded `#e8e0d0` or `#e63946` remain in the UI source.
- Full audit of UI source files shows no remaining hardcoded hex strings that map to a CSS custom property.
- `pnpm build` passes with zero errors or new warnings.

## Open Questions

- None. All changes are mechanical.

## Testing Guidelines

No new test files are needed — these are renames and style constant swaps with no logic changes. Existing tests must continue to pass unchanged after the renames.

- Verify `pnpm --filter @tv-tracker/api test` passes after #7 rename.
- Verify `pnpm build` passes for both `api` and `ui` after all changes.

## Personal Opinion

All six items are straightforward and clearly worth doing. The renames (#7, #8) prevent genuine reader confusion. The type deduplication (#20) removes a drift hazard. The hex-to-var migrations (#23, #24, #25) are necessary for theme correctness and were already flagged as the last stragglers after prior cleanup. No concerns — this is routine housekeeping.
