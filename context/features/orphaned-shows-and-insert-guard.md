# Plan: Fix Orphaned Shows and Insert Guard

## Context

Two independent bugs from the backlog:

- **#3 Security**: `tv_shows.userId` FK has no `ON DELETE CASCADE`. Deleting a user via `DELETE /api/auth/deleteUser` leaves orphaned show rows. SQLite FK enforcement is also **not enabled** anywhere in the codebase — the pragma is never set — so even the existing `ON DELETE no action` constraint is silently inactive. Both issues need to be fixed together.
- **#4 Bug**: `POST /api/user/tvshow/:id` returns HTTP 200 with `{ status: 'added' }` even when the DB insert fails (i.e., `newShowId` is `undefined`). An equivalent guard exists on the `POST /tvshow` (body) route at lines 94–96 but was not applied here.

---

## Fix #3 — FK Cascade + Enable FK Enforcement

### Step 1: Enable `PRAGMA foreign_keys = ON` in the DB client

**File:** `apps/api/src/db/client.ts`

After creating the drizzle instance, call `.run('PRAGMA foreign_keys = ON')` on the underlying libsql client. The drizzle `db` object exposes the raw client via `db.$client`. Use it to execute the pragma once at module load time:

```
db.$client.execute('PRAGMA foreign_keys = ON')
```

This is synchronous-equivalent for libsql (the client queues it before any queries). No await needed at module level since libsql/SQLite serializes commands on its internal queue.

> Note: Actually libsql's `.execute()` returns a Promise. Since this is module-level and we want it before any queries, we can call it and let it resolve naturally — queries will be serialized after it in libsql's queue. No top-level await needed; all routes are only called after the server starts.

### Step 2: Update the schema FK to add `onDelete: 'cascade'`

**File:** `apps/api/src/db/schema.ts`

Change:
```ts
userId: int('user_id').notNull().references(() => users.userId),
```
To:
```ts
userId: int('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
```

### Step 3: Generate the migration

Run from `apps/api/`:
```
pnpm db:generate
```

This will produce a new migration file in `apps/api/drizzle/` that recreates `tv_shows` with `ON DELETE CASCADE`. Commit the generated file.

> SQLite cannot `ALTER TABLE` to change FK constraints, so Drizzle will generate a table-recreation migration (drop + create with new definition + copy data). This is expected and correct.

---

## Fix #4 — Insert guard on `POST /tvshow/:id`

**File:** `apps/api/src/routes/user.ts`

Current code (around line 130):
```ts
const result = await dbShowFunctions.addOneShow(db, showData, userId);
const newShowId = result?.[0]?.showId;
if (newShowId !== undefined) {
  scheduleEpisodeUpdate(showData, newShowId);
}
return c.json(ok({ status: 'added' }));
```

Change to:
```ts
const result = await dbShowFunctions.addOneShow(db, showData, userId);
const newShowId = result?.[0]?.showId;
if (newShowId === undefined) {
  return c.json(err('Failed to save show'), 500);
}
scheduleEpisodeUpdate(showData, newShowId);
return c.json(ok({ status: 'added' }));
```

This mirrors the existing guard on `POST /tvshow` (lines 94–96 of the same file).

---

## Tests

### #4 — Insert guard test

**File:** `apps/api/tests/user.test.ts` (inside the existing `POST /api/user/tvshow/:id` describe block)

Add one test: mock `dbShowFunctions.addOneShow` to return `[]` (empty array), assert response status is 500.

Existing happy-path test (`returns added status on success`) should pass unchanged.

### #3 — Cascade delete test

**File:** `apps/api/tests/auth.test.ts` or a new dedicated test

The existing delete test only mocks `deleteUserById` — no real DB interaction. For the cascade test, use an **integration test against a real in-memory DB** (following the pattern in `db.test.ts` or `schema.test.ts`):

1. Insert a user and a show row.
2. Delete the user.
3. Query `tv_shows` for that `userId` — assert 0 rows returned.

This validates that both the pragma and the CASCADE constraint are working end-to-end.

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/db/client.ts` | Enable `PRAGMA foreign_keys = ON` |
| `apps/api/src/db/schema.ts` | Add `{ onDelete: 'cascade' }` to `userId` FK |
| `apps/api/src/routes/user.ts` | Add `newShowId === undefined` guard with 500 return |
| `apps/api/tests/user.test.ts` | Add failing-insert → 500 test |
| `apps/api/tests/` (new or existing) | Add cascade-delete integration test |
| `apps/api/drizzle/<new>.sql` | Generated migration (commit as-is) |

---

## Verification

1. `pnpm build` — must pass with no type errors.
2. `pnpm --filter @tv-tracker/api test` — all existing + new tests must pass.
3. Manual: register a user, add a show, delete the user, confirm `tv_shows` has no orphaned row (via SQLite CLI or a test).
