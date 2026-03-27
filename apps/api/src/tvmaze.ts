import { type TvMazeShow } from '@shared/types/tvmaze.js';
import { getPlatformName } from '@shared/utils/tvmaze.js';
import logger from './utils/logger.js';

export default class TvMazeData {
  title: string;
  tvMazeId: number;
  platform: string;
  status: string;
  scheduleDays: string[];
  scheduleTime: string;
  nextEpisodeLink: string;
  prevEpisodeLink: string;
  imageLink: string;
  nextEpisode: string;
  prevEpisode: string;

  constructor(showData: TvMazeShow) {
    this.title = showData.name ?? '';
    this.tvMazeId = showData.id ?? -1;
    this.platform = this.returnPlatform(showData);
    this.status = showData.status ?? '';
    this.scheduleDays = showData.schedule?.days ?? [];
    this.scheduleTime = showData.schedule?.time ?? '';
    this.nextEpisodeLink = showData._links?.nextepisode?.href ?? '';
    this.prevEpisodeLink = showData._links?.previousepisode?.href ?? '';
    this.imageLink = this.sanitizeImageUrl(showData.image?.medium ?? '');
    this.nextEpisode = showData._embedded?.nextepisode?.airdate ?? '';
    this.prevEpisode = showData._embedded?.previousepisode?.airdate ?? '';
    logger.debug({ title: this.title, tvMazeId: this.tvMazeId }, 'TvMazeData constructed');
  }

  returnPlatform(showData: TvMazeShow): string {
    return getPlatformName(showData) ?? '';
  }

  private sanitizeImageUrl(url: string): string {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'static.tvmaze.com') {
        logger.warn({ url }, 'Rejected non-TVMaze image URL');
        return '';
      }
      return url;
    } catch {
      logger.warn({ url }, 'Rejected malformed image URL');
      return '';
    }
  }

  async updateEpisodes(): Promise<{ next: string; prev: string }> {
    const fetchAirdate = async (link: string, label: string): Promise<string> => {
      if (!link) return '';
      try {
        const url = new URL(link);
        if (url.hostname !== 'api.tvmaze.com') {
          logger.warn({ link }, `Rejected non-TVMaze URL for ${label} episode`);
          return '';
        }
        const response = await fetch(link);
        if (!response.ok) {
          logger.warn({ link, status: response.status }, `Non-OK response from TVMaze for ${label} episode`);
          return '';
        }
        const data = await response.json();
        return data.airdate ?? '';
      } catch (e) {
        logger.warn({ err: e }, `Failed to fetch ${label} episode`);
        return '';
      }
    };

    [this.nextEpisode, this.prevEpisode] = await Promise.all([
      this.nextEpisode ? this.nextEpisode : fetchAirdate(this.nextEpisodeLink, 'next'),
      this.prevEpisode ? this.prevEpisode : fetchAirdate(this.prevEpisodeLink, 'previous'),
    ]);

    return { next: this.nextEpisode, prev: this.prevEpisode };
  }

}
