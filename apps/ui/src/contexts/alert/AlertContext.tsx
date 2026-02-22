import { createContext, useContext } from 'react';

interface AlertProps {
  visibleAlert: boolean,
  alertVariant: string,
  setAlertVariant: React.Dispatch<React.SetStateAction<string>>
  alertMessage: string,
  setAlertMessage: React.Dispatch<React.SetStateAction<string>>
  showAlert: () => void
}

export const AlertContext = createContext<AlertProps | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within a AlertProvider');
  }
  return context;
}
