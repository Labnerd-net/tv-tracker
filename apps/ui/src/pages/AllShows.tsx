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
  const { setAlertVariant, setAlertMessage, showAlert } = useAlert();
  const { tvShows, setTvShows } = useShow();
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);

  useEffect(() => {
    const fetchShows = async () => {
      const response = await Api.getAllShows();
      if (response.success && response.data) {
        setTvShows(response.data);
      } else if (!response.success) {
        setAlertVariant('danger');
        setAlertMessage(response.error ?? 'Failed to retrieve TV Shows');
        showAlert();
      }
    };
    fetchShows();
  }, [setTvShows, setAlertVariant, setAlertMessage, showAlert]);

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode === null) return;
    localStorage.setItem('showsViewMode', newMode);
    setViewMode(newMode);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
          <ToggleButton value="card"><GridViewIcon /></ToggleButton>
          <ToggleButton value="table"><TableRowsIcon /></ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {viewMode === 'card' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, p: 2 }}>
          {tvShows.map((data, index) => (
            <SingleShow key={index} showData={data} />
          ))}
        </Box>
      ) : (
        <ShowsTable tvShows={tvShows} />
      )}
    </>
  );
}
