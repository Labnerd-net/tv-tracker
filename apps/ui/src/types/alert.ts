export interface AlertProps {
  visibleAlert: boolean,
  alertVariant: string,
  alertMessage: string,
  showAlert: (variant: string, message: string) => void
}
