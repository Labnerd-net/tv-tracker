# Plan: High Priority Security Fixes

## Context

Four high-priority security issues identified in the backlog audit need to be fixed:
1. Protected routes not wrapped — unauthenticated users can access `/dashboard`, `/tvshow/:id`, `/search/*` directly
2. `ProtectedRoute` renders children before redirect completes
3. Raw `e.message` from internal errors returned to client in auth routes
4. SSRF risk in `tvmaze.ts` — episode link URLs fetched without hostname validation

Branch: `claude/fix/high-priority-security-fixes`

---

## Fix 1 & 2: Route Protection (UI)

**Files:**
- `apps/ui/src/pages/ProtectedRoute.tsx`
- `apps/ui/src/AppContent.tsx`

**ProtectedRoute.tsx** — fix first (Fix 2):

Current code calls `navigate('/login')` imperatively but still returns `children` unconditionally. The `AuthContext` already exposes `isLoading`.

Replace with:
```
- import useNavigate, use useAuth
+ import Navigate from react-router
+ also read isLoading from useAuth

if (isLoading) return null   // wait for auth check to resolve
if (!user) return <Navigate to="/login" replace />
return children
```

**AppContent.tsx** — wrap routes (Fix 1):

Wrap these four routes with `<ProtectedRoute>`:
- `/dashboard` → `<AllShows />`
- `/tvshow/:showID` → `<OneShow />`
- `/search/:showName` → `<SearchResults />`
- `/search/show/:showID` → `<OneShowSearch />`

Import `ProtectedRoute` at the top of `AppContent.tsx`.

---

## Fix 3: Auth Error Message Leakage (API)

**File:** `apps/api/src/routes/auth.ts`

The `if (e instanceof Error) { return c.json(err(e.message), 500) }` pattern appears in catch blocks for: `/register` (line 90), `/login` (line 126), `/refresh` (line 170), `/logout` (line 193), `/deleteUser` (line 231).

All five catch blocks need the same change. Replace the `instanceof Error` branch to log the error and return a generic message:

```
} catch (e: unknown) {
  logger.error({ err: e }, '<context message>');
  return c.json(err('An unexpected error occurred'), 500);
}
```

The existing `logger` is already imported. No new dependencies needed. The non-Error branch (`logger.error` + generic message) that already exists in each catch block can be simplified — collapse into one branch.

Also note line 70 throws `new Error(\`Could not add new user with email=${email}\`)` — this message would be logged (fine) but NOT returned to client after this fix, so no change needed there.

---

## Fix 4: SSRF URL Validation (API)

**File:** `apps/api/src/tvmaze.ts`

In `updateEpisodes()`, the `fetchAirdate()` inner function fetches `link` with no validation.

Add hostname check before the fetch:

```typescript
const fetchAirdate = async (link: string, label: string): Promise<string> => {
  if (!link) return '';
  try {
    const url = new URL(link);
    if (url.hostname !== 'api.tvmaze.com') {
      logger.warn({ link }, `Rejected non-TVMaze URL for ${label} episode`);
      return '';
    }
    const response = await fetch(link);
    const data = await response.json();
    return data.airdate ?? '';
  } catch (e) {
    logger.warn({ err: e }, `Failed to fetch ${label} episode`);
    return '';
  }
};
```

`new URL(link)` throws if the URL is malformed — the existing catch block handles that case already (returns `''`).

---

## Tests

**`apps/api/tests/auth.test.ts`** — add two new test cases in the existing describe block:

1. Register — mock `dbUserFunctions.addUser` to throw `new Error('DB connection failed')`. Assert response status 500 and body `error` field does NOT contain "DB connection" (i.e. is the generic message).
2. Login — mock `dbUserFunctions.returnUserByEmail` to throw `new Error('internal error')`. Assert response status 500 and body `error` field is the generic message.

Pattern: follow existing mock structure (vi.mock already in place for dbUserFunctions).

**New file: `apps/api/tests/tvmaze.test.ts`**:

Test `TvMazeData.updateEpisodes()` URL validation:
- Valid URL (`https://api.tvmaze.com/episodes/123`): mock fetch, assert airdate returned
- Invalid hostname (`https://evil.example.com/ssrf`): assert `''` returned without fetch being called
- Malformed URL (`not-a-url`): assert `''` returned gracefully

---

## Verification

1. `pnpm build` — must pass with no errors
2. Browser: navigate to `/dashboard` while logged out — should redirect to `/login`, no flash of dashboard
3. Browser: log in — dashboard should load normally
4. API: trigger a DB error on register (e.g. mock or disconnect DB) — response should be generic 500, not raw message
5. Run `pnpm --filter @tv-tracker/api test` — all tests including new ones should pass
