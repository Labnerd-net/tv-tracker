# Spec for Unified ESLint Config and Pre-commit Hooks

Title: Unified ESLint Config and Pre-commit Hooks
Branch: claude/feature/unified-eslint-pre-commit-hooks
Spec file: context/specs/unified-eslint-pre-commit-hooks.md

## Summary

The UI has a flat ESLint config (`apps/ui/eslint.config.js`) using `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. The API has no lint config at all and no `lint` script. The root `pnpm lint` delegates to workspace packages, so the API is silently skipped.

This feature adds a root-level shared ESLint config that both packages extend from, adds a `lint` script to the API, and wires up husky + lint-staged so staged `.ts`/`.tsx` files are linted on every commit.

## Functional Requirements

- Create a root-level `eslint.config.js` containing shared base rules (JS recommended + TypeScript recommended, `no-console: error`, unused-vars pattern matching existing UI rules).
- The UI's `eslint.config.js` should extend or import the shared base and layer on its React-specific plugins/rules. Avoid duplicating rules already in the shared config.
- Add an `eslint.config.js` to `apps/api/` that extends the shared base with Node.js globals and no React plugins. The API's config must handle the `.js` extension imports (ES modules).
- Add a `lint` script to `apps/api/package.json` so `pnpm -r run lint` covers both packages.
- Install husky and lint-staged at the root workspace level.
- Configure lint-staged to run ESLint on staged `*.ts` and `*.tsx` files across all packages.
- Add a `prepare` script at the root `package.json` to install husky hooks (`husky`).
- The pre-commit hook must run lint-staged.
- All existing UI lint errors (if any) must be resolved before the hook is enabled — the hook should not block clean commits from day one.

## Possible Edge Cases

- The API uses `"type": "module"` so any config files placed there must be valid ES modules or named `.cjs` if CommonJS is needed. The flat config format (`eslint.config.js`) is already ESM-compatible.
- `tsc-alias` path rewrites mean the compiled API output uses `.js` extensions for `.ts` sources — ESLint should only run on source `.ts` files, not `dist/`.
- Husky's `prepare` script runs on `pnpm install`. In CI or Docker builds where `NODE_ENV=production`, `prepare` is skipped by default — this is acceptable since lint runs separately in CI.
- lint-staged resolves file paths relative to the repo root; the ESLint config lookup must work when invoked from the root against files in `apps/api/src/` or `apps/ui/src/`.
- If the API config introduces new lint errors on existing code, those must be fixed as part of this feature — do not gate the hook on a passing baseline and then ignore failures.

## Acceptance Criteria

- `pnpm lint` from the repo root lints both `apps/ui` and `apps/api` with no errors.
- `pnpm --filter @tv-tracker/api lint` runs without error.
- `pnpm --filter @tv-tracker/ui lint` runs without error (same behavior as before).
- Making a commit with a staged `.ts` file that has a lint error is blocked by the pre-commit hook.
- Making a commit with clean staged files is not blocked.
- The shared base rules include at minimum: `@typescript-eslint/no-unused-vars` (with `_`-prefix ignore patterns) and `no-console: error`.

## Open Questions

- Should the shared config live in `apps/shared/` (as a proper workspace package) or as a plain file at the repo root? A plain root file is simpler and avoids adding a build step to `apps/shared`. Recommend root file unless there is a reason to publish the config. - root is good
- Should lint-staged also run `tsc --noEmit` on commit, or is that too slow for a pre-commit hook? Leave out of scope for now; this can be added later.

## Testing Guidelines

No automated tests are needed for build tooling configuration. Instead, verify manually:

- `pnpm lint` passes from root.
- Introduce a deliberate lint error in an API file, stage it, and confirm the commit is blocked.
- Remove the error, re-stage, and confirm the commit proceeds.

## Personal Opinion

This is a good, low-risk housekeeping change. The API having zero lint coverage is a real gap — TypeScript catches types but not style/quality issues that ESLint would surface. The pre-commit hook is lightweight and will catch regressions before they land.

One concern: if the API has accumulated `no-console` violations or unused-var issues that the UI config already flags, those will need to be cleaned up as part of this PR. That's a small amount of churn but is the right thing to do rather than adding a lint baseline with existing suppressions.

Complexity is low. This is a configuration task with no production code changes.
