export interface ShowData {
  ShowId: string
  ShowTitle: string
  TvMazeId: number
  ShowPlatform: string
  ShowStatus: string
  ScheduleDay: string
  ScheduleTime: string
  PrevEpisode: string
  NextEpisode: string
  ImageLink: string
}

export type TvShows = ShowData[]
