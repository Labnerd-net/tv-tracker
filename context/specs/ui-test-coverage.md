# Spec for UI Test Coverage Expansion

Title: UI Test Coverage Expansion
Branch: claude/feature/ui-test-coverage
Spec file: context/specs/ui-test-coverage.md

## Summary

UI test coverage is currently minimal — only `viewToggle.test.ts` exists. Core components (`SearchResults`, `AllShows`, `OneShow`) and the `useShowActions` hook have no tests. This spec adds react-testing-library tests for the primary user flows and covers API edge cases such as concurrent requests and partial failures.

## Functional Requirements

- Set up `vitest` + `@testing-library/react` + `@testing-library/user-event` in `apps/ui` with a jsdom test environment.
- Add a `test` script to `apps/ui/package.json`.
- Write tests for `AllShows`: renders skeleton while loading, renders show cards when data arrives, shows empty state when the list is empty.
- Write tests for `SearchResults`: renders results from TVMaze search, shows loading skeleton during fetch, handles empty results, cancels stale episode-date fetches on query change (abort signal fires).
- Write tests for `OneShow`: renders show detail from context, shows skeleton while loading, displays error state for unknown show IDs.
- Write tests for `useShowActions`: `refreshShow` calls the API and invokes `updateShow`; `deleteShow` calls the API and invokes `removeShow` on success; `deleteShow` leaves the show in state and shows an error alert on failure; concurrent refresh calls do not race.
- API mocks should use `vitest`'s `vi.mock` or MSW to intercept Axios calls — no real network requests in tests.

## Possible Edge Cases

- `useShowActions` is called before `ShowContext` is ready (null provider).
- `SearchResults` unmounts mid-fetch — abort signal must fire and state must not update.
- `AllShows` receives an empty array vs. a null/undefined response from the API.
- `deleteShow` returns `ok: false` — show must remain in the list.
- Multiple concurrent refreshes for the same show — final state should reflect the last resolved response.

## Acceptance Criteria

- `pnpm --filter @tv-tracker/ui test` passes with no failures.
- At least one test each for happy path, loading state, and error/failure state in `AllShows`, `SearchResults`, and `OneShow`.
- At least one test each for success and failure branches of `refreshShow` and `deleteShow` in `useShowActions`.
- Tests do not make real network requests.
- Build (`pnpm build:ui`) still passes after adding test infrastructure.

## Open Questions

- Should we use MSW (`msw`) for intercepting requests, or `vi.mock` on the Axios instance directly? MSW is more realistic but adds a dependency. Given the project already mocks at the module level on the API side, `vi.mock` on `userRequests.ts` is simpler and consistent. - mock is fine
- Is `jsdom` sufficient or do we need `happy-dom`? `jsdom` is the standard choice with RTL. - jsdom is fine

## Testing Guidelines

Create test files under `apps/ui/src/__tests__/` (or alongside components in `__tests__` subdirectories):

- `AllShows.test.tsx` — loading skeleton, populated grid, empty state.
- `SearchResults.test.tsx` — renders results, loading state, empty results, abort on query change.
- `OneShow.test.tsx` — detail view renders, loading skeleton, unknown ID error state.
- `useShowActions.test.ts` — refresh success, delete success, delete failure (show stays), concurrent requests.

Mock `userRequests.ts` at the module level with `vi.mock`. Use `renderWithProviders` helper that wraps the component tree in the required context providers (Auth, Alert, Show, Theme).

## Personal Opinion

This is a straightforward and clearly necessary improvement — the current test gap is real. The scope is well-bounded: four files covering the highest-value surfaces. The main risk is setup cost (RTL + vitest config, provider wrappers) exceeding the test value if the component APIs change frequently. That said, `AllShows`, `OneShow`, and `useShowActions` are stable at this point, so the investment should hold. The concurrent-request edge case for `useShowActions` is worth the attention — that race condition exists today and a test will make any future regression immediately visible. Overall a good idea, not over-engineered.
