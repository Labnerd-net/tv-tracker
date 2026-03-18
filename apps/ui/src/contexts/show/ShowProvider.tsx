import { type ReactNode, useState, useEffect } from 'react';
import { ShowContext } from './ShowContext';
import type { ShowData } from '@shared/types/tv-tracker';
import { useAuth } from '../auth/AuthContext';
import { getAllShows } from '../../apis/userRequests';

export function ShowProvider({ children }: { children: ReactNode }) {
  const [tvShows, setTvShows] = useState<ShowData[]>([]);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const fetchShows = async () => {
      if (!user) {
        setTvShows([]);
        return;
      }
      const response = await getAllShows();
      if (response.success && response.data) setTvShows(response.data);
    };
    fetchShows();
  }, [user, isLoading]);

  const addShow = (show: ShowData) => setTvShows(prev => [...prev, show]);
  const updateShow = (show: ShowData) => setTvShows(prev => prev.map(s => s.showId === show.showId ? show : s));
  const removeShow = (showId: number) => setTvShows(prev => prev.filter(s => s.showId !== showId));

  return (
    <ShowContext.Provider value={{ tvShows, addShow, updateShow, removeShow }}>
      {children}
    </ShowContext.Provider>
  );
}
