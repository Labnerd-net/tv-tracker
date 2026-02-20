import axios from 'axios';
import { logger } from '../utils/logger';

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('jwt');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function handleApiError(caller: string, error: unknown): { success: false; error: string } {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    logger.error(`${caller} failed`, error.response.status, error.response.data.error);
    return { success: false, error: error.response.data.error };
  }
  logger.error(`${caller} unexpected error`, error);
  return { success: false, error: 'An unexpected error occurred' };
}
