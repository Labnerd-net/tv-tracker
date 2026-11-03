import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../src/app.js';
import * as dbUserFunctions from '../src/db/dbUserFunctions.js';
import * as dbShowFunctions from '../src/db/dbShowFunctions.js';
import * as jobQueue from '../src/utils/jobQueue.js';
import { SEED_SHOWS, MAX_DEMO_USERS, DEMO_EMAIL_DOMAIN, DEMO_REFRESH_WAIT_MS } from '../src/demo/seedShows.js';
import { mockEnv, mockCtx } from './helpers.js';

vi.mock('../src/db/dbUserFunctions.js', () => ({
  countDemoUsers: vi.fn().mockResolvedValue(0),
  deleteExpiredDemoUsers: vi.fn().mockResolvedValue([]),
  addUser: vi.fn().mockResolvedValue([
    { userId: 42, email: 'demo-x@demo.invalid', displayName: 'Demo Guest', roles: ['user'] },
  ]),
  updateRefreshToken: vi.fn().mockResolvedValue(null),
  returnUserByEmail: vi.fn().mockResolvedValue([]),
  returnUserById: vi.fn().mockResolvedValue([]),
  returnUserByRefreshTokenHash: vi.fn().mockResolvedValue([]),
  clearRefreshToken: vi.fn().mockResolvedValue(null),
  deleteUserById: vi.fn().mockResolvedValue(null),
  returnUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/db/dbShowFunctions.js', () => ({
  addSeedShows: vi.fn().mockResolvedValue([{ showId: 1, tvMazeId: 44933 }]),
}));

vi.mock('../src/db/client.js', () => ({ getDb: vi.fn().mockReturnValue({}) }));

vi.mock('../src/utils/jobQueue.js', () => ({
  refreshDemoShows: vi.fn().mockResolvedValue(undefined),
  scheduleEpisodeUpdate: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  compare: vi.fn().mockResolvedValue(true),
}));

const demo = () => app.request('/api/auth/demo', { method: 'POST' }, mockEnv, mockCtx);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/demo', () => {
  it('creates a seeded non-admin demo user and sets auth cookies', async () => {
    const res = await demo();
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const cookies = res.headers.getSetCookie().join(';');
    expect(cookies).toContain('accessToken=');
    expect(cookies).toContain('refreshToken=');

    const added = vi.mocked(dbUserFunctions.addUser).mock.calls[0][1];
    expect(added.email).toMatch(new RegExp(`^demo-[0-9a-f-]+@${DEMO_EMAIL_DOMAIN}$`));
    expect(added.roles).toEqual(['user']);
    expect(added.passwordHash).toBeTruthy();

    expect(dbShowFunctions.addSeedShows).toHaveBeenCalledWith({}, 42, SEED_SHOWS);
    expect(jobQueue.refreshDemoShows).toHaveBeenCalledWith({}, [{ showId: 1, tvMazeId: 44933 }]);
    expect(mockCtx.waitUntil).toHaveBeenCalledTimes(1);
  });

  it('waits for the refresh to finish before responding', async () => {
    const order: string[] = [];
    vi.mocked(jobQueue.refreshDemoShows).mockImplementationOnce(async () => {
      await new Promise(r => setTimeout(r, 20));
      order.push('refresh-done');
    });
    const res = await demo();
    order.push('responded');
    expect(res.status).toBe(200);
    expect(order).toEqual(['refresh-done', 'responded']);
  });

  it('stops waiting after the cap and still responds when the refresh hangs', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      vi.mocked(jobQueue.refreshDemoShows).mockImplementationOnce(() => new Promise<void>(() => {}));
      let responded = false;
      const pending = demo().then(r => { responded = true; return r; });
      // The route reaches its timer a few async hops in, so keep advancing until it responds.
      for (let i = 0; i < 20 && !responded; i++) {
        await vi.advanceTimersByTimeAsync(DEMO_REFRESH_WAIT_MS);
      }
      const res = await pending;
      expect(responded).toBe(true);
      expect(res.status).toBe(200);
      // the hung refresh was still handed to waitUntil so it can finish in the background
      expect(mockCtx.waitUntil).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns 503 when the cap is reached and cleanup frees nothing', async () => {
    vi.mocked(dbUserFunctions.countDemoUsers).mockResolvedValue(MAX_DEMO_USERS);
    const res = await demo();
    expect(res.status).toBe(503);
    expect(dbUserFunctions.deleteExpiredDemoUsers).toHaveBeenCalledTimes(1);
    expect(dbUserFunctions.addUser).not.toHaveBeenCalled();
    vi.mocked(dbUserFunctions.countDemoUsers).mockResolvedValue(0);
  });

  it('reclaims expired demo users at the cap and then succeeds', async () => {
    vi.mocked(dbUserFunctions.countDemoUsers)
      .mockResolvedValueOnce(MAX_DEMO_USERS)
      .mockResolvedValueOnce(MAX_DEMO_USERS - 5);
    const res = await demo();
    expect(res.status).toBe(200);
    expect(dbUserFunctions.deleteExpiredDemoUsers).toHaveBeenCalledTimes(1);
    expect(dbUserFunctions.addUser).toHaveBeenCalledTimes(1);
  });

  it('does not run cleanup when under the cap', async () => {
    await demo();
    expect(dbUserFunctions.deleteExpiredDemoUsers).not.toHaveBeenCalled();
  });

  it('returns a generic 500 when the database fails', async () => {
    vi.mocked(dbUserFunctions.addUser).mockRejectedValueOnce(new Error('secret db detail'));
    const res = await demo();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('An unexpected error occurred');
  });
});

describe('POST /api/auth/register reserved domain', () => {
  const register = (email: string) => app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', displayName: 'X' }),
  }, mockEnv, mockCtx);

  it.each(['a@demo.invalid', 'A@DEMO.INVALID'])('rejects %s with 400', async email => {
    const res = await register(email);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('This email domain is reserved');
    expect(dbUserFunctions.addUser).not.toHaveBeenCalled();
  });
});
