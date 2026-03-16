# Plan: Security Quick Wins

## Context

Four small, self-contained backlog security fixes ([7], [8], [9], [10]). No architectural changes. Each is a targeted 1-3 line edit.

---

## Step 1: Create Branch

```
git checkout -b claude/fix/security-quick-wins
```

---

## Step 2: Fix [7] — Password minimum length (6 → 8)

The `loginSchema` and `registrationSchema` in `apps/api/src/schemas/auth.ts` both need updates. Note: `registrationSchema` extends `loginSchema` but overrides `password` independently, so both must change.

**`apps/api/src/schemas/auth.ts`**
- Line 5: `password: z.string().min(1, ...)` → `min(8, 'Password must be at least 8 characters long')`
- Line 14: `password: z.string().min(6, ...)` → `min(8, 'Password must be at least 8 characters long')`

**`apps/ui/src/pages/Login.tsx`**
- Line 17: `min(6, ...)` → `min(8, 'Password must be at least 8 characters long')`

**`apps/ui/src/pages/Registration.tsx`**
- Line 22: `min(6, ...)` → `min(8, 'Password must be at least 8 characters long')`
- Line 23: `confirmPassword` `min(6, ...)` → `min(8, 'Please repeat the password')` (consistency)

---

## Step 3: Fix [8] — Admin errors returning HTTP 200

`apps/api/src/routes/admin.ts` — both catch-block returns are missing the status arg on `c.json()`:
- Line 29: `return c.json(err(e.message, 500))` → `return c.json(err(e.message, 500), 500)`
- Line 32: `return c.json(err('An unexpected error occurred', 500))` → `return c.json(err('An unexpected error occurred', 500), 500)`

---

## Step 4: Fix [9] — encodeURIComponent on TVMaze search URL

`apps/ui/src/apis/userRequests.ts`
- Line 149: `` `${tvMazeAPI}/search/shows?q=${showName}` `` → `` `${tvMazeAPI}/search/shows?q=${encodeURIComponent(showName)}` ``

No double-encoding risk — this is the only call site; `showName` comes directly from user input (route param) with no prior encoding.

---

## Step 5: Fix [10] — Strip sensitive fields from admin users response

`apps/api/src/routes/admin.ts` line 25 currently does a bare TypeScript type cast (`const allUserProfiles: ProfileData[] = allUsers`), which does NOT strip fields at runtime — `passwordHash`, `createdAt`, `refreshTokenHash`, `refreshTokenExpiresAt` are all still sent.

Replace with an explicit map:
```ts
const allUserProfiles: ProfileData[] = allUsers.map(({ userId, email, displayName, roles }) => ({
  userId, email, displayName, roles,
}));
```

---

## Step 6: Update / Add Tests

**`apps/api/tests/auth.test.ts`** — update existing + add new cases:
- Line 81: Update expected error message from `'Password must be at least 6 characters long'` to `'Password must be at least 8 characters long'`
- Add: registration rejects password of exactly 7 chars (boundary) → 400
- Add: registration accepts password of exactly 8 chars → 200
- Add: login rejects password shorter than 8 chars → 400

**`apps/api/tests/admin.test.ts`** — create new file:
- `GET /api/admin/users` with admin token returns 200 and response does not contain `passwordHash`, `refreshTokenHash`, or `refreshTokenExpiresAt`
- `GET /api/admin/users` when DB throws → HTTP 500 (not 200)

Pattern: follow the mock setup in `auth.test.ts` (mock `dbUserFunctions`, `rateLimiter`, use `app.request()`). Need a valid admin JWT — obtain by calling the login route in test setup, the same way `auth.test.ts` does for the logout test.

---

## Verification

```bash
pnpm --filter @tv-tracker/api test
pnpm build
```

- All existing tests pass
- New tests pass
- Build has no TS errors
