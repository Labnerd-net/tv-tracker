# Plan: Navbar Refactor

## Context

The current `NavOffcanvas` component mixes navigation, search, sort controls, and view toggling inside a slide-out Drawer. The goal is to replace it with a simple persistent AppBar that keeps only what belongs in a global nav: the title, search (authenticated only), theme toggle, and login/logout. Sort and view controls are deferred.

Answers to open questions from the spec:
- Search bar is **hidden entirely** on unauthenticated pages.
- Login button is a plain `Button` (no variant emphasis).
- Component is **renamed** from `NavOffcanvas` to `Navbar` (file and import updated).

---

## Files to Change

| File | Action |
|------|--------|
| `apps/ui/src/components/NavOffcanvas.tsx` | Rewrite in-place as `Navbar` logic, then rename file to `Navbar.tsx` |
| `apps/ui/src/App.tsx` | Update import path and component name |
| `apps/ui/tests/navbar.test.tsx` | New test file |

No other files need to change. `TvShowContext` and `ViewContext` remain in place for other consumers; only the UI controls in the navbar are removed.

---

## Implementation Steps

### 1. Rewrite `NavOffcanvas.tsx` → `Navbar.tsx`

**Remove entirely:**
- `Drawer`, `navOpen` state, Menu `Button`
- `useContext(TvShowContext)` and all sort logic and sort buttons
- `useContext(ViewContext)` and view toggle buttons
- `Divider` sections

**Keep:**
- `AppBar` + `Toolbar`
- App title link (`Typography` as anchor, left-aligned, `flexGrow: 1`)
- Theme toggle `IconButton` (Brightness4/Brightness7, already working)

**Add / change:**
- Import `useAuth` from `AuthContext`
- Check `user !== null` (from `useAuth`) to determine authenticated state
- If authenticated: render inline search `TextField` + submit `Button` + `Logout` Button
- If not authenticated: render a plain `Login` Button that navigates to `/login`
- `useNavigate` stays for search submission and logout redirect

**Resulting imports (approximate):**
```
useState, useNavigate, AppBar, Toolbar, Box, Button, IconButton,
TextField, Typography, Brightness4Icon, Brightness7Icon,
useAuth, useTheme
```

### 2. Update `App.tsx`

Change:
```ts
import NavOffcanvas from './components/NavOffcanvas.tsx';
// and
<NavOffcanvas />
```
To:
```ts
import Navbar from './components/Navbar.tsx';
// and
<Navbar />
```

### 3. Write `apps/ui/tests/navbar.test.tsx`

Tests need: `BrowserRouter` (for `useNavigate`), a mock `AuthContext`, and `ThemeProvider`.

Use `vi.mock` on `../src/contexts/auth/AuthContext` to control the `useAuth` return value per test.

**Test cases (per spec):**
1. Search form submits and navigates to `/search/:query`
2. Logout button is visible when authenticated; calls logout and navigates to `/login`
3. Login button is visible when not authenticated
4. Theme toggle button is present and calls `toggleTheme`
5. Sort controls are not rendered
6. View controls are not rendered

Test wrapper: `<ThemeProvider><BrowserRouter><Navbar /></BrowserRouter></ThemeProvider>`

---

## Verification

1. `pnpm --filter @tv-tracker/ui test --run` — all tests pass (7 existing + new navbar tests)
2. `pnpm dev:ui` — app loads, AppBar visible on all routes
3. Log out → Login button appears, no search bar
4. Log in → Logout button and search bar appear
5. Search submits → navigates to `/search/:query`
6. Theme toggle still works in both directions
