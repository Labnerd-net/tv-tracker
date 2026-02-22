# Spec for view-toggle-card-table

branch: claude/feature/view-toggle-card-table

## Summary
Add a view toggle to the shows list page that lets users switch between the existing card grid layout and a new compact table layout. The table view should support sortable columns so users can order their shows by different fields (e.g. name, status, next airdate).

## Functional Requirements
- A toggle control (e.g. icon buttons) is visible on the shows list page, allowing the user to switch between "Card View" and "Table View".
- The selected view persists across page refreshes (e.g. stored in localStorage).
- The card view is unchanged from its current implementation.
- The table view renders each tracked show as a row with the following columns: Show Name, Status, Network/Platform, Schedule Day, Next Airdate, Previous Airdate.
- Each column header in the table view is clickable to sort ascending/descending by that field.
- A visual indicator (arrow or similar) shows which column is currently sorted and in which direction.
- Sorting is client-side only; no additional API calls are made.
- The table view supports the same show actions (e.g. delete/remove) available in the card view.

## Possible Edge Cases
- Shows with no next or previous airdate should sort consistently (e.g. always last when sorting ascending by date).
- Empty state (no shows tracked) should render correctly in both views.
- Very long show names should not break the table layout.
- If the persisted view preference is corrupted or invalid, fall back to the default card view.

## Acceptance Criteria
- The toggle is visible and functional on the shows list page.
- Switching views does not trigger a data re-fetch.
- The table view renders all tracked shows with the correct fields.
- Clicking a column header sorts the rows by that field; clicking again reverses the sort order.
- The active sort column and direction are clearly indicated.
- The selected view (card or table) is remembered after a page refresh.
- All existing card view functionality remains unaffected.

## Open Questions
- Should the toggle be placed in the page header, inline above the list, or elsewhere? - wherever it makes the most sense
- Should sorting state also persist in localStorage, or reset on each visit? - reset on each visit
- Should the table support multi-column sort or just single-column? - just single
- Are there any columns that should not be sortable? - not that I can think of

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- The view preference is correctly saved to and read from localStorage.
- Sorting by show name (ascending and descending) produces the correct order.
- Sorting by next airdate handles shows with missing airdates consistently.
- Switching between views preserves the current show list data.

## Personal Opinion
This is a good idea. Card views are visually rich but become unwieldy when a user is tracking many shows — a sortable table gives a much faster way to scan and compare. The complexity is moderate: the toggle and table rendering are straightforward, but handling null/missing dates in sort logic and keeping the two views in sync with shared state requires care. No major concerns, but clarifying the persistence scope (view only vs. view + sort state) before implementing will avoid rework.
