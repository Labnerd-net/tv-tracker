# Notes: Starting From Scratch

## Tech choices I'd revisit

- **SQLite + libsql** is fine for a personal project, but if this ever needs to run on more than one instance, you're already stuck. Postgres from the start costs nothing locally and removes a future migration.
- **Formik + Yup** is heavy for two forms. React Hook Form is smaller, faster, and the DX is better. Yup stays useful for schema validation either way.
- **Axios** — the Fetch API is good enough now. One less dependency.

## Architecture

- The `TvShowContext` / `ViewContext` / `AlertContext` pattern in `Contexts.ts` and `propsFactory.ts` is already getting unwieldy and you have maybe 3 pages. I'd use [Zustand](https://github.com/pmndrs/zustand) for global client state — it's lighter than Redux, simpler than context-with-useReducer, and doesn't require wrapping the tree in providers.
- The API has no validation layer. Anything hitting the DB goes through raw user input. I'd add [Zod](https://github.com/colinhacks/zod) on the API side for request parsing — it pairs naturally with the shared types you already have in `@tv-tracker/shared`.
- Auth is JWT-only with no refresh token. The 7-day expiry means either users get logged out mid-week or you're carrying a long-lived credential with no revocation path. A short-lived access token + httpOnly refresh token cookie is the right default even for small apps.

## Developer experience

- No tests on the API side at all. Hono has good testing utilities — even a handful of route-level integration tests would catch regressions fast.
- The DB functions in `dbShowFunctions.ts` / `dbUserFunctions.ts` are thin wrappers but untested and untestable in isolation because they import the live `db` client at module load. Injecting the db client as a parameter makes them trivially testable.
- `console.log(userInput)` was left in the search handler — small thing, but a linter rule (`no-console`) would catch that before review.

## The one thing I'd keep

The monorepo structure with shared types is the right call even at this scale. Catching a type mismatch between the API response and the UI consumer at compile time rather than runtime is worth the setup cost.
