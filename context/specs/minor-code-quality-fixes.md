# Spec for Minor Code Quality Fixes

Title: Minor Code Quality Fixes (Backlog #16, #17, #18, #21)
Branch: claude/fix/minor-code-quality
Spec file: context/specs/minor-code-quality-fixes.md

## Summary

Four small, unrelated housekeeping fixes that reduce dead code, type inconsistency, import style drift, and unnecessary prop coupling. No behavior changes.

## Functional Requirements

- **#16** — Remove the four dead fields (`sortOrder`, `setSortOrder`, `sortCol`, `setSortCol`) from the `DataProps` interface in `apps/ui/src/types/data.ts`. Sort state lives entirely in `ShowsTable.tsx` as local state and is not part of `ShowContext`.
- **#17** — In the logout handler in `apps/api/src/routes/auth.ts`, replace the `setCookie(c, 'accessToken', '', { maxAge: 0, ... })` call with `deleteCookie(c, 'accessToken', { path: '/api' })` to match how `refreshToken` is already cleared.
- **#18** — In `apps/ui/src/hooks/useShowActions.ts`, change the four imports that use explicit `.ts`/`.tsx` extensions to use `.js` extensions, matching the convention used everywhere else in the UI.
- **#21** — In `apps/ui/src/components/Result.tsx`, narrow the `alertProps: AlertProps` prop to `showAlert: AlertProps['showAlert']` and update the three internal call sites. In `apps/ui/src/pages/SearchResults.tsx`, pass `showAlert={showAlert}` instead of `alertProps={alertProps}` and remove the now-unnecessary `alertProps` variable.

## Possible Edge Cases

- `DataProps` may be imported in files that reference the dead fields — need to confirm no usages before deleting.
- `deleteCookie` may require matching `httpOnly`/`secure`/`sameSite` options to properly clear the cookie in all browsers; verify the options match what was used when the cookie was set.

## Acceptance Criteria

- `DataProps` no longer contains `sortOrder`, `setSortOrder`, `sortCol`, `setSortCol`.
- `POST /api/auth/logout` uses `deleteCookie` for both `refreshToken` and `accessToken`.
- All imports in `useShowActions.ts` use `.js` extensions.
- `Result` accepts `showAlert` directly, not the full `alertProps` object.
- `pnpm build` passes with no errors.
- No behavior changes in the UI or API.

## Open Questions

- For #17: should the `deleteCookie` options for `accessToken` include `httpOnly`, `secure`, and `sameSite` explicitly, or does Hono's `deleteCookie` handle that without them? Need to verify against the Hono docs. - i'm not sure

## Testing Guidelines

These are all structural/cosmetic changes with no logic delta. No new tests are needed. Existing tests should continue to pass:
- Run the full API test suite (`pnpm --filter @tv-tracker/api test`) to confirm the logout route still behaves correctly after the cookie fix.
- Run `pnpm build` to confirm TypeScript is satisfied after removing the dead `DataProps` fields and updating `Result`'s prop type.

## Personal Opinion

These are all good changes — small, safe, and unambiguously correct. None of them are risky:

- **#16** is a straightforward dead-code removal. The fields should never have stayed in the interface after sort state was moved local.
- **#17** is a consistency fix. Using `setCookie` with `maxAge: 0` works but is semantically misleading; `deleteCookie` is the right tool.
- **#18** is a one-line-per-import change. No concern at all.
- **#21** reduces coupling slightly and makes `Result`'s contract clearer. The only thing to watch is that `AlertProps['showAlert']` resolves correctly as a type — it should, since `AlertProps` is a plain interface.

Grouping all four into a single commit is reasonable; they're all too small to warrant individual PRs.
