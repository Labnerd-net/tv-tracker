import { useState } from 'react';
import type { AuthProps, Credentials, UserData } from '../types/auth';
import type { AlertProps } from '../types/alert';
import type { ViewProps } from '../types/view';
import type { DataProps, ShowData } from '../types/data';
import * as Api from '../apis/requests';
import useToken from '../hooks/useToken';

export const useAuthProps = (): AuthProps => {
  const { token, setToken, removeToken } = useToken();
  const [user, setUser] = useState<UserData | null>(null);

  const login = async (credentials: Credentials): Promise<UserData> => {
    const response = await Api.loginUser(credentials);
    console.log(response);

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setToken(data);
    // Optionally decode token to set user info
    return data;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token,
  };
};

export const useAlertProps = (): AlertProps => {
  const [visibleAlert, setVisibleAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  const showAlert = () => {
    setVisibleAlert(true);
    setTimeout( () => {
      setVisibleAlert(false);
    }, 5000);
  };
  
  return { 
     visibleAlert, 
     alertVariant, setAlertVariant, 
     alertMessage, setAlertMessage, 
     showAlert,
  };
}

export const useViewProps = (): ViewProps => {
  const [viewValue, setViewValue] = useState('card');
  const views = [
    { viewName: 'Card View', value: 'card' },
    { viewName: 'Table View', value: 'table' },
  ];

  return {
    views, viewValue, setViewValue,
  };
}

export const useDataProps = (): DataProps => {
  const [tvShows, setTvShows] = useState<ShowData[]>([] as ShowData[]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortCol, setSortCol] = useState('');

  return {
    tvShows, setTvShows, sortOrder, setSortOrder, sortCol, setSortCol 
  };
}