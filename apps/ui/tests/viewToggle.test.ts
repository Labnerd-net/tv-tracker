import { describe, it, expect, beforeEach } from 'vitest';
import { sortShows } from '../src/utils/sortShows.ts';
import type { ShowData } from '@shared/types/tv-tracker.ts';

function makeShow(overrides: Partial<ShowData>): ShowData {
  return {
    showId: 1,
    userId: 1,
    title: 'Test Show',
    tvMazeId: 1,
    platform: null,
    status: null,
    scheduleDay: null,
    scheduleTime: null,
    prevEpisode: null,
    nextEpisode: null,
    imageLink: null,
    ...overrides,
  };
}

const SHOWS: ShowData[] = [
  makeShow({ showId: 1, title: 'Breaking Bad', nextEpisode: null }),
  makeShow({ showId: 2, title: 'Arrested Development', nextEpisode: '2025-03-01' }),
  makeShow({ showId: 3, title: 'Curb Your Enthusiasm', nextEpisode: '2025-01-15' }),
];

describe('localStorage round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads back "table" after writing it', () => {
    localStorage.setItem('showsViewMode', 'table');
    const stored = localStorage.getItem('showsViewMode');
    const mode = stored === 'card' || stored === 'table' ? stored : 'card';
    expect(mode).toBe('table');
  });

  it('defaults to "card" on invalid value', () => {
    localStorage.setItem('showsViewMode', 'grid');
    const stored = localStorage.getItem('showsViewMode');
    const mode = stored === 'card' || stored === 'table' ? stored : 'card';
    expect(mode).toBe('card');
  });

  it('defaults to "card" when key is absent', () => {
    const stored = localStorage.getItem('showsViewMode');
    const mode = stored === 'card' || stored === 'table' ? stored : 'card';
    expect(mode).toBe('card');
  });
});

describe('sortShows — title', () => {
  it('sorts ascending by title', () => {
    const result = sortShows(SHOWS, 'title', 'asc');
    expect(result.map(s => s.title)).toEqual([
      'Arrested Development',
      'Breaking Bad',
      'Curb Your Enthusiasm',
    ]);
  });

  it('sorts descending by title', () => {
    const result = sortShows(SHOWS, 'title', 'desc');
    expect(result.map(s => s.title)).toEqual([
      'Curb Your Enthusiasm',
      'Breaking Bad',
      'Arrested Development',
    ]);
  });
});

describe('sortShows — nextEpisode with nulls', () => {
  it('puts null last when ascending', () => {
    const result = sortShows(SHOWS, 'nextEpisode', 'asc');
    expect(result[result.length - 1].nextEpisode).toBeNull();
  });

  it('puts null first when descending', () => {
    const result = sortShows(SHOWS, 'nextEpisode', 'desc');
    expect(result[0].nextEpisode).toBeNull();
  });
});

describe('sortShows — does not mutate input', () => {
  it('returns a new array and leaves the original unchanged', () => {
    const originalIds = SHOWS.map(s => s.showId);
    const result = sortShows(SHOWS, 'title', 'desc');
    expect(result).not.toBe(SHOWS);
    expect(SHOWS.map(s => s.showId)).toEqual(originalIds);
  });
});
