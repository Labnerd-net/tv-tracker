import type { ShowData } from "@shared/types/tv-tracker";

export interface DataProps {
    tvShows: ShowData[]
    setTvShows: React.Dispatch<React.SetStateAction<ShowData[]>>
    sortOrder: 'asc' | 'desc';
    setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>
    sortCol: string
    setSortCol: React.Dispatch<React.SetStateAction<string>>
}
