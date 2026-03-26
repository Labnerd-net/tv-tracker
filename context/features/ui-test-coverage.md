# Plan: UI Test Coverage Expansion (Backlog #17)

## Context

Only `viewToggle.test.ts` and two newer test files (`navbar.test.tsx`, `themeProvider.test.tsx`) exist under `apps/ui/tests/`. The four highest-value surfaces — `AllShows`, `SearchResults`, `OneShow`, and `useShowActions` — have zero test coverage. This plan adds focused RTL tests for each.

## Key Findings from Exploration

- Test infra is **already in place**: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@testing-library/jest-dom`, setup file at `apps/ui/tests/setup.ts`.
- All tests live in `apps/ui/tests/` (not `__tests__/`).
- Existing `navbar.test.tsx` establishes the patterns to follow: `vi.mock()` on context hooks, custom render wrapper with `ThemeProvider + BrowserRouter`.
- No new npm packages needed.

## Shared Test Utilities

**New file: `apps/ui/tests/testUtils.tsx`**

Export:
- `makeShow(overrides?)` — builds a `ShowData` object with sensible defaults (reusable across all test files; mirrors the one in `viewToggle.test.ts` but shared).
- `renderWithProviders(ui, opts)` — wraps UI in `ThemeProvider > MemoryRouter`. Auth, Alert, and Show contexts will be mocked at the hook level (matching `navbar.test.tsx` pattern) rather than providing real providers.

## Test Files

### 1. `apps/ui/tests/allShows.test.tsx`

Mock at module level:
- `vi.mock('../src/contexts/show/ShowContext')` — control `tvShows`, `loading`, `addShow`, `updateShow`, `removeShow`

Cases:
1. **Loading** — `loading: true, tvShows: []` → skeleton cards present (check for `ShowCardSkeleton` role or test-id)
2. **Populated** — `loading: false, tvShows: [show1, show2]` → show titles rendered
3. **Empty** — `loading: false, tvShows: []` → empty state text rendered

Also mock `useShowActions` to prevent API calls from `SingleShow` child components.

### 2. `apps/ui/tests/searchResults.test.tsx`

Mock at module level:
- `vi.mock('../src/apis/userRequests')` — mock `tvShowResults`, `fetchNextEpisodeDate`
- `vi.mock('../src/contexts/alert/AlertContext')` — mock `useAlert`

Render inside `MemoryRouter` with route `/search/:showName` using `initialEntries`.

Cases:
1. **Loading** — `tvShowResults` never resolves (pending promise) → loading indicator present
2. **Results rendered** — `tvShowResults` resolves with 2 results, `fetchNextEpisodeDate` resolves with date → result titles visible
3. **Empty results** — `tvShowResults` resolves with `[]` → empty/no-results text or no result cards
4. **Abort on unmount** — `tvShowResults` is slow; unmount before resolve → state update does not fire (no RTL warnings)

### 3. `apps/ui/tests/oneShow.test.tsx`

Mock at module level:
- `vi.mock('../src/apis/userRequests')` — mock `getOneShow`
- `vi.mock('../src/contexts/show/ShowContext')` — mock `useShow` (`updateShow`, `removeShow`)
- `vi.mock('../src/contexts/alert/AlertContext')` — mock `useAlert`
- `vi.mock('react-router')` (importOriginal) — mock `useNavigate`, `useParams` to return `{ showID: '42' }`

Cases:
1. **Loading skeleton** — `getOneShow` pending → skeleton placeholder visible
2. **Detail renders** — `getOneShow` resolves with `ShowData` → title, platform, episode info visible
3. **Error / unknown ID** — `getOneShow` returns `{ success: false, error: '...' }` → error message or navigate called

### 4. `apps/ui/tests/useShowActions.test.tsx`

Use `renderHook` from `@testing-library/react` with a wrapper that provides `ShowContext` and `AlertContext` (real or minimal mock providers).

Mock at module level:
- `vi.mock('../src/apis/userRequests')` — mock `updateShow`, `getOneShow`, `deleteShow`
- Mock `useShow` and `useAlert` via vi.mock on context modules

Cases:
1. **refreshShow success** — `updateShow` resolves ok, `getOneShow` returns show → `updateShow` context action called with updated show; success alert shown
2. **deleteShow success** — `deleteShow` resolves ok → `removeShow` context action called; success alert shown
3. **deleteShow failure** — `deleteShow` returns `{ success: false }` → `removeShow` NOT called; error alert shown
4. **Concurrent refresh** — two `refreshShow` calls in flight; both resolve → `updateShow` called twice, no errors thrown

## Implementation Order

1. `testUtils.tsx` — shared helpers first
2. `useShowActions.test.tsx` — hook test (no render complexity)
3. `allShows.test.tsx` — component with context mocks
4. `oneShow.test.tsx` — component with route params + async fetch
5. `searchResults.test.tsx` — most complex (parallel fetches, abort)

## Verification

```bash
pnpm --filter @tv-tracker/ui test       # all tests pass
pnpm build:ui                           # build still clean
```

## Critical Files

| File | Role |
|------|------|
| `apps/ui/tests/setup.ts` | Existing setup — do not modify |
| `apps/ui/tests/navbar.test.tsx` | Pattern reference |
| `apps/ui/src/pages/AllShows.tsx` | Subject |
| `apps/ui/src/pages/OneShow.tsx` | Subject |
| `apps/ui/src/pages/SearchResults.tsx` | Subject |
| `apps/ui/src/hooks/useShowActions.ts` | Subject |
| `apps/ui/src/apis/userRequests.ts` | Mocked in all component tests |
| `apps/ui/src/contexts/show/ShowContext.tsx` | Mocked in AllShows, OneShow, useShowActions tests |
| `apps/ui/src/contexts/alert/AlertContext.tsx` | Mocked in SearchResults, OneShow, useShowActions tests |
| `apps/shared/types/tv-tracker.ts` | `ShowData` type used in `makeShow()` |
