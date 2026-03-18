import { useState } from 'react';
import * as Api from '../apis/userRequests.ts';
import { logger } from '../utils/logger.ts';
import { useShow } from '../contexts/show/ShowContext.tsx';
import { useAlert } from '../contexts/alert/AlertContext.tsx';

export function useShowActions() {
  const { updateShow, removeShow } = useShow();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const refreshShow = async (showId: string, title: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      await Api.updateShow(showId);
      const response = await Api.getOneShow(showId);
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
      setLoading(false);
    }
  };

  const deleteShow = async (showId: string, title: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      const response = await Api.deleteShow(showId);
      if (response.success) {
        removeShow(Number(showId));
        showAlert('success', `${title} removed`);
        onSuccess?.();
      } else {
        showAlert('danger', response.error ?? `Failed to delete ${title}`);
      }
    } catch (err) {
      logger.error(err);
      showAlert('danger', `Failed to delete ${title}`);
    } finally {
      setLoading(false);
    }
  };

  return { loading, refreshShow, deleteShow };
}
