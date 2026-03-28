import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { ShowContext } from './ShowContext';
import type { ShowData } from '@shared/types/tv-tracker';
import { useAuth } from '../auth/AuthContext';
import { useAlert } from '../alert/AlertContext';
import { getAllShows, updateShow as apiUpdateShow, deleteShow as apiDeleteShow, getOneShow } from '../../apis/userRequests';
import { logger } from '../../utils/logger';

export function ShowProvider({ children }: { children: ReactNode }) {
  const [tvShows, setTvShows] = useState<ShowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const { user, isLoading } = useAuth();
  const { showAlert } = useAlert();

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

  const refreshShow = useCallback(async (showId: string, title: string, onSuccess?: () => void) => {
    const numericId = Number(showId);
    setActionLoading(prev => ({ ...prev, [numericId]: true }));
    try {
      const updateResponse = await apiUpdateShow(showId);
      if (!updateResponse.success) {
        showAlert('danger', `Failed to update ${title}`);
        return;
      }
      const response = await getOneShow(showId);
      if (response.success && response.data) {
        updateShow(response.data);
        showAlert('success', `${title} updated`);
        onSuccess?.();
      } else {
        showAlert('danger', `Failed to update ${title}`);
      }
    } catch (err) {
      logger.error(err);
      showAlert('danger', `Failed to update ${title}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [numericId]: false }));
    }
  }, [updateShow, showAlert]);

  const deleteShow = useCallback(async (showId: string, title: string, onSuccess?: () => void) => {
    const numericId = Number(showId);
    setActionLoading(prev => ({ ...prev, [numericId]: true }));
    try {
      const response = await apiDeleteShow(showId);
      if (response.success) {
        removeShow(numericId);
        showAlert('success', `${title} removed`);
        onSuccess?.();
      } else {
        showAlert('danger', response.error ?? `Failed to delete ${title}`);
      }
    } catch (err) {
      logger.error(err);
      showAlert('danger', `Failed to delete ${title}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [numericId]: false }));
    }
  }, [removeShow, showAlert]);

  return (
    <ShowContext.Provider value={{ tvShows, loading, actionLoading, addShow, updateShow, removeShow, refreshShow, deleteShow }}>
      {children}
    </ShowContext.Provider>
  );
}
