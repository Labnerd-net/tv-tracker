# Spec for Code Quality Type and Constant Fixes

Title: Code Quality Type and Constant Fixes
Branch: claude/fix/code-quality-type-and-constant-fixes
Spec file: context/specs/code-quality-type-and-constant-fixes.md

## Summary

Two small code quality fixes from the backlog:

- **#22** — Tighten the type annotation in `validationHook.ts` from the loose `Hook<unknown, any, any>` to a precise generic from `@hono/zod-validator`, eliminating the `any` suppression and surfacing middleware type mismatches at compile time.
- **#30** — The `tvMazeAPI` base URL constant is duplicated in both `apps/api/src/routes/user.ts` and `apps/ui/src/apis/userRequests.ts`. Move it to `apps/shared/` so both packages reference a single source of truth.

## Functional Requirements

- Replace `Hook<unknown, any, any>` in `validationHook.ts` with the correct precise type from `@hono/zod-validator`.
- Define a single `TV_MAZE_API_BASE` (or equivalent) constant in `apps/shared/`.
- Update `apps/api/src/routes/user.ts` to import the constant from shared instead of defining it inline.
- Update `apps/ui/src/apis/userRequests.ts` to import the constant from shared instead of defining it inline.
- No behavior changes — this is purely a refactor.

## Possible Edge Cases

- The shared package has no build step; imports must resolve correctly via the TypeScript path alias `@shared/*` in the API and via the equivalent Vite alias in the UI.
- The API uses `.js` extensions on imports even for `.ts` source files — the shared import must follow the same convention.

## Acceptance Criteria

- `pnpm build` passes with no TypeScript errors.
- `pnpm lint` passes (UI).
- No `any` remains in `validationHook.ts`.
- The `tvMazeAPI` base URL string appears exactly once across the codebase (in `apps/shared/`).
- All existing API tests continue to pass.

## Open Questions

- None.

## Testing Guidelines

No new tests are needed — these are type-level and constant-extraction changes with no runtime behavior. Verify the existing test suite still passes after the changes.

## Personal Opinion

Both changes are straightforward and low-risk. #22 is a genuine improvement — losing the `any` means the compiler will catch hook signature mismatches that are currently invisible. #30 is marginally useful; the duplication is minor and the constant is unlikely to change, but it's still the right call. Neither change is complex. No concerns.
