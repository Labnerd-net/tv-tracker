# Plan: API Cleanup - Deps, Env Vars, and Types

## Context

Three small technical-debt fixes in `apps/api`:
- Remove dead `jsonwebtoken` dependency (app uses `hono/jwt` exclusively)
- Eliminate duplicate `process.env.DB_FILE_NAME` read in `schema.ts` — `envVars.ts` already owns that logic
- Replace `any` suppressions in `validationHook.ts` and `auth.ts` with proper Hono/Zod types

No runtime behavior changes. Build and existing tests must pass throughout.

---

## Step 1 — Remove jsonwebtoken ([25])

**File:** `apps/api/package.json`

Remove from `dependencies`:
```
"jsonwebtoken": "^9.0.3"
```
Remove from `devDependencies`:
```
"@types/jsonwebtoken": "^9.0.10"
```

Then run from repo root:
```bash
pnpm install
```
This updates `pnpm-lock.yaml` and removes the packages from `node_modules`.

---

## Step 2 — Unify DB_FILE_NAME through envVars.ts ([21])

**Files:**
- `apps/api/src/db/schema.ts` (modify)
- `apps/api/src/utils/envVars.ts` (read-only — already exports `dbUrl`)

`envVars.ts:4-5` already does:
```ts
const sqliteFile = process.env.DB_FILE_NAME || 'file:data/local.db';
export const dbUrl = sqliteFile;
```

`schema.ts:1,7` duplicates this:
```ts
import 'dotenv/config';         // ← also redundant once envVars.ts is imported
const sqliteFile = process.env.DB_FILE_NAME || 'file:data/local.db';
```

Changes to `schema.ts`:
1. Remove `import 'dotenv/config'` (envVars.ts loads dotenv on import)
2. Remove `const sqliteFile = ...` line
3. Add `import { dbUrl } from '../utils/envVars.js';`
4. Change `export const db = drizzle(sqliteFile)` → `export const db = drizzle(dbUrl)`

---

## Step 3 — Fix `any` type suppressions ([22])

### 3a. `apps/api/src/utils/validationHook.ts`

Current:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validationHook = (result: any, c: any) => {
```

Replace with:
```ts
import type { z } from 'zod';
import type { Context } from 'hono';

export const validationHook = (result: z.SafeParseReturnType<unknown, unknown>, c: Context) => {
```

Remove the eslint-disable comment.

### 3b. `apps/api/src/routes/auth.ts`

Two functions use `c: any`:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setRefreshCookie(c: any, raw: string) { ... }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setAccessCookie(c: any, token: string) { ... }
```

Replace both `c: any` with `c: Context` (Hono's `Context` type).
Add import: `import type { Context } from 'hono';` — or merge with existing `import { Hono } from 'hono'` as a type import.
Remove both eslint-disable comments.

---

## Verification

```bash
pnpm --filter @tv-tracker/api build   # must pass with 0 errors
pnpm --filter @tv-tracker/api test    # must pass with 0 regressions
```

Spot checks after build:
- `apps/api/package.json` contains no `jsonwebtoken`
- `apps/api/src/db/schema.ts` contains no `process.env.DB_FILE_NAME`
- `apps/api/src/utils/validationHook.ts` and `apps/api/src/routes/auth.ts` contain no `any`
