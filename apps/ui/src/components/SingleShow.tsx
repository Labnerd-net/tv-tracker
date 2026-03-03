import { useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import * as Api from '../apis/userRequests.ts';
import { logger } from '../utils/logger.ts';
import type { ShowData } from '@shared/types/tv-tracker.ts';
import { useShow } from '../contexts/show/ShowContext.tsx';
import { useAlert } from '../contexts/alert/AlertContext.tsx';

const PLACEHOLDER = 'https://placehold.co/210x295/0f1420/5a5248?text=NO+IMAGE';

export default function SingleShow({ showData, index = 0 }: { showData: ShowData; index?: number }) {
  const dataProps = useShow();
  const alertProps = useAlert();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const refreshData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await Api.updateShow(String(showData.showId));
      const response = await Api.getAllShows();
      dataProps.setTvShows(response.data ?? []);
      alertProps.showAlert('success', `${showData.title} updated`);
    } catch (err) {
      logger.error(err);
      alertProps.showAlert('danger', `Failed to update ${showData.title}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteOneShow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await Api.deleteShow(String(showData.showId));
      const response = await Api.getAllShows();
      dataProps.setTvShows(response.data ?? []);
      alertProps.showAlert('success', `${showData.title} removed`);
      navigate('/');
    } catch (err) {
      logger.error(err);
      alertProps.showAlert('danger', `Failed to delete ${showData.title}`);
    } finally {
      setLoading(false);
    }
  };

  const episodeLabel = showData.nextEpisode ? 'NEXT' : 'LAST';
  const episodeDate = showData.nextEpisode ?? showData.prevEpisode ?? showData.status ?? '—';

  return (
    <Box
      onClick={() => navigate(`/tvshow/${showData.showId}`)}
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
      {/* Image */}
      <Box
        component="img"
        className="poster-img"
        src={showData.imageLink ?? PLACEHOLDER}
        alt={showData.title}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: 'scale(1)',
          transition: 'transform 0.45s ease',
        }}
      />

      {/* Gradient scrim */}
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

      {/* Info overlay */}
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
        {/* Title */}
        <Box
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.08rem',
            fontWeight: 500,
            lineHeight: 1.2,
            color: '#e8e0d0',
            mb: '4px',
          }}
        >
          {showData.title}
        </Box>

        {showData.platform && (
          <Box
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.56rem',
              letterSpacing: '0.14em',
              color: '#5a5248',
              textTransform: 'uppercase',
              mb: '10px',
            }}
          >
            {showData.platform}
          </Box>
        )}

        {/* Episode */}
        <Box
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.62rem',
            color: showData.nextEpisode ? '#f2a65a' : '#7a7266',
            letterSpacing: '0.05em',
          }}
        >
          <Box component="span" sx={{ opacity: 0.5, mr: '6px', fontSize: '0.54rem', letterSpacing: '0.12em' }}>
            {episodeLabel}
          </Box>
          {episodeDate}
        </Box>

        {/* Action buttons — revealed on hover */}
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
          {loading ? (
            <CircularProgress size={14} sx={{ color: '#a09688' }} />
          ) : (
            <>
              <Box
                component="button"
                onClick={refreshData}
                sx={{
                  all: 'unset',
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(232,224,208,0.22)',
                  color: 'rgba(232,224,208,0.6)',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    background: 'rgba(232,224,208,0.1)',
                    borderColor: 'rgba(232,224,208,0.5)',
                    color: '#e8e0d0',
                  },
                }}
              >
                Refresh
              </Box>
              <Box
                component="button"
                onClick={deleteOneShow}
                sx={{
                  all: 'unset',
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(230,57,70,0.3)',
                  color: 'rgba(230,57,70,0.65)',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    background: 'rgba(230,57,70,0.12)',
                    borderColor: '#e63946',
                    color: '#e63946',
                  },
                }}
              >
                Remove
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
