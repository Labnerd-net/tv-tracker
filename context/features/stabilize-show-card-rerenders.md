# Plan: Stabilize Show Card Re-renders

## Context

Backlog item #10. Each `SingleShow` card calls `useShowActions()` which subscribes to `ShowContext`. When any card is refreshed or deleted, `ShowProvider` replaces the `tvShows` array, creating new function references for `addShow`/`updateShow`/`removeShow` on every render. Because `SingleShow` is not memoized, all N cards re-render on every mutation — not just the changed one.

Fix: stable context functions via `useCallback` + `React.memo` on `SingleShow`. Also closes backlog #44.

---

## Files to Change (3 total)

### 1. `apps/ui/src/contexts/show/ShowProvider.tsx`

Add `useCallback` to the `react` import. Wrap all three mutation functions with `useCallback` and empty dep arrays — all three use the functional-updater form of `setTvShows` (no closure over `tvShows`), so deps are `[]`.

```
addShow  → useCallback(() => setTvShows(prev => [...prev, show]), [])
updateShow → useCallback(() => setTvShows(prev => prev.map(...)), [])
removeShow → useCallback(() => setTvShows(prev => prev.filter(...)), [])
```

### 2. `apps/ui/src/components/SingleShow.tsx`

Add `memo` to the React import. Wrap the default export in `React.memo`:

```ts
export default memo(function SingleShow(...) { ... });
```

No custom comparator needed — `showData` is a plain object; after `updateShow`, only the mutated card gets a new object reference. Default shallow equality (reference comparison) is correct.

### 3. `apps/ui/src/hooks/useShowActions.ts`

Add `useCallback` to the `react` import. Wrap both async functions:

- `refreshShow`: deps `[updateShow, showAlert]`
- `deleteShow`: deps `[removeShow, showAlert]`

`setLoading` is a stable setState dispatch — does not need to be in deps.

---

## Dep Array Reference

| Function | File | deps |
|---|---|---|
| `addShow` | `ShowProvider.tsx` | `[]` |
| `updateShow` | `ShowProvider.tsx` | `[]` |
| `removeShow` | `ShowProvider.tsx` | `[]` |
| `refreshShow` | `useShowActions.ts` | `[updateShow, showAlert]` |
| `deleteShow` | `useShowActions.ts` | `[removeShow, showAlert]` |

---

## Out of Scope

- `ShowsTable`: calls `useShowActions()` once at table level, not per-row — no memoization needed.
- `index` prop on `SingleShow`: cards after a delete will re-render once to shift their animation delay. Acceptable.
- `AllShows.tsx`: no changes — it correctly re-renders whenever `tvShows` changes.

---

## Verification

1. `pnpm build` — no TypeScript errors.
2. Manual: refresh one card → spinner appears only on that card; other cards stay frozen (React DevTools Profiler confirms).
3. Manual: delete a card → only that card disappears; cards before it do not re-render.
