# Spec for Accessibility, Error Boundary, and Empty State Fixes

Title: Accessibility, Error Boundary, and Empty State Fixes
Branch: claude/fix/accessibility-error-boundary-empty-state
Spec file: context/specs/accessibility-error-boundary-empty-state.md

## Summary

Three small but meaningful UX/robustness improvements grouped into one fix:

1. **Accessibility (#14)** — Interactive `<Box onClick>` elements are missing semantic roles and keyboard access. `ShowCard.tsx` needs `role="button"` and `tabIndex`. The back button in `OneShow.tsx` and action buttons in `ShowsTable.tsx` need `aria-label` attributes.
2. **Error Boundary (#15)** — No error boundary exists. If any page component throws an unhandled error, the entire app goes blank with no recovery path. A class-based `ErrorBoundary` component should wrap the router in `App.tsx`.
3. **Better Empty State (#28)** — The `AllShows.tsx` empty state (no tracked shows) shows nothing actionable. It should include a CTA linking to the search page so new users are guided to add shows.

## Functional Requirements

### Accessibility
- `ShowCard.tsx`: Add `role="button"` and `tabIndex={0}` to the clickable `<Box>` container. Add `onKeyDown` handler so Enter/Space triggers the click action.
- `OneShow.tsx` back button: Add a descriptive `aria-label` (e.g., `aria-label="Go back"`).
- `ShowsTable.tsx` action buttons (refresh, delete): Add `aria-label` attributes describing each action and which show they target.

### Error Boundary
- Create `ErrorBoundary.tsx` class component in `apps/ui/src/components/`.
- It should catch render/lifecycle errors in its subtree and display a user-friendly fallback UI (styled to match the Broadcast Noir theme) with a "Reload page" button.
- Wrap the router in `App.tsx` with `<ErrorBoundary>`.

### Empty State
- When `AllShows.tsx` renders with no shows and `loading` is false, display an improved empty state.
- Include a heading ("No shows tracked yet" or similar) and a `<Link>` button to the `/search/` route (or a general search entry point) so users can immediately add shows.
- Style consistently with existing theme (no MUI defaults, sharp corners, CSS custom properties).

## Possible Edge Cases

- `ErrorBoundary` must not suppress errors silently — log them via `console.error` so they appear in browser DevTools.
- `ShowCard` keyboard handler: only Enter (key code 13) and Space (key code 32) should trigger the click to avoid hijacking other keyboard interactions.
- Empty state: must not render while loading is still in progress (skeleton loaders should remain visible until loading completes).
- `aria-label` on `ShowsTable` action buttons should include the show title so screen readers can differentiate between multiple rows (e.g., `aria-label="Refresh The Wire"`).

## Acceptance Criteria

- [ ] Clicking `ShowCard` via keyboard (Tab to focus, Enter/Space to activate) navigates correctly.
- [ ] `ShowCard` clickable container has `role="button"` and `tabIndex={0}` visible in the DOM.
- [ ] Back button in `OneShow.tsx` has a non-empty `aria-label`.
- [ ] Refresh and delete buttons in `ShowsTable.tsx` have `aria-label` values that include the show name.
- [ ] `ErrorBoundary` catches a thrown error and renders a fallback UI instead of a blank screen.
- [ ] Fallback UI includes a "Reload page" button that calls `window.location.reload()`.
- [ ] Empty state on `AllShows.tsx` shows a CTA with a working link to the search page when shows array is empty and loading is false.
- [ ] All existing tests pass; build is clean.

## Open Questions

- Should the empty state also surface TVMaze trending shows (backlog #28 mentions this as an option)? That would require a new API call and add complexity. Recommended: start with just the search CTA link — the trending shows idea can be a separate feature.

## Testing Guidelines

Create or extend tests in `apps/api/tests/` or `apps/ui/src/` as appropriate.

- `ErrorBoundary`: render a component that throws inside `<ErrorBoundary>` and assert the fallback UI is shown instead of the throwing component.
- `AllShows` empty state: assert that the search CTA link is rendered when the shows array is empty and loading is false; assert it is NOT rendered while loading.

## Personal Opinion

These are all solid, low-risk fixes with clear value:
- #14 (accessibility) is the right thing to do and the changes are mechanical — no design rethink needed.
- #15 (error boundary) is a one-time addition that prevents a frustrating blank-screen experience. Simple to implement.
- #28 (empty state) is a tiny UX improvement that meaningfully helps new users.

Grouping them makes sense since they're all small and none of them interact with each other. No concerns.
