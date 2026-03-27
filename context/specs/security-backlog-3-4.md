# Spec for security-backlog-3-4

Title: Security Fixes — Backlog #3 and #4
Branch: claude/fix/security-backlog-3-4
Spec file: context/specs/security-backlog-3-4.md

## Summary

Two medium-security fixes in the API backend:

1. **#3** — `DELETE /api/auth/deleteUser` uses `authRateLimit` (5 req/15 min), the brute-force limiter meant for login/register. An attacker can exhaust a victim's quota before they can delete their own account. Switch to `apiRateLimit` (100 req/15 min), which is appropriate for an authenticated self-service endpoint.

2. **#4** — `returnUsers()` does a bare `db.select().from(users)`, pulling all columns — including `passwordHash`, `refreshTokenHash`, and `refreshTokenExpiresAt` — into Node memory. The admin route then manually projects down to `ProfileData`. The sensitive fields should never leave the DB layer. Use Drizzle column selection to return only the safe fields.

## Functional Requirements

- `DELETE /api/auth/deleteUser` must use `apiRateLimit` instead of `authRateLimit`
- `returnUsers()` must select only `{ userId, email, displayName, roles }` at query time
- `returnUsers()` return type must narrow from `Promise<UserDbData[]>` to `Promise<ProfileData[]>`
- `admin.ts` GET /users handler must be simplified to use the query result directly (no manual map)

## Possible Edge Cases

- `apiRateLimit` and `authRateLimit` share the same `windowMs` (15 min) — only `maxRequests` differs. Confirm no config drift.
- `returnUsers()` is only called from `admin.ts`; verify no other call site exists that relies on `UserDbData` fields.

## Acceptance Criteria

- `DELETE /api/auth/deleteUser` is no longer gated by the 5-req/15-min brute-force limiter
- `returnUsers()` never returns `passwordHash`, `refreshTokenHash`, or `refreshTokenExpiresAt`
- Existing `admin.test.ts` field-stripping assertions still pass (now enforced at the DB layer rather than the route layer)
- Build passes, all tests pass

## Open Questions

- None — both changes are straightforward and self-contained.

## Testing Guidelines

No new test files needed. Verify existing `admin.test.ts` still passes — the field-stripping test was previously catching the route-level map; after this fix it should still pass because the fields are excluded at the query level.

- Confirm `passwordHash`, `refreshTokenHash`, `refreshTokenExpiresAt` are absent from `GET /api/admin/users` response

## Personal Opinion

Both fixes are good, low-risk changes. #3 is trivially correct — `authRateLimit` on an authenticated route was always mismatched. #4 is a defense-in-depth improvement; the fields were already stripped at the route level, so this isn't fixing an active leak, but moving the exclusion to the query level is the right place for it and removes a latent risk if the admin route ever changes.

No concerns. Both changes are simple one- or two-line diffs.
