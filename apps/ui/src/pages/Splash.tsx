import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function Splash() {
  const navigate = useNavigate();

  return (
    <Container maxWidth='sm'>
      <Box
        sx={{
          mt: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant='h3' component='h1' fontWeight='bold'>
          TV Show Tracker
        </Typography>

        <Typography variant='h6' color='text.secondary'>
          Keep track of what you're watching, what's next, and what you've missed.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant='contained' size='large' onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant='outlined' size='large' onClick={() => navigate('/register')}>
            Create Account
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
