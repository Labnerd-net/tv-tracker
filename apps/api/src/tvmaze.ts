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
    if (this.nextEpisodeLink) {
      try {
        const response = await fetch(this.nextEpisodeLink);
        const nextEpisodeData = await response.json();
        this.nextEpisode = nextEpisodeData.airdate;
      } catch (e) {
        logger.warn({ err: e }, 'Failed to fetch next episode');
        this.nextEpisode = '';
      }
    } else {
      this.nextEpisode = '';
    }
    if (this.prevEpisodeLink) {
      try {
        const response = await fetch(this.prevEpisodeLink);
        const prevEpisodeData = await response.json();
        this.prevEpisode = prevEpisodeData.airdate;
      } catch (e) {
        logger.warn({ err: e }, 'Failed to fetch previous episode');
        this.prevEpisode = '';
      }
    } else {
      this.prevEpisode = '';
    }
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
