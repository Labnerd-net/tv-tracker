import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleEpisodeUpdate } from '../src/utils/jobQueue.js';
import * as dbShowFunctions from '../src/db/dbShowFunctions.js';
import logger from '../src/utils/logger.js';
import TvMazeData from '../src/tvmaze.js';

vi.mock('../src/db/dbShowFunctions.js', () => ({
  updateShowEpisodes: vi.fn().mockResolvedValue(undefined),
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

function makeCtx(): ExecutionContext {
  const promises: Promise<unknown>[] = [];
  return {
    waitUntil: (p: Promise<unknown>) => { promises.push(p); },
    passThroughOnException: () => {},
    props: {},
    abort: () => {},
  } as unknown as ExecutionContext;
}

const mockDb = {} as D1Database;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scheduleEpisodeUpdate', () => {
  it('calls ctx.waitUntil and resolves — updateShowEpisodes called and success logged', async () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const errorSpy = vi.spyOn(logger, 'error');
    const showData = makeShowData();
    vi.spyOn(showData, 'updateEpisodes').mockResolvedValueOnce({ next: '2026-04-01', prev: '2026-03-25' });

    const ctx = makeCtx();
    const waitSpy = vi.spyOn(ctx, 'waitUntil');

    scheduleEpisodeUpdate(ctx, mockDb as unknown as ReturnType<typeof import('../src/db/client.js').getDb>, showData, 42);

    expect(waitSpy).toHaveBeenCalledOnce();

    await vi.waitFor(() => {
      expect(vi.mocked(dbShowFunctions.updateShowEpisodes)).toHaveBeenCalledWith(
        mockDb,
        42,
        '2026-04-01',
        '2026-03-25',
      );
    });
    expect(infoSpy).toHaveBeenCalledWith({ showId: 42 }, 'episode update succeeded');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs error when updateEpisodes fails — updateShowEpisodes not called', async () => {
    const errorSpy = vi.spyOn(logger, 'error');
    const showData = makeShowData();
    vi.spyOn(showData, 'updateEpisodes').mockRejectedValueOnce(new Error('TVMaze down'));

    const ctx = makeCtx();

    scheduleEpisodeUpdate(ctx, mockDb as unknown as ReturnType<typeof import('../src/db/client.js').getDb>, showData, 7);

    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ showId: 7 }),
        'episode update failed',
      );
    });
    expect(vi.mocked(dbShowFunctions.updateShowEpisodes)).not.toHaveBeenCalled();
  });
});
