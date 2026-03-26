import axios from 'axios';
import { logger } from '../utils/logger';

let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(fn: () => void) {
  logoutCallback = fn;
}

let isRefreshing = false;
let refreshQueue: Array<{ resolve: () => void; reject: (reason?: unknown) => void }> = [];

function processQueue(error: unknown) {
  if (error) {
    refreshQueue.forEach(({ reject }) => reject(error));
  } else {
    refreshQueue.forEach(({ resolve }) => resolve());
  }
  refreshQueue = [];
}

export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, { ...init, credentials: 'include' });

  if (response.status !== 401) return response;

  if (isRefreshing) {
    return new Promise<void>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    }).then(() => fetch(input, { ...init, credentials: 'include' }));
  }

  isRefreshing = true;
  try {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (!refreshResponse.ok) throw new Error('Refresh failed');
    processQueue(null);
    return fetch(input, { ...init, credentials: 'include' });
  } catch (err) {
    processQueue(err);
    logoutCallback?.();
    throw err;
  } finally {
    isRefreshing = false;
  }
}

export function handleApiError(caller: string, error: unknown): { success: false; error: string } {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    logger.error(`${caller} failed`, error.response.status, error.response.data.error);
    return { success: false, error: error.response.data.error };
  }
  logger.error(`${caller} unexpected error`, error);
  return { success: false, error: 'An unexpected error occurred' };
}
