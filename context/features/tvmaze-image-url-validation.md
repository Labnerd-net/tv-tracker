# Plan: TVMaze Image URL Validation

## Context

Two backlog security items ([6] and [45]) both relate to `imageLink` URL handling in the API.

- **[6]**: `POST /api/user/tvshow` (body route, `user.ts:81`) accepts a full TVMaze JSON body from the client. `TvMazeData` constructor pulls `imageLink` from `showData.image?.medium` — in this path that value is client-supplied and unvalidated, allowing any URL to be stored in the DB.
- **[45]**: `returnImage()` in `tvmaze.ts:61` fetches `this.imageLink` without hostname validation, inconsistent with the `fetchAirdate()` pattern. However, `returnImage()` is dead code (never called in any route), so the decision is to **remove it** rather than fix it.

Root fix: validate `imageLink` at assignment time inside `TvMazeData` constructor. This covers all paths (body route and server-side routes) in one place. TVMaze images always originate from `https://static.tvmaze.com/`, so this validation will never reject legitimate data.

---

## Changes

### 1. `apps/api/src/tvmaze.ts`

**Validate `imageLink` in the constructor:**
- After `showData.image?.medium ?? ''`, validate the URL:
  - If empty string → keep as `''` (no warning)
  - If non-empty → parse with `new URL()`, check `protocol === 'https:'` and `hostname === 'static.tvmaze.com'`
  - If invalid or parse throws → set to `''` and `logger.warn()`

**Remove `returnImage()` method entirely** (lines 61–70). It is never called.

### 2. `apps/api/tests/tvmaze.test.ts`

Add a new `describe` block: `TvMazeData constructor imageLink validation`

Tests:
- Sets `imageLink` from a valid `https://static.tvmaze.com/...` URL
- Clears `imageLink` to `''` for a non-TVMaze URL (e.g. `https://evil.example.com/img.jpg`)
- Clears `imageLink` to `''` for an HTTP (non-HTTPS) URL
- Clears `imageLink` to `''` for a malformed URL string
- Keeps `imageLink` as `''` when `image` is `null` (already handled by `?? ''`)

No `returnImage()` tests (method is removed).

### 3. `apps/api/tests/user.test.ts`

The existing `tvMazeShowJson` fixture at line 59 uses `image: { medium: 'http://example.com/img.jpg' }`. After this fix, the constructor will sanitize that to `''`. No route tests currently assert on the `imageLink` value passed to `addOneShow`, so no test assertions break — but update the fixture to use a valid `https://static.tvmaze.com/uploads/images/medium_portrait/0/0.jpg` URL so tests reflect realistic data.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/tvmaze.ts` | Validate `imageLink` in constructor; remove `returnImage()` |
| `apps/api/tests/tvmaze.test.ts` | Add constructor imageLink validation tests |
| `apps/api/tests/user.test.ts` | Update `tvMazeShowJson` fixture image URL |

---

## Verification

```bash
# Run API tests
pnpm --filter @tv-tracker/api test

# Build must pass
pnpm build
```

Manual check: attempt `POST /api/user/tvshow` with a body containing `image: { medium: "https://evil.example.com/img.jpg" }` and verify the stored show has `imageLink: null` or `''`.
