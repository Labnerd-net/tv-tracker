import { useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { loginDemo } from '../apis/authRequests';
import { useAuth } from '../contexts/auth/AuthContext';
import { useTheme } from '../contexts/theme/ThemeContext';

const REPO_URL = 'https://github.com/Labnerd-net/tv-tracker';

const SCREENSHOTS = [
  {
    key: 'cards',
    width: 1600,
    height: 435,
    alt: 'TV Tracker dashboard in card view, showing poster cards with platform and the next or last episode date',
  },
  {
    key: 'table',
    width: 1600,
    height: 536,
    alt: 'TV Tracker dashboard in table view, listing shows with platform, status, schedule, and next and previous episode dates',
  },
] as const;

const FEATURES = [
  {
    title: 'Search and add',
    text: 'Look up any show on TVMaze and add it to your watchlist in one click.',
  },
  {
    title: 'Never miss an episode',
    text: 'See the previous and next airdate for every show, and refresh a show to pull the latest status and dates.',
  },
  {
    title: 'Cards or table',
    text: 'Browse your list as poster cards or a compact table with sortable columns.',
  },
];

export default function Splash() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDemo = async () => {
    setLoading(true);
    setError(null);

    const result = await loginDemo();

    if (result.success) {
      try {
        await login();
        navigate('/dashboard');
      } catch {
        setError('Failed to load user profile');
      }
    } else {
      setError(result.error || 'Demo unavailable');
    }

    setLoading(false);
  };

  return (
    <>
    <Box
      sx={{
        minHeight: 'calc(100vh - 54px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'var(--bg)',
        // Subtle radial vignette
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, var(--surface-elevated) 0%, var(--bg) 70%)',
      }}
    >
      {/* CRT scanlines */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.012) 2px,
            rgba(255,255,255,0.012) 4px
          )`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Decorative corner marks */}
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
        <Box
          key={pos}
          aria-hidden
          sx={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            borderTop: pos.includes('top') ? '1px solid var(--border-strong)' : 'none',
            borderBottom: pos.includes('bottom') ? '1px solid var(--border-strong)' : 'none',
            borderLeft: pos.includes('left') ? '1px solid var(--border-strong)' : 'none',
            borderRight: pos.includes('right') ? '1px solid var(--border-strong)' : 'none',
            top: pos.includes('top') ? '28px' : 'auto',
            bottom: pos.includes('bottom') ? '28px' : 'auto',
            left: pos.includes('left') ? '28px' : 'auto',
            right: pos.includes('right') ? '28px' : 'auto',
            opacity: 0.4,
            animation: 'fadeIn 1s ease both',
            animationDelay: '0.8s',
          }}
        />
      ))}

      {/* Main content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: 3,
        }}
      >
        {/* Big italic TV */}
        <Box
          component="h1"
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(5rem, 14vw, 9.5rem)',
            lineHeight: 0.85,
            color: 'var(--cream)',
            m: 0,
            animation: 'fadeInUp 0.7s ease both',
            animationDelay: '0.05s',
          }}
        >
          TV
        </Box>

        {/* TRACKER spaced */}
        <Box
          component="div"
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            letterSpacing: '0.35em',
            lineHeight: 1,
            color: 'var(--cream)',
            mt: '4px',
            animation: 'fadeInUp 0.7s ease both',
            animationDelay: '0.15s',
          }}
        >
          TRACKER
        </Box>

        {/* Thin rule */}
        <Box
          aria-hidden
          sx={{
            width: '160px',
            height: '1px',
            background: 'var(--border-strong)',
            mx: 'auto',
            my: '28px',
            animation: 'fadeIn 0.6s ease both',
            animationDelay: '0.3s',
          }}
        />

        {/* Tagline */}
        <Box
          component="p"
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.62rem',
            letterSpacing: '0.16em',
            color: 'var(--cream-muted)',
            textTransform: 'uppercase',
            m: 0,
            animation: 'fadeIn 0.6s ease both',
            animationDelay: '0.4s',
          }}
        >
          Season by season. Episode by episode.
        </Box>

        {/* Demo (primary call to action) */}
        <Box
          sx={{
            mt: '36px',
            animation: 'fadeIn 0.6s ease both',
            animationDelay: '0.55s',
          }}
        >
          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={onDemo}
            startIcon={loading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : null}
            sx={{
              bgcolor: 'var(--accent)',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
              '&:disabled': { opacity: 0.45 },
            }}
          >
            {loading ? 'Loading demo…' : 'Try the demo'}
          </Button>
          <Box
            component="p"
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.58rem',
              letterSpacing: '0.12em',
              color: 'var(--cream-muted)',
              textTransform: 'uppercase',
              m: '10px 0 0',
            }}
          >
            No sign-up needed
          </Box>
          {error && (
            <Box
              role="alert"
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '0.68rem',
                color: 'var(--accent)',
                mt: '12px',
              }}
            >
              {error}
            </Box>
          )}
        </Box>

        {/* Account buttons */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            mt: '24px',
            justifyContent: 'center',
            animation: 'fadeIn 0.6s ease both',
            animationDelay: '0.65s',
          }}
        >
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              color: 'var(--cream)',
              borderColor: 'var(--border-strong)',
              '&:hover': { borderColor: 'var(--cream)', background: 'rgba(232,224,208,0.05)' },
            }}
          >
            Sign In
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              color: 'var(--cream)',
              borderColor: 'var(--border-strong)',
              '&:hover': { borderColor: 'var(--cream)', background: 'rgba(232,224,208,0.05)' },
            }}
          >
            Create Account
          </Button>
        </Box>
      </Box>
    </Box>

    <Box
      component="section"
      aria-label="Features"
      sx={{ bgcolor: 'var(--bg)', px: 3, py: { xs: '56px', md: '80px' } }}
    >
      <Box sx={{ maxWidth: '1100px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', mb: { xs: '40px', md: '64px' } }}>
          {SCREENSHOTS.map(({ key, width, height, alt }) => (
            <Box
              key={key}
              component="img"
              src={`/dashboard-${key === 'cards' ? 'cards-' : ''}${mode}.webp`}
              alt={alt}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
              sx={{
                display: 'block',
                width: '100%',
                height: 'auto',
                border: '1px solid var(--border-strong)',
              }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '32px',
          }}
        >
          {FEATURES.map((f, i) => (
            <Box key={f.title} sx={{ borderTop: '1px solid var(--border-strong)', pt: '16px' }}>
              <Box
                component="div"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.62rem',
                  letterSpacing: '0.16em',
                  color: 'var(--amber)',
                  mb: '10px',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </Box>
              <Box
                component="h2"
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontWeight: 400,
                  fontSize: '1.7rem',
                  lineHeight: 1.1,
                  color: 'var(--cream)',
                  m: '0 0 10px',
                }}
              >
                {f.title}
              </Box>
              <Box
                component="p"
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.7rem',
                  lineHeight: 1.7,
                  color: 'var(--cream-muted)',
                  m: 0,
                }}
              >
                {f.text}
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: '56px',
            pt: '20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px 24px',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.62rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--cream-muted)',
          }}
        >
          <span>React 19 · MUI · Hono · Cloudflare Workers + D1 · TypeScript</span>
          <Box
            component="a"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'var(--cream-dim)',
              textDecorationColor: 'var(--border-strong)',
              '&:hover': { color: 'var(--cream)' },
            }}
          >
            View source on GitHub
          </Box>
        </Box>
      </Box>
    </Box>
    </>
  );
}
