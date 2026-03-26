# Spec for Stabilize Show Card Re-renders

Title: Stabilize Show Card Re-renders
Branch: claude/fix/stabilize-show-card-rerenders
Spec file: context/specs/stabilize-show-card-rerenders.md

## Summary

Each `SingleShow` card component instantiates its own `useShowActions()` hook, which subscribes to `ShowContext`. When any show is refreshed or deleted, `updateShow`/`removeShow` causes the context value to change, which re-renders every card in the grid — not just the one that changed. For users with large libraries this causes unnecessary DOM work on every mutation.

The fix is to memoize `SingleShow` so React skips re-rendering cards whose `showData` prop has not changed, and to stabilize the `updateShow`/`removeShow` context functions with `useCallback` so they don't become new references on every render (which would defeat memoization).

## Functional Requirements

- `SingleShow` must only re-render when its own `showData` prop changes.
- A refresh or delete of one card must not trigger re-renders of unrelated cards.
- Per-card `loading` state must still work correctly (spinner shows on the card being acted on, not all cards).
- The fix must not change any visible behavior or UI.

## Possible Edge Cases

- If `showData` is mutated in-place instead of replaced, `React.memo` will miss the change and the card won't update. The context must produce a new object reference for the updated show.
- If `updateShow`/`removeShow` are unstable references, they will be captured in `useCallback` deps inside `useShowActions` and cause cascading re-renders — stabilizing them in `ShowContext` with `useCallback` is a prerequisite.
- `useCallback` deps must be correct; missing deps will cause stale closure bugs on refresh/delete.

## Acceptance Criteria

- Wrapping `SingleShow` in `React.memo` stops sibling cards from re-rendering when one card's data changes.
- `updateShow` and `removeShow` in `ShowContext` (or `ShowProvider`) are wrapped in `useCallback` with correct deps so their references are stable across renders.
- `useShowActions` functions (`refreshShow`, `deleteShow`) are stable via `useCallback`.
- A refresh on card A shows a spinner only on card A; cards B, C, … do not re-render.
- A delete of card A removes only that card; remaining cards do not re-render.
- `pnpm build` passes with no errors.

## Open Questions

- None — the approach is clear from the existing code.

## Testing Guidelines

No new test file is needed (this is a pure render-optimization change with no API or logic changes). Verify manually:
- Trigger a refresh on one card and confirm the spinner appears only on that card.
- Delete a card and confirm the grid updates without visible flicker on unrelated cards.

## Personal Opinion

This is a good, well-scoped fix. The problem is real: every mutation today re-renders the entire grid. The solution — `React.memo` on `SingleShow` plus `useCallback` on context actions — is idiomatic React and low-risk. The scope is small (three files at most: `SingleShow.tsx`, `ShowProvider.tsx`, `useShowActions.ts`) and it directly resolves the backlog item. `useCallback` on context actions also addresses backlog #44, so two items get closed for the price of one.
