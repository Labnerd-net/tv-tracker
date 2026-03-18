# Plan: Auth Security Hardening - Rate Limit and Password Max Length

Spec file: context/specs/auth-security-hardening.md
Branch: claude/fix/auth-security-hardening

## Steps

### Step 1 — Add rate limit to DELETE /api/auth/deleteUser

File: `apps/api/src/routes/auth.ts` (line 188)

The route currently passes `authMiddleware` as the first handler argument after the path string. Insert `authRateLimit` between the path string and `authMiddleware`, matching the pattern of all other auth mutation routes. Order: path → `authRateLimit` → `authMiddleware` → async handler.

---

### Step 2 — Add password max length to loginSchema

File: `apps/api/src/schemas/auth.ts` (line 5)

The `password` field in `loginSchema` ends with `.min(8, 'Password must be at least 8 characters long')`. Chain `.max(128, 'Password must be at most 128 characters long')` directly onto that call.

---

### Step 3 — Add password max length to registrationSchema

File: `apps/api/src/schemas/auth.ts` (line 14)

The `password` field in `registrationSchema` (the override) also ends with `.min(8, ...)`. Chain `.max(128, 'Password must be at most 128 characters long')` in the same way.

---

### Step 4 — Add password max length tests for POST /api/auth/register

File: `apps/api/tests/auth.test.ts`

Inside the existing `describe('POST /api/auth/register', ...)` block, add two new cases:

1. Password of 129 chars (`'a'.repeat(129)`) with valid email and displayName → expect status 400, error message `'Password must be at most 128 characters long'`.
2. Password of exactly 128 chars (`'a'.repeat(128)`) with valid email and displayName → assert status is **not** 400 (schema validation passes; it may fail for other mock reasons but not schema).

---

### Step 5 — Add password max length test for POST /api/auth/login

File: `apps/api/tests/auth.test.ts`

Inside the existing `describe('POST /api/auth/login', ...)` block, add one new case:

1. Password of 129 chars (`'a'.repeat(129)`) with a valid email → expect status 400, error message `'Password must be at most 128 characters long'`.

---

### Step 6 — Note on deleteUser rate limit test coverage

`authRateLimit` is mocked to a passthrough in `auth.test.ts` (lines 17-20), so actual 429 behavior cannot be exercised there. Middleware presence is confirmed at the route definition level. Rate limiting behavior is covered by `rateLimiter.test.ts`. Add a brief comment at the end of `auth.test.ts` to document this.

---

### Step 7 — Verify build and tests

Run `pnpm build:api` from repo root. Fix any TypeScript errors. Then run `pnpm --filter @tv-tracker/api test` and confirm all tests pass.

---

## Critical Files

- `apps/api/src/routes/auth.ts` — add `authRateLimit` middleware to DELETE route
- `apps/api/src/schemas/auth.ts` — add `.max(128)` to both password fields
- `apps/api/tests/auth.test.ts` — add max-length test cases
