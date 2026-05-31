import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../src/app.js';
import * as dbUserFunctions from '../src/db/dbUserFunctions.js';
import * as bcrypt from 'bcryptjs';
import { mockEnv, mockCtx } from './helpers.js';

vi.mock('../src/db/dbUserFunctions.js', () => ({
  returnUserByEmail: vi.fn().mockResolvedValue([]),
  returnUsers: vi.fn().mockResolvedValue([]),
  addUser: vi.fn().mockResolvedValue([]),
  returnUserById: vi.fn().mockResolvedValue([]),
  deleteUserById: vi.fn().mockResolvedValue(null),
  updateRefreshToken: vi.fn().mockResolvedValue(null),
  clearRefreshToken: vi.fn().mockResolvedValue(null),
  returnUserByRefreshTokenHash: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/db/client.js', () => ({ getDb: vi.fn().mockReturnValue({}) }));

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  compare: vi.fn().mockResolvedValue(true),
}));

const mockAdminUser = {
  userId: 1,
  email: 'admin@test.com',
  displayName: 'Admin User',
  passwordHash: 'hashed',
  roles: ['user', 'admin'] as const,
  createdAt: new Date(),
  refreshTokenHash: 'somehash',
  refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

const mockAdminProfile = {
  userId: mockAdminUser.userId,
  email: mockAdminUser.email,
  displayName: mockAdminUser.displayName,
  roles: mockAdminUser.roles,
};

function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, mockEnv, mockCtx);
}

async function getAdminAccessToken(): Promise<string> {
  vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([mockAdminUser]);
  vi.mocked(bcrypt.compare).mockResolvedValueOnce(true);
  const loginRes = await post('/api/auth/login', {
    email: 'admin@test.com',
    password: 'password123',
  });
  const setCookieHeader = loginRes.headers.get('set-cookie') ?? '';
  const match = setCookieHeader.match(/accessToken=([^;]+)/);
  return match?.[1] ?? '';
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/users', () => {
  it('returns 200 with user profiles that do not include sensitive fields', async () => {
    const token = await getAdminAccessToken();

    vi.mocked(dbUserFunctions.returnUsers).mockResolvedValueOnce([mockAdminProfile]);

    const res = await app.request('/api/admin/users', {
      headers: { Cookie: `accessToken=${token}` },
    }, mockEnv, mockCtx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const users = body.data.allUserProfiles;
    expect(users).toHaveLength(1);
    expect(users[0]).not.toHaveProperty('passwordHash');
    expect(users[0]).not.toHaveProperty('refreshTokenHash');
    expect(users[0]).not.toHaveProperty('refreshTokenExpiresAt');
    expect(users[0]).not.toHaveProperty('createdAt');
    expect(users[0]).toMatchObject({
      userId: 1,
      email: 'admin@test.com',
      displayName: 'Admin User',
    });
  });

  it('returns HTTP 500 (not 200) when DB throws', async () => {
    const token = await getAdminAccessToken();

    vi.mocked(dbUserFunctions.returnUsers).mockRejectedValueOnce(new Error('DB error'));

    const res = await app.request('/api/admin/users', {
      headers: { Cookie: `accessToken=${token}` },
    }, mockEnv, mockCtx);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('An unexpected error occurred');
    expect(body.error).not.toContain('DB error');
  });
});
