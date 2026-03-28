# Plan: Lift Show Actions to ShowContext

## Context

`useShowActions()` is instantiated in every `SingleShow` card, creating N independent `loading` states and N memoized callback closures per render of the AllShows grid. The callbacks are stateless (all data is passed at call time), so N copies serve no purpose. Moving `refreshShow`, `deleteShow`, and per-show loading state into `ShowProvider` means they are created once for the app lifetime. As a bonus, per-show loading (keyed by show ID) allows concurrent card operations and is strictly more correct than the current single-boolean per hook.

Context hierarchy confirms `AlertProvider` wraps `ShowProvider`, so `useAlert()` is valid inside `ShowProvider`.

---

## Implementation Steps

### 1. Extend `ShowContext.tsx`
**File:** `apps/ui/src/contexts/show/ShowContext.tsx`

Add three fields to `ShowProps`:
- `actionLoading: Record<number, boolean>` — per-show loading keyed by numeric show ID
- `refreshShow: (showId: string, title: string, onSuccess?: () => void) => Promise<void>`
- `deleteShow: (showId: string, title: string, onSuccess?: () => void) => Promise<void>`

Leave `loading: boolean` untouched (it is the initial-fetch flag).

---

### 2. Rewrite `ShowProvider.tsx`
**File:** `apps/ui/src/contexts/show/ShowProvider.tsx`

Add:
- `import { useAlert } from '../alert/AlertContext.js'`
- Imports for `updateShow` (API), `deleteShow` (API), `getOneShow` from `../../apis/userRequests.js`, and `logger` from `../../utils/logger.js`
- `const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})`
- `const { showAlert } = useAlert()`

Implement `refreshShow` as `useCallback`:
- Derive `numericId = Number(showId)`
- Set loading: `setActionLoading(prev => ({ ...prev, [numericId]: true }))`
- Call `Api.updateShow(showId)`, then `Api.getOneShow(showId)`
- On success: call `updateShow(response.data)`, `showAlert('success', ...)`, `onSuccess?.()`
- On failure/catch: `showAlert('danger', ...)`
- Finally: `setActionLoading(prev => ({ ...prev, [numericId]: false }))`
- Deps: `[updateShow, showAlert]`

Implement `deleteShow` as `useCallback` with same structural pattern using `Api.deleteShow` and `removeShow`. Deps: `[removeShow, showAlert]`.

Add `actionLoading`, `refreshShow`, `deleteShow` to the context value.

---

### 3. Gut `useShowActions.ts`
**File:** `apps/ui/src/hooks/useShowActions.ts`

Replace the entire implementation with a thin pass-through:
- Import only `useShow` from `../contexts/show/ShowContext.js`
- Body: destructure `{ actionLoading, refreshShow, deleteShow }` from `useShow()` and return them
- Remove all other imports (`useState`, `useCallback`, `Api`, `logger`, `useAlert`)

Keeping the file avoids changing imports in `ShowsTable` and `OneShow`.

---

### 4. Update `SingleShow.tsx`
**File:** `apps/ui/src/components/SingleShow.tsx`

- Change destructuring to `const { actionLoading, refreshShow, deleteShow } = useShowActions()`
- Replace `loading` check with `actionLoading[showData.showId] ?? false` for the spinner conditional

---

### 5. Update `OneShow.tsx`
**File:** `apps/ui/src/pages/OneShow.tsx`

- Change destructuring to `const { actionLoading, refreshShow, deleteShow } = useShowActions()` (drop the `loading:` alias)
- Derive `const isActionLoading = actionLoading[Number(showID)] ?? false`
- Replace all uses of `actionLoading` (the old boolean) with `isActionLoading`

---

### 6. `ShowsTable.tsx` — no change needed
Already destructures only `{ refreshShow, deleteShow }`, which are still returned from the hook.

---

### 7. Update Tests

**`apps/ui/tests/useShowActions.test.tsx`**
- Remove `vi.mock('../src/contexts/show/ShowContext', ...)` — `ShowProvider` is now the real wrapper under test
- Keep `vi.mock('../src/contexts/alert/AlertContext', ...)` as-is
- Change `renderHook(() => useShowActions())` to use `ShowProvider` as the wrapper
- Update result destructuring from `{ loading, ... }` to `{ actionLoading, ... }`
- Update loading assertions: `actionLoading[showId]` instead of `loading`
- Update context mutation assertions: verify `actionLoading` and `tvShows` state through context rather than a mocked `updateShow`/`removeShow` spy (since those are now internal to `ShowProvider`)

**`apps/ui/tests/allShows.test.tsx`** and **`apps/ui/tests/oneShow.test.tsx`**
- Update `useShowActions` mock from `{ loading: false, ... }` to `{ actionLoading: {}, ... }`
- `actionLoading[anyId] ?? false` resolves to `false` for empty object — identical behavior

---

## Verification

```bash
pnpm --filter @tv-tracker/ui test
pnpm build
```

- All existing card behavior unchanged (spinner appears, buttons hidden during load)
- Concurrent refresh on two different cards shows two independent spinners
- OneShow detail page refresh/delete buttons still disable during action
