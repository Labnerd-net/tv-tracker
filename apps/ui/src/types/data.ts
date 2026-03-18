import type { ShowData } from "@shared/types/tv-tracker";

export interface DataProps {
    tvShows: ShowData[]
    addShow: (show: ShowData) => void
    updateShow: (show: ShowData) => void
    removeShow: (showId: number) => void
    sortOrder: 'asc' | 'desc';
    setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>
    sortCol: string
    setSortCol: React.Dispatch<React.SetStateAction<string>>
}
