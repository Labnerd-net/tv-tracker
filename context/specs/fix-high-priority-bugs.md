# Spec for Fix High Priority Bugs

Title: Fix High Priority Bugs
Branch: claude/fix/fix-high-priority-bugs
Spec file: context/specs/fix-high-priority-bugs.md

## Summary

Four bugs in the UI have been identified in the backlog as high or low priority. Three are identical — the entire `useAlert()` return object is placed in a `useEffect` dependency array instead of the specific function needed. Since the object is recreated on every render, this causes the effect to fire infinitely. The fourth is a React key stability issue in a list.

**Bugs being fixed:**
- **[11]** `OneShow.tsx:40` — `alertProps` in `useEffect` deps, causes infinite re-render loop
- **[12]** `OneShowSearch.tsx:54` — same issue
- **[13]** `SearchResults.tsx:41` — same issue
- **[15]** `SearchResults.tsx:131` — array `index` used as `key` for `Result` components instead of stable TVMaze show ID

## Functional Requirements

- In `OneShow.tsx`, `OneShowSearch.tsx`, and `SearchResults.tsx`: destructure `showAlert` from `useAlert()` and use only `showAlert` in `useEffect` dependency arrays.
- In `SearchResults.tsx`: replace `index` with `showData.show.id` (the TVMaze show ID) as the `key` prop on `Result` components.
- No behavior changes — only fix the incorrect dependency arrays and key props.

## Possible Edge Cases

- `showData.show.id` could theoretically be `undefined` if TVMaze returns malformed data. In practice this is safe since TVMaze always provides a numeric ID, but worth noting.

## Acceptance Criteria

- `useEffect` in all three pages no longer fires on every render — only fires when its actual dependencies change.
- React does not log key-stability warnings for the `Result` list in `SearchResults.tsx`.
- No visible behavior change from the user's perspective.

## Open Questions

- None — the fixes are straightforward and well-defined.

## Testing Guidelines

These are pure React dependency/key correctness fixes with no new logic. No new test files are needed. Manual verification is sufficient:
- Load the `OneShow`, `OneShowSearch`, and `SearchResults` pages and confirm no infinite re-render loops in the React DevTools profiler or console.
- Confirm the `SearchResults` list renders correctly and React does not warn about duplicate or unstable keys.

## Personal Opinion

These are clear-cut bugs. The `alertProps` issue (#11–13) is the most impactful — an infinite effect loop is a real runtime problem even if the user doesn't notice it directly (wasted renders, potential cascading state issues). The key fix (#15) is a minor but correct improvement. All four are low-risk, minimal-touch changes. Good idea to fix them.
