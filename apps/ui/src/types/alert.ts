export interface AlertProps {
  visibleAlert: boolean,
  alertVariant: string,
  setAlertVariant: React.Dispatch<React.SetStateAction<string>>
  alertMessage: string,
  setAlertMessage: React.Dispatch<React.SetStateAction<string>>
  showAlert: () => void
}
