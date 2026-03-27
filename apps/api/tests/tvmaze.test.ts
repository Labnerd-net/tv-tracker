import { describe, it, expect, vi, beforeEach } from 'vitest';
import TvMazeData from '../src/tvmaze.js';
import logger from '../src/utils/logger.js';
import type { TvMazeShowInput } from '../src/schemas/show.js';

const baseMockShow: TvMazeShowInput = {
  id: 1,
  name: 'Test Show',
  status: 'Running',
  schedule: { days: ['Monday'], time: '20:00' },
  _links: {},
  image: null,
  network: null,
  webChannel: null,
  _embedded: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('TvMazeData constructor scheduleDays', () => {
  it('stores a multi-day array as-is', () => {
    const show = new TvMazeData({ ...baseMockShow, schedule: { days: ['Monday', 'Wednesday'], time: '21:00' } });
    expect(show.scheduleDays).toEqual(['Monday', 'Wednesday']);
  });

  it('stores an empty days array as empty array', () => {
    const show = new TvMazeData({ ...baseMockShow, schedule: { days: [], time: '21:00' } });
    expect(show.scheduleDays).toEqual([]);
  });

  it('stores a single-element days array as a one-element array', () => {
    const show = new TvMazeData({ ...baseMockShow, schedule: { days: ['Friday'], time: '22:00' } });
    expect(show.scheduleDays).toEqual(['Friday']);
  });

  it('defaults to empty array when schedule is missing', () => {
    const show = new TvMazeData({ ...baseMockShow, schedule: undefined });
    expect(show.scheduleDays).toEqual([]);
  });
});

describe('TvMazeData constructor imageLink validation', () => {
  it('keeps a valid static.tvmaze.com HTTPS URL', () => {
    const url = 'https://static.tvmaze.com/uploads/images/medium_portrait/0/1.jpg';
    const show = new TvMazeData({ ...baseMockShow, image: { medium: url } });
    expect(show.imageLink).toBe(url);
  });

  it('clears imageLink for a non-TVMaze hostname', () => {
    const show = new TvMazeData({
      ...baseMockShow,
      image: { medium: 'https://evil.example.com/img.jpg' },
    });
    expect(show.imageLink).toBe('');
  });

  it('clears imageLink for HTTP (non-HTTPS) URL', () => {
    const show = new TvMazeData({
      ...baseMockShow,
      image: { medium: 'http://static.tvmaze.com/img.jpg' },
    });
    expect(show.imageLink).toBe('');
  });

  it('clears imageLink for a malformed URL', () => {
    const show = new TvMazeData({
      ...baseMockShow,
      image: { medium: 'not-a-url' },
    });
    expect(show.imageLink).toBe('');
  });

  it('keeps imageLink as empty string when image is null', () => {
    const show = new TvMazeData({ ...baseMockShow, image: null });
    expect(show.imageLink).toBe('');
  });
});

describe('TvMazeData.updateEpisodes() URL validation', () => {
  it('fetches airdate for valid api.tvmaze.com URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ airdate: '2024-01-01' }),
    } as Response);

    const show = new TvMazeData({
      ...baseMockShow,
      _links: { nextepisode: { href: 'https://api.tvmaze.com/episodes/123' } },
    });
    await show.updateEpisodes();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(show.nextEpisode).toBe('2024-01-01');
  });

  it('skips fetch and returns empty string for non-tvmaze hostname', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const show = new TvMazeData({
      ...baseMockShow,
      _links: { nextepisode: { href: 'https://evil.example.com/ssrf' } },
    });
    await show.updateEpisodes();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(show.nextEpisode).toBe('');
  });

  it('returns empty string gracefully for a malformed URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const show = new TvMazeData({
      ...baseMockShow,
      _links: { nextepisode: { href: 'not-a-url' } },
    });
    await show.updateEpisodes();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(show.nextEpisode).toBe('');
  });

  it('returns empty string and logs a warning when TVMaze returns a non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
    } as Response);
    const warnSpy = vi.spyOn(logger, 'warn');

    const show = new TvMazeData({
      ...baseMockShow,
      _links: { nextepisode: { href: 'https://api.tvmaze.com/episodes/123' } },
    });
    const result = await show.updateEpisodes();

    expect(result).toEqual({ next: '', prev: '' });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 429 }),
      expect.any(String),
    );
  });
});

describe('TvMazeData constructor _embedded episode data', () => {
  it('populates nextEpisode and prevEpisode from _embedded when present', () => {
    const show = new TvMazeData({
      ...baseMockShow,
      _embedded: {
        nextepisode: { airdate: '2025-06-01' },
        previousepisode: { airdate: '2025-05-25' },
      },
    });
    expect(show.nextEpisode).toBe('2025-06-01');
    expect(show.prevEpisode).toBe('2025-05-25');
  });

  it('defaults nextEpisode and prevEpisode to empty string when _embedded is absent', () => {
    const show = new TvMazeData({ ...baseMockShow, _embedded: undefined });
    expect(show.nextEpisode).toBe('');
    expect(show.prevEpisode).toBe('');
  });

  it('handles minimal input (only id and name) without runtime errors', () => {
    const show = new TvMazeData({ id: 42, name: 'Minimal Show' });
    expect(show.tvMazeId).toBe(42);
    expect(show.title).toBe('Minimal Show');
    expect(show.scheduleDays).toEqual([]);
    expect(show.nextEpisode).toBe('');
    expect(show.prevEpisode).toBe('');
  });
});
