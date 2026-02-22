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
import type { RegistrationFormData } from '@shared/types/tv-tracker';
import { registerUser } from '../apis/authRequests';
import { useAuth } from '../contexts/auth/AuthContext';

const RegistrationSchema = z
  .object({
    email: z.email('Please enter a valid email address'),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be less than 50 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Please repeat the password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function Registration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(RegistrationSchema),
    mode: 'onBlur',
  });

  const onSubmit: SubmitHandler<RegistrationFormData> = async (data) => {
    setLoading(true);
    setError(null);

    const { confirmPassword: _confirmPassword, ...registrationData } = data;
    const result = await registerUser(registrationData);

    if (result.success && result.data?.token) {
      try {
        await login(result.data.token);
        navigate('/dashboard');
      } catch {
        setError('Failed to load user profile');
      }
    } else {
      setError(result.error || 'Registration failed');
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
          Create Account
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
            label='Display Name'
            type='text'
            autoComplete='nickname'
            fullWidth
            {...register('displayName')}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
          />

          <TextField
            label='Password'
            type='password'
            autoComplete='new-password'
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <TextField
            label='Confirm Password'
            type='password'
            autoComplete='new-password'
            fullWidth
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button
            type='submit'
            variant='contained'
            fullWidth
            disabled={loading || !isValid}
            startIcon={loading ? <CircularProgress size={18} color='inherit' /> : null}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </Box>

        <Typography variant='body2'>
          Already have an account?{' '}
          <Link component={RouterLink} to='/login'>
            Sign In
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
