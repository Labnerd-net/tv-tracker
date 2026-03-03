import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import * as Api from '../apis/userRequests.ts';
import { getPlatformName } from '@shared/utils/tvmaze';
import type { AlertProps } from '../types/alert.ts';
import type { TvMazeSeries, TvMazeShow } from '@shared/types/tvmaze.ts';
import { useShow } from '../contexts/show/ShowContext.tsx';

export default function Result({ showData, alertProps }: { showData: TvMazeSeries; alertProps: AlertProps }) {
  const dataProps = useShow();
  const [nextEpisode, setNextEpisode] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const getNextEpisode = async (show: TvMazeShow) => {
      try {
        const response = await Api.fetchNextEpisodeDate(show);
        if (response.success && response.data) {
          setNextEpisode(response.data.date);
        }
      } catch {
        setError('—');
      } finally {
        setLoading(false);
      }
    };
    getNextEpisode(showData.show);
  }, [showData.show]);

  const addTvShow = async () => {
    setAdding(true);
    try {
      const response1 = await Api.addNewShowJson(showData.show);
      if (!response1.success) {
        alertProps.showAlert('danger', `Failed to add ${showData.show.name}!`);
        return;
      }
      if (response1.data?.status === 'exists') {
        alertProps.showAlert('warning', `${showData.show.name} already in your list`);
      } else {
        alertProps.showAlert('success', `${showData.show.name} added`);
      }

      const response2 = await Api.getAllShows();
      if (response2.success && response2.data) {
        dataProps.setTvShows(response2.data);
      }
    } catch {
      alertProps.showAlert('danger', `Failed to add ${showData.show.name}!`);
    } finally {
      setAdding(false);
    }
  };

  const platform = getPlatformName(showData.show) ?? '';
  const episodeText = loading ? '…' : (error || nextEpisode || showData.show.status || '—');

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
      {/* Thumbnail */}
      {showData.show.image?.medium ? (
        <Box
          component="img"
          src={showData.show.image.medium}
          alt={showData.show.name}
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

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          component={Link}
          to={`/search/show/${showData.show.id}/`}
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
          {showData.show.name}
        </Box>
        <Box
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.6rem',
            color: 'var(--cream-muted)',
            letterSpacing: '0.06em',
          }}
        >
          {platform && <Box component="span" sx={{ mr: '8px' }}>{platform}</Box>}
          {loading
            ? <CircularProgress size={8} sx={{ color: 'var(--cream-muted)', verticalAlign: 'middle' }} />
            : <Box component="span" sx={{ color: nextEpisode ? 'var(--amber)' : 'inherit' }}>{episodeText}</Box>
          }
        </Box>
      </Box>

      {/* Add button */}
      <Box
        component="button"
        onClick={addTvShow}
        disabled={adding}
        sx={{
          all: 'unset',
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.56rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: '1px solid var(--border-strong)',
          color: 'var(--cream-muted)',
          padding: '6px 14px',
          cursor: adding ? 'default' : 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          opacity: adding ? 0.5 : 1,
          '&:hover:not(:disabled)': {
            background: 'rgba(230,57,70,0.1)',
            borderColor: 'var(--accent)',
            color: 'var(--accent)',
          },
        }}
      >
        {adding ? '…' : '+ Add'}
      </Box>
    </Box>
  );
}
