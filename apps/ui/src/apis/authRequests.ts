import type { ApiVoidResponse, Credentials, RegistrationData } from '@shared/types/tv-tracker';
import { client } from '../utils/honoClient';

export async function loginUser(credentials: Credentials): Promise<ApiVoidResponse> {
  try {
    const response = await client.api.auth.login.$post({ json: credentials });
    const data = await response.json();
    if (data.ok) return { success: true };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function registerUser(data: RegistrationData): Promise<ApiVoidResponse> {
  try {
    const response = await client.api.auth.register.$post({ json: data });
    const body = await response.json();
    if (body.ok) return { success: true };
    return { success: false, error: body.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function logoutUser(): Promise<ApiVoidResponse> {
  try {
    const response = await client.api.auth.logout.$post();
    const data = await response.json();
    if (data.ok) return { success: true };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteUser(): Promise<ApiVoidResponse> {
  try {
    const response = await client.api.auth.deleteUser.$delete();
    const data = await response.json();
    if (data.ok) return { success: true };
    return { success: false, error: data.error };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}
