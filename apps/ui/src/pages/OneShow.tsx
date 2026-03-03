import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import * as Api from '../apis/userRequests.ts';
import { logger } from '../utils/logger.ts';
import type { ShowData } from '@shared/types/tv-tracker.ts';
import { useAlert } from '../contexts/alert/AlertContext.tsx';
import { useShow } from '../contexts/show/ShowContext.tsx';

const PLACEHOLDER = 'https://placehold.co/210x295/0f1420/5a5248?text=NO+IMAGE';

export default function OneShow() {
  const { showID } = useParams();
  const alertProps = useAlert();
  const dataProps = useShow();
  const [tvShow, setTvShow] = useState<ShowData>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const retreiveTvShow = async () => {
      try {
        if (showID) {
          const response = await Api.getOneShow(showID);
          if (response.success && response.data) setTvShow(response.data);
        }
      } catch (err) {
        logger.error(err);
        setError('Failed to retrieve TV Show');
        alertProps.showAlert('danger', 'Failed to retrieve TV Show!');
      } finally {
        setLoading(false);
      }
    };
    retreiveTvShow();
  }, [alertProps, showID]);

  const refreshData = async () => {
    if (tvShow && showID) {
      setActionLoading(true);
      try {
        await Api.updateShow(showID);
        const response = await Api.getAllShows();
        dataProps.setTvShows(response.data ?? []);
        alertProps.showAlert('success', `${tvShow.title} updated`);
      } catch (err) {
        logger.error(err);
        alertProps.showAlert('danger', `Failed to update ${tvShow.title}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const deleteOneShow = async () => {
    if (tvShow) {
      setActionLoading(true);
      try {
        await Api.deleteShow(String(tvShow.showId));
        const response = await Api.getAllShows();
        dataProps.setTvShows(response.data ?? []);
        alertProps.showAlert('success', `${tvShow.title} removed`);
        navigate('/');
      } catch (err) {
        logger.error(err);
        alertProps.showAlert('danger', `Failed to delete ${tvShow.title}`);
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 54px)', bgcolor: 'var(--bg)' }}>
        <CircularProgress sx={{ color: 'var(--accent)' }} />
      </Box>
    );
  }

  if (error || !tvShow) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 54px)', bgcolor: 'var(--bg)' }}>
        <Box sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.75rem', color: 'var(--cream-muted)' }}>
          {error || 'Show not found'}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 54px)', bgcolor: 'var(--bg)' }}>
      {/* Blurred hero background */}
      <Box sx={{ position: 'relative', height: { xs: '200px', md: '320px' }, overflow: 'hidden' }}>
        {tvShow.imageLink && (
          <Box
            component="img"
            src={tvShow.imageLink}
            alt=""
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(28px) brightness(0.25) saturate(0.7)',
              transform: 'scale(1.12)',
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(8,11,18,0.3) 0%, var(--bg) 100%)',
          }}
        />
      </Box>

      {/* Content — overlaps the hero */}
      <Box
        sx={{
          maxWidth: '900px',
          mx: 'auto',
          px: { xs: 2, md: 4 },
          mt: { xs: '-100px', md: '-160px' },
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.5s ease both',
          animationDelay: '0.1s',
        }}
      >
        {/* Back button */}
        <Box
          component="button"
          onClick={() => navigate('/dashboard')}
          sx={{
            all: 'unset',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--cream-muted)',
            cursor: 'pointer',
            mb: '28px',
            transition: 'color 0.15s ease',
            '&:hover': { color: 'var(--cream)' },
          }}
        >
          ← All Shows
        </Box>

        {/* Main grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '140px 1fr', md: '200px 1fr' },
            gap: { xs: '20px', md: '36px' },
            alignItems: 'start',
          }}
        >
          {/* Poster */}
          <Box
            component="img"
            src={tvShow.imageLink ?? PLACEHOLDER}
            alt={tvShow.title}
            sx={{
              width: '100%',
              aspectRatio: '2 / 3',
              objectFit: 'cover',
              outline: '1px solid var(--border-strong)',
              display: 'block',
            }}
          />

          {/* Details */}
          <Box sx={{ pt: { xs: '8px', md: '16px' } }}>
            {/* Title */}
            <Box
              component="h1"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontWeight: 500,
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                lineHeight: 1.1,
                color: 'var(--cream)',
                m: 0,
                mb: '8px',
              }}
            >
              {tvShow.title}
            </Box>

            {/* Platform / Status */}
            <Box
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '0.66rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--cream-muted)',
                mb: '28px',
              }}
            >
              {[tvShow.platform, tvShow.status].filter(Boolean).join(' · ')}
            </Box>

            {/* Episode grid */}
            <Box
              sx={{
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                py: '20px',
                mb: '28px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                rowGap: '14px',
                columnGap: '24px',
                alignItems: 'center',
              }}
            >
              <Box sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cream-muted)' }}>
                Next
              </Box>
              <Box sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.8rem', color: tvShow.nextEpisode ? 'var(--amber)' : 'var(--cream-muted)' }}>
                {tvShow.nextEpisode || tvShow.status || '—'}
              </Box>

              <Box sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cream-muted)' }}>
                Prev
              </Box>
              <Box sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.8rem', color: 'var(--cream-dim)' }}>
                {tvShow.prevEpisode || '—'}
              </Box>

              {tvShow.scheduleTime && (
                <>
                  <Box sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cream-muted)' }}>
                    Airs
                  </Box>
                  <Box sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.8rem', color: 'var(--cream-dim)' }}>
                    {[tvShow.scheduleDay, tvShow.scheduleTime].filter(Boolean).join(' at ')}
                  </Box>
                </>
              )}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={refreshData}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={12} sx={{ color: 'inherit' }} /> : null}
                sx={{ color: 'var(--cream)', borderColor: 'var(--border-strong)', '&:hover': { borderColor: 'var(--cream)', background: 'rgba(232,224,208,0.05)' } }}
              >
                Refresh Data
              </Button>
              <Button
                variant="contained"
                onClick={deleteOneShow}
                disabled={actionLoading}
                sx={{ bgcolor: 'var(--accent)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
              >
                Remove Show
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
