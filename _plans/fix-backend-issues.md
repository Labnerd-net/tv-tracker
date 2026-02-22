# Plan: Fix Backend Issues

## Context
Five correctness/security bugs were identified in a code review. The spec confirms which fixes to make and answers open questions: use `ADMIN_EMAIL` env var for admin promotion, drop the old `scheduleDay` column in the same migration, and no external clients to worry about. Two secondary improvements (shared `validationHook`, rate limiter comment) are in scope.

---

## Primary Issues

### 1. Add `authRateLimit` to `POST /api/auth/refresh`
**File:** `apps/api/src/routes/auth.ts:127`

Change:
```typescript
auth.post('/refresh', async c => {
```
To:
```typescript
auth.post('/refresh', authRateLimit, async c => {
```
`authRateLimit` is already imported at line 22.

---

### 2. Clear refresh cookie in `DELETE /api/auth/deleteUser`
**File:** `apps/api/src/routes/auth.ts:185-206`

Add two lines before `return c.json(ok(...))`:
1. Call `clearRefreshToken(db, payload.sub)` before `deleteUserById` (clears DB token)
2. Clear the cookie using `setCookie` with `maxAge: 0` and identical cookie options to `setRefreshCookie`:
```typescript
await dbUserFunctions.clearRefreshToken(db, payload.sub);
// ... existing deleteUserById call ...
setCookie(c, 'refreshToken', '', {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
  maxAge: 0,
  path: '/api/auth',
});
```
Must use `setCookie` (not `deleteCookie`) — `deleteCookie` in Hono only passes `path`, so `secure`/`sameSite` won't match and the browser will ignore the clear.

---

### 3. Replace first-user-admin logic with `ADMIN_EMAIL` env var
**Files:** `apps/api/src/utils/envVars.ts` and `apps/api/src/routes/auth.ts:60-61`

**envVars.ts** — add at the bottom:
```typescript
// Optional. If set, only the user registering with this email receives admin role.
// If unset, no user is auto-promoted to admin.
export const adminEmail: string | undefined = process.env.ADMIN_EMAIL || undefined;
```

**auth.ts register handler** — replace lines 60-61:
```typescript
// Remove:
const totalUsers = await dbUserFunctions.returnUsers(db);
const roles: Role[] = totalUsers.length === 0 ? ['user', 'admin'] : ['user'];

// Add:
const roles: Role[] = (adminEmail && email === adminEmail) ? ['user', 'admin'] : ['user'];
```
Also add `adminEmail` to the existing `envVars.js` import on line 12.

The `returnUsers(db)` call on line 60 is eliminated entirely — one fewer DB query per registration.

---

### 4. Change `scheduleDay` to JSON array

#### 4a. Drizzle schema
**File:** `apps/api/src/db/schema.ts`

Change the `scheduleDay` column:
```typescript
// Before:
scheduleDay: text('schedule_day'),

// After:
scheduleDay: text('schedule_day', { mode: 'json' }).$type<string[]>(),
```
Mirrors the `roles` pattern on the `users` table.

#### 4b. `TvMazeData` class
**File:** `apps/api/src/tvmaze.ts`

```typescript
// Property declaration (line ~10):
scheduleDays: string[];   // was: string

// Constructor (line ~23):
this.scheduleDays = showData.schedule?.days ?? [];  // was: ...days?.[0] ?? ''
```

#### 4c. Shared type
**File:** `apps/shared/types/tv-tracker.ts`

```typescript
// Before:
scheduleDay: string | null;

// After:
scheduleDay: string[] | null;
```

#### 4d. Migration
SQLite cannot `ALTER COLUMN` — table recreation required.

**Step 1:** Update schema as in 4a, then run `pnpm db:generate` from `apps/api/` to generate the snapshot file (`0002_*.json` in `drizzle/meta/`). Note the generated migration tag name.

**Step 2:** The generated SQL file will be wrong (Drizzle won't know to backfill). Replace its contents with:
```sql
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `tv_shows_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL,
  `title` text NOT NULL,
  `tvmaze_id` integer NOT NULL,
  `platform` text,
  `status` text,
  `schedule_day` text,
  `schedule_time` text,
  `prev_episode` text,
  `next_episode` text,
  `image_link` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `tv_shows_new`
  SELECT
    `id`, `user_id`, `title`, `tvmaze_id`, `platform`, `status`,
    CASE
      WHEN `schedule_day` IS NULL OR `schedule_day` = '' THEN NULL
      ELSE json_array(`schedule_day`)
    END,
    `schedule_time`, `prev_episode`, `next_episode`, `image_link`
  FROM `tv_shows`;
--> statement-breakpoint
DROP TABLE `tv_shows`;
--> statement-breakpoint
ALTER TABLE `tv_shows_new` RENAME TO `tv_shows`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
```
`json_array('Monday')` → `["Monday"]`. The `_journal.json` and snapshot are generated correctly by `db:generate` — only the SQL file body needs replacing.

**Note:** `dbShowFunctions.ts` needs no changes — `showData.scheduleDays` maps to `scheduleDay` column in both `addOneShow` and `updateOneShow`, and Drizzle handles JSON serialization via the `mode: 'json'` column config.

---

### 5. Tighten `tvMazeShowBodySchema`
**File:** `apps/api/src/schemas/show.ts`

```typescript
// Before:
name: z.string().optional(),

// After:
name: z.string({ error: 'Missing or invalid show name in request body' }),
```
Making `name` required means `{ id: 123 }` is rejected with 400. `z.looseObject` still passes through all other TVMaze fields unchanged.

---

## Secondary Improvements

### 6. Extract shared `validationHook`
**File to create:** `apps/api/src/utils/validationHook.ts`
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validationHook = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ ok: false, error: result.error.issues[0].message }, 400);
  }
};
```
Remove the identical inline definition from `routes/auth.ts:33-37` and `routes/user.ts`, replace with `import { validationHook } from '../utils/validationHook.js';`.

### 7. Document in-memory rate limiter
**File:** `apps/api/src/utils/rateLimiter.ts`

Add a comment before the `store` map:
```typescript
// WARNING: In-memory store — state resets on process restart and does not
// synchronise across multiple API instances. Use a shared store (e.g. Redis)
// for multi-instance deployments.
```

Also export a `resetForTesting()` function at the bottom of the file (needed by new tests):
```typescript
export function resetForTesting() { store.clear(); }
```

---

## Tests

**File to create:** `apps/api/tests/fix-backend-issues.test.ts`

Five test cases (one per acceptance criterion):

1. **Refresh rate-limited** — call `POST /api/auth/refresh` 6 times; 6th returns 429. Uses real rate limiter (do not mock it). Call `resetForTesting()` in `beforeEach` to isolate from other tests.

2. **deleteUser clears cookie** — `DELETE /api/auth/deleteUser` with valid Bearer token; assert response has `Set-Cookie: refreshToken=; Max-Age=0` and that `clearRefreshToken` was called.

3. **Multi-day schedule stored** — `POST /api/user/tvshow` with `schedule.days: ['Monday','Tuesday']`; assert `addOneShow` was called with `scheduleDays: ['Monday','Tuesday']`.

4. **Body with only `{ id }` returns 400** — `POST /api/user/tvshow` with `{ id: 123 }` only; assert 400.

5. **First user not auto-admined** — `POST /api/auth/register` with `ADMIN_EMAIL` unset (test env has no `ADMIN_EMAIL`); assert `addUser` was called with `roles: ['user']` only.

**Files to update:**
- `apps/api/tests/db.test.ts` — update `makeShowStub` to use `scheduleDays: ['Monday']` (was `'Monday'`)
- `apps/api/tests/user.test.ts` — update `mockShow.scheduleDay` to `['Monday']` (was `'Monday'`); add `apiRateLimit: (_c, next) => next()` to the `rateLimiter.js` mock (currently missing, causing `apiRateLimit` to be `undefined` at module init)
- `apps/api/tests/auth.test.ts` — add `apiRateLimit: (_c, next) => next()` to the same mock for consistency

---

## Verification

```bash
# Run all API tests
pnpm --filter @tv-tracker/api test

# TypeScript should pass cleanly
pnpm build:api

# Manual smoke test: add a show with multiple schedule days and check the returned data
# Manual: register a new user without ADMIN_EMAIL set — should not be admin
# Manual: call /api/auth/refresh 6+ times rapidly — should 429 on the 6th
```
