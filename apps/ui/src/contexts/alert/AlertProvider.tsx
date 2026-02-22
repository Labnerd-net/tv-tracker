import { type ReactNode, useCallback, useState } from 'react';
import { AlertContext } from './AlertContext';

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visibleAlert, setVisibleAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  const showAlert = useCallback(() => {
    setVisibleAlert(true);
    setTimeout(() => {
      setVisibleAlert(false);
    }, 5000);
  }, []);
  

  return (
    <AlertContext.Provider value={{ visibleAlert, alertVariant, setAlertVariant, alertMessage, setAlertMessage, showAlert }}>
      {children}
    </AlertContext.Provider>
  );
}
