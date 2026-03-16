# Spec for API Cleanup - Deps, Env Vars, and Types

Title: API Cleanup - Deps, Env Vars, and Types
Branch: claude/fix/api-cleanup-deps-env-types
Spec file: context/specs/api-cleanup-deps-env-types.md

## Summary

Three small cleanup fixes in `apps/api`:

1. **[25] Remove unused `jsonwebtoken` dep** — `jsonwebtoken` and `@types/jsonwebtoken` are listed in `apps/api/package.json` but never used. The app uses `hono/jwt` for all JWT operations. Remove both packages.

2. **[21] Unify `DB_FILE_NAME` reading through `envVars.ts`** — `apps/api/src/db/schema.ts` reads `DB_FILE_NAME` directly from `process.env` at module load time, bypassing `envVars.ts` which already exports a `dbUrl` value. Consolidate so `schema.ts` imports `dbUrl` from `envVars.ts`.

3. **[22] Fix `any` type suppressions** — `apps/api/src/utils/validationHook.ts` and `apps/api/src/routes/auth.ts` suppress TypeScript errors with `any` casts. Replace with proper types from `@hono/zod-validator` and `hono`.

## Functional Requirements

- `jsonwebtoken` and `@types/jsonwebtoken` are removed from `apps/api/package.json` and `pnpm-lock.yaml`.
- `apps/api/src/db/schema.ts` no longer reads `process.env.DB_FILE_NAME` directly; it imports the database URL from `envVars.ts`.
- `apps/api/src/utils/validationHook.ts` uses correct types instead of `any`.
- `apps/api/src/routes/auth.ts` uses correct `Context` and validator types instead of `any`.
- No runtime behavior changes — these are purely structural/type fixes.

## Possible Edge Cases

- `envVars.ts` may not export the DB URL under the same name or format expected by `schema.ts` — verify both files use the same env var and fallback logic before consolidating.
- Removing `any` in `validationHook.ts` or `auth.ts` may surface pre-existing type errors elsewhere that were previously hidden — fix those too rather than leaving them.

## Acceptance Criteria

- `pnpm --filter @tv-tracker/api build` passes with no errors.
- `pnpm --filter @tv-tracker/api test` passes with no regressions.
- `jsonwebtoken` does not appear in `apps/api/package.json` or `node_modules`.
- `schema.ts` contains no direct `process.env.DB_FILE_NAME` reads.
- `validationHook.ts` and `auth.ts` contain no `any` type casts related to these suppressions.

## Open Questions

- None — all three items are well-scoped with clear locations identified in the backlog.

## Testing Guidelines

No new tests required — these are type/dependency fixes, not logic changes. Existing tests in `apps/api/tests/` should continue to pass unmodified. Verify this explicitly after each change.

## Personal Opinion

All three are straightforward and low-risk. They reduce technical debt and improve type safety without touching runtime logic. The `any` fix in particular is worth doing before the codebase grows, since suppressions tend to spread. None of these changes are complex — combined they should take under an hour. No concerns.
