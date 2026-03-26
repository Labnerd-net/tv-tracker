import type { ReactNode } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

interface ShowCardProps {
  variant: 'card' | 'list';
  image: string;
  title: string;
  titleHref?: string;
  platform?: string;
  episodeLabel?: string;
  episodeInfo?: string;
  episodeHighlight?: boolean;
  episodeLoading?: boolean;
  actions?: ReactNode;
  onClick?: () => void;
  index?: number;
}

export default function ShowCard({
  variant,
  image,
  title,
  titleHref,
  platform,
  episodeLabel,
  episodeInfo,
  episodeHighlight,
  episodeLoading,
  actions,
  onClick,
  index = 0,
}: ShowCardProps) {
  if (variant === 'card') {
    return (
      <Box
        onClick={onClick}
        style={{ animationDelay: `${Math.min(index * 55, 900)}ms` }}
        sx={{
          position: 'relative',
          aspectRatio: '2 / 3',
          cursor: 'pointer',
          overflow: 'hidden',
          outline: '1px solid var(--border)',
          animation: 'fadeInUp 0.5s ease both',
          transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.35s ease, outline-color 0.2s ease',
          '&:hover': {
            transform: 'scale(1.03)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
            outlineColor: 'var(--border-strong)',
            zIndex: 1,
          },
          '&:hover .poster-img': { transform: 'scale(1.07)' },
          '&:hover .poster-scrim': { opacity: 1 },
          '&:hover .poster-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        }}
      >
        <Box
          component="img"
          className="poster-img"
          src={image || 'https://placehold.co/210x295/0f1420/5a5248?text=NO+IMAGE'}
          alt={title}
          loading="lazy"
          decoding="async"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: 'scale(1)',
            transition: 'transform 0.45s ease',
          }}
        />

        <Box
          className="poster-scrim"
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,11,18,0.97) 0%, rgba(8,11,18,0.75) 40%, rgba(8,11,18,0.15) 100%)',
            transition: 'opacity 0.3s ease',
            opacity: 0.88,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: '14px',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.08rem',
              fontWeight: 500,
              lineHeight: 1.2,
              color: 'var(--cream)',
              mb: '4px',
            }}
          >
            {title}
          </Box>

          {platform && (
            <Box
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '0.56rem',
                letterSpacing: '0.14em',
                color: 'var(--cream-muted)',
                textTransform: 'uppercase',
                mb: '10px',
              }}
            >
              {platform}
            </Box>
          )}

          <Box
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.62rem',
              color: episodeHighlight ? 'var(--amber)' : 'var(--cream-muted)',
              letterSpacing: '0.05em',
            }}
          >
            {episodeLabel && (
              <Box component="span" sx={{ opacity: 0.5, mr: '6px', fontSize: '0.54rem', letterSpacing: '0.12em' }}>
                {episodeLabel}
              </Box>
            )}
            {episodeInfo}
          </Box>

          <Box
            className="poster-actions"
            sx={{
              display: 'flex',
              gap: '8px',
              mt: '12px',
              opacity: 0,
              transform: 'translateY(8px)',
              transition: 'opacity 0.22s ease, transform 0.22s ease',
            }}
          >
            {actions}
          </Box>
        </Box>
      </Box>
    );
  }

  // list variant
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderBottom: '1px solid var(--border)',
        py: '14px',
        transition: 'background 0.15s ease',
        '&:hover': { background: 'var(--surface-elevated)' },
        animation: 'fadeInUp 0.4s ease both',
        px: '2px',
      }}
    >
      {image ? (
        <Box
          component="img"
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          sx={{
            width: '48px',
            height: '68px',
            objectFit: 'cover',
            flexShrink: 0,
            outline: '1px solid var(--border)',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '48px',
            height: '68px',
            flexShrink: 0,
            background: 'var(--surface-elevated)',
            outline: '1px solid var(--border)',
          }}
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {titleHref ? (
          <Box
            component={Link}
            to={titleHref}
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.15rem',
              fontWeight: 500,
              color: 'var(--cream)',
              textDecoration: 'none',
              display: 'block',
              lineHeight: 1.2,
              mb: '4px',
              '&:hover': { color: 'var(--accent)' },
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Box>
        ) : (
          <Box
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.15rem',
              fontWeight: 500,
              color: 'var(--cream)',
              display: 'block',
              lineHeight: 1.2,
              mb: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Box>
        )}
        <Box
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.6rem',
            color: 'var(--cream-muted)',
            letterSpacing: '0.06em',
          }}
        >
          {platform && <Box component="span" sx={{ mr: '8px' }}>{platform}</Box>}
          {episodeLoading
            ? <CircularProgress size={8} sx={{ color: 'var(--cream-muted)', verticalAlign: 'middle' }} />
            : <Box component="span" sx={{ color: episodeHighlight ? 'var(--amber)' : 'inherit' }}>{episodeInfo}</Box>
          }
        </Box>
      </Box>

      {actions}
    </Box>
  );
}
