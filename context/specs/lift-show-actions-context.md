# Spec for Lift Show Actions to ShowContext

Title: Lift Show Actions to ShowContext
Branch: claude/fix/lift-show-actions-context
Spec file: context/specs/lift-show-actions-context.md

## Summary

`useShowActions()` is instantiated in every `SingleShow` card, creating N independent `loading` states and N memoized callback closures for the card grid. The callbacks themselves are stateless (all arguments are passed at call time), so there is no reason for N copies. Move `refreshShow`, `deleteShow`, and loading tracking into `ShowContext` so they are created once. Per-card loading indicators should be retained by tracking loading state keyed by show ID.

## Functional Requirements

- `refreshShow` and `deleteShow` are defined once (in `ShowProvider`) rather than once per card.
- Loading state is tracked per show ID (`Record<number, boolean>` or equivalent) so individual cards can still show a spinner while their operation is in flight.
- `SingleShow`, `ShowsTable`, and `OneShow` continue to work identically from the user's perspective.
- The `useShowActions` hook file can remain as a thin wrapper that reads from context, or call sites can consume context directly — whichever keeps the change minimal.

## Possible Edge Cases

- Concurrent refresh/delete on different cards must work independently — per-show-ID loading state handles this.
- `OneShow.tsx` uses `loading` as a single boolean (it acts on one show at a time), so the per-ID map still satisfies it via a single ID lookup.
- `ShowsTable.tsx` currently destructures only `refreshShow` and `deleteShow` (ignores loading). No change needed there beyond updating the import if the hook is removed.

## Acceptance Criteria

- The card grid creates exactly one copy of `refreshShow` and `deleteShow`, not one per card.
- Clicking Refresh or Remove on card A shows a spinner on card A only; card B is unaffected.
- `OneShow.tsx` loading indicator still works.
- `pnpm build` passes with no errors.
- Existing `useShowActions` tests pass or are updated to reflect the new structure.

## Open Questions

- None. The approach (lift to context, key loading by show ID) is straightforward.

## Testing Guidelines

- Update or replace existing `useShowActions` tests to cover the context-level logic.
- Test that loading state for show ID 1 is independent of show ID 2 (concurrent operations).
- Test that `refreshShow` success updates the correct show in context.
- Test that `deleteShow` failure leaves the show in context.

## Personal Opinion

Worth doing. The fix is small, the improvement is real (one closure instead of N), and keying loading state by show ID is strictly better than the current per-hook boolean since it also unlocks concurrent card operations. No concerns.
