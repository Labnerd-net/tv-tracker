# Spec for TvMaze Show Input Type

Title: TvMaze Show Input Type
Branch: claude/fix/tvmaze-show-input-type
Spec file: context/specs/tvmaze-show-input-type.md

## Summary

`TvMazeData`'s constructor currently accepts `TvMazeShow` — a broad interface with many required fields (genres, runtime, premiered, etc.) that the Zod validation schema does not guarantee. To bridge the gap, the code uses `body as unknown as TvMazeShow` double-casts at three points in `user.ts` (lines 93, 125, 156), silencing TypeScript and masking the mismatch.

The fix is to derive a `TvMazeShowInput` type from `tvMazeShowBodySchema` using `z.infer`, extend the schema to include `_embedded` (currently stripped by Zod, losing airdate data on the client-body path), update `TvMazeData`'s constructor to accept `TvMazeShowInput`, and remove all three casts.

## Functional Requirements

- Export a `TvMazeShowInput` type derived from `tvMazeShowBodySchema` using `z.infer<typeof tvMazeShowBodySchema>`.
- Add `_embedded` (with optional `nextepisode` and `previousepisode` airdate fields) to `tvMazeShowBodySchema` so episode data is not stripped on the client-body path.
- Change `TvMazeData`'s constructor signature from `TvMazeShow` to `TvMazeShowInput`.
- Remove the `as unknown as TvMazeShow` casts at `user.ts` lines 93, 125, and 156. No cast should be needed after the type change.
- The `TvMazeShow` interface in `shared/types/tvmaze.ts` remains — it is still used for client-side TVMaze search results. Only the constructor input changes.

## Possible Edge Cases

- `_embedded` is present in TVMaze fetch responses (when using `?embed[]` params) but may be absent in client-submitted bodies if the UI sends a show without embed data. The schema already uses `.optional()` for embed fields, so this is handled.
- After the schema adds `_embedded`, Zod will include it in `parsed.data` — but only if the raw JSON contains it. The existing `?? ''` fallbacks in the constructor handle missing values.
- `returnPlatform()` in `TvMazeData` calls `getPlatformName(showData)` from shared utils. Verify `getPlatformName` only accesses fields present in `TvMazeShowInput` (network, webChannel).

## Acceptance Criteria

- No `as unknown as TvMazeShow` casts remain in `user.ts`.
- TypeScript compiles cleanly with no errors (`pnpm build` passes).
- `TvMazeData` constructor parameter type is `TvMazeShowInput` (inferred from schema), not `TvMazeShow`.
- `_embedded` is included in `tvMazeShowBodySchema` with appropriate optional fields.
- Existing behavior is unchanged: shows are added/refreshed correctly via all three routes.

## Open Questions

- None.

## Testing Guidelines

Add tests to the existing `tvmaze.test.ts` file:
- Constructor with `_embedded` present — `nextEpisode` and `prevEpisode` are populated from it.
- Constructor with `_embedded` absent — `nextEpisode` and `prevEpisode` default to `''`.
- Constructor with a minimal Zod-inferred input (only required fields) — no runtime errors.

No new test files needed; this is a type-level and schema change.

## Personal Opinion

This is a good, targeted fix. The double-cast is a real type safety gap — TypeScript believes fields like `genres` and `runtime` are present, but they're not validated and could be `undefined` at runtime. The fix is straightforward and low risk: derive the type from the existing schema, extend the schema minimally for `_embedded`, and remove the casts.

One concern: the `TvMazeShow` interface and `TvMazeShowInput` will now diverge further (the interface has required fields the schema doesn't; the schema has optional `_embedded` the interface treats as optional too). That's fine — they serve different purposes. Just make sure `getPlatformName` in shared utils doesn't rely on fields outside the schema (network and webChannel are both in the schema, so this should be fine).

Complexity: low. This is mostly renaming and type plumbing, with a small schema addition.
