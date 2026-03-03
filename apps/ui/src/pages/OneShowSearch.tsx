import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import * as Api from '../apis/userRequests.ts';
import { getPlatformName } from '@shared/utils/tvmaze';
import type { TvMazeShow } from '@shared/types/tvmaze.ts';
import { useAlert } from '../contexts/alert/AlertContext.tsx';
import { useShow } from '../contexts/show/ShowContext.tsx';

const PLACEHOLDER = 'https://placehold.co/210x295/0f1420/5a5248?text=NO+IMAGE';

export default function OneShowSearch() {
  const { showID } = useParams();
  const alertProps = useAlert();
  const dataProps = useShow();
  const [tvShow, setTvShow] = useState<TvMazeShow>();
  const [nextEpisode, setNextEpisode] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const searchTvShow = async (showID: string) => {
      try {
        const response = await Api.returnSearchShow(showID);
        if (response.success && response.data) {
          setTvShow(response.data);
          const nextEp = await Api.fetchNextEpisodeDate(response.data);
          if (nextEp.success && nextEp.data) {
            setNextEpisode(nextEp.data.date);
          }
          const platformName = getPlatformName(response.data);
          if (platformName) setPlatform(platformName);
        } else {
          const msg = response.error ?? 'Failed to retrieve TV Show';
          alertProps.showAlert('danger', msg);
          setError(msg);
        }
      } catch {
        const msg = 'Failed to retrieve TV Show results';
        alertProps.showAlert('danger', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (showID) {
      searchTvShow(showID);
    }
  }, [alertProps, showID]);

  const addTvShow = async () => {
    if (!tvShow) return;
    setAdding(true);
    try {
      const response1 = await Api.addNewShowJson(tvShow);
      if (!response1.success) {
        alertProps.showAlert('danger', `Failed to add ${tvShow.name}!`);
        return;
      }
      if (response1.data?.status === 'exists') {
        alertProps.showAlert('warning', `${tvShow.name} already in your list`);
      } else {
        alertProps.showAlert('success', `${tvShow.name} added`);
      }

      const response2 = await Api.getAllShows();
      if (response2.success && response2.data) {
        dataProps.setTvShows(response2.data);
      }
    } catch {
      alertProps.showAlert('danger', `Failed to add ${tvShow.name}!`);
    } finally {
      setAdding(false);
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
      {/* Blurred hero */}
      <Box sx={{ position: 'relative', height: { xs: '180px', md: '280px' }, overflow: 'hidden' }}>
        {tvShow.image?.medium && (
          <Box
            component="img"
            src={tvShow.image.medium}
            alt=""
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(28px) brightness(0.2) saturate(0.6)',
              transform: 'scale(1.12)',
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(8,11,18,0.2) 0%, var(--bg) 100%)',
          }}
        />
      </Box>

      {/* Content */}
      <Box
        sx={{
          maxWidth: '800px',
          mx: 'auto',
          px: { xs: 2, md: 4 },
          mt: { xs: '-80px', md: '-130px' },
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.5s ease both',
          animationDelay: '0.1s',
        }}
      >
        {/* Back */}
        <Box
          component="button"
          onClick={() => navigate(-1)}
          sx={{
            all: 'unset',
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--cream-muted)',
            cursor: 'pointer',
            mb: '24px',
            display: 'block',
            transition: 'color 0.15s ease',
            '&:hover': { color: 'var(--cream)' },
          }}
        >
          ← Back
        </Box>

        {/* Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '130px 1fr', md: '190px 1fr' },
            gap: { xs: '18px', md: '32px' },
            alignItems: 'start',
          }}
        >
          {/* Poster */}
          <Box
            component="img"
            src={tvShow.image?.medium ?? PLACEHOLDER}
            alt={tvShow.name}
            sx={{
              width: '100%',
              aspectRatio: '2 / 3',
              objectFit: 'cover',
              outline: '1px solid var(--border-strong)',
              display: 'block',
            }}
          />

          {/* Info */}
          <Box sx={{ pt: { xs: '4px', md: '12px' } }}>
            <Box
              component="h1"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontWeight: 500,
                fontSize: 'clamp(1.7rem, 4vw, 2.8rem)',
                lineHeight: 1.1,
                color: 'var(--cream)',
                m: 0,
                mb: '8px',
              }}
            >
              {tvShow.name}
            </Box>

            <Box
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '0.64rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--cream-muted)',
                mb: '24px',
              }}
            >
              {[platform, tvShow.status].filter(Boolean).join(' · ')}
            </Box>

            {/* Episode info */}
            <Box
              sx={{
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                py: '16px',
                mb: '24px',
              }}
            >
              <Box
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.58rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--cream-muted)',
                  mb: '6px',
                }}
              >
                Next Episode
              </Box>
              <Box
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.82rem',
                  color: nextEpisode ? 'var(--amber)' : 'var(--cream-muted)',
                }}
              >
                {nextEpisode || tvShow.status || '—'}
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={addTvShow}
                disabled={adding}
                startIcon={adding ? <CircularProgress size={12} sx={{ color: 'inherit' }} /> : null}
                sx={{ bgcolor: 'var(--accent)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
              >
                {adding ? 'Adding…' : 'Add Show'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                sx={{ color: 'var(--cream-muted)', borderColor: 'var(--border-strong)', '&:hover': { color: 'var(--cream)', borderColor: 'var(--cream)' } }}
              >
                My Shows
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
