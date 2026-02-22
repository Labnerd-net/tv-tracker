import { type ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { getUserProfile } from '../../apis/userRequests';
import { apiClient, setLogoutCallback } from '../../utils/requests';
import type { ProfileData } from '@shared/types/tv-tracker';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore errors — clear state regardless
    }
    setUser(null);
  };

  // On mount: validate session via profile endpoint and wire up 401 interceptor
  useEffect(() => {
    setLogoutCallback(() => setUser(null));

    const initAuth = async () => {
      const profileData = await getUserProfile();
      if (profileData.success && profileData.data) {
        setUser(profileData.data);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async () => {
    const profileData = await getUserProfile();
    if (profileData.success && profileData.data) {
      setUser(profileData.data);
    } else {
      throw new Error(profileData.error || 'Failed to fetch user profile');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
