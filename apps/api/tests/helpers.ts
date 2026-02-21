import { sign } from 'hono/jwt';

export async function makeToken(overrides: Record<string, unknown> = {}) {
  return sign(
    {
      sub: 1,
      email: 'test@test.com',
      displayName: 'Test',
      roles: ['user'],
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    },
    'test-secret',
    'HS256',
  );
}
