# Plan: TVMaze Client-Side Image URL Validation

## Overview

Four touch-points in dependency order: (1) add shared utility function, (2) update two UI components, (3) add tests, (4) verify build.

---

## Step 1 — Add `sanitizeTvMazeImageUrl` to shared utils

**File:** `apps/shared/utils/tvmaze.ts`

Add a new exported function `sanitizeTvMazeImageUrl(url: string | null | undefined): string` below `getPlatformName`.

Logic:
1. Return `''` immediately when falsy (covers `null`, `undefined`, empty string).
2. Wrap `new URL(url)` in try/catch.
3. Check `parsed.protocol !== 'https:'` OR `parsed.hostname !== 'static.tvmaze.com'` — return `''` if either fails.
4. Return the original `url` if both checks pass.
5. Return `''` in catch (malformed URL).

No logger — shared package has no logger dependency.

Accepts `string | null | undefined` (wider than the private API method) because UI callers use optional chains typed as `string | undefined`.

---

## Step 2 — Update `OneShowSearch.tsx`

**File:** `apps/ui/src/pages/OneShowSearch.tsx`

**2a.** Extend the existing `@shared/utils/tvmaze` import to also import `sanitizeTvMazeImageUrl`.

**2b.** Blurred hero image (line ~104–121): compute `const heroSrc = sanitizeTvMazeImageUrl(tvShow.image?.medium)` before the return, then use `{heroSrc && ...}` as the conditional and `src={heroSrc}` as the prop.

**2c.** Poster image (line ~178): change `src={tvShow.image?.medium ?? PLACEHOLDER}` to `src={sanitizeTvMazeImageUrl(tvShow.image?.medium) || PLACEHOLDER}`.

---

## Step 3 — Update `Result.tsx`

**File:** `apps/ui/src/components/Result.tsx`

**3a.** Extend the existing `@shared/utils/tvmaze` import to also import `sanitizeTvMazeImageUrl`.

**3b.** Change `image={showData.show.image?.medium ?? ''}` to `image={sanitizeTvMazeImageUrl(showData.show.image?.medium)}`.

---

## Step 4 — Add test file

**File:** `apps/api/tests/shared-tvmaze-utils.test.ts`

Import `sanitizeTvMazeImageUrl` from `@shared/utils/tvmaze.js` (`.js` extension per API convention). Use one `describe` block with seven `it` cases:

| Case | Input | Expected |
|---|---|---|
| Valid HTTPS static.tvmaze.com URL | `'https://static.tvmaze.com/uploads/images/medium_portrait/0/1.jpg'` | same string |
| HTTP URL | `'http://static.tvmaze.com/img.jpg'` | `''` |
| Wrong hostname | `'https://evil.example.com/img.jpg'` | `''` |
| Subdomain of static.tvmaze.com | `'https://sub.static.tvmaze.com/img.jpg'` | `''` |
| `null` | `null` | `''` |
| `undefined` | `undefined` | `''` |
| Empty string | `''` | `''` |

No mocking needed — function is pure and synchronous.

---

## Step 5 — Verify build

Run `pnpm build` from repo root. Confirms shared function is properly typed, both UI components compile cleanly, API still builds.

Also run `pnpm --filter @tv-tracker/api test` to confirm all tests pass.

---

## Key Notes

- UI imports from `@shared` use no file extension; API/test imports use `.js` extension.
- Subdomain test ensures exact hostname equality check is not accidentally relaxed later.
- The `|| PLACEHOLDER` pattern in `OneShowSearch.tsx` is correct because the sanitizer returns `''` (falsy) for all rejection cases.
