import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

export default function Splash() {
  const navigate = useNavigate();

  return (
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

        {/* Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: '12px',
            mt: '36px',
            justifyContent: 'center',
            animation: 'fadeIn 0.6s ease both',
            animationDelay: '0.55s',
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
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              bgcolor: 'var(--accent)',
              color: '#e8e0d0',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
            }}
          >
            Create Account
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
