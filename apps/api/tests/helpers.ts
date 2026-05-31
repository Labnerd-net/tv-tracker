import { sign } from 'hono/jwt';
import { vi } from 'vitest';

export const mockEnv = {
  TV_DB: {} as D1Database,
  JWT_SECRET: 'test-secret',
  ENVIRONMENT: 'test',
};

export const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

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
