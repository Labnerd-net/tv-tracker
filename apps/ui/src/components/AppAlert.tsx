import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

const severityMap: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  danger: 'error',
  success: 'success',
  warning: 'warning',
  primary: 'info',
  info: 'info',
};

export default function AppAlert({ alertVariant, alertMessage }: { alertVariant: string, alertMessage: string }) {
  const severity = severityMap[alertVariant] ?? 'info';
  return (
    <MuiAlert severity={severity}>
      <AlertTitle>{alertMessage}</AlertTitle>
    </MuiAlert>
  );
}
