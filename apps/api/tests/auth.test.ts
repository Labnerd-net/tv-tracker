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
}));

vi.mock('../src/utils/rateLimiter.js', () => ({
  authRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
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
};

function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  it('returns 200 with JWT and includes admin role for first user', async () => {
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

  it('returns 200 with JWT on successful login', async () => {
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
  });
});
