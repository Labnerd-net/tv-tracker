import type { ProfileData } from '@shared/types/tv-tracker';
import axios from 'axios';
import { getAuthHeaders, handleApiError } from '../utils/requests';

const databaseAPI = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const path = 'api/admin';

export interface GetUsersResponse {
  success: boolean;
  data?: ProfileData[];
  error?: string;
}

export async function getUsers(): Promise<GetUsersResponse> {
  try {
    const response = await axios.get(
      `${databaseAPI}/${path}/users`,
      { headers: getAuthHeaders() }
    );
    if (response.data.ok) {
      return { success: true, data: response.data.data.allUserProfiles };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getUsers', error);
  }
}
