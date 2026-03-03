import { createTheme } from '@mui/material/styles';

const DARK_VARS = `
  :root {
    --bg: #080b12;
    --surface: #0f1420;
    --surface-elevated: #161d2e;
    --cream: #e8e0d0;
    --cream-dim: #a09688;
    --cream-muted: #5a5248;
    --accent: #e63946;
    --accent-hover: #c8102e;
    --amber: #f2a65a;
    --border: rgba(232, 224, 208, 0.08);
    --border-strong: rgba(232, 224, 208, 0.18);
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

const LIGHT_VARS = `
  :root {
    --bg: #f4f0e8;
    --surface: #ede8de;
    --surface-elevated: #e4ddd0;
    --cream: #1a1510;
    --cream-dim: #4a4038;
    --cream-muted: #9a8e80;
    --accent: #c8102e;
    --accent-hover: #a00a20;
    --amber: #c8760a;
    --border: rgba(26, 21, 16, 0.10);
    --border-strong: rgba(26, 21, 16, 0.22);
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

const buttonOverrides = {
  root: {
    fontFamily: '"Space Mono", monospace',
    fontSize: '0.68rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    borderRadius: '0px',
    padding: '8px 20px',
    minWidth: 'unset',
    boxShadow: 'none',
    '&:hover': { boxShadow: 'none' },
  },
};

const inputOverrides = {
  root: {
    '& .MuiInputBase-root': {
      fontFamily: '"Space Mono", monospace',
      fontSize: '0.82rem',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: '0px',
    },
    '& .MuiInputLabel-root': {
      fontFamily: '"Space Mono", monospace',
      fontSize: '0.72rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
    '& .MuiFormHelperText-root': {
      fontFamily: '"Space Mono", monospace',
      fontSize: '0.62rem',
    },
  },
};

export const darkTheme = createTheme({
  typography: { fontFamily: '"Space Mono", monospace' },
  shape: { borderRadius: 0 },
  palette: {
    mode: 'dark',
    primary: { main: '#e63946' },
    secondary: { main: '#f2a65a' },
    background: { default: '#080b12', paper: '#0f1420' },
    text: { primary: '#e8e0d0', secondary: '#7a7266' },
    error: { main: '#e63946' },
    warning: { main: '#f2a65a' },
    success: { main: '#4caf50' },
    info: { main: '#90caf9' },
    divider: 'rgba(232, 224, 208, 0.08)',
  },
  components: {
    MuiCssBaseline: { styleOverrides: DARK_VARS },
    MuiButton: { styleOverrides: buttonOverrides },
    MuiTextField: { styleOverrides: inputOverrides },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'rgba(8, 11, 18, 0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(232, 224, 208, 0.08)',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: '#0f1420',
          backgroundImage: 'none',
          borderRadius: '0px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.72rem',
          borderColor: 'rgba(232, 224, 208, 0.08)',
          color: '#e8e0d0',
          padding: '11px 16px',
        },
        head: {
          fontSize: '0.62rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: '#5a5248',
          background: '#161d2e',
          fontWeight: 400,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: 'rgba(232, 224, 208, 0.03)' },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.62rem',
          letterSpacing: '0.08em',
          border: '1px solid rgba(232, 224, 208, 0.18)',
          color: '#5a5248',
          borderRadius: '0px',
          padding: '5px 12px',
          '&.Mui-selected': {
            background: '#161d2e',
            color: '#e8e0d0',
            borderColor: 'rgba(232, 224, 208, 0.18)',
          },
          '&:hover': { background: 'rgba(232, 224, 208, 0.05)' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.72rem',
          borderRadius: '0px',
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  typography: { fontFamily: '"Space Mono", monospace' },
  shape: { borderRadius: 0 },
  palette: {
    mode: 'light',
    primary: { main: '#c8102e' },
    secondary: { main: '#c8760a' },
    background: { default: '#f4f0e8', paper: '#ede8de' },
    text: { primary: '#1a1510', secondary: '#9a8e80' },
    error: { main: '#c8102e' },
    warning: { main: '#c8760a' },
    success: { main: '#2e7d32' },
    info: { main: '#0288d1' },
    divider: 'rgba(26, 21, 16, 0.10)',
  },
  components: {
    MuiCssBaseline: { styleOverrides: LIGHT_VARS },
    MuiButton: { styleOverrides: buttonOverrides },
    MuiTextField: { styleOverrides: inputOverrides },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'rgba(244, 240, 232, 0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(26, 21, 16, 0.10)',
          color: '#1a1510',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: '#ede8de',
          backgroundImage: 'none',
          borderRadius: '0px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.72rem',
          borderColor: 'rgba(26, 21, 16, 0.10)',
          color: '#1a1510',
          padding: '11px 16px',
        },
        head: {
          fontSize: '0.62rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: '#9a8e80',
          background: '#e4ddd0',
          fontWeight: 400,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: 'rgba(26, 21, 16, 0.03)' },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.62rem',
          letterSpacing: '0.08em',
          border: '1px solid rgba(26, 21, 16, 0.22)',
          color: '#9a8e80',
          borderRadius: '0px',
          padding: '5px 12px',
          '&.Mui-selected': {
            background: '#e4ddd0',
            color: '#1a1510',
            borderColor: 'rgba(26, 21, 16, 0.22)',
          },
          '&:hover': { background: 'rgba(26, 21, 16, 0.05)' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.72rem',
          borderRadius: '0px',
        },
      },
    },
  },
});
