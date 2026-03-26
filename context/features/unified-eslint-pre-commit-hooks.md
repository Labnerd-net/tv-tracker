# Plan: Unified ESLint Config and Pre-commit Hooks

## Context

The UI has a working ESLint 9 flat config. The API has no linting at all. The root `pnpm lint` delegates to workspaces, so the API is silently skipped. This adds a single root-level ESLint config covering both packages plus husky + lint-staged to gate commits.

## Approach

Move all ESLint deps to root. Single root `eslint.config.js` with file-pattern overrides per package. Delete the UI's local config (ESLint 9 traverses up to the root config automatically). Lint-staged runs from root so all plugins must be accessible from root `node_modules`.

---

## Steps

### 1. Install root-level devDependencies

Run from repo root:
```
pnpm add -D -w eslint @eslint/js globals typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh husky lint-staged
```

### 2. Create root `eslint.config.js`

Single flat config covering all packages:

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  // Base: all TS/TSX files across all packages
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  // UI: React plugins + browser globals
  {
    files: ['apps/ui/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // API: Node globals
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
```

**Note:** Root `package.json` has no `"type"` field (defaults to CJS). Name the file `eslint.config.mjs` so Node treats it as ESM without changing root package type. ESLint 9 supports `.mjs` configs natively.

### 3. Delete `apps/ui/eslint.config.js`

The root config replaces it. Running `eslint .` from `apps/ui/` will traverse up and find the root config.

### 4. Update `apps/ui/package.json`

Remove these ESLint devDependencies (moved to root):
- `@eslint/js`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `typescript-eslint`

Keep the `"lint": "eslint ."` script unchanged.

### 5. Update `apps/api/package.json`

Add lint script:
```json
"lint": "eslint ."
```

### 6. Update root `package.json`

Add `"prepare": "husky"` to scripts.

Add lint-staged config block:
```json
"lint-staged": {
  "*.{ts,tsx}": "eslint"
}
```

### 7. Initialize husky and create pre-commit hook

```
pnpm dlx husky init
```

Set `.husky/pre-commit` content:
```sh
pnpm lint-staged
```

### 8. Fix API lint errors

Run `pnpm lint` after setup and fix any errors surfaced in the API codebase (likely `no-console` violations from `console.log` debug calls or similar).

---

## Critical Files

- **New:** `/eslint.config.mjs`
- **New:** `/.husky/pre-commit`
- **Modified:** `/package.json` — add `prepare`, `type: module`, `lint-staged` config, root devDeps
- **Modified:** `apps/ui/package.json` — remove ESLint devDeps
- **Modified:** `apps/api/package.json` — add `lint` script
- **Deleted:** `apps/ui/eslint.config.js`

## Verification

1. `pnpm install` — installs husky and triggers `prepare` (sets up git hook)
2. `pnpm lint` — must pass for both packages
3. `pnpm --filter @tv-tracker/api lint` — must pass independently
4. `pnpm --filter @tv-tracker/ui lint` — same behavior as before
5. Stage a `.ts` file with a deliberate `const x = 1;` (unused var) → `git commit` blocked
6. Remove the error, re-stage → commit succeeds
