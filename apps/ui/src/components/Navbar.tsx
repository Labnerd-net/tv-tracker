import { useState } from 'react';
import { useNavigate } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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
    navigate(`/search/${userInput}/`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position='sticky'>
      <Toolbar>
        <Typography
          component='a'
          href='/dashboard'
          variant='h6'
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          TV Show Tracker
        </Typography>

        {user !== null ? (
          <>
            <Box component='form' onSubmit={startSearch} sx={{ display: 'flex', gap: 1, mr: 1 }}>
              <TextField
                size='small'
                type='text'
                name='search'
                placeholder='Search TV Shows'
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                sx={{ input: { color: 'inherit' } }}
              />
              <Button type='submit' color='inherit'>Go</Button>
            </Box>
            <Button color='inherit' onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <Button color='inherit' onClick={() => navigate('/login')}>Login</Button>
        )}

        <IconButton color='inherit' onClick={toggleTheme} aria-label='toggle theme'>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
