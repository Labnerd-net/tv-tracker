# Spec for Minor Type and Constant Fixes

Title: Minor Type and Constant Fixes
Branch: claude/fix/minor-type-and-constant-fixes
Spec file: context/specs/minor-type-and-constant-fixes.md

## Summary

Three small housekeeping fixes targeting a loose type definition, duplicated string literals, and repeated manual ID coercions across DB helper functions. None of these are behaviorally broken today, but they accumulate technical debt and make refactors riskier over time.

- **#14** — `alertVariant` in `AlertContext.tsx` is typed as `string` instead of the narrower union `'danger' | 'warning' | 'success'`. This allows invalid variants to slip through without a compile error.
- **#15** — Cookie path strings (`/api/auth`, `/api`) appear as literals in multiple places in `auth.ts`. A future path change would require hunting them all down.
- **#18** — Several DB functions in `dbShowFunctions.ts` individually call `Number()` to coerce a string ID before querying. The same pattern is repeated each time with no shared abstraction.

## Functional Requirements

- Define an `AlertVariant` union type (`'danger' | 'warning' | 'success'`) and apply it to the `alertVariant` field in `AlertProps` and all call sites that pass a variant string.
- Export cookie path constants (`AUTH_COOKIE_PATH`, `API_COOKIE_PATH`) from `apps/api/src/utils/auth.ts` and replace all hardcoded path string literals in `auth.ts` with references to those constants.
- Extract an `ensureNumericId(id: string): number` helper function in `apps/api/src/db/` and use it in every DB function that currently calls `Number()` directly on a string ID.

## Possible Edge Cases

- `AlertVariant` change may surface existing call sites passing strings that TypeScript previously accepted silently — all must be updated.
- Cookie path constants affect logout and `deleteUser` handlers; both must be verified to still set/clear cookies at the correct paths after the refactor.
- `ensureNumericId` should be a pure function with no side effects; callers that currently handle `NaN` implicitly may need no changes, but the helper should not silently coerce non-numeric strings.

## Acceptance Criteria

- `alertVariant` is typed as `AlertVariant` (not `string`) in `AlertProps` and wherever the type is used; the build passes with no TypeScript errors.
- No hardcoded `'/api/auth'` or `'/api'` path strings remain in `auth.ts`; constants are exported from `utils/auth.ts` and imported in the route file.
- No `Number(id)` or equivalent inline coercions remain in `dbShowFunctions.ts`; all are replaced by the shared `ensureNumericId` helper.
- `pnpm build` passes clean.

## Open Questions

- Should `ensureNumericId` throw on `NaN`, or is a passthrough acceptable since callers already rely on Drizzle rejecting bad values? Probably throw — fail fast.
- Is the `AlertVariant` type best placed in `apps/shared/types/` or alongside `AlertProps` in `apps/ui/src/types/alert.ts`? Since it's UI-only, local is fine unless other packages need it.

## Testing Guidelines

No new test files needed for these changes — they are type-level and structural. However:

- Verify existing API tests still pass after the cookie-path and `ensureNumericId` changes (`pnpm --filter @tv-tracker/api test`).
- If `ensureNumericId` is written to throw on NaN, add one unit test asserting that behavior.

## Personal Opinion

All three are low-risk, high-value housekeeping items. They make the codebase incrementally safer (type narrowing on `alertVariant`), more maintainable (path constants), and less repetitive (`ensureNumericId`). None require architectural decisions. The complexity is minimal — this is a fast, clean fix worth doing. My only mild concern is `ensureNumericId`: if it throws and any call site passes a malformed ID that currently survives silently, a test could break. That's worth a quick check but not a blocker.
