import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../src/app.js';
import * as dbUserFunctions from '../src/db/dbUserFunctions.js';
import * as bcrypt from 'bcryptjs';

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

vi.mock('../src/utils/rateLimiter.js', () => ({
  authRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
  apiRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
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

function post(path: string, body: unknown, headers?: Record<string, string>) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('returns 400 when displayName is missing', async () => {
    const res = await post('/api/auth/register', {
      email: 'test@test.com',
      password: 'password123',
      displayName: '',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Display name is required');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await post('/api/auth/register', {
      email: 'notanemail',
      password: 'password123',
      displayName: 'Test',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid email format');
  });

  it('returns 400 when password is too short', async () => {
    const res = await post('/api/auth/register', {
      email: 'test@test.com',
      password: 'abc',
      displayName: 'Test',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Password must be at least 6 characters long');
  });

  it('returns 409 when user already exists', async () => {
    vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([mockUser]);
    const res = await post('/api/auth/register', {
      email: 'test@test.com',
      password: 'password123',
      displayName: 'Test',
    });
    expect(res.status).toBe(409);
  });

  it('returns 200 with access token and sets refreshToken cookie', async () => {
    vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([]);
    vi.mocked(dbUserFunctions.returnUsers).mockResolvedValueOnce([]);
    vi.mocked(dbUserFunctions.addUser).mockResolvedValueOnce([
      { userId: 1, email: 'test@test.com', displayName: 'Test', roles: ['user', 'admin'] },
    ]);
    const res = await post('/api/auth/register', {
      email: 'test@test.com',
      password: 'password123',
      displayName: 'Test',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(vi.mocked(dbUserFunctions.updateRefreshToken)).toHaveBeenCalledOnce();
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('refreshToken=');
    expect(cookie).toContain('HttpOnly');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await post('/api/auth/login', { email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await post('/api/auth/login', {
      email: 'notanemail',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid email format');
  });

  it('returns 401 for unknown user', async () => {
    vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([]);
    const res = await post('/api/auth/login', {
      email: 'unknown@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([mockUser]);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);
    const res = await post('/api/auth/login', {
      email: 'test@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 200 with access token and sets refreshToken cookie', async () => {
    vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([mockUser]);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true);
    const res = await post('/api/auth/login', {
      email: 'test@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(vi.mocked(dbUserFunctions.updateRefreshToken)).toHaveBeenCalledOnce();
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('refreshToken=');
    expect(cookie).toContain('HttpOnly');
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 401 when refresh cookie is absent', async () => {
    const res = await app.request('/api/auth/refresh', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when refresh token not found in DB', async () => {
    vi.mocked(dbUserFunctions.returnUserByRefreshTokenHash).mockResolvedValueOnce([]);
    const res = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { Cookie: 'refreshToken=unknowntoken' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when refresh token is expired', async () => {
    vi.mocked(dbUserFunctions.returnUserByRefreshTokenHash).mockResolvedValueOnce([
      { ...mockUser, refreshTokenExpiresAt: new Date(Date.now() - 1000) },
    ]);
    const res = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { Cookie: 'refreshToken=expiredtoken' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Refresh token expired');
  });

  it('returns 200 with new access token and rotates refresh cookie on valid token', async () => {
    vi.mocked(dbUserFunctions.returnUserByRefreshTokenHash).mockResolvedValueOnce([mockUser]);
    const res = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: { Cookie: 'refreshToken=validrawtoken' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(vi.mocked(dbUserFunctions.updateRefreshToken)).toHaveBeenCalledOnce();
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('refreshToken=');
    expect(cookie).toContain('HttpOnly');
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 401 without a valid access token', async () => {
    const res = await app.request('/api/auth/logout', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('clears refresh token from DB and cookie on valid logout', async () => {
    // First login to get a real access token
    vi.mocked(dbUserFunctions.returnUserByEmail).mockResolvedValueOnce([mockUser]);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true);
    const loginRes = await post('/api/auth/login', {
      email: 'test@test.com',
      password: 'password123',
    });
    const loginBody = await loginRes.json();
    const accessToken = loginBody.data.token;

    vi.clearAllMocks();

    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    expect(vi.mocked(dbUserFunctions.clearRefreshToken)).toHaveBeenCalledOnce();
    const cookie = res.headers.get('set-cookie');
    // Cookie should be cleared (max-age=0 or expires in past)
    expect(cookie).toContain('refreshToken=');
  });
});
