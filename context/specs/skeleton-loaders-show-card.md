# Spec for Skeleton Loaders and ShowCard Extraction

Title: Skeleton Loaders and ShowCard Extraction
Branch: claude/feature/skeleton-loaders-show-card
Spec file: context/specs/skeleton-loaders-show-card.md

## Summary

Two related UI improvements: replace bare `CircularProgress` spinners with MUI `Skeleton` loading placeholders on the card grid and show detail page (backlog #26), and extract a shared `ShowCard.tsx` base component from the duplicated markup in `SingleShow.tsx` and `Result.tsx` (backlog #29). The extraction is a prerequisite for adding the skeleton to the card, so the two items are done in sequence.

## Functional Requirements

- Replace `CircularProgress` on the dashboard card grid (`AllShows.tsx`) with `Skeleton` placeholders that match the card dimensions while shows are loading.
- Replace `CircularProgress` on the show detail page (`OneShow.tsx`) with a `Skeleton` placeholder matching the detail layout while data is loading.
- Extract a `ShowCard.tsx` base component that encapsulates the shared card/list-item layout currently duplicated between `SingleShow.tsx` (tracked shows grid) and `Result.tsx` (search results list).
- `SingleShow.tsx` and `Result.tsx` must be refactored to use `ShowCard.tsx`; their existing visual output and behaviour must not change.
- Skeleton shapes should approximate the real content layout (image area, title line, subtitle line) so there is no layout shift when content loads.
- Skeletons must respect the active theme (dark/light) — MUI `Skeleton` uses `--surface` / `--cream` tones automatically via the theme.

## Possible Edge Cases

- `SingleShow.tsx` passes interactive callbacks (refresh, delete) that `Result.tsx` does not; `ShowCard.tsx` must support optional action slots without forcing them on search results.
- `Result.tsx` shows an "Add" button; `ShowCard.tsx` must support an optional footer/action area.
- If `nextEpisode` or `prevEpisode` data is absent, skeleton lines that represent those fields should not appear when content loads — ensure skeleton count matches actual rendered line count.
- The card grid uses `React.memo`; ensure the extracted `ShowCard` is also wrapped or that memo on `SingleShow` is preserved after refactor.
- Search results list may render before TVMaze episode dates resolve; the skeleton for `Result.tsx` should handle both states.

## Acceptance Criteria

- Dashboard card grid shows skeleton placeholders (image block + text lines) while `ShowProvider` is loading; `CircularProgress` is removed from that path.
- Show detail page shows a skeleton layout while data is fetching; `CircularProgress` is removed from that path.
- A `ShowCard.tsx` component exists and is used by both `SingleShow.tsx` and `Result.tsx`.
- No visual regression in either the dashboard grid or search results — layout, spacing, and interactions are identical to before.
- Build passes (`pnpm build`) with no TypeScript errors.

## Open Questions

- Should `OneShowSearch.tsx` (search detail page) also get a skeleton, or only `OneShow.tsx` (tracked show detail)? The backlog says "detail page" generically — confirm scope. - whatever you think is best
- Should a `SkeletonCard.tsx` be a sibling of `ShowCard.tsx`, or should skeleton rendering be a prop/state of `ShowCard.tsx` itself? - whatever you think is best

## Testing Guidelines

No new unit tests are required for this change — it is a pure UI/presentational refactor. Verify manually in the browser:

- Dashboard loads with skeletons visible briefly before show cards appear.
- Show detail page loads with a skeleton before data populates.
- Search results look and behave identically to before.
- Dark/light theme toggle renders skeletons correctly in both modes.

## Personal Opinion

Both changes are straightforward and low-risk. The `ShowCard` extraction (#29) is the right call — the duplication between `SingleShow` and `Result` is real and the shared abstraction is natural. The skeleton work (#26) is a small perceived-performance win that's worth the effort. Doing them together is sensible since the extraction simplifies adding the skeleton to a single place. Neither change is complex. The main risk is the optional-props API for `ShowCard` — keep it simple and avoid over-engineering the slot system.
