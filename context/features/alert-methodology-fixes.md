# Plan: Alert Methodology Fixes

## Context

The `AlertProvider` / `useAlert` system has two bugs:
1. **Race condition**: `showAlert` starts a `setTimeout` but never cancels a previous one. If a second alert fires within 5 seconds of the first, the first timer fires mid-display and hides the second alert early.
2. **Leaky API**: callers must make three ordered calls (`setAlertVariant`, `setAlertMessage`, `showAlert`) every time. The setters are implementation details that shouldn't be part of the public interface.

The fix is to collapse the API to a single `showAlert(variant, message)` call and use a ref to cancel stale timers.

---

## Files to Change

| File | Change |
|------|--------|
| `apps/ui/src/contexts/alert/AlertContext.tsx` | Remove `setAlertVariant` / `setAlertMessage` from interface; change `showAlert` signature to `(variant: string, message: string) => void` |
| `apps/ui/src/contexts/alert/AlertProvider.tsx` | Implement timer cancellation via `useRef`; absorb variant/message setting into `showAlert`; add `useEffect` cleanup |
| `apps/ui/src/pages/AllShows.tsx` | Update call site + `useEffect` dependency array |
| `apps/ui/src/pages/OneShow.tsx` | Update call sites |
| `apps/ui/src/pages/OneShowSearch.tsx` | Update call sites |
| `apps/ui/src/pages/SearchResults.tsx` | Update call sites |
| `apps/ui/src/components/ShowsTable.tsx` | Update call sites |
| `apps/ui/src/components/SingleShow.tsx` | Update call sites |
| `apps/ui/src/components/Result.tsx` | Update call sites; `alertProps` prop type will update automatically |

---

## Implementation Steps

### 1. Update `AlertContext.tsx`

Change the `AlertProps` interface:
- Remove `setAlertVariant` and `setAlertMessage`
- Change `showAlert: () => void` → `showAlert: (variant: string, message: string) => void`
- Keep `visibleAlert`, `alertVariant`, `alertMessage` as read-only (AppContent still needs them to pass to AppAlert)

### 2. Update `AlertProvider.tsx`

- Add `const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)`
- Rewrite `showAlert` to:
  - Accept `(variant: string, message: string)`
  - Call `setAlertVariant(variant)` and `setAlertMessage(message)` internally
  - Clear `timerRef.current` before starting a new timer
  - Store the new timer ID in `timerRef.current`
- Add a `useEffect` with no deps (runs once) that returns a cleanup: `() => { if (timerRef.current) clearTimeout(timerRef.current) }` — prevents state updates on unmount
- Remove `setAlertVariant` and `setAlertMessage` from the Provider `value` prop

### 3. Update all call sites

Replace every 3-call block:
```
setAlertVariant('success')
setAlertMessage('...')
showAlert()
```
with a single call:
```
showAlert('success', '...')
```

**AllShows.tsx** — also update the destructure on line 21 (remove `setAlertVariant`, `setAlertMessage`) and the `useEffect` dependency array on line 37 (remove those two).

**Result.tsx** — receives `alertProps` as a prop typed as `AlertProps` from the context. No prop type change needed beyond what flows automatically from the interface update.

---

## Verification

- `pnpm build:ui` — must complete with no TypeScript errors (the interface change will surface any missed call sites at compile time)
- Manual test: trigger two alerts in quick succession (e.g. rapidly click refresh on a show) and confirm the second alert stays visible for a full 5 seconds
- `pnpm --filter @tv-tracker/api test` — no backend tests are affected, but run to confirm nothing regressed
