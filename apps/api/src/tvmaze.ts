import { type TvMazeShow } from '@shared/types/tvmaze.js';
import { getPlatformName } from '@shared/utils/tvmaze.js';
import logger from './utils/logger.js';

export default class TvMazeData {
  title: string;
  tvMazeId: number;
  platform: string;
  status: string;
  scheduleDays: string;
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
    this.scheduleDays = showData.schedule?.days?.[0] ?? '';
    this.scheduleTime = showData.schedule?.time ?? '';
    this.nextEpisodeLink = showData._links?.nextepisode?.href ?? '';
    this.prevEpisodeLink = showData._links?.previousepisode?.href ?? '';
    this.imageLink = showData.image?.medium ?? '';
    this.nextEpisode = '';
    this.prevEpisode = '';
    logger.debug({ title: this.title, tvMazeId: this.tvMazeId }, 'TvMazeData constructed');
  }

  returnPlatform(showData: TvMazeShow): string {
    return getPlatformName(showData) ?? '';
  }

  async updateEpisodes() {
    const fetchAirdate = async (link: string, label: string): Promise<string> => {
      if (!link) return '';
      try {
        const response = await fetch(link);
        const data = await response.json();
        return data.airdate ?? '';
      } catch (e) {
        logger.warn({ err: e }, `Failed to fetch ${label} episode`);
        return '';
      }
    };

    [this.nextEpisode, this.prevEpisode] = await Promise.all([
      fetchAirdate(this.nextEpisodeLink, 'next'),
      fetchAirdate(this.prevEpisodeLink, 'previous'),
    ]);
  }

  async returnImage(): Promise<Response | null> {
    if (this.imageLink) {
      try {
        return await fetch(this.imageLink);
      } catch {
        return null;
      }
    }
    return null;
  }
}
