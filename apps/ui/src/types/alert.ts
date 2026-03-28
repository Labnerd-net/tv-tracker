export type AlertVariant = 'danger' | 'warning' | 'success';

export interface AlertProps {
  visibleAlert: boolean,
  alertVariant: AlertVariant | '',
  alertMessage: string,
  showAlert: (variant: AlertVariant, message: string) => void
}
