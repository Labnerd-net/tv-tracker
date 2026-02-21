# Spec for api-testing

branch: claude/feature/api-testing

## Summary

Add an automated test suite to the API using Hono's built-in testing utilities. The API currently has no tests. The goal is to cover the auth and user routes at the HTTP level — exercising validation, happy paths, and error branches — without spinning up a real server or hitting a real database.

## Functional Requirements

- Install a test runner (Vitest) in `apps/api`
- Use Hono's `app.request()` test helper to send requests directly against the Hono app instance
- Mock the database layer (`db/dbUserFunctions`, `db/dbShowFunctions`) so tests are self-contained and don't require a real SQLite file
- Mock external HTTP calls (TVMaze API fetch) where relevant
- Export the Hono `app` instance from a separate module so it can be imported by tests without starting the server
- Tests should run with `pnpm --filter @tv-tracker/api test`
- Tests must not require any `.env` file to be present; env vars should be injectable or stubbed at test time

## Possible Edge Cases

- JWT secret must be available for `sign`/`verify` in auth tests; needs to be stubbed or set before import
- `db` client in `schema.ts` is instantiated at module load time, so env vars (specifically `DB_FILE_NAME`) must be set before any import of that module
- Rate limiter middleware may interfere with repeated requests in tests; it should be disabled or bypassed for the test environment
- `bcrypt` hashing is slow; consider whether to mock it or accept the slowness for correctness
- The `TvMazeData.updateEpisodes()` method makes outbound fetches that must be mocked in show-related tests

## Acceptance Criteria

- `pnpm --filter @tv-tracker/api test` runs and passes with no real network calls or database file required
- Auth route tests cover:
  - `POST /api/auth/register` — missing fields, invalid email, short password, duplicate user, successful registration returning a JWT
  - `POST /api/auth/login` — missing fields, invalid email format, unknown user, wrong password, successful login returning a JWT
- User route tests cover:
  - `GET /api/user/profile` — missing token, valid token returning profile
  - `GET /api/user/tvshows` — returns list for authenticated user
  - `GET /api/user/tvshow/:id` — non-numeric id returns 400, unknown id returns 404, valid id returns show
  - `POST /api/user/tvshow` — missing/invalid body id returns 400, duplicate returns exists, success returns added
  - `POST /api/user/tvshow/:id` — non-numeric id returns 400, TVMaze fetch failure returns 502, success returns added
  - `PATCH /api/user/tvshow/:id` — non-numeric id, show not found, success
  - `DELETE /api/user/tvshow/:id` — non-numeric id, show not found, success
- All tests are isolated — no shared mutable state between tests

## Open Questions

- Should `bcrypt` calls be mocked to keep tests fast, or left real to catch regressions?
- Is there a preference for where test files live (`tests/` at the api root vs co-located `*.test.ts`)?
- Should the rate limiter be disabled via an env flag, or mocked outright in tests?

## Testing Guidelines

Create test files under `apps/api/tests/`. Cover the following without going too heavy:

- `auth.test.ts` — registration and login happy paths plus the main validation failure cases
- `user.test.ts` — profile, tvshow CRUD including param validation and mocked TVMaze responses
- A shared test helper/setup file for building the app instance with stubbed env vars and mocked db modules

## Personal Opinion

This is a good idea and overdue — the validation layer just added makes the routes testable at a meaningful level. The main complexity is the module-load-time `db` instantiation; it will require careful mock setup order (set env vars before importing app). Vitest handles this well with `vi.mock` and `vi.stubEnv`. The scope is right: HTTP-level route tests give the most value for the effort here, and staying away from unit-testing Drizzle internals keeps the suite lean. No concerns beyond the env/import ordering issue noted above.
