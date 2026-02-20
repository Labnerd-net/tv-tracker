import { createTheme } from '@mui/material/styles';

// College football inspired color palette
export const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Optional: Create a light mode theme variant
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});
