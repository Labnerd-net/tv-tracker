import type { TvMazeShow } from '@shared/types/tvmaze';

export function getPlatformName(show: TvMazeShow): string | null {
  return show.network?.name ?? show.webChannel?.name ?? null;
}
