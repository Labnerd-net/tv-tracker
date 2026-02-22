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

  return (
    <ShowContext.Provider value={{ tvShows, setTvShows }}>
      {children}
    </ShowContext.Provider>
  );
}
