# Plan: UI Code Quality Fixes

## Fix [26] — SingleShow.tsx: Replace hardcoded hex colors with CSS custom properties

1. Open `apps/ui/src/components/SingleShow.tsx`.
2. Line 98: `'#e8e0d0'` → `'var(--cream)'`
3. Line 111: `'#5a5248'` → `'var(--cream-muted)'`
4. Line 125: `'#f2a65a'` → `'var(--amber)'`, `'#7a7266'` → `'var(--cream-muted)'`
5. Line 148: `'#a09688'` → `'var(--cream-dim)'`
6. Lines 168/190 hover states: `'#e8e0d0'` → `'var(--cream)'`, `'#e63946'` → `'var(--accent)'`
7. Leave all `rgba()` values untouched (not hex strings; scrim stays dark regardless of theme).

---

## Fix [27] — Navbar.tsx: Replace anchor tag with React Router Link

1. Open `apps/ui/src/components/Navbar.tsx`.
2. Add `Link` to the named imports from `react-router` on line 2 (alongside `useNavigate`).
3. Lines 33–44: change `component="a"` → `component={Link}` and `href="/dashboard"` → `to="/dashboard"`.

---

## Fix [28] — requests.ts: Remove `any` in refreshQueue type

1. Open `apps/ui/src/utils/requests.ts`.
2. Delete line 16 (the `eslint-disable-next-line` comment).
3. Line 17: change `(value: any) => void` → `(value: unknown) => void`.

---

## Fix [29] — ShowsTable.tsx: Persist sort state to localStorage

1. Open `apps/ui/src/components/ShowsTable.tsx`.
2. Add a `VALID_SORT_COLS` constant: the array of valid `keyof ShowData` column keys from `COLUMNS` (`title`, `platform`, `status`, `scheduleDay`, `scheduleTime`, `nextEpisode`, `prevEpisode`).
3. Replace `sortCol` `useState` initializer: read `localStorage.getItem('tv-sort-col')`, validate against `VALID_SORT_COLS`, fall back to `'title'`.
4. Replace `sortDir` `useState` initializer: read `localStorage.getItem('tv-sort-dir')`, validate it is `'asc'` or `'desc'`, fall back to `'asc'`.
5. Add a `useEffect` depending on `[sortCol, sortDir]` that writes both to `localStorage`. Leave `handleSort` unchanged.

---

## Verification

1. `pnpm lint` — zero errors; confirm removing the eslint-disable comment in [28] doesn't introduce a new error.
2. `pnpm build` — exits cleanly with no TypeScript errors.
3. Fix any errors found; do not touch unrelated code.
