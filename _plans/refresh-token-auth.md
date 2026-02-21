# Plan: Short-lived Access Token + httpOnly Refresh Token Cookie

## Context

The current auth system issues a single 7-day JWT on login/register. This means either users are logged out mid-week when it expires, or the credential lives too long with no revocation mechanism. The fix is a standard dual-token pattern: a short-lived access token (15 min) for API calls, and a longer-lived refresh token stored in an httpOnly cookie that can rotate and be revoked on logout.

## Approach

- **Access token**: 15-minute JWT, same structure as today, returned in the response body.
- **Refresh token**: Random opaque token (UUID), stored as SHA-256 hash in the DB, returned as an httpOnly `SameSite` cookie.
- **Rotation**: Every `/refresh` call issues a new access token and a new refresh token (old one is invalidated).
- **Revocation**: Logout clears the cookie and nulls the DB hash — that refresh token is dead immediately.

No new library dependencies. Uses Node's built-in `crypto` module for SHA-256 hashing.

## Files to Modify

### 1. `apps/api/src/db/schema.ts`
Add two nullable columns to the `users` table:
```ts
refreshTokenHash: text('refresh_token_hash').unique(),
refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
```

### 2. `apps/api/src/db/dbUserFunctions.ts`
Add three new functions:
- `updateRefreshToken(userId: number, hash: string, expiresAt: Date)` — sets hash + expiry
- `clearRefreshToken(userId: number)` — nulls both columns on logout
- `returnUserByRefreshTokenHash(hash: string)` — looks up user by hashed token (unique index makes this fast)

### 3. `apps/api/src/utils/envVars.ts`
- Add `ACCESS_TOKEN_EXPIRY_MINUTES` env var (default 15). Add `getAccessTokenExpirationSeconds()` helper.
- Rename the existing `JWT_EXPIRATION_DAYS` → `REFRESH_TOKEN_EXPIRY_DAYS` (keep backward compat alias). Add `getRefreshTokenExpirationDate()` returning a `Date`.
- Export `isProduction = process.env.NODE_ENV === 'production'` for cookie flags.

### 4. `apps/api/src/utils/auth.ts`
Add:
```ts
import { createHash, randomUUID } from 'node:crypto';

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomUUID();
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}
```

### 5. `apps/api/src/routes/auth.ts`
- **Login + Register**: After signing the access token, also call `generateRefreshToken()`, store hash in DB via `updateRefreshToken()`, and set httpOnly cookie via `setCookie()` from `hono/cookie`.
- **New `POST /refresh`**: Read `refreshToken` cookie → SHA-256 hash it → `returnUserByRefreshTokenHash()` → check expiry → sign new access token → rotate refresh token (new UUID, update DB, set new cookie) → return `{ token }`.
- **New `POST /logout`**: Read `refreshToken` cookie → hash it → `returnUserByRefreshTokenHash()` to get user → `clearRefreshToken(userId)` → `deleteCookie()` → return 200. Works even when the access token has already expired (cookie-only, no Bearer token required).

Cookie settings:
```ts
setCookie(c, 'refreshToken', raw, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60, // seconds
  path: '/api/auth',
});
```

### 6. `apps/api/src/app.ts`
Add `'Cookie'` to `allowHeaders` in the CORS config so browsers send the refresh token cookie on cross-origin requests.

### 7. Database migration
After schema changes, run from `apps/api/`:
```bash
pnpm db:generate
pnpm db:migrate
```

### 8. `apps/api/tests/auth.test.ts`
- Update login/register tests to assert the response still has `{ token }` (access token) and check cookie is set.
- Add tests for `/refresh`: valid cookie → new token; expired/missing/tampered cookie → 401.
- Add tests for `/logout`: clears cookie and DB.

## What Does NOT Change
- `authMiddleware` in `utils/middleware.ts` — unchanged. It validates the access token as before; it just expires faster now (15 min instead of 7 days). Clients handle expired access tokens by calling `/refresh`.
- The UI is not in scope for this change. The UI will need to implement silent refresh (call `/refresh` when a 401 is received), but that is a separate task.

## Verification
1. `pnpm --filter @tv-tracker/api test` — all tests green.
2. Manual: register → get `token` in body + `refreshToken` cookie. Wait for access token to expire (or shorten expiry for testing). Call `/api/auth/refresh` with cookie → get new `token`. Call `/api/auth/logout` → cookie cleared. Call `/api/auth/refresh` again → 401.
