# Spec for Outbound Fetch Safety

Title: Outbound Fetch Safety
Branch: claude/fix/outbound-fetch-safety
Spec file: context/specs/outbound-fetch-safety.md

## Summary

Three gaps in how outbound HTTP requests are handled on the API and UI sides. The API makes fetch calls to TVMaze with no timeout, so a slow or hung TVMaze response holds the request handler open indefinitely. Those same fetch calls also buffer the full response body into memory before Zod validates it, leaving the server open to oversized payload abuse. On the UI side, the `OneShowSearch` component fires a TVMaze episode-date fetch without an `AbortController`, so if the user navigates away while the fetch is in flight, it completes and tries to update an unmounted component's state.

Backlog items: #1, #2, #17.

## Functional Requirements

- All outbound `fetch()` calls to the TVMaze API in `apps/api/src/tvmaze.ts` (`updateEpisodes`) and `apps/api/src/routes/user.ts` (`POST /tvshow/:id`, `PATCH /tvshow/:id`) must use `AbortSignal.timeout(8000)` so they are automatically aborted after 8 seconds.
- Before calling `.json()` on a TVMaze API response in `apps/api/src/routes/user.ts`, the response body must be read as text first. If the body exceeds 1 MB (1,000,000 characters), the handler must return a 502 error without parsing further.
- The `useEffect` in `apps/ui/src/pages/OneShowSearch.tsx` that calls `fetchNextEpisodeDate` must create an `AbortController`, pass the signal to the fetch, and call `controller.abort()` in the cleanup function.

## Possible Edge Cases

- TVMaze legitimately returns a large response for a show with many embedded resources. The 1 MB limit should be generous enough not to trip on normal responses but should reject obviously oversized payloads.
- `AbortSignal.timeout` throws a `DOMException` with name `TimeoutError` — the error handling in the affected routes must catch this specifically and return a 504 or 502, not a 500.
- In `OneShowSearch.tsx`, the fetch may already be resolved by the time the cleanup runs. Aborting an already-settled fetch is a no-op, so this is safe.
- `fetchNextEpisodeDate` and `fetchPrevEpisodeDate` in `userRequests.ts` may need to accept an optional `signal` parameter if they wrap `fetch` internally.

## Acceptance Criteria

- A fetch to TVMaze that hangs for more than 8 seconds results in a non-500 error response (504 Gateway Timeout or 502 Bad Gateway) to the client — not an indefinitely hung request.
- A TVMaze response body over 1 MB is rejected with a 502 before JSON parsing occurs.
- Navigating away from `OneShowSearch` while the episode-date fetch is in flight does not produce a React state-update-on-unmounted-component warning in the console.
- All existing tests continue to pass and build is clean.

## Open Questions

- Should the timeout on `updateEpisodes` (background fire-and-forget) also be 8 seconds, or should it be longer since it doesn't block the client response? A longer timeout (e.g. 15 seconds) might be more appropriate for the background path. - sure, 15 seconds is fine

## Testing Guidelines

Add tests to `apps/api/tests/` for:
- `POST /tvshow/:id` with a mocked TVMaze fetch that never resolves (simulate timeout): expect a non-200 response rather than a hung handler.
- `POST /tvshow/:id` with a mocked TVMaze fetch that returns a body > 1 MB: expect a 502 response.
- `PATCH /tvshow/:id` with a mocked TVMaze fetch that returns a body > 1 MB: expect a 502 response.

No new UI tests required for the `AbortController` change — the existing `OneShowSearch` behavior is covered by the acceptance criteria check (no console warning).

## Personal Opinion

These are all good fixes. None of them are complex — they are small, targeted, and fix real issues:

- Fetch timeouts are a must-have for any production API that proxies external services. The current behavior is a latent availability risk.
- The 1 MB body guard is straightforward and the threshold is generous; normal TVMaze responses are well under 100 KB.
- The `AbortController` cleanup is best practice in React and eliminates a known React warning.

No concerns. This is a worthwhile commit.
