import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import * as Api from '../apis/userRequests.js';
import Result from '../components/Result.js';
import type { TvMazeSeries } from '@shared/types/tvmaze.js';
import { useAlert } from '../contexts/alert/AlertContext.js';

const EPISODE_FETCH_BATCH_SIZE = 5;

export default function SearchResults() {
  const { showAlert } = useAlert();
  const { showName } = useParams();
  const [searchResults, setSearchResults] = useState<TvMazeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [episodeDates, setEpisodeDates] = useState<Record<number, string>>({});
  const [episodesLoading, setEpisodesLoading] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const searchTvShows = async (showName: string) => {
      setEpisodeDates({});
      setEpisodesLoading({});
      try {
        const response = await Api.tvShowResults(showName);
        if (controller.signal.aborted) return;
        if (response.success && response.data) {
          const data = response.data;
          setSearchResults(data);
          setLoading(false);
          setEpisodesLoading(Object.fromEntries(data.map(item => [item.show.id, true])));
          for (let i = 0; i < data.length; i += EPISODE_FETCH_BATCH_SIZE) {
            if (controller.signal.aborted) break;
            const batch = data.slice(i, i + EPISODE_FETCH_BATCH_SIZE);
            await Promise.allSettled(
              batch.map(item => {
                const id = item.show.id;
                return Api.fetchNextEpisodeDate(item.show, controller.signal).then(r => {
                  if (controller.signal.aborted) return;
                  setEpisodeDates(prev => ({ ...prev, [id]: r.success ? r.data.date : '' }));
                  setEpisodesLoading(prev => ({ ...prev, [id]: false }));
                }).catch(() => {
                  if (!controller.signal.aborted) {
                    setEpisodesLoading(prev => ({ ...prev, [id]: false }));
                  }
                });
              })
            );
          }
        } else {
          const msg = !response.success ? response.error : 'Failed to retrieve TV Show results';
          showAlert('danger', msg);
          setError(msg);
        }
      } catch {
        if (controller.signal.aborted) return;
        const msg = 'Failed to retrieve TV Show results';
        showAlert('danger', msg);
        setError(msg);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    if (showName) {
      searchTvShows(showName);
    }
    return () => controller.abort();
  }, [showAlert, showName]);

  return (
    <Box sx={{ minHeight: 'calc(100vh - 54px)', bgcolor: 'var(--bg)' }}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: '1px solid var(--border)',
          px: { xs: 2, md: 4 },
          py: '20px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.8rem',
            fontWeight: 400,
            color: 'var(--cream)',
            animation: 'fadeInUp 0.4s ease both',
          }}
        >
          {showName}
        </Box>
        <Box
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--cream-muted)',
            animation: 'fadeIn 0.4s ease both',
            animationDelay: '0.1s',
          }}
        >
          Search results
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ maxWidth: '760px', mx: 'auto', px: { xs: 2, md: 4 }, py: '24px' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
            <CircularProgress sx={{ color: 'var(--accent)' }} />
          </Box>
        )}

        {error && !loading && (
          <Box
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.72rem',
              color: 'var(--accent)',
              p: '16px',
              border: '1px solid rgba(230,57,70,0.25)',
              background: 'rgba(230,57,70,0.06)',
            }}
          >
            {error}
          </Box>
        )}

        {!loading && !error && searchResults.length === 0 && (
          <Box
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: '1.5rem',
              color: 'var(--cream-muted)',
              py: '40px',
              textAlign: 'center',
              animation: 'fadeIn 0.4s ease both',
            }}
          >
            No results found
          </Box>
        )}

        {!loading && !error && searchResults.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid var(--border)',
            }}
          >
            {searchResults.map((data) => (
              <Result
                key={data.show.id}
                showData={data}
                showAlert={showAlert}
                nextEpisodeDate={episodeDates[data.show.id] ?? ''}
                episodeLoading={episodesLoading[data.show.id] ?? false}
              />
            ))}
          </Box>
        )}

        <Box sx={{ mt: '28px' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ color: 'var(--cream-muted)', borderColor: 'var(--border-strong)', '&:hover': { color: 'var(--cream)', borderColor: 'var(--cream)' } }}
          >
            ← All Shows
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
