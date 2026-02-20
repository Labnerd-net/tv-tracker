import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { TvShowContext, ViewContext } from '../contexts/Contexts.ts';
import { useAuth } from '../contexts/auth/AuthContext.tsx';

export default function NavOffcanvas() {
  const { logout } = useAuth();
  const dataProps = useContext(TvShowContext);
  const viewProps = useContext(ViewContext);
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const startSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(userInput);
    navigate(`/search/${userInput}/`);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const sortFunction = (col: string) => {
    if (col === dataProps.sortCol) {
      dataProps.setSortOrder((dataProps.sortOrder === 'asc') ? 'desc' : 'asc');
    } else {
      dataProps.setSortCol(col);
      dataProps.setSortOrder('asc');
    }
    const sorted = [...dataProps.tvShows].sort((a, b) => {
      const multi = (dataProps.sortOrder === 'asc') ? 1 : -1;
      const sortingColumn = dataProps.sortCol as keyof typeof a;
      if (typeof a[sortingColumn] === 'string' && typeof b[sortingColumn] === 'string') {
        return multi * (a[sortingColumn].localeCompare(b[sortingColumn]));
      }
      return 0;
    });
    dataProps.setTvShows(sorted);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar position='sticky'>
        <Toolbar>
          <Typography
            component='a'
            href='/'
            variant='h6'
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            TV Show Tracker
          </Typography>
          <Button color='inherit' onClick={() => setNavOpen(true)}>Menu</Button>
        </Toolbar>
      </AppBar>

      <Drawer anchor='right' open={navOpen} onClose={() => setNavOpen(false)}>
        <Box sx={{ width: 280, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant='h6'>TV Show Tracker</Typography>

          <Box component='form' onSubmit={startSearch} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size='small'
              type='text'
              name='search'
              placeholder='Search TV Shows'
              value={userInput}
              onChange={onChange}
              fullWidth
            />
            <Button type='submit' variant='contained'>Go</Button>
          </Box>

          <Divider />
          <Typography variant='subtitle2'>View</Typography>
          {viewProps.views.map((view, idx) => (
            <Button key={idx} onClick={() => viewProps.setViewValue(view.value)} fullWidth>
              {view.viewName}
            </Button>
          ))}

          <Divider />
          <Typography variant='subtitle2'>Sort</Typography>
          <Button onClick={() => sortFunction('ShowTitle')} fullWidth>Sort by Show Title</Button>
          <Button onClick={() => sortFunction('ShowPlatform')} fullWidth>Sort by Platform</Button>
          <Button onClick={() => sortFunction('ShowStatus')} fullWidth>Sort by Show Status</Button>
          <Button onClick={() => sortFunction('PrevEpisode')} fullWidth>Sort by Previous Episode</Button>

          <Divider />
          <Button onClick={handleLogout} variant='outlined' color='error' fullWidth>Logout</Button>
        </Box>
      </Drawer>
    </>
  );
}
