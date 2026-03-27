# Plan: OneShow Error Handling and Param Guard Fixes

## Context

Two small bugs in `apps/ui/src/pages/OneShow.tsx`:

1. **#5 — Silent API failure**: `retrieveTvShow` only handles thrown errors in `catch`. If `getOneShow()` returns `{ success: false }` (e.g., 404), `setError`/`showAlert` are never called. The user sees a silent "Show not found" with no alert.
2. **#6 — Missing `showID` guard**: `deleteOneShow` only guards on `tvShow`. `showID` from `useParams()` is `string | undefined` — the callback should guard on it too. (`refreshData` at line 43 already has `showID` in its guard.)

## Changes

### `apps/ui/src/pages/OneShow.tsx`

**Fix #5** — Replace the `if (response.success && response.data) setTvShow(response.data)` one-liner with an if/else:

```ts
if (response.success && response.data) {
  setTvShow(response.data);
} else {
  const msg = response.error ?? 'Failed to retrieve TV Show';
  setError(msg);
  showAlert('danger', msg);
}
```

**Fix #6** — Add `showID` to the `deleteOneShow` guard (line ~49):

```ts
const deleteOneShow = () => {
  if (tvShow && showID) {
    deleteShow(String(tvShow.showId), tvShow.title, () => navigate('/'));
  }
};
```

## Files to Modify

- `apps/ui/src/pages/OneShow.tsx` — 2 edits

## Verification

1. `pnpm build` — must pass with no type errors.
2. Manual test: navigate to a show detail for an invalid/deleted show ID → danger alert should fire, error state renders.
3. Existing UI tests must continue to pass.
