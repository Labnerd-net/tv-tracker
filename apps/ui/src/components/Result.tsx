import { useState } from 'react';
import Box from '@mui/material/Box';
import * as Api from '../apis/userRequests';
import { getPlatformName, sanitizeTvMazeImageUrl } from '@shared/utils/tvmaze';
import type { TvMazeSeries } from '@shared/types/tvmaze';
import { useShow } from '../contexts/show/ShowContext';
import ShowCard from './ShowCard';

export default function Result({
  showData,
  showAlert,
  nextEpisodeDate,
  episodeLoading,
}: {
  showData: TvMazeSeries;
  showAlert: (variant: string, message: string) => void;
  nextEpisodeDate: string;
  episodeLoading: boolean;
}) {
  const { addShow } = useShow();
  const [adding, setAdding] = useState(false);

  const addTvShow = async () => {
    setAdding(true);
    try {
      const response1 = await Api.addNewShowById(String(showData.show.id));
      if (!response1.success) {
        showAlert('danger', `Failed to add ${showData.show.name}!`);
        return;
      }
      if (response1.data?.status === 'exists') {
        showAlert('warning', `${showData.show.name} already in your list`);
        return;
      }
      showAlert('success', `${showData.show.name} added`);
      const newShowId = response1.data?.showId;
      if (newShowId !== undefined) {
        const response2 = await Api.getOneShow(String(newShowId));
        if (response2.success && response2.data) {
          addShow(response2.data);
        }
      }
    } catch {
      showAlert('danger', `Failed to add ${showData.show.name}!`);
    } finally {
      setAdding(false);
    }
  };

  const platform = getPlatformName(showData.show) ?? '';
  const episodeText = episodeLoading ? '…' : (nextEpisodeDate || showData.show.status || '—');

  const addButton = (
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
  );

  return (
    <ShowCard
      variant="list"
      image={sanitizeTvMazeImageUrl(showData.show.image?.medium)}
      title={showData.show.name}
      titleHref={`/search/show/${showData.show.id}/`}
      platform={platform}
      episodeInfo={episodeText}
      episodeHighlight={!!nextEpisodeDate && !episodeLoading}
      episodeLoading={episodeLoading}
      actions={addButton}
    />
  );
}
