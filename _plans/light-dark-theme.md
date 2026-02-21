# Plan: Light and Dark Theme

## Context

The current `theme.ts` defines two placeholder themes that only set `mode: 'dark'` and `mode: 'light'` — everything else falls back to MUI defaults. The `ThemeProvider` and toggle infrastructure already exist and work correctly. This plan fills in the palette and wires up the missing toggle button.

The spec answers the open questions:
- Primary colour: neutral (no brand accent)
- Dark background: MUI recommendation (`#121212`, paper `#1e1e1e`)
- Toggle control: icon button in `NavOffcanvas`

No component in the app uses hardcoded colour values — all use MUI semantic props — so no audit pass is needed.

---

## Files to change

| File | Change |
|---|---|
| `apps/ui/src/utils/theme.ts` | Replace placeholder themes with full palette definitions; rename `theme` → `darkTheme` |
| `apps/ui/src/contexts/theme/ThemeProvider.tsx` | Update import: `theme` → `darkTheme` |
| `apps/ui/src/components/NavOffcanvas.tsx` | Add icon button theme toggle |
| `apps/ui/package.json` | Add `@mui/icons-material` dependency |
| `apps/ui/vite.config.ts` | Add vitest config block |
| `apps/ui/src/tests/ThemeProvider.test.tsx` | New: ThemeProvider unit tests |

---

## Step-by-step implementation

### 1. Add `@mui/icons-material` dependency

Run `pnpm --filter @tv-tracker/ui add @mui/icons-material` to make `Brightness4Icon` (dark mode indicator) and `Brightness7Icon` (light mode indicator) available.

### 2. Define palettes in `theme.ts`

Export two fully specified themes:

**`darkTheme`** (replaces the existing `theme` export, keep old name as alias if needed):
- `palette.mode: 'dark'`
- `palette.background.default: '#121212'`, `palette.background.paper: '#1e1e1e'`
- `palette.primary`: neutral blue-grey (`main: '#90a4ae'`, suitable for dark surfaces)
- `palette.secondary`: muted teal (`main: '#80cbc4'`)
- Standard MUI semantic colours for error/warning/info/success (keep defaults)
- `palette.text.primary: '#ffffff'`, `palette.text.secondary: 'rgba(255,255,255,0.7)'`

**`lightTheme`**:
- `palette.mode: 'light'`
- `palette.background.default: '#fafafa'`, `palette.background.paper: '#ffffff'`
- `palette.primary`: neutral blue-grey (`main: '#546e7a'`, works on light surfaces)
- `palette.secondary`: teal (`main: '#00897b'`)
- Standard MUI semantic colours for error/warning/info/success (keep defaults)
- `palette.text.primary: 'rgba(0,0,0,0.87)'`, `palette.text.secondary: 'rgba(0,0,0,0.6)'`

Both themes share:
- `typography.fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'`
- `shape.borderRadius: 8`

### 3. Update `ThemeProvider.tsx`

Change the import from `{ theme, lightTheme }` to `{ darkTheme, lightTheme }` and update `const currentTheme = mode === 'light' ? lightTheme : darkTheme`.

No other changes needed — localStorage, toggle, and CssBaseline are already correct.

### 4. Add icon toggle to `NavOffcanvas.tsx`

- Import `useTheme` from `'../contexts/theme/ThemeContext'`
- Import `IconButton` from `'@mui/material'`
- Import `Brightness4Icon` and `Brightness7Icon` from `'@mui/icons-material'`
- Destructure `{ mode, toggleTheme }` from `useTheme()`
- Add an `IconButton` to the `AppBar` `Toolbar` (between the title and the Menu button): renders `Brightness7Icon` when mode is `'dark'` (click → go light) and `Brightness4Icon` when mode is `'light'` (click → go dark)
- Add the same toggle inside the `Drawer` below the Logout button for discoverability

### 5. Set up vitest for unit tests

- Add test dependencies to `apps/ui/package.json`: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`
- Add a `test` script: `"test": "vitest"`
- Add vitest config to `vite.config.ts` (or a separate `vitest.config.ts`):
  - `environment: 'jsdom'`
  - `setupFiles: ['./src/tests/setup.ts']`
- Create `apps/ui/src/tests/setup.ts` that imports `@testing-library/jest-dom`

### 6. Write `ThemeProvider.test.tsx`

Located at `apps/ui/src/tests/ThemeProvider.test.tsx`. Tests:

1. Initialises to `'dark'` when localStorage has no `themeMode` value
2. Initialises to `'light'` when localStorage contains `'light'`
3. Initialises to `'dark'` when localStorage contains `'dark'`
4. Falls back to `'dark'` when localStorage contains an unrecognised value (e.g. `'lsu'`)
5. `toggleTheme` switches mode from `'dark'` to `'light'`
6. `toggleTheme` switches mode from `'light'` to `'dark'`
7. After toggling, the new value is written to localStorage

Each test renders a minimal consumer component that reads `mode` from `useTheme()` and asserts on what is displayed.

---

## Reusable existing code

- `useTheme()` hook — `apps/ui/src/contexts/theme/ThemeContext.tsx` — already exported, use as-is in NavOffcanvas
- `toggleTheme` — already implemented in `ThemeProvider.tsx`, no changes needed there beyond the import rename
- `localStorage` read/write logic — already in `ThemeProvider.tsx`, no changes needed

---

## Verification

1. Run `pnpm dev:ui` and visit each page; toggle the theme and confirm all components update immediately
2. Reload the page after toggling; confirm the selected mode is restored
3. Open DevTools → Application → localStorage → confirm `themeMode` is written on toggle
4. Run `pnpm --filter @tv-tracker/ui test` and confirm all 7 ThemeProvider tests pass