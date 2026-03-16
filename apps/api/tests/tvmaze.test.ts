import { describe, it, expect, vi, beforeEach } from 'vitest';
import TvMazeData from '../src/tvmaze.js';
import type { TvMazeShow } from '@shared/types/tvmaze.js';

const baseMockShow: TvMazeShow = {
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

describe('TvMazeData constructor imageLink validation', () => {
  it('keeps a valid static.tvmaze.com HTTPS URL', () => {
    const url = 'https://static.tvmaze.com/uploads/images/medium_portrait/0/1.jpg';
    const show = new TvMazeData({ ...baseMockShow, image: { medium: url, original: url } });
    expect(show.imageLink).toBe(url);
  });

  it('clears imageLink for a non-TVMaze hostname', () => {
    const show = new TvMazeData({
      ...baseMockShow,
      image: { medium: 'https://evil.example.com/img.jpg', original: '' },
    });
    expect(show.imageLink).toBe('');
  });

  it('clears imageLink for HTTP (non-HTTPS) URL', () => {
    const show = new TvMazeData({
      ...baseMockShow,
      image: { medium: 'http://static.tvmaze.com/img.jpg', original: '' },
    });
    expect(show.imageLink).toBe('');
  });

  it('clears imageLink for a malformed URL', () => {
    const show = new TvMazeData({
      ...baseMockShow,
      image: { medium: 'not-a-url', original: '' },
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
});
