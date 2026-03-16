# Spec for High Priority Security Fixes

Title: High Priority Security Fixes
Branch: claude/fix/high-priority-security-fixes
Spec file: context/specs/high-priority-security-fixes.md

## Summary

Fix all four high-priority security issues identified in the backlog audit. Two are UI-side route protection problems, two are API-side issues involving information disclosure and SSRF risk.

## Functional Requirements

### [1] Protect all routes requiring authentication (AppContent.tsx)
- Wrap `/dashboard`, `/tvshow/:showID`, `/search/:showName`, and `/search/show/:showID` routes with `<ProtectedRoute>` so unauthenticated users cannot access them directly.

### [2] Fix ProtectedRoute rendering behavior (ProtectedRoute.tsx)
- `ProtectedRoute` must not render `children` when the user is unauthenticated.
- Replace the imperative `navigate('/login')` call with a declarative `<Navigate to="/login" replace />` return, ensuring protected content is never rendered before the redirect resolves.

### [3] Remove raw error messages from auth responses (routes/auth.ts)
- On registration and login failure, do not return `e.message` or any internal error detail to the client.
- Log the full error server-side (existing logger is fine).
- Return a generic, user-safe message such as "An unexpected error occurred."

### [4] Validate episode link URLs before fetching (tvmaze.ts)
- In `fetchAirdate()`, before making any HTTP request to an episode link URL, validate that the URL's hostname is `api.tvmaze.com`.
- Reject and skip any URL that does not match this pattern.
- This prevents SSRF via client-supplied URLs in the body-based `POST /tvshow` route.

## Possible Edge Cases

- [2] If `AuthProvider` has not yet resolved on initial load (e.g. still validating the stored JWT), `ProtectedRoute` must not redirect prematurely — it should wait or show a loading state.
- [4] Malformed or relative URLs in `_links` should be caught and handled without throwing.
- [3] Ensure the generic error message still allows the UI to display meaningful feedback to the user (e.g. "invalid credentials" vs "server error" distinction is acceptable — just no raw stack traces or DB messages).

## Acceptance Criteria

- Navigating to `/dashboard` while logged out redirects to `/login` without flashing any dashboard content.
- `ProtectedRoute` returns `<Navigate>` and never renders children when `user` is null (and auth has resolved).
- Auth registration and login error responses never include raw exception messages.
- `fetchAirdate()` rejects any URL not on `api.tvmaze.com` and does not make an HTTP request to it.
- Existing auth and show-add flows continue to work correctly for authenticated users.

## Open Questions

- Should `ProtectedRoute` show a loading spinner while the auth check is in-flight, or just a blank screen? (Low stakes — pick whichever is already established in the codebase.) - either one is fine

## Testing Guidelines

Create or update test files in `./tests` for the following cases without going too heavy:

- `auth.test.ts`: Confirm registration/login error responses do not leak raw error messages (e.g. mock a DB throw and assert the response body contains a generic message, not the thrown string).
- `tvmaze.test.ts` (or equivalent): Confirm `fetchAirdate()` skips / returns null for non-`api.tvmaze.com` URLs and proceeds normally for valid ones.

UI route protection is best verified manually in the browser — no unit tests needed for [1] and [2].

## Personal Opinion

All four fixes are straightforward and correct. None of them involve architectural changes.

[1] and [2] should have been in place from day one — unprotected routes are a basic oversight.
[3] is low effort and eliminates a common information-disclosure vector.
[4] is the most impactful: SSRF via client-supplied URLs is a real exploit path, not a theoretical one.

No concerns. These are all good, necessary changes with minimal risk of regression.
