import { createTheme } from '@mui/material/styles';

const sharedSettings = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
};

export const darkTheme = createTheme({
  ...sharedSettings,
  palette: {
    mode: 'dark',
    primary: { main: '#546e7a' },
    secondary: { main: '#78909c' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#e0e0e0', secondary: '#9e9e9e' },
    error: { main: '#f44336' },
    warning: { main: '#ff9800' },
    success: { main: '#4caf50' },
    info: { main: '#2196f3' },
  },
});

export const lightTheme = createTheme({
  ...sharedSettings,
  palette: {
    mode: 'light',
    primary: { main: '#546e7a' },
    secondary: { main: '#78909c' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#212121', secondary: '#757575' },
    error: { main: '#f44336' },
    warning: { main: '#ed6c02' },
    success: { main: '#2e7d32' },
    info: { main: '#0288d1' },
  },
});
