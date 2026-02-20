import { type TvMazeShow } from './types/tvmaze.js';

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
    console.log('Enter Constructor')
    this.title = (showData.name) ? showData.name : '';
    this.tvMazeId = (showData.id) ? showData.id: -1;
    console.log(`created title=${this.title} and tvmazeid=${this.tvMazeId}`);
    this.platform = this.returnPlatform(showData);
    console.log(`created platform=${this.platform}`);
    this.status = (showData.status) ? showData.status : '';
    console.log(`created status=${this.status}`)
    this.scheduleDays = (showData.schedule && showData.schedule.days && showData.schedule.days[0]) ?
      showData.schedule.days[0] : '';
    this.scheduleTime = (showData.schedule && showData.schedule.time) ?
      showData.schedule.time : '';
    console.log(`created scheduleDays=${this.scheduleDays} and scheduleTime=${this.scheduleTime}`);
    this.nextEpisodeLink = (showData._links && showData._links.nextepisode && showData._links.nextepisode.href) ? 
      showData._links.nextepisode.href : '';
    this.prevEpisodeLink = (showData._links && showData._links.previousepisode && showData._links.previousepisode.href) ? 
      showData._links.previousepisode.href : '';
    console.log(`created nextEpisodeLink=${this.nextEpisodeLink} and prevEpisodeLink=${this.prevEpisodeLink}`);
    this.imageLink = (showData.image && showData.image.medium) ?
      showData.image.medium : '';
    console.log(`created imageLink=${this.imageLink}`);
    this.nextEpisode = '';
    this.prevEpisode = '';
    console.log('Exit Constructor');
  }

  returnPlatform (showData: TvMazeShow): string {
    if (showData.network) {
      return showData.network.name;
    } else if (showData.webChannel) {
      return showData.webChannel.name;
    }
    return '';
  }

  async updateEpisodes () {
    if (this.nextEpisodeLink) {
      try { 
        const response = await fetch(this.nextEpisodeLink);
        const nextEpisodeData = await response.json();
        this.nextEpisode = nextEpisodeData.airdate;
      } catch (e) {
        console.log(e);
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
        console.log(e);
        this.prevEpisode = '';
      }
    } else {
      this.prevEpisode = '';
    }
  }

  async returnImage (): Promise<Response | null> {
    if (this.imageLink) {
      try {
        const image = await fetch(this.imageLink);
        return image;
      } catch {
        return null;
      }
    }
    return null;
  }
}