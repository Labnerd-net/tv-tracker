# Plan: Discriminated Union API Response Types

## Context

The UI API modules use loose interfaces (`AuthResponse`, `ProfileResponse`, `ShowResponse`, etc.) where `data` and `error` are both optional fields. TypeScript cannot enforce exhaustive handling — callers can read `response.data` without a prior `success` check and the compiler won't complain. The goal is to replace all per-file loose interfaces with a shared discriminated union so the compiler enforces narrowing.

**Note:** `adminRequests.ts` does not exist in this project; only `authRequests.ts` and `userRequests.ts` need updating.

---

## Step 1 — Add `ApiResponse<T>` to shared types

File: `apps/shared/types/tv-tracker.ts`

Add at the bottom (after existing exports):

```typescript
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
export type ApiVoidResponse = { success: true } | { success: false; error: string };
```

Two types are needed:
- `ApiResponse<T>` — for functions that return a data payload.
- `ApiVoidResponse` — for `authRequests.ts` functions (`loginUser`, `registerUser`, `deleteUser`) that currently return `{ success: true }` with no `data` field, avoiding any runtime change.

---

## Step 2 — Update `authRequests.ts`

File: `apps/ui/src/apis/authRequests.ts`

- Remove the existing `AuthResponse` interface.
- Import `ApiVoidResponse` from `@shared/types/tv-tracker`.
- Change the return type of `loginUser`, `registerUser`, `deleteUser` from `Promise<AuthResponse>` to `Promise<ApiVoidResponse>`.
- No changes to return statements needed (they already return `{ success: true }` or `{ success: false, error }` from `handleApiError`).

---

## Step 3 — Update `userRequests.ts`

File: `apps/ui/src/apis/userRequests.ts`

- Remove all 7 loose response interfaces: `ProfileResponse`, `ShowResponse`, `SingleShowResponse`, `StringResponse`, `DateResponse`, `TvMazeShowsResponse`, `TvMazeShowResponse`.
- Import `ApiResponse` from `@shared/types/tv-tracker`.
- Change return type annotations for each function:

| Function | New return type |
|---|---|
| `getUserProfile` | `Promise<ApiResponse<ProfileData>>` |
| `getAllShows` | `Promise<ApiResponse<ShowData[]>>` |
| `getOneShow` | `Promise<ApiResponse<ShowData>>` |
| `addNewShowJson` | `Promise<ApiResponse<{ status: string; showId?: number }>>` |
| `updateShow` | `Promise<ApiResponse<{ status: string; showId?: number }>>` |
| `deleteShow` | `Promise<ApiResponse<{ status: string; showId?: number }>>` |
| `fetchNextEpisodeDate` | `Promise<ApiResponse<{ date: string }>>` |
| `fetchPrevEpisodeDate` | `Promise<ApiResponse<{ date: string }>>` |
| `tvShowResults` | `Promise<ApiResponse<TvMazeSeries[]>>` |
| `returnSearchShow` | `Promise<ApiResponse<TvMazeShow>>` |

- No changes to return statement values needed — the actual objects already conform.

---

## Step 4 — Fix call sites (if TypeScript flags them)

From exploration, all existing call sites already check `response.success` before accessing `response.data`. Most are safe. After compilation, fix any errors TypeScript surfaces. Likely candidates:

- `response.data?.status` / `response.data?.showId` in `Result.tsx` and `OneShowSearch.tsx` — optional chaining on now-non-optional `data` after a success guard. TypeScript may warn if `strictPropertyChecks` treats this as unnecessary, but it shouldn't be a hard error.
- `response.error ?? 'fallback'` patterns — on the new `ApiVoidResponse` and `ApiResponse<T>`, `error` is only present on the failure branch. If callers access `response.error` without narrowing first, TypeScript will flag this. Fix by adding a `!response.success` guard or using a type assertion after checking.

Run `pnpm build` after changes and resolve any remaining type errors.

---

## Files Modified

1. `apps/shared/types/tv-tracker.ts` — added `ApiResponse<T>` and `ApiVoidResponse` exports
2. `apps/ui/src/apis/authRequests.ts` — removed `AuthResponse`, updated return types
3. `apps/ui/src/apis/userRequests.ts` — removed 7 interfaces, updated return types
4. `apps/ui/src/contexts/auth/AuthProvider.tsx` — narrowed success guard (removed redundant `&& data`)
5. `apps/ui/src/pages/OneShowSearch.tsx` — replaced `response.error ??` with narrowing ternary
6. `apps/ui/src/pages/SearchResults.tsx` — two fixes: `.then(r => r.success ? r.data.date : '')` and narrowing ternary for error message

---

## Verification

1. `pnpm build` — passes with zero TypeScript errors ✓
2. `pnpm --filter @tv-tracker/api test` — no API code changed
