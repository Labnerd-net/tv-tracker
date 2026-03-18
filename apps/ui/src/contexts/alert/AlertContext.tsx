import { createContext, useContext } from 'react';
import type { AlertProps } from '../../types/alert.ts';

export const AlertContext = createContext<AlertProps | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within a AlertProvider');
  }
  return context;
}
