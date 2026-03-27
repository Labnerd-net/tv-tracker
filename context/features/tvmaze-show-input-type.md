# Plan: TvMaze Show Input Type

## Context

`TvMazeData`'s constructor accepts `TvMazeShow` — a broad interface with ~20 fields (genres, runtime, premiered, etc.) that are not validated by Zod. To satisfy the constructor's type, three call sites in `user.ts` use the `body as unknown as TvMazeShow` double-cast, silencing TypeScript while smuggling unvalidated values through. A secondary issue: `_embedded` is not in `tvMazeShowBodySchema`, so Zod strips it from `parsed.data` — meaning `nextEpisode`/`prevEpisode` are always empty when constructed from a validated response (these values are subsequently filled in by `updateEpisodes()`, so it's not a functional bug today, but it is a correctness gap).

The fix: derive a `TvMazeShowInput` type from the schema, add `_embedded` to the schema, narrow `TvMazeData`'s constructor to `TvMazeShowInput`, and remove all three casts.

## Files to Modify

1. **`apps/api/src/schemas/show.ts`** — add `_embedded` sub-schema; export `TvMazeShowInput = z.infer<typeof tvMazeShowBodySchema>`
2. **`apps/shared/utils/tvmaze.ts`** — narrow `getPlatformName` param to a minimal structural type so it works with both `TvMazeShow` (UI) and `TvMazeShowInput` (API)
3. **`apps/api/src/tvmaze.ts`** — swap import from `TvMazeShow` → `TvMazeShowInput`; update constructor and `returnPlatform` param types
4. **`apps/api/src/routes/user.ts`** — remove three `as unknown as TvMazeShow` casts (lines 93, 125, 156)
5. **`apps/api/tests/tvmaze.test.ts`** — add 3 constructor tests

## Step-by-Step Changes

### 1. `apps/api/src/schemas/show.ts`

Add an `embeddedEpisodeSchema` and `embeddedSchema`, then add `_embedded` to `tvMazeShowBodySchema`. Export the inferred type:

```
const embeddedEpisodeSchema = z.object({ airdate: z.string() });
const embeddedSchema = z.object({
  nextepisode: embeddedEpisodeSchema.nullable().optional(),
  previousepisode: embeddedEpisodeSchema.nullable().optional(),
});

// add to tvMazeShowBodySchema:
_embedded: embeddedSchema.nullable().optional(),

// new export at bottom:
export type TvMazeShowInput = z.infer<typeof tvMazeShowBodySchema>;
```

### 2. `apps/shared/utils/tvmaze.ts`

Change the `getPlatformName` parameter from `TvMazeShow` to a minimal structural type that both `TvMazeShow` and `TvMazeShowInput` satisfy:

```
type ShowPlatformData = {
  network?: { name: string } | null;
  webChannel?: { name: string } | null;
};

export function getPlatformName(show: ShowPlatformData): string | null { ... }
```

This avoids importing either `TvMazeShow` or `TvMazeShowInput` into shared utils and keeps it compatible with both callers.

### 3. `apps/api/src/tvmaze.ts`

- Change import: `import { type TvMazeShowInput } from '../schemas/show.js'` (and remove the `TvMazeShow` import from shared)
- Update constructor: `constructor(showData: TvMazeShowInput)`
- Update `returnPlatform`: `returnPlatform(showData: TvMazeShowInput): string`

### 4. `apps/api/src/routes/user.ts`

Remove the three casts. Each becomes:
```
// Before:
const showData = new TvMazeData(body as unknown as TvMazeShow);
// After:
const showData = new TvMazeData(body);
```
And for the two `parsed.data` cases:
```
// Before:
const showData = new TvMazeData(parsed.data as unknown as TvMazeShow);
// After:
const showData = new TvMazeData(parsed.data);
```

Remove the `TvMazeShow` import from `user.ts` if it is now unused.

### 5. `apps/api/tests/tvmaze.test.ts`

Add three constructor tests:
- `_embedded` present with valid airdates → `nextEpisode` and `prevEpisode` populated
- `_embedded` absent → `nextEpisode` and `prevEpisode` default to `''`
- Minimal valid input (only `id` and `name` required by schema, all others omitted) → no runtime errors, graceful defaults

## Verification

```bash
pnpm build          # must pass with no TypeScript errors
pnpm --filter @tv-tracker/api test  # existing + 3 new tests must pass
```

Manually verify that `pnpm build` produces no errors and no remaining `as unknown as TvMazeShow` casts exist in the codebase.
