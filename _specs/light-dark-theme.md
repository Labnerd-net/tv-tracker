# Spec for light-dark-theme

branch: claude/feature/light-dark-theme

## Summary

Define a cohesive light and dark colour palette and apply it consistently across all pages and components in the frontend. The user can toggle between modes at runtime and their preference is persisted across sessions.

## Functional Requirements

- The app ships with two fully defined MUI themes: one light, one dark.
- Both themes share the same typography scale, border radius, and spacing baseline, differing only in palette values.
- Each theme defines colours for: primary, secondary, background (default and paper), text (primary and secondary), error, warning, success, and info.
- The `ThemeContext` exposes the current mode and a `toggleTheme` function to all components.
- The `ThemeProvider` reads the saved mode from `localStorage` on mount and defaults to dark if nothing is stored.
- When the user toggles the theme the new mode is immediately applied to all components without a page reload and written to `localStorage`.
- A theme toggle control is added to `NavOffcanvas` so the user can switch modes from any page.
- All existing pages (Splash, Login, Registration, AllShows/Dashboard, OneShow, OneShowSearch, SearchResults) and shared components render correctly in both modes with no hardcoded colour values.

## Possible Edge Cases

- A `localStorage` value from an old session that is not `'light'` or `'dark'` should fall back to the dark default rather than crashing.
- Components that previously used inline `style` colour values or non-theme MUI `sx` colour strings will not automatically pick up the new palette and must be audited.
- The `NavOffcanvas` is rendered on auth pages (Login, Registration) where the user is not yet logged in; the toggle must work without requiring an authenticated context.

## Acceptance Criteria

- `apps/ui/src/utils/theme.ts` exports a `lightTheme` and a `darkTheme`, each created with `createTheme` and a complete palette definition.
- `ThemeProvider` applies `lightTheme` when mode is `'light'` and `darkTheme` when mode is `'dark'`.
- The mode stored in `localStorage` under `themeMode` is restored correctly on page load.
- Toggling the theme in one browser tab takes effect immediately in the UI.
- Every page and component in the app displays without colour contrast failures in both modes.
- No component contains a hardcoded hex, rgb, or named CSS colour that bypasses the MUI theme.

## Open Questions

- Is there a specific brand/accent colour to use for the primary palette, or should a sensible neutral default be chosen for now? - Just a newutral for now
- Should the dark background use true black (`#000000`) or the Material Design recommended dark surface (`#121212`)? - use the mui recommendation
- Should the toggle in `NavOffcanvas` be an icon button, a labelled button, or a switch component? - an icon button

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- `ThemeProvider` initialises to `'dark'` when `localStorage` has no stored value.
- `ThemeProvider` initialises to the stored value when `localStorage` contains `'light'` or `'dark'`.
- `ThemeProvider` falls back to `'dark'` when `localStorage` contains an unrecognised value.
- Calling `toggleTheme` switches the mode from `'dark'` to `'light'` and vice versa.
- After toggling, the new mode is written to `localStorage`.

## Personal Opinion

This is a straightforward and worthwhile change. The current theme definitions are placeholder stubs (`mode: 'dark'` and `mode: 'light'` with no further customisation), so everything in the app is relying on MUI defaults. Defining a real palette now will make every subsequent UI feature easier to build consistently.

The main risk is the audit pass — any component with a hardcoded colour will look broken in one of the two modes, and that only becomes visible by manually checking every page. Keep the palette conservative (avoid highly saturated accent colours) so the default output is acceptable even before a formal design review.

Complexity is low to moderate. The core theme wiring is already in place; this is mostly filling in palette values and adding the toggle control.
