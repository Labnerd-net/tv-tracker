import type { TvMazeShow } from '../types/tvmaze.js';

export function getPlatformName(show: TvMazeShow): string | null {
  return show.network?.name ?? show.webChannel?.name ?? null;
}
