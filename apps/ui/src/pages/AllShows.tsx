import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import SingleShow from '../components/SingleShow.tsx';
import ShowsTable from '../components/ShowsTable.tsx';
import * as Api from '../apis/userRequests.ts';
import { useAlert } from '../contexts/alert/AlertContext.tsx';
import { useShow } from '../contexts/show/ShowContext.tsx';

type ViewMode = 'card' | 'table';

function getInitialViewMode(): ViewMode {
  const stored = localStorage.getItem('showsViewMode');
  return stored === 'card' || stored === 'table' ? stored : 'card';
}

export default function AllShows() {
  const { showAlert } = useAlert();
  const { tvShows, setTvShows } = useShow();
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);

  useEffect(() => {
    const fetchShows = async () => {
      const response = await Api.getAllShows();
      if (response.success && response.data) {
        setTvShows(response.data);
      } else if (!response.success) {
        showAlert('danger', response.error ?? 'Failed to retrieve TV Shows');
      }
    };
    fetchShows();
  }, [setTvShows, showAlert]);

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode === null) return;
    localStorage.setItem('showsViewMode', newMode);
    setViewMode(newMode);
  };

  return (
    <Box sx={{ bgcolor: 'var(--bg)', minHeight: 'calc(100vh - 54px)' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2, md: 3 },
          py: '12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Box
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--cream-muted)',
          }}
        >
          {tvShows.length > 0 && `${tvShows.length} show${tvShows.length !== 1 ? 's' : ''}`}
        </Box>
        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
          <ToggleButton value="card" aria-label="card view">
            <GridViewIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="table" aria-label="table view">
            <TableRowsIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      {viewMode === 'card' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '12px',
            p: { xs: 2, md: 3 },
          }}
        >
          {tvShows.map((data, index) => (
            <SingleShow key={data.showId} showData={data} index={index} />
          ))}
        </Box>
      ) : (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
          <ShowsTable tvShows={tvShows} />
        </Box>
      )}

      {/* Empty state */}
      {tvShows.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            gap: '16px',
            animation: 'fadeIn 0.5s ease both',
            animationDelay: '0.3s',
          }}
        >
          <Box
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: '2rem',
              color: 'var(--cream-muted)',
              fontWeight: 300,
            }}
          >
            No shows tracked yet
          </Box>
          <Box
            sx={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.12em',
              color: 'var(--cream-muted)',
              textTransform: 'uppercase',
            }}
          >
            Use search to find and add shows
          </Box>
        </Box>
      )}
    </Box>
  );
}
