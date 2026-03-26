import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from '../src/contexts/theme/ThemeProvider';
import type { ShowData } from '@shared/types/tv-tracker.ts';
import type { TvMazeShow, TvMazeSeries } from '@shared/types/tvmaze.ts';

export function makeShow(overrides: Partial<ShowData> = {}): ShowData {
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

export function makeTvMazeShow(overrides: Partial<TvMazeShow> = {}): TvMazeShow {
  return {
    id: 1,
    url: 'https://api.tvmaze.com/shows/1',
    name: 'Test Series',
    type: 'Scripted',
    language: 'English',
    genres: [],
    status: 'Running',
    runtime: 60,
    averageRuntime: 60,
    premiered: '2020-01-01',
    officialSite: '',
    schedule: { time: '21:00', days: ['Monday'] },
    rating: { average: 8.5 },
    weight: 99,
    network: null,
    webChannel: null,
    externals: { tvrage: undefined, thetvdb: undefined, imdb: 'tt1234567' },
    image: null,
    summary: '',
    updated: 0,
    _links: { self: { href: 'https://api.tvmaze.com/shows/1' } },
    ...overrides,
  };
}

export function makeTvMazeSeries(overrides: Partial<TvMazeSeries> = {}): TvMazeSeries {
  return {
    score: 0.9,
    show: makeTvMazeShow(),
    ...overrides,
  };
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </ThemeProvider>
  );
}
