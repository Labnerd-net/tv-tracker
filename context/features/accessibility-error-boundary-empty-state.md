# Plan: Accessibility, Error Boundary, and Empty State Fixes

## Context

Three grouped improvements from the backlog (#14, #15, #28):
- Interactive `<Box onClick>` elements lack semantic roles/keyboard access
- No error boundary — a thrown render error blanks the entire app
- Empty state on AllShows has no actionable CTA for new users

---

## Files to Change

| File | Change |
|------|--------|
| `apps/ui/src/components/ShowCard.tsx` | Add `role="button"`, `tabIndex={0}`, `onKeyDown` to card-variant Box |
| `apps/ui/src/pages/OneShow.tsx` | Add `aria-label="Go back"` to back button Box |
| `apps/ui/src/components/ShowsTable.tsx` | Add `aria-label` (with show title) to Refresh and Remove buttons |
| `apps/ui/src/components/ErrorBoundary.tsx` | **Create new** — class component, fallback UI with reload button |
| `apps/ui/src/App.tsx` | Wrap `<AppContent />` with `<ErrorBoundary>` |
| `apps/ui/src/pages/AllShows.tsx` | Replace empty-state subtitle Box with a `<Link>` to `/search/` |

---

## Implementation Steps

### 1. ShowCard.tsx — keyboard accessibility

The card-variant outer `<Box onClick={onClick}>` (line 38) needs:
- `role="button"`
- `tabIndex={0}`
- `onKeyDown` handler: fire `onClick()` on Enter or Space only

Only the card variant needs this — the list variant already uses `<Link>` via `titleHref`.

### 2. OneShow.tsx — back button aria-label

The `<Box component="button">` back button (line 120) has no `aria-label`. Add `aria-label="Go back"`. The visible text "← All Shows" is present so this is supplementary.

### 3. ShowsTable.tsx — action button aria-labels

Both buttons in the actions cell (lines 144–150) render inside `row.map()` so `show.title` is in scope. Add:
- Refresh: `aria-label={`Refresh ${show.title}`}`
- Remove: `aria-label={`Remove ${show.title}`}`

### 4. ErrorBoundary.tsx — new component

Create `apps/ui/src/components/ErrorBoundary.tsx` as a class component:
- State: `{ hasError: boolean }`
- `static getDerivedStateFromError()` → sets `hasError: true`
- `componentDidCatch()` → `console.error(error, info)`
- Fallback UI: centered Box styled with CSS custom properties (`--bg`, `--surface`, `--cream`, `--accent`), sharp corners, Space Mono font. Include heading "Something went wrong" and a `<button>` that calls `window.location.reload()`.
- Default export.

### 5. App.tsx — wrap AppContent

Import `ErrorBoundary` and wrap `<AppContent />`:
```tsx
<ErrorBoundary>
  <AppContent />
</ErrorBoundary>
```
This sits inside all providers so it can't catch provider init errors, but it catches all page-level throws, which is the target.

### 6. AllShows.tsx — empty state CTA

The subtitle Box currently reads "Use search to find and add shows" (plain text). Replace it with a React Router `<Link to="/search/">` styled to match the existing button patterns (Space Mono, `var(--accent)` color, no underline or with tasteful underline on hover). Keep all surrounding layout/styling unchanged.

---

## Testing

- Run `pnpm build` — must be clean.
- Run `pnpm --filter @tv-tracker/api test` — all API tests must pass.
- Manual checks:
  - Tab to a ShowCard and press Enter/Space — should navigate to the show detail page.
  - Tab to the back button on OneShow — screen reader should announce "Go back button".
  - Inspect ShowsTable refresh/remove buttons in DevTools — aria-label should include show title.
  - Temporarily throw inside a page component, confirm fallback UI renders.
  - Navigate to `/dashboard` with no shows — confirm CTA link to search is present and clickable.

### New Tests (RTL)

Add to existing `apps/ui/src/` test suite (or create `errorBoundary.test.tsx`):
- Render a throwing child inside `<ErrorBoundary>` — assert fallback text is shown.
- AllShows: assert search CTA link renders when `tvShows=[]` and `loading=false`; assert it is absent while `loading=true`.
