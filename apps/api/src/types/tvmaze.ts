export interface Schedule {
    time: string;
    days: string[];
}

export interface Rating {
  average?: number;
}

export interface Country {
  name: string;
  code: string;
  timezone: string;
}

export interface Network {
  id: number;
  name: string;
  officialSite: string;
  country: Country;
}

export interface WebChannel {
  id: number;
  name: string;
  country: Country;
}

export interface Externals {
  tvrage?: number;
  thetvdb?: number;
  imdb: string;
}

export interface Image {
  medium: string;
  original: string;
}

export interface Self {
  href: string;
}

export interface Episode {
  href: string;
  name: string;
}

export interface Links {
  self: Self;
  previousepisode: Episode;
  nextepisode: Episode;
}

export interface TvMazeShow {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime: number;
  averageRuntime: number
  premiered: string;
  officialSite: string;
  schedule: Schedule;
  rating: Rating;
  weight: number;
  network: Network;
  webChannel: WebChannel;
  externals: Externals;
  image: Image;
  summary: string;
  updated: number;
  _links: Links;
}

export interface TvMazeSeries {
  score: number;
  show: TvMazeShow;
}