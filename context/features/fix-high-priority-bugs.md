# Plan: Fix High Priority Bugs

## Context

Four bugs in the UI were identified in the backlog. Three involve putting the entire `useAlert()` return object in a `useEffect` dependency array — since the object reference is new on every render, this causes the effect to fire on every render (infinite loop). The fourth is a React key stability bug using array index instead of a stable ID.

Note: the spec says `OneShow.tsx` also has the `alertProps` dep bug, but the `useEffect` there already uses `showAlert` in the dep array (already fixed at some point). However, `OneShow.tsx` has a **worse related bug**: it destructures `{ showAlert }` from `useAlert()` but then calls `alertProps.showAlert(...)` in `refreshData` and `deleteOneShow` — `alertProps` is never declared, causing a `ReferenceError` at runtime.

## Changes

### 1. `apps/ui/src/pages/OneShow.tsx`

`alertProps` is undeclared — the component destructures `{ showAlert }` on line 16 but lines 49, 52, 66, 70 call `alertProps.showAlert(...)`.

- Replace all four `alertProps.showAlert(...)` calls with `showAlert(...)`.
- No dep array change needed (already correct on line 40).

### 2. `apps/ui/src/pages/OneShowSearch.tsx`

- Line 54: change `[alertProps, showID]` → `[alertProps.showAlert, showID]`
- `alertProps` is still used throughout the component body, so keep `const alertProps = useAlert()`.

### 3. `apps/ui/src/pages/SearchResults.tsx`

- Line 41: change `[alertProps, showName]` → `[alertProps.showAlert, showName]`
- Line 131: change `key={index}` → `key={data.show.id}`
- `alertProps` is passed to `<Result>` so keep `const alertProps = useAlert()`.

## Verification

- `pnpm build` — must pass with no errors (the `alertProps` ReferenceError in `OneShow.tsx` would show as a TypeScript error)
- Manual: load `/tvshow/:id`, `/search/show/:id`, `/search/:name` and confirm no console errors or infinite re-render loops
- Confirm React DevTools shows no key-stability warnings on the `SearchResults` list
