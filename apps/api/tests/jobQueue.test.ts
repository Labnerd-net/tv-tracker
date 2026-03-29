import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import app from '../src/app.js';
import logger from '../src/utils/logger.js';
import * as dbShowFunctions from '../src/db/dbShowFunctions.js';
import { enqueueEpisodeUpdate, _resetForTesting } from '../src/utils/jobQueue.js';
import TvMazeData from '../src/tvmaze.js';
import { makeToken } from './helpers.js';

vi.mock('../src/db/dbShowFunctions.js', () => ({
  returnOneShowTvMazeId: vi.fn().mockResolvedValue([]),
  addOneShow: vi.fn().mockResolvedValue([{ showId: 1 }]),
  updateShowEpisodes: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/db/dbUserFunctions.js', () => ({
  returnUserByEmail: vi.fn().mockResolvedValue([]),
  returnUsers: vi.fn().mockResolvedValue([]),
  addUser: vi.fn().mockResolvedValue([]),
  returnUserById: vi.fn().mockResolvedValue([]),
  deleteUserById: vi.fn().mockResolvedValue(null),
}));

vi.mock('../src/db/client.js', () => ({ db: {} }));

vi.mock('../src/utils/rateLimiter.js', () => ({
  authRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
  apiRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
}));

const tvMazeShowJson = {
  id: 1,
  name: 'Test Show',
  status: 'Running',
  schedule: { days: ['Monday'], time: '20:00' },
  network: { name: 'ABC' },
  webChannel: null,
  image: { medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/0/1.jpg', original: '' },
  _links: {},
};

function makeShowData(): TvMazeData {
  return new TvMazeData(tvMazeShowJson);
}

let authHeader: string;

beforeAll(async () => {
  const token = await makeToken();
  authHeader = `accessToken=${token}`;
});

beforeEach(() => {
  vi.clearAllMocks();
  _resetForTesting();
});

describe('enqueueEpisodeUpdate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('succeeds on first attempt — updateShowEpisodes called once, info logged', async () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const warnSpy = vi.spyOn(logger, 'warn');
    const errorSpy = vi.spyOn(logger, 'error');
    const showData = makeShowData();
    vi.spyOn(showData, 'updateEpisodes').mockResolvedValueOnce({ next: '2026-04-01', prev: '2026-03-25' });

    enqueueEpisodeUpdate(showData, 42);

    await vi.waitFor(() => {
      expect(vi.mocked(dbShowFunctions.updateShowEpisodes)).toHaveBeenCalledOnce();
    });
    expect(vi.mocked(dbShowFunctions.updateShowEpisodes)).toHaveBeenCalledWith(
      expect.anything(), 42, '2026-04-01', '2026-03-25',
    );
    expect(infoSpy).toHaveBeenCalledWith({ showId: 42 }, 'episode update succeeded');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('fails once then succeeds on retry', async () => {
    vi.useFakeTimers();
    const warnSpy = vi.spyOn(logger, 'warn');
    const infoSpy = vi.spyOn(logger, 'info');
    const showData = makeShowData();
    vi.spyOn(showData, 'updateEpisodes')
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce({ next: '2026-04-01', prev: '2026-03-25' });

    enqueueEpisodeUpdate(showData, 7);

    // First attempt runs and fails
    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalledOnce();
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ showId: 7, attempt: 0 }),
      'episode update attempt failed',
    );
    expect(vi.mocked(dbShowFunctions.updateShowEpisodes)).not.toHaveBeenCalled();

    // Advance timers to fire the retry (5s backoff)
    await vi.advanceTimersByTimeAsync(5_000);

    await vi.waitFor(() => {
      expect(infoSpy).toHaveBeenCalledWith({ showId: 7 }, 'episode update succeeded');
    });
    expect(vi.mocked(dbShowFunctions.updateShowEpisodes)).toHaveBeenCalledOnce();
  });

  it('fails all retries — error logged, updateShowEpisodes never called', async () => {
    vi.useFakeTimers();
    const warnSpy = vi.spyOn(logger, 'warn');
    const errorSpy = vi.spyOn(logger, 'error');
    const showData = makeShowData();
    vi.spyOn(showData, 'updateEpisodes').mockRejectedValue(new Error('always fails'));

    enqueueEpisodeUpdate(showData, 99);

    // First attempt fails (attempt 0)
    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
    // Advance past first retry backoff (5s)
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
    // Advance past second retry backoff (15s)
    await vi.advanceTimersByTimeAsync(15_000);
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ showId: 99 }),
        'episode update failed after all retries',
      );
    });
    expect(vi.mocked(dbShowFunctions.updateShowEpisodes)).not.toHaveBeenCalled();
    // All 3 attempts log a warn; the final attempt also logs an error
    expect(warnSpy).toHaveBeenCalledTimes(3);
  });

  it('drops new jobs when queue is at max depth', async () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    // Fill the queue with 100 never-resolving jobs
    for (let i = 0; i < 100; i++) {
      const showData = makeShowData();
      vi.spyOn(showData, 'updateEpisodes').mockReturnValue(new Promise(() => {}));
      enqueueEpisodeUpdate(showData, i);
    }
    // 101st job should be dropped
    const droppedShow = makeShowData();
    const droppedSpy = vi.spyOn(droppedShow, 'updateEpisodes').mockResolvedValue({ next: '', prev: '' });
    enqueueEpisodeUpdate(droppedShow, 999);

    expect(warnSpy).toHaveBeenCalledWith({ showId: 999 }, 'job queue full, dropping episode update job');
    expect(droppedSpy).not.toHaveBeenCalled();
  });
});

describe('scheduleEpisodeUpdate integration', () => {
  it('calls enqueueEpisodeUpdate when a show is added via POST /api/user/tvshow', async () => {
    const enqueueSpy = vi.spyOn(
      await import('../src/utils/jobQueue.js'),
      'enqueueEpisodeUpdate',
    );
    vi.mocked(dbShowFunctions.addOneShow).mockResolvedValueOnce([{ showId: 55 }]);

    const res = await app.request('/api/user/tvshow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authHeader },
      body: JSON.stringify(tvMazeShowJson),
    });

    expect(res.status).toBe(200);
    expect(enqueueSpy).toHaveBeenCalledOnce();
    expect(enqueueSpy).toHaveBeenCalledWith(expect.any(TvMazeData), 55);
  });
});
