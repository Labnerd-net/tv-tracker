export interface ShowData {
  id: string
  title: string
  tvMazeId: number
  platform: string
  status: string
  scheduleDay: string
  scheduleTime: string
  prevEpisode: string
  nextEpisode: string
  imageLink: string
}

export interface DataProps {
    tvShows: ShowData[]
    setTvShows: React.Dispatch<React.SetStateAction<ShowData[]>>
    sortOrder: 'asc' | 'desc';
    setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>
    sortCol: string
    setSortCol: React.Dispatch<React.SetStateAction<string>>
}

export type TvShows = ShowData[]
