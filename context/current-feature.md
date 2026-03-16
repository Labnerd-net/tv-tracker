# Current Feature

## Current Feature Spec File

Title:
Spec file:
Branch:

## Current Feature Plan File

Plan File:

## History

<!-- Keep this updated. Earliest to latest -->
- ...
- **High Priority Security Fixes** — Fixed four security issues: wrapped all authenticated routes in `<ProtectedRoute>`; fixed `ProtectedRoute` to use `<Navigate>` instead of imperative navigate (children never render unauthenticated); removed raw `e.message` from all five auth catch blocks (now logs server-side, returns generic message); added hostname validation in `fetchAirdate()` to reject non-`api.tvmaze.com` URLs (SSRF fix). Added auth error leakage tests and new `tvmaze.test.ts` for URL validation.
- **Security Quick Wins** — Four small security fixes: raised password minimum length to 8 chars (API schemas + UI forms, enforced on both login and registration); fixed admin error responses returning HTTP 200 instead of 500; added `encodeURIComponent()` to TVMaze search URL; replaced type-cast-only sensitive field exclusion in `GET /api/admin/users` with an explicit map. Added boundary tests for password validation and new `admin.test.ts` for field stripping and HTTP status checks.
- **Error Response Hardening** — Removed `e.message` leaks from all catch blocks in `admin.ts` and `user.ts` (6 routes); all errors now log server-side and return a generic message. Removed redundant `code` field from `err()` helper in `response.ts`. Fixed latent bug in `requireRole` middleware that was returning HTTP 200 on forbidden responses. Extended `admin.test.ts` to assert the generic error message and absence of raw DB errors.
