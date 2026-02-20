import type { ProfileData } from '@shared/types/tv-tracker';
import axios from 'axios';
import { logger } from '../utils/logger';

const databaseAPI = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const path = 'api/admin';

export interface GetUsersResponse {
  success: boolean;
  data?: ProfileData[];
  error?: string;
}

export async function getUsers(): Promise<GetUsersResponse> {
  try {
    const token = localStorage.getItem('jwt');
    const response = await axios.get(
      `${databaseAPI}/${path}/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.data.ok) {
      return { success: true, data: response.data.data.allUserProfiles };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      logger.error('getUsers failed', error.response.status, error.response.data.error);
      return { success: false, error: error.response.data.error };
    }
    logger.error('getUsers unexpected error', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
