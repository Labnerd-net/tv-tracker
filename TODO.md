# TODO

Potential issues, improvements, and edits identified during code review.

---

## Backend

### Issues


### Improvements

- **In-memory rate limiter** — `rateLimiter.ts` stores state in-process. A server restart resets all counters. Not suitable for multi-instance deployments. Redis or a DB-backed store would be the production-grade fix. A warning comment and `resetForTesting()` export have been added.


- **No pagination on `GET /tvshows` or `GET /users`** — both return all records. This is fine at small scale but will become a problem as data grows.

- **Admin has no endpoint to delete a user** — `DELETE /api/admin/user/:id` does not exist. User deletion is only self-service via `DELETE /api/auth/deleteUser`. An admin delete route may be intentionally omitted, but worth confirming.

---

## Frontend

