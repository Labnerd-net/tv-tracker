# Plan: Code Cleanup and Minor Fixes

Spec file: context/specs/code-cleanup-minor-fixes.md
Branch: claude/fix/code-cleanup-minor-fixes

## Steps

### Step 1 — #7: Rename `userIdNumber` → `userIdString` in auth.ts
File: `apps/api/src/routes/auth.ts`
- Rename variable `userIdNumber` to `userIdString` at its declaration (~line 191) and all subsequent uses (~lines 192, 197) in the same route handler.

### Step 2 — #8: Fix typo `retreiveTvShow` → `retrieveTvShow` in OneShow.tsx
File: `apps/ui/src/pages/OneShow.tsx`
- Rename the function declaration at ~line 24.
- Update the call site at ~line 38.
- Confirm no other files reference this function by name.

### Step 3 — #20: Deduplicate AlertProps in AlertContext.tsx
File: `apps/ui/src/contexts/alert/AlertContext.tsx`
- Verify the local `AlertProps` interface matches the one in `apps/ui/src/types/alert.ts` exactly.
- Remove the local interface definition.
- Add `import type { AlertProps } from '../../types/alert.ts'` (or `.js` per project convention) at the top.

### Step 4 — #23: Replace hardcoded hex in Splash.tsx
File: `apps/ui/src/pages/Splash.tsx`
- Replace `'#e8e0d0'` (~line 171) with `'var(--cream)'`.

### Step 5 — #24: Replace hardcoded hex in ShowsTable.tsx
File: `apps/ui/src/components/ShowsTable.tsx`
- Replace both instances of `'#e63946'` (~line 59) with `'var(--accent)'`.

### Step 6 — #25: Remaining hex stragglers across UI source
File: `apps/ui/src/components/AppAlert.tsx`
- Replace `#e63946` with `var(--accent)` and `#f2a65a` with `var(--amber)`.
- After these targeted fixes, do a final grep of `apps/ui/src/` for any remaining theme hex values (`#e8e0d0`, `#e63946`, `#080b12`, `#0f1420`, `#f4f0e8`, `#ede8de`, `#1a1510`, `#c8102e`, `#f2a65a`, `#c8760a`) and replace any found (excluding `theme.ts` where they are intentionally defined).

### Step 7 — Verify
- Run `pnpm --filter @tv-tracker/api test` — existing tests must pass after Step 1 rename.
- Run `pnpm build` — must complete with zero errors.

## Order

Steps 1–6 are independent and can be done in any order. Step 7 must come last.

## Notes

- The `#e63946` in `theme.ts` itself should NOT be replaced — that is the canonical definition.
- Import path convention in the UI uses `.ts` extensions in source (Vite handles resolution).
- No new files need to be created.
