import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import app from '../src/app.js';
import * as dbUserFunctions from '../src/db/dbUserFunctions.js';
import * as dbShowFunctions from '../src/db/dbShowFunctions.js';
import { resetForTesting } from '../src/utils/rateLimiter.js';
import { makeToken } from './helpers.js';

// Mock DB functions but NOT rateLimiter — test 1 uses the real rate limiter.
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

vi.mock('../src/db/dbShowFunctions.js', () => ({
  returnAllShows: vi.fn().mockResolvedValue([]),
  returnOneShowId: vi.fn().mockResolvedValue([]),
  returnOneShowTvMazeId: vi.fn().mockResolvedValue([]),
  addOneShow: vi.fn().mockResolvedValue(undefined),
  updateOneShow: vi.fn().mockResolvedValue(undefined),
  deleteOneShowId: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  compare: vi.fn().mockResolvedValue(true),
}));

const mockUser = {
  userId: 1,
  email: 'test@test.com',
  displayName: 'Test User',
  passwordHash: 'hashed',
  roles: ['user'] as const,
  createdAt: new Date(),
  refreshTokenHash: 'somehash',
  refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

let authHeader: string;

beforeAll(async () => {
  const token = await makeToken();
  authHeader = `Bearer ${token}`;
});

beforeEach(() => {
  vi.clearAllMocks();
  resetForTesting();
});

// 1. POST /api/auth/refresh is rate-limited
describe('POST /api/auth/refresh rate limiting', () => {
  it('returns 429 on the 6th request', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/api/auth/refresh', { method: 'POST' });
      expect(res.status).toBe(401);
    }
    const res = await app.request('/api/auth/refresh', { method: 'POST' });
    expect(res.status).toBe(429);
  });
});

// 2. DELETE /api/auth/deleteUser clears refresh cookie
describe('DELETE /api/auth/deleteUser clears refresh cookie', () => {
  it('calls clearRefreshToken and sets Max-Age=0 cookie', async () => {
    vi.mocked(dbUserFunctions.returnUserById).mockResolvedValueOnce([mockUser]);
    vi.mocked(dbUserFunctions.deleteUserById).mockResolvedValueOnce({ rowsAffected: 1 } as never);

    const res = await app.request('/api/auth/deleteUser', {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });

    expect(res.status).toBe(200);
    expect(vi.mocked(dbUserFunctions.clearRefreshToken)).toHaveBeenCalledOnce();
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('refreshToken=');
    expect(cookie?.toLowerCase()).toContain('max-age=0');
  });
});

// 3. Multi-day schedule is stored as an array
describe('POST /api/user/tvshow stores multi-day schedule', () => {
  it('passes scheduleDays array to addOneShow', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);

    const body = {
      id: 123,
      name: 'Multi-Day Show',
      status: 'Running',
      schedule: { days: ['Monday', 'Tuesday'], time: '21:00' },
      network: { name: 'HBO' },
      webChannel: null,
      image: { medium: 'http://example.com/img.jpg' },
      _links: {},
    };

    const res = await app.request('/api/user/tvshow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(200);
    expect(vi.mocked(dbShowFunctions.addOneShow)).toHaveBeenCalledOnce();
    const showDataArg = vi.mocked(dbShowFunctions.addOneShow).mock.calls[0][1];
    expect(showDataArg.scheduleDays).toEqual(['Monday', 'Tuesday']);
  });
});

// 4. Body with only { id } returns 400 (name is now required)
describe('POST /api/user/tvshow body validation', () => {
  it('returns 400 when name is missing', async () => {
    const res = await app.request('/api/user/tvshow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ id: 123 }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});

// 5. First user is not auto-promoted to admin when ADMIN_EMAIL is unset
describe('POST /api/auth/register without ADMIN_EMAIL', () => {
  it('registers user with roles: [user] only', async () => {
    vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([]);
    vi.mocked(dbUserFunctions.addUser).mockResolvedValueOnce([
      { userId: 2, email: 'new@test.com', displayName: 'New', roles: ['user'] },
    ] as never);

    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new@test.com',
        password: 'password123',
        displayName: 'New',
      }),
    });

    expect(res.status).toBe(200);
    expect(vi.mocked(dbUserFunctions.addUser)).toHaveBeenCalledOnce();
    const addUserCall = vi.mocked(dbUserFunctions.addUser).mock.calls[0][1];
    expect(addUserCall.roles).toEqual(['user']);
    expect(addUserCall.roles).not.toContain('admin');
  });
});
