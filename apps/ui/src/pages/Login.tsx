import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
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
    <Box
      sx={{
        minHeight: 'calc(100vh - 54px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'var(--bg)',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '380px',
          animation: 'fadeInUp 0.5s ease both',
          animationDelay: '0.05s',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: '40px', textAlign: 'center' }}>
          <Box
            component="div"
            sx={{
              width: '32px',
              height: '2px',
              background: 'var(--accent)',
              mx: 'auto',
              mb: '20px',
            }}
          />
          <Box
            component="h1"
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 400,
              fontSize: '2.6rem',
              color: 'var(--cream)',
              m: 0,
              letterSpacing: '0.02em',
            }}
          >
            Sign In
          </Box>
        </Box>

        {/* Error */}
        {error && (
          <Box
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.68rem',
              color: 'var(--accent)',
              border: '1px solid rgba(230,57,70,0.3)',
              background: 'rgba(230,57,70,0.08)',
              p: '10px 14px',
              mb: '20px',
              animation: 'fadeIn 0.3s ease both',
            }}
          >
            {error}
          </Box>
        )}

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !isValid}
            startIcon={loading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : null}
            sx={{
              mt: '8px',
              py: '10px',
              bgcolor: 'var(--accent)',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
              '&:disabled': { opacity: 0.45 },
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            mt: '28px',
            textAlign: 'center',
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.68rem',
            color: 'var(--cream-muted)',
          }}
        >
          No account?{' '}
          <Link
            component={RouterLink}
            to="/register"
            sx={{ color: 'var(--cream-dim)', textDecorationColor: 'var(--border-strong)', '&:hover': { color: 'var(--cream)' } }}
          >
            Register
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
