# Spec for demo-mode

branch: claude/feature/demo-mode

## Summary
Let prospective employers / reviewers try the app with one click, without registering. A "Try the demo" button on the login page creates an ephemeral, pre-seeded demo user and signs them in.

## Functional Requirements
- `POST /api/auth/demo` (unauthenticated) creates a user with email `demo-<uuid>@demo.invalid`, display name "Demo Guest", role `user` only, and an unguessable random password hash (password login is impossible).
- The user is seeded with 7 popular shows (static snapshot: title, TVMaze id, platform, status, schedule, image).
- After responding, the API refreshes next/previous episode dates for the seeded shows from TVMaze in the background (`waitUntil`, best-effort).
- Auth cookies are set exactly as in login/register.
- A scheduled (cron) handler deletes demo users older than 24 hours; their shows cascade-delete.
- A cap on live demo users (200) protects the DB; over the cap the endpoint returns 503.
- When the cap is reached, the endpoint first deletes expired demo users and re-counts; it returns 503 only if still at the cap.
- Registration rejects emails on the reserved `demo.invalid` domain (case-insensitive), since the cron purges that domain.
- Login page shows a "Try the demo" button; on success it calls `login()` and navigates to `/dashboard`.

## Possible Edge Cases
- Demo user can call every normal user route (add/delete shows, delete account). Acceptable: the data is ephemeral.
- TVMaze down during refresh: shows keep empty episode dates; no user-facing error.
- Cron has not yet run and cap is hit: endpoint returns 503 with a generic message.

## Acceptance Criteria
- Clicking the button lands on the dashboard with 7 shows within ~1-2 seconds.
- Demo user never has the admin role and cannot log in with a password.
- Expired demo users and their shows are removed by the scheduled handler; non-demo users are never touched.
- Existing auth tests still pass; new tests cover the demo route and cleanup.

## Testing Guidelines
Tests in apps/api/tests/demo.test.ts: success path (cookies set, seeded, role user, demo email), cap reached -> 503, DB failure -> 500, cleanup only targets the demo domain.
