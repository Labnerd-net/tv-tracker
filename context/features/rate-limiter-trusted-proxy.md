# Plan: Rate Limiter Trusted Proxy Validation

## Context

Backlog item [5]: the rate limiter in `apps/api/src/utils/rateLimiter.ts` reads the client IP from
`X-Forwarded-For`, `X-Real-IP`, and `CF-Connecting-IP` headers unconditionally. Any client making
a direct connection can cycle spoofed values in these headers to bypass rate limiting entirely.

Fix: only trust forwarded-IP headers when the actual socket connection originates from a known
trusted proxy. For direct connections, use the socket IP. No new config required — RFC 1918 private
ranges cover all Docker/nginx/Traefik deployments.

---

## Changes

### 1. `apps/api/src/utils/rateLimiter.ts`

**Add import:**
```ts
import { getConnInfo } from '@hono/node-server/conninfo';
```
(`getConnInfo` is the official `@hono/node-server` helper that wraps `c.env.incoming.socket.remoteAddress`.)

**Add `isTrustedProxy(ip: string): boolean`** (exported for testability):
- Normalise IPv4-mapped IPv6 (`::ffff:1.2.3.4` → `1.2.3.4`)
- Trusted if any of:
  - Loopback: `127.0.0.1`, `::1`
  - `10.x.x.x` — first octet === 10
  - `172.16–31.x.x` — first octet === 172 AND second octet 16–31
  - `192.168.x.x` — first two octets === 192.168

No third-party CIDR library — simple numeric/string checks are sufficient for these three ranges.

**Update `rateLimit()` IP resolution** (lines 46–51):
```ts
// Get actual socket IP
const socketIp = getConnInfo(c).remote.address ?? 'unknown';

// Only trust forwarded headers from trusted proxies
const ip = isTrustedProxy(socketIp)
  ? (c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
     c.req.header('x-real-ip') ||
     c.req.header('cf-connecting-ip') ||
     socketIp)
  : socketIp;
```

### 2. `apps/api/tests/rateLimiter.test.ts` (new file)

**Unit tests for `isTrustedProxy`:**
- `127.0.0.1` → trusted
- `::1` → trusted
- `::ffff:127.0.0.1` → trusted (IPv4-mapped loopback)
- `10.0.0.1` → trusted
- `172.16.0.1` → trusted
- `172.31.255.255` → trusted (top of range)
- `192.168.1.100` → trusted
- `8.8.8.8` → not trusted
- `172.32.0.0` → not trusted (just outside 172.16/12)
- `11.0.0.1` → not trusted

**Integration tests for `rateLimit()` middleware:**
- Mock `getConnInfo` from `@hono/node-server/conninfo` via `vi.mock`
- Test 1: socket IP is untrusted (`8.8.8.8`) + spoofed `X-Forwarded-For: 1.2.3.4` → rate limit key uses `8.8.8.8`; rotating the header does not reset the counter.
- Test 2: socket IP is trusted (`127.0.0.1`) + `X-Forwarded-For: 5.6.7.8` → rate limit key uses `5.6.7.8`.
- Test 3: no forwarded headers, trusted socket IP → falls back to socket IP.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/utils/rateLimiter.ts` | Import `getConnInfo`; add `isTrustedProxy()`; update IP resolution in `rateLimit()` |
| `apps/api/tests/rateLimiter.test.ts` | New test file — unit tests for `isTrustedProxy` + integration tests for `rateLimit()` |

No other files change. Existing tests that mock `rateLimiter` are unaffected.

---

## Verification

```bash
pnpm --filter @tv-tracker/api test
pnpm build
```
