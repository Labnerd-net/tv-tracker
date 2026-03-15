# Spec for navbar-refactor

branch: claude/feature/navbar-refactor

## Summary

Replace the current `NavOffcanvas` component — which uses an AppBar plus a slide-out Drawer — with a traditional persistent navbar. The new navbar will display the app title, a search bar, and login/logout controls inline. Sort controls and the table/card view toggle are removed from the navbar entirely and deferred to a later implementation.

## Functional Requirements

- The offcanvas Drawer and its toggle button are removed.
- The navbar is always visible as a sticky top AppBar.
- The app title ("TV Show Tracker") remains on the left as a link to `/dashboard`.
- The theme toggle icon button is retained in the navbar.
- A search input and submit button are embedded directly in the navbar, visible at all times on authenticated pages.
- Logged-in users see a Logout button in the navbar.
- Unauthenticated users (Splash, Login, Registration pages) see a Login button in the navbar that navigates to `/login`.
- The sort-by controls (Sort by Show Title, Platform, Status, Previous Episode) are removed with no replacement for now.
- The view toggle (card/table view) is removed with no replacement for now. The existing view state and context can be left in place; only the UI control is removed.
- The navbar renders without errors on both authenticated and unauthenticated routes.

## Possible Edge Cases

- The `TvShowContext` and `ViewContext` are still consumed by other parts of the app; removing the sort and view UI must not break context initialisation or other consumers.
- On small viewports the inline search bar may be too wide; a minimum viable responsive layout should be considered (e.g. the search bar takes remaining space via `flexGrow`).
- The logout button must only render when the user is authenticated; rendering it on public routes should not cause errors even if `AuthContext` is accessible everywhere.

## Acceptance Criteria

- `NavOffcanvas.tsx` is replaced (or rewritten in place) as a traditional navbar with no Drawer.
- The search bar submits on Enter or clicking the search button and navigates to `/search/:query`.
- Authenticated users see a Logout button; unauthenticated users see a Login button.
- The theme toggle icon button remains functional.
- Sort controls and view toggle controls are absent from the UI.
- The app builds and runs without TypeScript or runtime errors on all existing routes.
- The navbar displays correctly in both light and dark modes.

## Open Questions

- Should the search bar be hidden entirely on unauthenticated pages (Splash, Login, Registration), or shown but inactive? - remove the search bar entirely on unauthenticated pages
- Should the Login button on unauthenticated pages be a simple text button or a contained/outlined variant to draw attention? - I guess a simple button for now
- Is the component to be renamed from `NavOffcanvas` to something like `Navbar`, or kept as-is to avoid refactoring imports? - rename to Navbar

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The search form navigates to the correct route when submitted.
- The Logout button is visible when the user is authenticated and calls the logout handler on click.
- The Login button is visible when the user is not authenticated.
- The theme toggle button is present and calls `toggleTheme` on click.
- The sort and view controls are not present in the rendered output.

## Personal Opinion

This is a straightforward and worthwhile simplification. The offcanvas pattern was overloaded — it mixed navigation, search, sorting, and view switching into one side panel, which is harder to discover and adds interaction overhead for common actions like searching. A persistent navbar is the right call for an app of this scale.

Removing sort and view controls from the navbar is also correct. Those belong closer to the content they affect (e.g. as controls above the show list on the dashboard), not in a global nav. Deferring them avoids designing them into the wrong place now.

The main concern is the open question around the search bar on unauthenticated pages — showing a search bar on the Login page is slightly odd, so it is worth clarifying before implementing. Complexity is low; this is mostly a structural rearrangement of existing code.
