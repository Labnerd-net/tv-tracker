# Spec for Discriminated Union API Response Types

Title: Discriminated Union API Response Types
Branch: claude/feature/discriminated-union-api-response-types
Spec file: context/specs/discriminated-union-api-response-types.md

## Summary

The three UI API modules (`authRequests.ts`, `userRequests.ts`, `adminRequests.ts`) currently return a loose shape where `data` and `error` are both optional. Callers must manually check `response.success` and then manually narrow the type — TypeScript gives no exhaustive-handling guarantee. Replace the current return type with a proper discriminated union so that accessing `data` in the failure branch (or `error` in the success branch) is a type error.

The shared type lives in `apps/shared/` so both apps can reference it if needed.

## Functional Requirements

- Define `type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }` in `apps/shared/types/tv-tracker.ts` (or a new shared types file).
- Replace the existing return type annotation on every function in `authRequests.ts`, `userRequests.ts`, and `adminRequests.ts` with `Promise<ApiResponse<T>>` using the appropriate `T` for each function.
- All three files must compile with no TypeScript errors after the change.
- No runtime behavior changes — the actual response objects returned already conform to this shape; only the type annotations change.
- Update any call sites in the UI that rely on the old loose type if TypeScript flags them. Fix narrowing at call sites so they type-check cleanly without casts.

## Possible Edge Cases

- Some catch blocks may currently return `{ success: false, error: string, data: undefined }` — the new union forbids `data` on the failure branch, so those must be cleaned up.
- Any call site that destructures both `data` and `error` without a prior `success` check will now be a type error and must be fixed.
- The shared package has no build step — imports must use the correct path alias (`@shared/types/tv-tracker.js` in the API, relative import in the UI).

## Acceptance Criteria

- `pnpm build` passes with zero TypeScript errors.
- `authRequests.ts`, `userRequests.ts`, and `adminRequests.ts` all use `ApiResponse<T>` as their return type.
- Accessing `response.data` without first narrowing on `response.success` is a TypeScript error in call sites.
- No runtime behavior is altered — existing tests continue to pass.

## Open Questions

- Should `ApiResponse<T>` live in `apps/shared/types/tv-tracker.ts` alongside existing shared types, or in a new dedicated file? (Leaning toward the existing file to avoid proliferating small files.) - sure, existing file

## Testing Guidelines

No new test files are needed — this is a type-only change with no runtime behavior delta. Verify correctness via:
- `pnpm build` (TypeScript compilation must pass cleanly).
- `pnpm --filter @tv-tracker/api test` (existing API tests must still pass).

## Personal Opinion

Good change. The current loose interface is a common TypeScript antipattern — optional fields on both branches mean the compiler never forces callers to discriminate. The discriminated union costs almost nothing (only type annotations change) and eliminates a whole class of "forgot to check success" bugs. Complexity is very low; the only real work is updating call sites that TypeScript flags. This is the right kind of small, high-value refactor.
