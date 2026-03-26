import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { ShowContext } from './ShowContext';
import type { ShowData } from '@shared/types/tv-tracker';
import { useAuth } from '../auth/AuthContext';
import { getAllShows } from '../../apis/userRequests';

export function ShowProvider({ children }: { children: ReactNode }) {
  const [tvShows, setTvShows] = useState<ShowData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const fetchShows = async () => {
      if (!user) {
        setTvShows([]);
        setLoading(false);
        return;
      }
      const response = await getAllShows();
      if (response.success && response.data) setTvShows(response.data);
      setLoading(false);
    };
    fetchShows();
  }, [user, isLoading]);

  const addShow = useCallback((show: ShowData) => setTvShows(prev => [...prev, show]), []);
  const updateShow = useCallback((show: ShowData) => setTvShows(prev => prev.map(s => s.showId === show.showId ? show : s)), []);
  const removeShow = useCallback((showId: number) => setTvShows(prev => prev.filter(s => s.showId !== showId)), []);

  return (
    <ShowContext.Provider value={{ tvShows, loading, addShow, updateShow, removeShow }}>
      {children}
    </ShowContext.Provider>
  );
}
