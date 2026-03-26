# Plan: Skeleton Loaders and ShowCard Extraction

## Context

Two backlog items tackled together because the ShowCard extraction (#29) is a natural prerequisite for the grid skeleton work (#26). Extracting `ShowCard` first means the skeleton only needs to match one component's shell.

**#26** — Replace `CircularProgress` spinners with MUI `Skeleton` placeholders on the dashboard card grid and both detail pages (`OneShow`, `OneShowSearch`). Currently `ShowProvider` exposes no loading state, so `AllShows` cannot distinguish "fetching" from "no shows".

**#29** — `SingleShow.tsx` (vertical card, overlay text) and `Result.tsx` (horizontal list item) share image display, title/platform/episode typography, and theming conventions but duplicate the markup. Extract a `ShowCard.tsx` base component with a `variant` prop.

---

## Decisions on Open Questions

- **`OneShowSearch.tsx` also gets a skeleton** — both detail pages have identical loading patterns and should feel consistent.
- **Skeleton is a separate sibling component** (`ShowCardSkeleton.tsx`, `ShowDetailSkeleton.tsx`) — keeping it out of `ShowCard` avoids cluttering the live component's API with loading-state props.

---

## Implementation Plan

### Step 1 — Expose `loading` from `ShowProvider`

**Files:** `apps/ui/src/contexts/show/ShowContext.tsx`, `apps/ui/src/contexts/show/ShowProvider.tsx`

- Add `loading: boolean` to the `ShowProps` interface in `ShowContext.tsx`.
- In `ShowProvider.tsx`:
  - Add `const [loading, setLoading] = useState(true)`.
  - Set `loading = false` after `fetchShows()` resolves (success or not), and also when `!user` short-circuits.
  - Guard: while `isLoading` (auth), keep `loading = true` — don't flip to false until auth resolves.
  - Pass `loading` into the context value.

---

### Step 2 — Create `ShowCard.tsx`

**New file:** `apps/ui/src/components/ShowCard.tsx`

Extract the shared presentational shell. Props:

```
variant: "card" | "list"
image: string
title: string
titleHref?: string           // list variant: makes title a Link
platform: string
episodeInfo?: string
episodeLoading?: boolean     // list variant: inline spinner on episode line
actions?: ReactNode          // action button area (refresh/delete or Add)
onClick?: () => void         // card variant: navigate on card click
index?: number               // staggered animation delay (card variant)
```

- **`variant="card"`**: vertical card with 2:3 aspect ratio, lazy image, gradient scrim, overlay text at bottom, hover-reveal for `actions` — mirrors current `SingleShow` visual structure (without hook logic).
- **`variant="list"`**: horizontal flex row, 48×68 thumbnail left, info center, `actions` right — mirrors current `Result` visual structure.
- Both variants use existing CSS vars (`--bg`, `--surface`, `--accent`, `--cream`, etc.) and Space Mono / Cormorant Garamond fonts.
- Preserve `loading="lazy" decoding="async"` on `<img>`.
- Preserve image fallback (grey box) when `image` is empty.
- Preserve `fadeInUp` animation (import or re-declare the keyframe).

---

### Step 3 — Refactor `SingleShow.tsx` to use `ShowCard`

**File:** `apps/ui/src/components/SingleShow.tsx`

- Keep: `React.memo`, `useShowActions` hook, `useNavigate`, animation index logic.
- Replace the JSX render tree with `<ShowCard variant="card" ... />`.
- Pass refresh/delete icon buttons (with `CircularProgress` fallback) as the `actions` prop.
- `onClick` navigates to `/tvshow/${showData.showId}`.

---

### Step 4 — Refactor `Result.tsx` to use `ShowCard`

**File:** `apps/ui/src/components/Result.tsx`

- Keep: `adding` state, `handleAdd` logic, `alertProps` usage.
- Replace JSX render tree with `<ShowCard variant="list" ... />`.
- Pass the Add button as `actions`.
- Pass `episodeLoading` and `nextEpisodeDate` as `episodeInfo`/`episodeLoading` props.
- Pass `titleHref` to link the title to `/search/show/{id}`.

---

### Step 5 — Create `ShowCardSkeleton.tsx`

**New file:** `apps/ui/src/components/ShowCardSkeleton.tsx`

- Matches the card variant shell: same container sizing as `ShowCard variant="card"`.
- Uses `<Skeleton variant="rectangular" sx={{ aspectRatio: '2/3' }} />` for the image area.
- Text line skeletons at bottom for title (wider), platform (medium), episode (narrower).
- No props needed — pure presentational placeholder.

---

### Step 6 — Create `ShowDetailSkeleton.tsx`

**New file:** `apps/ui/src/components/ShowDetailSkeleton.tsx`

- Mimics `OneShow`/`OneShowSearch` hero + detail card layout:
  - Full-width rectangular skeleton for the hero image band.
  - Overlapping card: rectangular skeleton for poster (left) + text line skeletons for title, platform, status, episode info (right).
- Matches the same outer `Box` wrapper that the `CircularProgress` block currently uses (so no layout shift on the page).

---

### Step 7 — Update `AllShows.tsx`

**File:** `apps/ui/src/pages/AllShows.tsx`

- Destructure `loading` from `useShowContext()`.
- When `loading === true`, render a grid of 8 `<ShowCardSkeleton />` components in place of the `SingleShow` grid.
- Keep the toolbar visible during loading (count shows "—" or is hidden).
- Remove the empty-state copy that currently shows while loading (it will only appear when `loading === false && tvShows.length === 0`).

---

### Step 8 — Update `OneShow.tsx`

**File:** `apps/ui/src/pages/OneShow.tsx`

- Replace the `if (loading) { return <Box>...<CircularProgress /></Box> }` block with `if (loading) { return <ShowDetailSkeleton /> }`.

---

### Step 9 — Update `OneShowSearch.tsx`

**File:** `apps/ui/src/pages/OneShowSearch.tsx`

- Same replacement as Step 8.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/ui/src/contexts/show/ShowContext.tsx` | Add `loading: boolean` |
| `apps/ui/src/contexts/show/ShowProvider.tsx` | Track + expose loading state |
| `apps/ui/src/components/ShowCard.tsx` | **NEW** — shared card/list base |
| `apps/ui/src/components/ShowCardSkeleton.tsx` | **NEW** — grid card placeholder |
| `apps/ui/src/components/ShowDetailSkeleton.tsx` | **NEW** — detail page placeholder |
| `apps/ui/src/components/SingleShow.tsx` | Use `ShowCard variant="card"` |
| `apps/ui/src/components/Result.tsx` | Use `ShowCard variant="list"` |
| `apps/ui/src/pages/AllShows.tsx` | Show skeletons while loading |
| `apps/ui/src/pages/OneShow.tsx` | Replace spinner with `ShowDetailSkeleton` |
| `apps/ui/src/pages/OneShowSearch.tsx` | Replace spinner with `ShowDetailSkeleton` |

---

## Verification

1. `pnpm build` — must pass with zero TypeScript errors.
2. Browser — dashboard shows skeleton cards on first load, transitions to real cards.
3. Browser — `/tvshow/:id` shows skeleton layout before data loads.
4. Browser — `/search/show/:id` shows skeleton layout before data loads.
5. Browser — search results list looks and behaves identically.
6. Browser — dark/light theme toggle renders skeletons correctly in both modes.
7. Browser — refresh/delete actions on `SingleShow` still work (hover, spinner, etc.).
