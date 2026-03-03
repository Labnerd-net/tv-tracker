import { useState } from 'react';
import { useNavigate } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../contexts/auth/AuthContext.tsx';
import { useTheme } from '../contexts/theme/ThemeContext.tsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState('');

  const startSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (userInput.trim()) navigate(`/search/${userInput}/`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ minHeight: '54px !important', px: { xs: 2, md: 3 } }}>
        {/* Logo */}
        <Box
          component="a"
          href="/dashboard"
          sx={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
            flexGrow: 1,
            userSelect: 'none',
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: '1.35rem',
              fontWeight: 400,
              color: 'var(--accent)',
              lineHeight: 1,
            }}
          >
            TV
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.35rem',
              fontWeight: 400,
              letterSpacing: '0.18em',
              color: 'var(--cream)',
              lineHeight: 1,
            }}
          >
            TRACKER
          </Box>
        </Box>

        {user !== null && (
          <Box
            component="form"
            onSubmit={startSearch}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-strong)',
              mr: 2,
              '&:focus-within': { borderBottomColor: 'var(--accent)' },
              transition: 'border-color 0.2s ease',
            }}
          >
            <InputBase
              size="small"
              type="text"
              placeholder="Search shows…"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '0.72rem',
                color: 'var(--cream)',
                px: 1,
                py: 0.5,
                width: { xs: '120px', sm: '180px' },
                '& input::placeholder': {
                  color: 'var(--cream-muted)',
                  opacity: 1,
                },
              }}
            />
            <Box
              component="button"
              type="submit"
              sx={{
                all: 'unset',
                fontFamily: '"Space Mono", monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--cream-muted)',
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                transition: 'color 0.15s ease',
                '&:hover': { color: 'var(--cream)' },
              }}
            >
              Go
            </Box>
          </Box>
        )}

        {user !== null ? (
          <Box
            component="button"
            onClick={handleLogout}
            sx={{
              all: 'unset',
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--cream-muted)',
              cursor: 'pointer',
              mr: 1,
              transition: 'color 0.15s ease',
              '&:hover': { color: 'var(--cream)' },
            }}
          >
            Logout
          </Box>
        ) : (
          <Box
            component="button"
            onClick={() => navigate('/login')}
            sx={{
              all: 'unset',
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--cream-muted)',
              cursor: 'pointer',
              mr: 1,
              transition: 'color 0.15s ease',
              '&:hover': { color: 'var(--cream)' },
            }}
          >
            Login
          </Box>
        )}

        <IconButton
          onClick={toggleTheme}
          aria-label="toggle theme"
          size="small"
          sx={{ color: 'var(--cream-muted)', '&:hover': { color: 'var(--cream)' } }}
        >
          {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
