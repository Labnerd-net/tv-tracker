import axios from 'axios';
import { logger } from '../utils/logger';

const databaseAPI = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: databaseAPI,
  withCredentials: true,
});

let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(fn: () => void) {
  logoutCallback = fn;
}

let isRefreshing = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let refreshQueue: Array<{ resolve: (value: any) => void; reject: (reason?: unknown) => void }> = [];

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post(`${databaseAPI}/api/auth/refresh`, {}, { withCredentials: true });
      refreshQueue.forEach(({ resolve }) => resolve(undefined));
      refreshQueue = [];
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach(({ reject }) => reject(refreshError));
      refreshQueue = [];
      logoutCallback?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export function handleApiError(caller: string, error: unknown): { success: false; error: string } {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    logger.error(`${caller} failed`, error.response.status, error.response.data.error);
    return { success: false, error: error.response.data.error };
  }
  logger.error(`${caller} unexpected error`, error);
  return { success: false, error: 'An unexpected error occurred' };
}
