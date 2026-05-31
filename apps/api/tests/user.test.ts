import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import app from '../src/app.js';
import * as dbUserFunctions from '../src/db/dbUserFunctions.js';
import * as dbShowFunctions from '../src/db/dbShowFunctions.js';
import TvMazeData from '../src/tvmaze.js';
import { makeToken, mockEnv, mockCtx } from './helpers.js';
import * as jobQueue from '../src/utils/jobQueue.js';

vi.mock('../src/db/dbUserFunctions.js', () => ({
  returnUserByEmail: vi.fn().mockResolvedValue([]),
  returnUsers: vi.fn().mockResolvedValue([]),
  addUser: vi.fn().mockResolvedValue([]),
  returnUserById: vi.fn().mockResolvedValue([]),
  deleteUserById: vi.fn().mockResolvedValue(null),
}));

vi.mock('../src/db/dbShowFunctions.js', () => ({
  returnAllShows: vi.fn().mockResolvedValue([]),
  returnOneShowId: vi.fn().mockResolvedValue([]),
  returnOneShowTvMazeId: vi.fn().mockResolvedValue([]),
  addOneShow: vi.fn().mockResolvedValue([{ showId: 1 }]),
  updateOneShow: vi.fn().mockResolvedValue(undefined),
  updateShowEpisodes: vi.fn().mockResolvedValue(undefined),
  deleteOneShowId: vi.fn().mockResolvedValue([{ showId: 1 }]),
}));

vi.mock('../src/db/client.js', () => ({ getDb: vi.fn().mockReturnValue({}) }));

vi.mock('../src/utils/jobQueue.js', () => ({ scheduleEpisodeUpdate: vi.fn() }));

const mockUser = {
  userId: 1,
  email: 'test@test.com',
  displayName: 'Test User',
  passwordHash: 'hashed',
  roles: ['user'] as const,
  createdAt: new Date(),
};

const mockShow = {
  showId: 1,
  userId: 1,
  title: 'Test Show',
  tvMazeId: 123,
  platform: 'ABC',
  status: 'Running',
  scheduleDay: ['Monday'],
  scheduleTime: '20:00',
  prevEpisode: null,
  nextEpisode: null,
  imageLink: null,
};

const tvMazeShowJson = {
  id: 123,
  name: 'Test Show',
  status: 'Running',
  schedule: { days: ['Monday'], time: '20:00' },
  network: { name: 'ABC' },
  webChannel: null,
  image: { medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/0/1.jpg', original: '' },
  _links: {},
};

const fetchMock = vi.fn();
let token: string;
let authHeader: string;

beforeAll(async () => {
  token = await makeToken();
  authHeader = `accessToken=${token}`;
  vi.stubGlobal('fetch', fetchMock);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify(tvMazeShowJson),
  });
});

function get(path: string, headers: Record<string, string> = {}) {
  return app.request(path, { headers }, mockEnv, mockCtx);
}

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }, mockEnv, mockCtx);
}

function patch(path: string, headers: Record<string, string> = {}) {
  return app.request(path, { method: 'PATCH', headers }, mockEnv, mockCtx);
}

function del(path: string, headers: Record<string, string> = {}) {
  return app.request(path, { method: 'DELETE', headers }, mockEnv, mockCtx);
}

describe('GET /api/user/profile', () => {
  it('returns 401 with no token', async () => {
    const res = await get('/api/user/profile');
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(dbUserFunctions.returnUserById).mockResolvedValueOnce([]);
    const res = await get('/api/user/profile', { Cookie: authHeader });
    expect(res.status).toBe(404);
  });

  it('returns 200 with profile on success', async () => {
    vi.mocked(dbUserFunctions.returnUserById).mockResolvedValueOnce([mockUser]);
    const res = await get('/api/user/profile', { Cookie: authHeader });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.email).toBe('test@test.com');
  });
});

describe('GET /api/user/tvshows', () => {
  it('returns 200 with shows array', async () => {
    vi.mocked(dbShowFunctions.returnAllShows).mockResolvedValueOnce([mockShow]);
    const res = await get('/api/user/tvshows', { Cookie: authHeader });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe('GET /api/user/tvshow/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await get('/api/user/tvshow/abc', { Cookie: authHeader });
    expect(res.status).toBe(400);
  });

  it('returns 404 when show not found', async () => {
    vi.mocked(dbShowFunctions.returnOneShowId).mockResolvedValueOnce([]);
    const res = await get('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(404);
  });

  it('returns 200 with show on success', async () => {
    vi.mocked(dbShowFunctions.returnOneShowId).mockResolvedValueOnce([mockShow]);
    const res = await get('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.title).toBe('Test Show');
  });
});

describe('POST /api/user/tvshow (body)', () => {
  it('returns 400 when id field is missing', async () => {
    const res = await post(
      '/api/user/tvshow',
      { name: 'Test Show' },
      { Cookie: authHeader },
    );
    expect(res.status).toBe(400);
  });

  it('returns exists status for duplicate show', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([mockShow]);
    const res = await post(
      '/api/user/tvshow',
      { id: 123, name: 'Test Show' },
      { Cookie: authHeader },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('exists');
  });

  it('returns added status and showId on success', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    const res = await post(
      '/api/user/tvshow',
      tvMazeShowJson,
      { Cookie: authHeader },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('added');
    expect(body.data.showId).toBe(1);
  });

  it('returns 500 when DB insert yields no rows', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    vi.mocked(dbShowFunctions.addOneShow).mockResolvedValueOnce([]);
    const res = await post(
      '/api/user/tvshow',
      tvMazeShowJson,
      { Cookie: authHeader },
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Failed to save show');
  });

  it('schedules background episode update without blocking response', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    vi.mocked(dbShowFunctions.addOneShow).mockResolvedValueOnce([{ showId: 42 }]);
    const enqueueSpy = vi.spyOn(jobQueue, 'scheduleEpisodeUpdate');

    const res = await post('/api/user/tvshow', tvMazeShowJson, { Cookie: authHeader });
    expect(res.status).toBe(200);
    expect(enqueueSpy).toHaveBeenCalledOnce();
    expect(enqueueSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(TvMazeData), 42);
  });
});

describe('POST /api/user/tvshow/:id (TVMaze fetch)', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await post('/api/user/tvshow/abc', {}, { Cookie: authHeader });
    expect(res.status).toBe(400);
  });

  it('returns 502 when TVMaze returns non-OK', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    const res = await post('/api/user/tvshow/123', {}, { Cookie: authHeader });
    expect(res.status).toBe(502);
  });

  it('returns 502 when TVMaze returns an invalid response body', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{}' });
    const res = await post('/api/user/tvshow/123', {}, { Cookie: authHeader });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Invalid response from TVMaze');
  });

  it('returns added status on success', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(tvMazeShowJson),
    });
    const res = await post('/api/user/tvshow/123', {}, { Cookie: authHeader });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('added');
  });

  it('schedules background episode update without blocking response', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    vi.mocked(dbShowFunctions.addOneShow).mockResolvedValueOnce([{ showId: 42 }]);
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify(tvMazeShowJson) });
    const enqueueSpy = vi.spyOn(jobQueue, 'scheduleEpisodeUpdate');

    const res = await post('/api/user/tvshow/123', {}, { Cookie: authHeader });
    expect(res.status).toBe(200);
    expect(enqueueSpy).toHaveBeenCalledOnce();
    expect(enqueueSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(TvMazeData), 42);
  });

  it('returns 504 when TVMaze fetch times out', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    fetchMock.mockRejectedValueOnce(new DOMException('The operation timed out', 'TimeoutError'));
    const res = await post('/api/user/tvshow/123', {}, { Cookie: authHeader });
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toBe('TVMaze request timed out');
  });

  it('returns 502 when TVMaze response body exceeds 1 MB', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => 'x'.repeat(1_000_001) });
    const res = await post('/api/user/tvshow/123', {}, { Cookie: authHeader });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('TVMaze response too large');
  });

  it('returns 500 when DB insert returns no row', async () => {
    vi.mocked(dbShowFunctions.returnOneShowTvMazeId).mockResolvedValueOnce([]);
    vi.mocked(dbShowFunctions.addOneShow).mockResolvedValueOnce([]);
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify(tvMazeShowJson) });
    const res = await post('/api/user/tvshow/123', {}, { Cookie: authHeader });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to save show');
  });
});

describe('PATCH /api/user/tvshow/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await patch('/api/user/tvshow/abc', { Cookie: authHeader });
    expect(res.status).toBe(400);
  });

  it('returns 404 when show not found', async () => {
    vi.mocked(dbShowFunctions.returnOneShowId).mockResolvedValueOnce([]);
    const res = await patch('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(404);
  });

  it('returns 502 when TVMaze returns an invalid response body', async () => {
    vi.mocked(dbShowFunctions.returnOneShowId).mockResolvedValueOnce([mockShow]);
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{}' });
    const res = await patch('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Invalid response from TVMaze');
  });

  it('returns updated status on success', async () => {
    vi.mocked(dbShowFunctions.returnOneShowId).mockResolvedValueOnce([mockShow]);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(tvMazeShowJson),
    });
    const res = await patch('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('updated');
  });

  it('returns 502 when TVMaze response body exceeds 1 MB', async () => {
    vi.mocked(dbShowFunctions.returnOneShowId).mockResolvedValueOnce([mockShow]);
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => 'x'.repeat(1_000_001) });
    const res = await patch('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('TVMaze response too large');
  });
});

describe('DELETE /api/user/tvshow/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await del('/api/user/tvshow/abc', { Cookie: authHeader });
    expect(res.status).toBe(400);
  });

  it('returns 404 when no rows affected', async () => {
    vi.mocked(dbShowFunctions.deleteOneShowId).mockResolvedValueOnce([]);
    const res = await del('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(404);
  });

  it('returns deleted status on success', async () => {
    vi.mocked(dbShowFunctions.deleteOneShowId).mockResolvedValueOnce([{ showId: 1 }]);
    const res = await del('/api/user/tvshow/1', { Cookie: authHeader });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('deleted');
  });
});
