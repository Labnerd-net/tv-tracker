import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Credentials } from '@shared/types/tv-tracker';
import { loginUser } from '../apis/authRequests';
import { useAuth } from '../contexts/auth/AuthContext';

const LoginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Credentials>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
  });

  const onSubmit: SubmitHandler<Credentials> = async (credentials) => {
    setLoading(true);
    setError(null);

    const result = await loginUser(credentials);

    if (result.success) {
      try {
        await login();
        navigate('/dashboard');
      } catch {
        setError('Failed to load user profile');
      }
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <Container maxWidth='xs'>
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant='h5' component='h1'>
          Sign In
        </Typography>

        {error && (
          <Alert severity='error' sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box
          component='form'
          onSubmit={handleSubmit(onSubmit)}
          sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label='Email'
            type='email'
            autoComplete='email'
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label='Password'
            type='password'
            autoComplete='current-password'
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            type='submit'
            variant='contained'
            fullWidth
            disabled={loading || !isValid}
            startIcon={loading ? <CircularProgress size={18} color='inherit' /> : null}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>

        <Typography variant='body2'>
          Don't have an account?{' '}
          <Link component={RouterLink} to='/register'>
            Register
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
