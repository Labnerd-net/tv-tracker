import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AlertContext } from './AlertContext';
import type { AlertVariant } from '../../types/alert.ts';

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visibleAlert, setVisibleAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState<AlertVariant | ''>('');
  const [alertMessage, setAlertMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showAlert = useCallback((variant: AlertVariant, message: string) => {
    setAlertVariant(variant);
    setAlertMessage(message);
    setVisibleAlert(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisibleAlert(false);
    }, 5000);
  }, []);

  return (
    <AlertContext.Provider value={{ visibleAlert, alertVariant, alertMessage, showAlert }}>
      {children}
    </AlertContext.Provider>
  );
}
