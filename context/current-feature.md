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
