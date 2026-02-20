import axios from 'axios';
import type { Credentials, RegistrationData } from '@shared/types/tv-tracker';
import { getAuthHeaders, handleApiError } from '../utils/requests';

const databaseAPI = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const path = 'api/auth';

export interface AuthResponse {
  success: boolean;
  data?: { token: string; id?: number };
  error?: string;
}

export async function loginUser(credentials: Credentials): Promise<AuthResponse> {
  try {
    const response = await axios.post(`${databaseAPI}/${path}/login`, credentials);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('loginUser', error);
  }
}

export async function registerUser(data: RegistrationData): Promise<AuthResponse> {
  try {
    const response = await axios.post(`${databaseAPI}/${path}/register`, data);
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('registerUser', error);
  }
}

export async function deleteUser(): Promise<AuthResponse> {
  try {
    const response = await axios.delete(`${databaseAPI}/${path}/deleteUser`, {
      headers: getAuthHeaders(),
    });
    if (response.data.ok) {
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.error };
  } catch (error) {
    return handleApiError('deleteUser', error);
  }
}
