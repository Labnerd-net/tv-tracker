import { createContext, useContext } from 'react';

interface AlertProps {
  visibleAlert: boolean,
  alertVariant: string,
  alertMessage: string,
  showAlert: (variant: string, message: string) => void
}

export const AlertContext = createContext<AlertProps | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within a AlertProvider');
  }
  return context;
}
