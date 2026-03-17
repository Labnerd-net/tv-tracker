# Spec for UI Code Quality Fixes

Title: UI Code Quality Fixes
Branch: claude/fix/ui-code-quality-fixes
Spec file: context/specs/ui-code-quality-fixes.md

## Summary

Four small, self-contained code quality fixes across the UI layer. Each item addresses a distinct problem: broken theme support due to hardcoded colours, a full-page reload caused by a plain `<a>` tag in the navbar, loose `any` typing on a token-refresh queue, and a sort preference that resets on every navigation. None of these require API changes.

## Functional Requirements

- **[26] Replace hardcoded hex with CSS custom properties** — In `SingleShow.tsx`, replace every hardcoded hex colour value with the equivalent CSS custom property (e.g. `var(--amber)`, `var(--cream)`, `var(--accent)`). The affected lines are around 127, 140, and 154. After the fix, toggling between light and dark theme must update those elements correctly.
- **[27] Replace `<a href>` with `<Link>` in Navbar** — In `Navbar.tsx` line 35, replace `<Box component="a" href="/dashboard">` with a `react-router` `<Link>` component so the logo navigates client-side without a full page reload.
- **[28] Type `refreshQueue` entries properly** — In `requests.ts` lines 16–17, replace the `any` type on `refreshQueue` entries with an explicit type: `{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }`.
- **[29] Persist sort preference to localStorage** — In `ShowsTable.tsx` lines 55–56, save the active sort key and direction to `localStorage` on change (similar to how view mode is persisted) and read them back as the initial state on mount.

## Possible Edge Cases

- **[26]** Some custom properties may not be defined for both themes — verify each `var()` resolves in both light and dark mode before replacing.
- **[27]** The `<Link>` component needs to be imported from `react-router`; confirm the existing router version uses `react-router` (not `react-router-dom`) to match the rest of the codebase.
- **[28]** The typed queue must still satisfy any call-sites that call `.resolve()` or `.reject()` — check all usages before narrowing.
- **[29]** If `localStorage` contains a stale sort key that no longer maps to a valid column, the table should fall back to the default sort rather than crashing.

## Acceptance Criteria

- `SingleShow.tsx` contains no hardcoded hex colour strings; toggling the theme changes those elements visually.
- Clicking the Navbar logo does not trigger a full page reload (verify with browser devtools Network tab — no full document request).
- `refreshQueue` in `requests.ts` has no `any` types; the file compiles cleanly under `tsc --noEmit`.
- Sort preference survives a hard page refresh on the dashboard — the table opens with the previously selected sort column and direction.
- `pnpm build` passes with zero errors and zero new lint warnings.

## Open Questions

- None — all four items are straightforward and fully specified in the backlog.

## Testing Guidelines

No new test files are needed for these changes (they are UI-only or type-only fixes). Verify the following manually or via existing build checks:

- `pnpm build` passes cleanly.
- `pnpm lint` reports no new errors.
- Light/dark toggle visually updates the formerly hardcoded colour elements in `SingleShow`.
- Navbar logo click does not reload the page.
- Sort preference persists across a page refresh.

## Personal Opinion

These are all good, low-risk fixes worth doing together since they're each tiny. The hardcoded hex fix ([26]) is the most impactful — it's an actual functional bug (theme toggle is broken for those elements). The `<a>` tag ([27]) and `any` type ([28]) are straightforward correctness issues. The localStorage sort persistence ([29]) is a minor UX improvement but consistent with the existing pattern already used for view mode.

No concerns — batch these in one commit and move on.
