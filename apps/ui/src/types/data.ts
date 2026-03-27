import type { ShowData } from "@shared/types/tv-tracker";

export interface DataProps {
    tvShows: ShowData[]
    addShow: (show: ShowData) => void
    updateShow: (show: ShowData) => void
    removeShow: (showId: number) => void
}
