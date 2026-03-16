# Spec for Rate Limiter Trusted Proxy Validation

Title: Rate Limiter Trusted Proxy Validation
Branch: claude/fix/rate-limiter-trusted-proxy
Spec file: context/specs/rate-limiter-trusted-proxy.md

## Summary

The rate limiter in `apps/api/src/utils/rateLimiter.ts:46-51` reads the client IP from `X-Forwarded-For`, `X-Real-IP`, and `CF-Connecting-IP` headers unconditionally. These headers are client-controlled: any direct caller can set them to an arbitrary value and cycle through fake IPs to bypass rate limiting entirely.

The fix: only trust forwarded IP headers when the underlying socket connection comes from a known trusted proxy IP. For all other connections, use the actual socket remote address. This is the standard approach used by frameworks like Express (`trust proxy` setting) and connects directly to the deployment topology — the app runs behind nginx/Traefik in Docker, so proxy traffic originates from private/loopback addresses.

## Functional Requirements

- Read the actual socket remote address from the incoming Node.js request (`c.env.incoming.socket.remoteAddress` via `@hono/node-server`).
- Define a list of trusted proxy CIDRs/IPs: loopback (`127.0.0.1`, `::1`) and RFC 1918 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). These cover the Docker bridge network and nginx/Traefik deployments without requiring explicit configuration.
- If the socket IP matches the trusted list → use the forwarded IP header (existing logic).
- If the socket IP does not match → use the socket IP directly, ignoring all forwarded headers.
- If the socket IP cannot be determined → fall back to `'unknown'` (existing behaviour, no regression).
- No new environment variables or configuration surface — the private IP ranges are sufficient for the deployment context.

## Possible Edge Cases

- IPv6 loopback (`::1`) must be included alongside IPv4 loopback (`127.0.0.1`).
- IPv4-mapped IPv6 addresses (`::ffff:127.0.0.1`) — Node.js occasionally exposes these; normalise before checking.
- Docker bridge network uses `172.17.0.0/16` by default, which falls within the `172.16.0.0/12` private range — covered.
- `X-Forwarded-For` may be a comma-separated list (e.g. `client, proxy1, proxy2`) — the existing `.split(',')[0].trim()` handles this correctly.
- The `c.env.incoming` property is specific to `@hono/node-server` — this is the only runtime used, so no edge runtime compatibility needed.

## Acceptance Criteria

- A request with a spoofed `X-Forwarded-For` header from a non-trusted socket IP is rate-limited by the socket IP, not the spoofed value.
- A request through a trusted proxy (socket IP is loopback or private range) correctly uses the forwarded IP for rate limiting.
- A request with no forwarded headers falls back to socket IP as before.
- All existing rate limit tests continue to pass.

## Open Questions

- None.

## Testing Guidelines

Add tests to `apps/api/tests/rateLimiter.test.ts` (new file):

- Direct connection with spoofed `X-Forwarded-For` is rate-limited by socket IP (not the spoofed value) — verify by hitting the limit with consistent socket IP regardless of rotating headers.
- Connection from a trusted proxy IP with a valid `X-Forwarded-For` uses the forwarded IP for tracking.
- Connection with no forwarded headers falls back to socket IP.

Note: accessing the real socket in unit tests requires mocking `c.env.incoming.socket.remoteAddress`.

## Personal Opinion

This is a legitimate fix worth doing. The current implementation gives false confidence — the rate limiter exists but is trivially bypassed. The private-IP trust approach is pragmatic: it requires no config, matches the deployment topology exactly, and is the industry-standard pattern.

One honest caveat: the fix relies on the assumption that direct external connections never originate from RFC 1918 space. This is true for any internet-facing deployment but could be wrong in unusual network configurations. For this app that's not a concern.

Complexity is low — the IP check is a simple function, and the integration point is a single block in `rateLimit()`.
