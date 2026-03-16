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
- **TVMaze Image URL Validation** — Added `sanitizeImageUrl()` to `TvMazeData` constructor: validates `imageLink` against `https://static.tvmaze.com` hostname and HTTPS protocol, clearing to `''` on any mismatch. Removed dead `returnImage()` method. Covers both the client-body route and server-fetched routes at construction time. Added 5 constructor imageLink tests to `tvmaze.test.ts`; updated test fixtures to use valid CDN URLs.
- **Rate Limiter Trusted Proxy Validation** — Fixed rate limiter bypass: forwarded-IP headers (`X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP`) are now only trusted when the socket connection originates from a loopback or RFC 1918 private IP. Direct connections use the socket IP regardless of headers. Added `isTrustedProxy()` with IPv4-mapped IPv6 normalisation. New `rateLimiter.test.ts` with 10 unit tests for `isTrustedProxy` and 5 integration tests for the middleware.
- **Fix High Priority Bugs** — Fixed four UI bugs: replaced undeclared `alertProps` references with destructured `showAlert` in `OneShow.tsx` (was a live ReferenceError in refresh/delete handlers); fixed infinite `useEffect` re-render loops in `OneShowSearch.tsx` and `SearchResults.tsx` by scoping dep arrays to `alertProps.showAlert` instead of the full context object; replaced unstable `index` key with `data.show.id` in `SearchResults.tsx` result list.
- **UI Performance Refactor** — Extracted `useShowActions()` hook consolidating refresh/delete logic from `SingleShow`, `ShowsTable`, and `OneShow`; context is now updated in-place (splice on refresh, filter on delete) instead of re-fetching all shows. Eliminated N+1 TVMaze episode-date fetches in search results by lifting the fetch to `SearchResults` using `Promise.allSettled`, passing dates down as props to `Result`.
- **API Cleanup - Deps, Env Vars, and Types** — Removed unused `jsonwebtoken` and `@types/jsonwebtoken` dependencies. Unified `DB_FILE_NAME` reading through `envVars.ts` (removed duplicate `process.env` read and `import 'dotenv/config'` from `schema.ts`). Replaced `any` suppressions in `validationHook.ts` (now typed as `Hook<unknown, any, any>` from `@hono/zod-validator`) and `auth.ts` (`c: Context` on both cookie helpers).
