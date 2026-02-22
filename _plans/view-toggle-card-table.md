# Plan: View Toggle — Card View & Sortable Table View

## Context

The shows dashboard (`/dashboard`) currently renders every tracked show as a card grid via `AllShows.tsx` + `SingleShow.tsx`. As a user's list grows, the card grid becomes hard to scan and compare. A compact sortable table gives a faster overview. The spec asks for a toggle between the two views, with the chosen view persisted in localStorage and sort state resetting each visit.

---

## Files to Create

### `apps/ui/src/components/ShowsTable.tsx`
New component. Receives `tvShows: ShowData[]` as a prop.

- Renders a MUI `Table` / `TableContainer` / `TableHead` / `TableBody`.
- Columns: **Title**, **Platform**, **Status**, **Schedule Day**, **Schedule Time**, **Next Episode**, **Previous Episode**, **Actions**.
- Local state: `sortCol: keyof ShowData` (default `'title'`) and `sortDir: 'asc' | 'desc'` (default `'asc'`). Neither is persisted.
- Clicking a column header sets that column as active and toggles direction if already active; otherwise resets to `'asc'`.
- Sorting is pure client-side. Null values always sort last when ascending, first when descending.
- The active column header shows a MUI `ArrowUpward` / `ArrowDownward` icon.
- Each row has **Refresh Data** and **Delete Show** action buttons. Reuse the same `Api.updateShow` / `Api.deleteShow` + `Api.getAllShows` + context update pattern from `SingleShow.tsx` (copy the handlers; there is no shared utility to extract from).

---

## Files to Modify

### `apps/ui/src/pages/AllShows.tsx`

1. Add localStorage read on initial render (lazy state initialiser):
   - Key: `'showsViewMode'`, valid values: `'card'` | `'table'`, default: `'card'`.
   - On invalid/missing value, default to `'card'`.
2. Add `useState<'card' | 'table'>` initialised from localStorage.
3. On toggle change, write new value to localStorage and update state.
4. Add a MUI `ToggleButtonGroup` (two `ToggleButton`s with `GridViewIcon` / `TableRowsIcon`) positioned above the list — a small `Box` with `display: flex; justifyContent: flex-end; p: 1` wrapping the toggle.
5. Conditionally render:
   - `'card'` → existing `Box` grid of `SingleShow` cards (unchanged).
   - `'table'` → `<ShowsTable tvShows={tvShows} />`.

---

## Sorting Logic Detail

Inside `ShowsTable`, derive a `sortedShows` array from `tvShows` before rendering:

```
sortedShows = [...tvShows].sort((a, b) => {
  const valA = a[sortCol] ?? null;
  const valB = b[sortCol] ?? null;
  if (valA === null && valB === null) return 0;
  if (valA === null) return sortDir === 'asc' ? 1 : -1;
  if (valB === null) return sortDir === 'asc' ? -1 : 1;
  return sortDir === 'asc'
    ? String(valA).localeCompare(String(valB))
    : String(valB).localeCompare(String(valA));
});
```

Date strings (`nextEpisode`, `prevEpisode`) are ISO format and sort correctly via `localeCompare`.

---

## Tests

The spec's test cases are all UI-side concerns (localStorage, sort logic, state). The existing `apps/api/tests/` suite is backend-only with no UI test runner configured.

**Action:** Add a Vitest config for the UI package and create `apps/ui/tests/viewToggle.test.ts`.

Steps:
1. Add `vitest` dev dependency to `apps/ui` if not present, and add a `vitest.config.ts` (jsdom environment) — or add `test` config to the existing `vite.config.ts`.
2. Create `apps/ui/tests/viewToggle.test.ts` covering:
   - **localStorage round-trip**: write `'table'`, read back and confirm it's `'table'`; write an invalid value, confirm default is `'card'`.
   - **Sort by title ascending/descending**: given a fixed `ShowData[]`, confirm output order.
   - **Sort by nextEpisode with nulls**: confirm nulls always land last (asc) / first (desc).
   - **View switch preserves data**: toggling sort col/dir does not mutate the original `tvShows` array (tests that sort uses a copy).

   Because `ShowsTable` sorts inline, extract the sort comparator into a small pure function (`utils/sortShows.ts`) so it can be tested without mounting React components. Import it in both `ShowsTable.tsx` and the test file.

---

## New Utility File

### `apps/ui/src/utils/sortShows.ts`
Exports one pure function:
```ts
export function sortShows(shows: ShowData[], col: keyof ShowData, dir: 'asc' | 'desc'): ShowData[]
```
Used by `ShowsTable.tsx` and directly imported in tests.

---

## Verification

1. `pnpm dev` — open `/dashboard`, confirm toggle buttons appear and switching views works.
2. Reload page — confirm chosen view is remembered.
3. In table view: click each column header twice, confirm order reverses and null values stay at the bottom/top correctly.
4. Refresh Data and Delete Show buttons in table view — confirm they work identically to card view.
5. `pnpm --filter @tv-tracker/ui test` — all new tests pass.
6. `pnpm --filter @tv-tracker/api test` — existing backend tests unaffected.
7. `pnpm lint` — no new lint errors.
