# Plan: Code Quality Type and Constant Fixes (#22, #30)

## Context

Two small code quality issues from the backlog:
- **#22**: `validationHook.ts` uses `Hook<unknown, any, any>` — the two `any` generics suppress type errors for the Hono `Env` and path string parameters.
- **#30**: The TVMaze base URL `'https://api.tvmaze.com'` is independently defined as `const tvMazeAPI` in both `apps/api/src/routes/user.ts` (line 18) and `apps/ui/src/apis/userRequests.ts` (line 6). Moving it to shared eliminates the duplication.

---

## Step 1 — Fix `Hook<unknown, any, any>` in `validationHook.ts`

**File:** `apps/api/src/utils/validationHook.ts`

Check `@hono/zod-validator` docs for the exact `Hook` signature. The expected fix is to replace `any, any` with `BlankEnv, string` (using `BlankEnv` from `hono/types`) since this hook is reused across all routes and doesn't depend on a specific env or path:

```ts
import type { Hook } from '@hono/zod-validator';
import type { BlankEnv } from 'hono/types';

export const validationHook: Hook<unknown, BlankEnv, string> = (result, c) => {
  if (!result.success) {
    return c.json({ ok: false, error: result.error.issues[0].message }, 400);
  }
};
```

Verify `BlankEnv` is exported from `hono/types` before using it; if not, use the equivalent (`{}` inline or another Hono env type). Check docs via Context7 before writing the code.

---

## Step 2 — Create shared TVMaze constants file

**New file:** `apps/shared/constants/tvmaze.ts`

```ts
export const TV_MAZE_API_BASE = 'https://api.tvmaze.com';
```

No build step needed — the shared package is consumed directly as TypeScript source.

---

## Step 3 — Update API to import from shared

**File:** `apps/api/src/routes/user.ts` (line 18)

- Remove: `const tvMazeAPI = 'https://api.tvmaze.com';`
- Add import: `import { TV_MAZE_API_BASE } from '@shared/constants/tvmaze.js';` (`.js` extension required for ESM)
- Replace all 2 usages of `tvMazeAPI` with `TV_MAZE_API_BASE` (lines 121 and 153)

---

## Step 4 — Update UI to import from shared

**File:** `apps/ui/src/apis/userRequests.ts` (line 6)

- Remove: `const tvMazeAPI = 'https://api.tvmaze.com';`
- Add import: `import { TV_MAZE_API_BASE } from '@shared/constants/tvmaze';` (no `.js` for Vite)
- Replace all 2 usages of `tvMazeAPI` with `TV_MAZE_API_BASE` (lines 165 and 180)

---

## Verification

1. `pnpm build` — must pass with zero TypeScript errors
2. `pnpm lint` — must pass (UI)
3. `pnpm --filter @tv-tracker/api test` — existing tests must still pass
4. Grep for `tvMazeAPI` and `'https://api.tvmaze.com'` — must appear only in the new shared file
5. Grep for `any, any` in `validationHook.ts` — must be gone
