# Spec for Auth Security Hardening

Title: Auth Security Hardening - Rate Limit and Password Max Length
Branch: claude/fix/auth-security-hardening
Spec file: context/specs/auth-security-hardening.md

## Summary

Two small security gaps in the auth layer:

1. **Missing rate limit on `DELETE /api/auth/deleteUser`** — every other auth mutation uses `authRateLimit`, but this route only has `authMiddleware`. An attacker with a valid token can hammer it without hitting the rate limiter.
2. **No upper bound on password length** — `loginSchema` and `registrationSchema` impose a minimum (8 chars) but no maximum. A multi-megabyte password body is fully buffered and hashed (bcrypt truncates at 72 bytes), allowing trivial CPU/memory abuse. Adding `.max(128)` caps it before bcrypt is invoked.

## Functional Requirements

- `DELETE /api/auth/deleteUser` must apply `authRateLimit` middleware in addition to `authMiddleware`.
- `password` in `loginSchema` must have a `.max(128)` constraint.
- `password` in `registrationSchema` must have a `.max(128)` constraint.
- The max length should be validated and return a 400 with a descriptive message before any hashing or DB work occurs.

## Possible Edge Cases

- Users with existing passwords longer than 128 chars (practically impossible given bcrypt's 72-byte effective limit, but login would now reject at schema level — acceptable since those passwords are functionally identical to their 72-byte prefix anyway).
- Rate limiter ordering matters: `authRateLimit` should be applied before or alongside `authMiddleware` to prevent unauthenticated hammering from also being rate-limit-exempt.

## Acceptance Criteria

- `DELETE /api/auth/deleteUser` returns 429 after hitting the rate limit threshold, same as other auth mutation routes.
- Submitting a password longer than 128 characters to `/api/auth/register` or `/api/auth/login` returns 400.
- Submitting a password of exactly 128 characters is accepted.
- All existing auth tests continue to pass.

## Open Questions

- None.

## Testing Guidelines

Create or extend `tests/auth.test.ts`:
- Test that `DELETE /api/auth/deleteUser` is rate-limited (can reuse the pattern from existing rate limit tests on other auth routes).
- Test that registration with a 129-char password returns 400.
- Test that registration with a 128-char password succeeds (or at least passes schema validation).
- Test that login with a 129-char password returns 400.

## Personal Opinion

Both fixes are straightforward and clearly correct. Item #1 is a genuine oversight — the route was almost certainly supposed to have `authRateLimit` and it was just missed. Item #4 is a well-known bcrypt footgun; `.max(128)` is the standard mitigation and adds no complexity. Neither change is controversial. Good first things to knock out.
