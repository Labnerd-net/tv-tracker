import { useState } from 'react';
import * as Api from '../apis/userRequests.ts';
import { logger } from '../utils/logger.ts';
import { useShow } from '../contexts/show/ShowContext.tsx';
import { useAlert } from '../contexts/alert/AlertContext.tsx';

export function useShowActions() {
  const { setTvShows } = useShow();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const refreshShow = async (showId: string, title: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      await Api.updateShow(showId);
      const response = await Api.getOneShow(showId);
      if (response.success && response.data) {
        const updated = response.data;
        setTvShows(prev => prev.map(s => String(s.showId) === showId ? updated : s));
        showAlert('success', `${title} updated`);
        onSuccess?.();
      } else {
        showAlert('danger', `Failed to update ${title}`);
      }
    } catch (err) {
      logger.error(err);
      showAlert('danger', `Failed to update ${title}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteShow = async (showId: string, title: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      await Api.deleteShow(showId);
      setTvShows(prev => prev.filter(s => String(s.showId) !== showId));
      showAlert('success', `${title} removed`);
      onSuccess?.();
    } catch (err) {
      logger.error(err);
      showAlert('danger', `Failed to delete ${title}`);
    } finally {
      setLoading(false);
    }
  };

  return { loading, refreshShow, deleteShow };
}
