# Spec for Security Quick Wins

Title: Security Quick Wins
Branch: claude/fix/security-quick-wins
Spec file: context/specs/security-quick-wins.md

## Summary

Four small, self-contained security fixes from the backlog (items [7], [8], [9], [10]). Each is a 1-3 line change with no dependency on the others. All address low-hanging issues: weak password policy, incorrect HTTP status codes on admin errors, missing URL encoding in TVMaze search, and sensitive fields leaking from the admin users endpoint.

## Functional Requirements

- **[7] Password minimum length**: Raise the minimum password length from 6 to 8 characters in the API Zod schema (`apps/api/src/schemas/auth.ts`) and in the matching client-side validation in `Login.tsx` and `Registration.tsx`.
- **[8] Admin error HTTP status codes**: In `apps/api/src/routes/admin.ts`, all `c.json(err(...))` calls that signal server errors must pass the HTTP status code as the second argument to `c.json()` so the response is not HTTP 200.
- **[9] Encode show name in TVMaze URL**: In `apps/ui/src/apis/userRequests.ts`, wrap `showName` in `encodeURIComponent()` before interpolating it into the TVMaze search URL.
- **[10] Strip sensitive fields from admin users response**: In `apps/api/src/routes/admin.ts`, the `GET /api/admin/users` handler must not return `passwordHash`, `refreshTokenHash`, or `refreshTokenExpiresAt`. Map each row to only the fields defined in `ProfileData` before responding.

## Possible Edge Cases

- Existing users with passwords of length 6-7 must still be able to log in — the length check only applies to registration (and optionally the login form for UX feedback, but the API login route should not enforce it).
- The `encodeURIComponent()` fix must not double-encode if any calling code already encodes the value — verify the call sites.
- If `ProfileData` fields change in the future, the admin mapping must be updated in sync — this is a pre-existing maintenance concern, not introduced by this fix.

## Acceptance Criteria

- Registration rejects passwords shorter than 8 characters with a clear validation message.
- Login form validation reflects the 8-character minimum.
- Existing 6-7 character passwords still authenticate successfully via the login API.
- Admin error responses return the correct non-200 HTTP status code (e.g. 500).
- A TVMaze search for a show name containing `&`, `=`, `#`, or spaces produces a correctly encoded URL.
- `GET /api/admin/users` response does not include `passwordHash`, `refreshTokenHash`, or `refreshTokenExpiresAt` for any user.

## Open Questions

- Should the login API also enforce the 8-character minimum, or only registration? (Current behavior allows login with any length password since it's just a hash check — enforcing on login would break existing short passwords.) - the only account is a test account and it already has 8 characters.  So enforce on login too.

## Testing Guidelines

Create or extend tests in `apps/api/tests/` for:
- Registration rejects passwords with fewer than 8 characters (returns 400)
- Registration accepts passwords of exactly 8 characters
- Login succeeds regardless of password length (no regression)
- `GET /api/admin/users` response does not include `passwordHash` or other sensitive fields
- Admin error routes return the correct HTTP status code (not 200) on error conditions

No tests needed for the UI-side `encodeURIComponent` change (pure URL construction utility).

## Personal Opinion

This is a straightforward and unambiguously good change. All four fixes are independent, low-risk, and correct clear security oversights. None of them are controversial. The only judgment call is item [7] for the login route — I'd recommend leaving login enforcement out to avoid breaking existing accounts, and only enforcing on registration. Overall complexity is very low.
