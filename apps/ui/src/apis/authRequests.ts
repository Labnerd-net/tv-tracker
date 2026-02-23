import type { Credentials, RegistrationData } from '@shared/types/tv-tracker';
import { apiClient, handleApiError } from '../utils/requests';

const path = 'api/auth';

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export async function loginUser(credentials: Credentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post(`/${path}/login`, credentials);
    if (response.data.ok) {
      return { success: true };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('loginUser', error);
  }
}

export async function registerUser(data: RegistrationData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post(`/${path}/register`, data);
    if (response.data.ok) {
      return { success: true };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('registerUser', error);
  }
}

export async function deleteUser(): Promise<AuthResponse> {
  try {
    const response = await apiClient.delete(`/${path}/deleteUser`);
    if (response.data.ok) {
      return { success: true };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('deleteUser', error);
  }
}
