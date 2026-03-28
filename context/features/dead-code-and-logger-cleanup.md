# Plan: Dead Code and Logger Cleanup

Backlog: #12, #13, #16
Branch: claude/fix/dead-code-and-logger-cleanup

---

## Findings

- `apps/ui/src/types/data.ts` — contains only the `DataProps` interface (plus one import). No other file imports `DataProps`. Delete the file entirely.
- `apps/ui/src/types/view.ts` — contains only the `ViewProps` interface. No other file imports `ViewProps`. Delete the file entirely.
- `apps/ui/src/components/ErrorBoundary.tsx` — `componentDidCatch` calls `console.error` with an `// eslint-disable-next-line no-console` comment above it. The project logger lives at `apps/ui/src/utils/logger.ts` and exports a `logger` object with `.error(...args: unknown[])`. Class components can import ES modules normally; no compatibility issue.

---

## Steps

### 1. Create branch
```
git checkout -b claude/fix/dead-code-and-logger-cleanup
```

### 2. Delete `apps/ui/src/types/data.ts` (#12)
Delete the file. Grep confirms zero imports across the codebase.

### 3. Delete `apps/ui/src/types/view.ts` (#13)
Delete the file. Grep confirms zero imports across the codebase.

### 4. Fix `ErrorBoundary.tsx` (#16)
- Add import: `import { logger } from '../utils/logger';`
- Remove the `// eslint-disable-next-line no-console` comment
- Replace `console.error('[ErrorBoundary]', error, info);` with `logger.error('[ErrorBoundary]', error, info);`

### 5. Build and lint
```
pnpm build
pnpm lint
```
Confirm clean output before committing.

---

## Files Changed
- `apps/ui/src/types/data.ts` — deleted
- `apps/ui/src/types/view.ts` — deleted
- `apps/ui/src/components/ErrorBoundary.tsx` — 3-line change (add import, remove disable comment, swap call)
