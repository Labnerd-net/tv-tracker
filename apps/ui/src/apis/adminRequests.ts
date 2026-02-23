import type { ProfileData } from '@shared/types/tv-tracker';
import { apiClient, handleApiError } from '../utils/requests';

const path = 'api/admin';

export interface GetUsersResponse {
  success: boolean;
  data?: ProfileData[];
  error?: string;
}

export async function getUsers(): Promise<GetUsersResponse> {
  try {
    const response = await apiClient.get(`/${path}/users`);
    if (response.data.ok) {
      return { success: true, data: response.data.data.allUserProfiles };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('getUsers', error);
  }
}
