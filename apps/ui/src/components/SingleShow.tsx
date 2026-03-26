import { memo } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { ShowData } from '@shared/types/tv-tracker.ts';
import { useShowActions } from '../hooks/useShowActions.ts';
import ShowCard from './ShowCard.tsx';

export default memo(function SingleShow({ showData, index = 0 }: { showData: ShowData; index?: number }) {
  const { loading, refreshShow, deleteShow } = useShowActions();
  const navigate = useNavigate();

  const refreshData = (e: React.MouseEvent) => {
    e.stopPropagation();
    refreshShow(String(showData.showId), showData.title);
  };

  const deleteOneShow = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteShow(String(showData.showId), showData.title, () => navigate('/'));
  };

  const episodeLabel = showData.nextEpisode ? 'NEXT' : 'LAST';
  const episodeDate = showData.nextEpisode ?? showData.prevEpisode ?? showData.status ?? '—';

  const actions = loading ? (
    <CircularProgress size={14} sx={{ color: 'var(--cream-dim)' }} />
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
            color: 'var(--cream)',
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
            borderColor: 'var(--accent)',
            color: 'var(--accent)',
          },
        }}
      >
        Remove
      </Box>
    </>
  );

  return (
    <ShowCard
      variant="card"
      image={showData.imageLink ?? ''}
      title={showData.title}
      platform={showData.platform ?? undefined}
      episodeLabel={episodeLabel}
      episodeInfo={episodeDate}
      episodeHighlight={!!showData.nextEpisode}
      actions={actions}
      onClick={() => navigate(`/tvshow/${showData.showId}`)}
      index={index}
    />
  );
});
