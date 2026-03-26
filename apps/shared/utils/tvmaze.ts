import type { TvMazeShow } from '../types/tvmaze.js';

export function getPlatformName(show: TvMazeShow): string | null {
  return show.network?.name ?? show.webChannel?.name ?? null;
}

export function sanitizeTvMazeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'static.tvmaze.com') {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}
