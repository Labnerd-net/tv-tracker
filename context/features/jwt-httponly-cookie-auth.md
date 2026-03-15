# Plan: JWT HttpOnly Cookie Auth

## Context
The access token (JWT) is stored in `localStorage`, readable by any JavaScript on the page and therefore XSS-vulnerable. The refresh token already uses an `httpOnly` cookie correctly. This change mirrors that pattern for the access token: the API sets it as an `httpOnly` cookie (name: `accessToken`, path: `/api`) and the UI stops reading, storing, or manually attaching it.

Open questions answered in the spec:
- Cookie path: `/api` (all API routes)
- UI does not need decoded JWT claims — `ProfileData` from `/api/user/profile` is sufficient
- Remove `jwt-decode` entirely

---

## API Changes

### 1. `apps/api/src/routes/auth.ts`
Add a `setAccessCookie(c, token)` helper mirroring `setRefreshCookie`:
- `httpOnly: true`, `secure: isProduction`, `sameSite: isProduction ? 'None' : 'Lax'`
- `maxAge: accessTokenExpiryMinutes * 60`, `path: '/api'`

Update each handler:
- **register** and **login**: call `setAccessCookie(c, token)` and return `ok({})` instead of `ok({ token })`
- **refresh**: call `setAccessCookie(c, token)` (in addition to `setRefreshCookie` for the new refresh token), return `ok({})`
- **logout**: clear access token cookie with `setCookie(c, 'accessToken', '', { ..., maxAge: 0, path: '/api' })`
- **deleteUser**: same access token cookie clear (refresh token clear already present)

`accessTokenExpiryMinutes` needs to be exported from `utils/envVars.ts` (currently unexported as a `const` inside the file).

### 2. `apps/api/src/utils/middleware.ts`
Replace the `jwt()` middleware with a custom `authMiddleware` that:
1. Reads `getCookie(c, 'accessToken')`
2. Returns 401 if missing
3. Verifies with `verify(token, jwtSecret, jwtAlgorithm)` from `hono/jwt`
4. Returns 401 if verification throws
5. Sets `c.set('jwtPayload', payload)` and calls `next()`

Import `getCookie` from `hono/cookie` and `verify` from `hono/jwt`.

### 3. `apps/api/src/app.ts`
Remove `Authorization` from `allowHeaders` — Bearer tokens are gone; `Cookie` can also be removed since CORS doesn't block cookies when `credentials: true`. Keep `Content-Type` and `credentials: true`.

---

## UI Changes

### 4. `apps/ui/src/utils/requests.ts`
- Remove `getAuthHeaders()`
- Create and export an Axios instance (`apiClient`) configured with `withCredentials: true` and the base URL from `VITE_API_URL`
- Add a **response interceptor** for 401 handling:
  - On 401: POST to `/api/auth/refresh` (via a plain axios call, not through `apiClient` to avoid re-triggering the interceptor)
  - If refresh succeeds (200): retry the original request once via `apiClient`
  - If refresh fails: call a registered logout callback (set via an exported `setLogoutCallback(fn)` that `AuthProvider` calls on mount) and reject
  - Guard against infinite loops with an `isRefreshing` flag and a queue for concurrent requests that arrive while a refresh is in progress
- Keep `handleApiError()`

### 5. `apps/ui/src/apis/userRequests.ts`
- Replace all `axios.get/post/patch/delete` calls with `apiClient.get/post/patch/delete`
- Remove all `getAuthHeaders()` calls and the `headers` parameters from authenticated requests
- TVMaze direct calls (`tvShowResults`, `returnSearchShow`, `fetchNextEpisodeDate`, `fetchPrevEpisodeDate`) use plain `axios` — no change needed

### 6. `apps/ui/src/apis/authRequests.ts`
- Replace `axios` calls with `apiClient` throughout (login, register, deleteUser all need `withCredentials`)
- Remove `getAuthHeaders()` from `deleteUser()`
- `loginUser` and `registerUser` use `apiClient` so the Set-Cookie response headers are accepted cross-origin

### 7. `apps/ui/src/apis/adminRequests.ts`
- Replace `axios` calls with `apiClient`
- Remove `getAuthHeaders()`

### 8. `apps/ui/src/contexts/auth/AuthProvider.tsx`
- Remove all `localStorage.getItem/setItem/removeItem('jwt')` calls
- **`login()`** (signature change: no token parameter): calls `getUserProfile()` and sets `user` from the result
- **`logout()`**: calls `POST /api/auth/logout` via `apiClient` to clear server-side cookies, then sets `user = null`
- **`initAuth` on mount**: just call `getUserProfile()` directly; if it succeeds set user, if it fails (401) set user to null — no localStorage check needed
- Call `setLogoutCallback(logout)` on mount to wire up the 401 interceptor
- Keep `isLoading` to prevent authenticated-route flashes on hard refresh

### 9. `apps/ui/src/contexts/auth/AuthContext.tsx`
- Change `login` type signature to `login: () => Promise<void>`

### 10. Call sites of `login(token)`
Search for and update callers (expected: `Login.tsx`, `Registration.tsx`):
- Remove passing the token from the API response to `login()`
- Call `login()` after a successful API response (cookie is already set by the browser)

### 11. `apps/ui/src/hooks/useToken.ts`
- Delete — unused file that references the old `localStorage.token` key and `jwt-decode`

### 12. `apps/ui/package.json`
- Remove `jwt-decode` from dependencies
- Run `pnpm install` to update the lockfile

---

## Test Changes

### 13. `apps/api/tests/helpers.ts`
- Keep `makeToken()` as-is (still needed to generate valid JWTs for test cookies)

### 14. `apps/api/tests/auth.test.ts`
- All three `expect(body.data.token).toBeDefined()` assertions → assert `set-cookie` header contains `accessToken=` instead
- The logout test currently extracts `loginBody.data.token` and sends it as a Bearer header: change to read the `accessToken` cookie from the login response and send it as `Cookie: accessToken=<value>`
- Update the `function post(...)` helper or add a helper that builds a `Cookie` header from a token

### 15. `apps/api/tests/user.test.ts`
- Change `authHeader = \`Bearer ${token}\`` → `authHeader = \`accessToken=${token}\``
- Change header key from `Authorization` to `Cookie` in all `get/post/patch/del` helper calls

### 16. `apps/api/tests/fix-backend-issues.test.ts`
- Same: change `Authorization: authHeader` → `Cookie: authHeader` (where `authHeader` is now `accessToken=<token>`)

---

## Verification

```bash
# TypeScript must compile cleanly (both API and UI)
pnpm build:api
pnpm build:ui   # also catches jwt-decode removal

# All API tests must pass
pnpm --filter @tv-tracker/api test

# Manual smoke tests
# 1. Login — browser DevTools > Application > Cookies: accessToken and refreshToken
#    both present as httpOnly; localStorage has no 'jwt' key
# 2. Hard-refresh on a protected page — still authenticated (cookie persists)
# 3. Wait 15 min (or lower ACCESS_TOKEN_EXPIRY_MINUTES in .env) — next request
#    triggers transparent refresh; no logout
# 4. Logout — both cookies cleared (Max-Age=0 in response headers)
# 5. After logout, a direct URL to /dashboard shows splash / redirects
```
