# Spec for TVMaze Client-Side Image URL Validation

Title: TVMaze Client-Side Image URL Validation
Branch: claude/fix/tvmaze-client-image-url-validation
Spec file: context/specs/tvmaze-client-image-url-validation.md

## Summary

The API already sanitizes TVMaze image URLs via `TvMazeData.sanitizeImageUrl()`, rejecting anything not from `https://static.tvmaze.com`. The client-side search flow skips this validation entirely — `OneShowSearch.tsx` and `Result.tsx` render `tvShow.image?.medium` and `showData.show.image?.medium` directly from raw TVMaze API responses. A malicious response could supply a URL pointing to an attacker-controlled server, leaking the user's IP via image load.

The fix extracts a shared URL validator into `apps/shared/utils/tvmaze.ts` and applies it before rendering image URLs in both affected components.

Closes backlog #1 and #2.

## Functional Requirements

- Extract a `sanitizeTvMazeImageUrl(url: string | null | undefined): string` utility to `apps/shared/utils/tvmaze.ts`. Returns the original URL if it starts with `https://static.tvmaze.com/`, otherwise returns an empty string.
- `OneShowSearch.tsx` must pass the image URL through this validator before rendering.
- `Result.tsx` must pass the image URL through this validator before rendering.
- The validator must be usable on both API and UI sides (lives in `apps/shared/`).

## Possible Edge Cases

- `image` field is `null` or `undefined` — validator should handle gracefully and return empty string.
- URL uses HTTP instead of HTTPS — must be rejected.
- URL uses a subdomain of `static.tvmaze.com` (e.g., `evil.static.tvmaze.com`) — must be rejected; use exact hostname match, not `includes()`.
- URL is an empty string — return empty string.

## Acceptance Criteria

- `sanitizeTvMazeImageUrl('https://static.tvmaze.com/uploads/images/medium_portrait/1/1.jpg')` returns the URL unchanged.
- `sanitizeTvMazeImageUrl('http://static.tvmaze.com/...')` returns `''` (HTTP rejected).
- `sanitizeTvMazeImageUrl('https://evil.static.tvmaze.com/...')` returns `''` (wrong hostname).
- `sanitizeTvMazeImageUrl(null)` and `sanitizeTvMazeImageUrl(undefined)` return `''`.
- `OneShowSearch.tsx` no longer passes a raw TVMaze image URL to `<img src>` without validation.
- `Result.tsx` no longer passes a raw TVMaze image URL to `ShowCard` without validation.
- Build passes with no TypeScript errors.

## Open Questions

- None. The server-side implementation in `TvMazeData.sanitizeImageUrl()` is the reference for correct behavior.

## Testing Guidelines

Add tests to a new `apps/api/tests/shared-tvmaze-utils.test.ts` (or similar) covering:
- Valid `https://static.tvmaze.com/` URL — returns URL unchanged.
- HTTP URL — returns empty string.
- Wrong hostname — returns empty string.
- Subdomain of `static.tvmaze.com` — returns empty string.
- `null` input — returns empty string.
- `undefined` input — returns empty string.
- Empty string input — returns empty string.

## Personal Opinion

This is a straightforward and clearly necessary fix. The server-side protection already exists; the client just needs to use the same rule. Extracting to `apps/shared/` is the right call — it prevents the two code paths from drifting apart again. The change is small and low risk. No concerns.
