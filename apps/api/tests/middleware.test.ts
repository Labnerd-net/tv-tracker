import { describe, it, expect, vi } from 'vitest';
import { sign } from 'hono/jwt';
import app from '../src/app.js';

vi.mock('../src/db/dbUserFunctions.js', () => ({
  returnUserByEmail: vi.fn().mockResolvedValue([]),
  returnUsers: vi.fn().mockResolvedValue([]),
  addUser: vi.fn().mockResolvedValue([]),
  returnUserById: vi.fn().mockResolvedValue([{ userId: 1, email: 'a@b.com', displayName: 'Test', roles: ['user'] }]),
  deleteUserById: vi.fn().mockResolvedValue(null),
  updateRefreshToken: vi.fn().mockResolvedValue(null),
  clearRefreshToken: vi.fn().mockResolvedValue(null),
  returnUserByRefreshTokenHash: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/utils/rateLimiter.js', () => ({
  authRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
  apiRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
}));

const SECRET = 'test-secret';
const ALG = 'HS256';

async function tokenCookie(payload: Record<string, unknown>): Promise<string> {
  const token = await sign(payload, SECRET, ALG);
  return `accessToken=${token}`;
}

function getProfile(cookie: string) {
  return app.request('/api/user/profile', {
    headers: { Cookie: cookie },
  });
}

describe('authMiddleware JWT shape validation', () => {
  it('passes through with a well-formed JWT payload', async () => {
    const cookie = await tokenCookie({
      sub: 1,
      email: 'a@b.com',
      displayName: 'Test',
      roles: ['user'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const res = await getProfile(cookie);
    expect(res.status).not.toBe(401);
  });

  it('returns 401 when JWT payload is missing sub', async () => {
    const cookie = await tokenCookie({
      email: 'a@b.com',
      displayName: 'Test',
      roles: ['user'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const res = await getProfile(cookie);
    expect(res.status).toBe(401);
  });

  it('returns 401 when JWT payload has roles as a string instead of an array', async () => {
    const cookie = await tokenCookie({
      sub: 1,
      email: 'a@b.com',
      displayName: 'Test',
      roles: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const res = await getProfile(cookie);
    expect(res.status).toBe(401);
  });

  it('returns 401 when JWT payload has sub as a string instead of a number', async () => {
    const cookie = await tokenCookie({
      sub: '1',
      email: 'a@b.com',
      displayName: 'Test',
      roles: ['user'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const res = await getProfile(cookie);
    expect(res.status).toBe(401);
  });
});
