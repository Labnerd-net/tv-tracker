# Spec for JWT HttpOnly Cookie Auth

branch: claude/feature/jwt-httponly-cookie-auth

## Summary
The access token (JWT) is currently stored in `localStorage`, which is readable by any JavaScript running on the page and therefore vulnerable to XSS attacks. This spec covers migrating the access token to an `httpOnly` cookie so it is never accessible to client-side JavaScript, matching the same approach already used for the refresh token.

## Functional Requirements
- The API issues the access token as an `httpOnly`, `secure`, `sameSite` cookie instead of returning it in the JSON response body
- The cookie path should be `/api` so it is sent with all authenticated API requests
- The UI no longer reads, stores, or manually attaches the JWT — the browser forwards the cookie automatically
- `getAuthHeaders()` and any manual `Authorization: Bearer` header injection is removed from the UI
- Login, registration, and token refresh responses no longer include a `token` field in the JSON body
- The UI `AuthProvider` can no longer decode the token client-side via `jwt-decode` to obtain profile data; it must use the `/api/user/profile` endpoint instead (which it already does on mount)
- Logout must clear both the access token cookie and the refresh token cookie
- `DELETE /api/auth/deleteUser` must also clear the access token cookie
- The CORS configuration must include `credentials: true` so cookies are forwarded on cross-origin requests from the UI

## Possible Edge Cases
- Cross-origin requests: the UI dev server (port 5173) talks to the API (port 3000); cookies require `credentials: 'include'` on every Axios request and `Access-Control-Allow-Credentials: true` from the API
- `sameSite: 'None'` requires `secure: true`, which requires HTTPS in production; local dev with HTTP will need `sameSite: 'Lax'` — the same `isProduction` pattern used for the refresh token applies here
- The UI currently decodes the JWT client-side to get `displayName` and `roles` for the navbar and guard logic; these must come from the profile API call or be embedded in the profile response instead
- Token expiry: the UI currently checks `exp` from the decoded token to decide when to refresh; without access to the token, it must handle 401 responses and trigger a refresh instead
- Any test that currently reads the `token` field from a register/login response body needs updating

## Acceptance Criteria
- After login or registration, no JWT appears in `localStorage` or in the JSON response body
- Authenticated API calls succeed without a manual `Authorization` header
- Logging out clears the access token cookie (Max-Age=0) alongside the refresh token cookie
- Navigating to a protected route after token expiry triggers an automatic refresh (or redirects to login if refresh also fails)
- XSS scripts running on the page cannot read the access token

## Open Questions
- Should the access token cookie path be `/api` (all API routes) or `/api/user` and `/api/admin` only? Narrower scope is more correct but requires listing each prefix - /api is fine
- Does the UI need to retain any decoded JWT claims client-side (e.g. `roles` for admin UI rendering)? If so, should the profile endpoint return them (it already does via `roles: Role[]`), or should a separate lightweight claims endpoint be added? - I don't think the ui needs the jwt claims
- Should `jwt-decode` be removed from the UI dependencies entirely once this change lands? - sure

## Testing Guidelines
Create or update test files in `apps/api/tests/` for the following cases, without going too heavy:
- `POST /api/auth/login` sets an `httpOnly` access token cookie and does not include `token` in the JSON body
- `POST /api/auth/register` sets an `httpOnly` access token cookie and does not include `token` in the JSON body
- `POST /api/auth/refresh` rotates both the access token cookie and the refresh token cookie
- `POST /api/auth/logout` sets both cookies to Max-Age=0
- `DELETE /api/auth/deleteUser` sets both cookies to Max-Age=0
- An authenticated request without the cookie returns 401
- An authenticated request with a valid cookie succeeds

## Personal Opinion
This is a good idea and a meaningful security improvement — `localStorage` XSS exposure is a real and well-documented risk. The change is moderately complex: every layer touches it (API cookie options, CORS config, Axios config, AuthProvider, any component that reads the token or checks expiry). The trickiest part is handling token expiry without being able to read the `exp` claim; switching to a 401-triggered refresh flow is the right approach but requires care to avoid infinite refresh loops. Worth doing, but worth planning carefully — especially the CORS `credentials` setup, which is easy to misconfigure and hard to debug across origins.
