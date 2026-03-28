import { createContext, useContext } from 'react';
import type { ShowData } from "@shared/types/tv-tracker";

export interface ShowProps {
    tvShows: ShowData[]
    loading: boolean
    actionLoading: Record<number, boolean>
    addShow: (show: ShowData) => void
    updateShow: (show: ShowData) => void
    removeShow: (showId: number) => void
    refreshShow: (showId: string, title: string, onSuccess?: () => void) => Promise<void>
    deleteShow: (showId: string, title: string, onSuccess?: () => void) => Promise<void>
}

export const ShowContext = createContext<ShowProps | undefined>(undefined);

export function useShow() {
  const context = useContext(ShowContext);
  if (context === undefined) {
    throw new Error('useShow must be used within a ShowProvider');
  }
  return context;
}
