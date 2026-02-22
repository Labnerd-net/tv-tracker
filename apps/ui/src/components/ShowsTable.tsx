import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { ShowData } from '@shared/types/tv-tracker.ts';
import { useShow } from '../contexts/show/ShowContext.tsx';
import { useAlert } from '../contexts/alert/AlertContext.tsx';
import * as Api from '../apis/userRequests.ts';
import { logger } from '../utils/logger.ts';
import { sortShows } from '../utils/sortShows.ts';

interface Column {
  key: keyof ShowData;
  label: string;
}

const COLUMNS: Column[] = [
  { key: 'title', label: 'Title' },
  { key: 'platform', label: 'Platform' },
  { key: 'status', label: 'Status' },
  { key: 'scheduleDay', label: 'Schedule Day' },
  { key: 'scheduleTime', label: 'Schedule Time' },
  { key: 'nextEpisode', label: 'Next Episode' },
  { key: 'prevEpisode', label: 'Previous Episode' },
];

export default function ShowsTable({ tvShows }: { tvShows: ShowData[] }) {
  const { setTvShows } = useShow();
  const alertProps = useAlert();
  const [sortCol, setSortCol] = useState<keyof ShowData>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: keyof ShowData) => {
    if (col === sortCol) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const refreshData = async (show: ShowData) => {
    try {
      await Api.updateShow(String(show.showId));
      const response = await Api.getAllShows();
      setTvShows(response.data ?? []);
      alertProps.setAlertVariant('success');
      alertProps.setAlertMessage(`${show.title} successfully updated!`);
      alertProps.showAlert();
    } catch (err) {
      logger.error(err);
      alertProps.setAlertVariant('danger');
      alertProps.setAlertMessage(`Failed to update ${show.title}!`);
      alertProps.showAlert();
    }
  };

  const deleteShow = async (show: ShowData) => {
    try {
      await Api.deleteShow(String(show.showId));
      const response = await Api.getAllShows();
      setTvShows(response.data ?? []);
      alertProps.setAlertVariant('success');
      alertProps.setAlertMessage(`${show.title} successfully deleted!`);
      alertProps.showAlert();
    } catch (err) {
      logger.error(err);
      alertProps.setAlertVariant('danger');
      alertProps.setAlertMessage(`Failed to delete ${show.title}!`);
      alertProps.showAlert();
    }
  };

  const sortedShows = sortShows(tvShows, sortCol, sortDir);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {COLUMNS.map(col => (
              <TableCell
                key={col.key}
                onClick={() => handleSort(col.key)}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {col.label}
                  {sortCol === col.key && (
                    sortDir === 'asc'
                      ? <ArrowUpwardIcon fontSize="small" />
                      : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
            ))}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedShows.map(show => (
            <TableRow key={show.showId}>
              <TableCell>{show.title}</TableCell>
              <TableCell>{show.platform}</TableCell>
              <TableCell>{show.status}</TableCell>
              <TableCell>{show.scheduleDay}</TableCell>
              <TableCell>{show.scheduleTime}</TableCell>
              <TableCell>{show.nextEpisode}</TableCell>
              <TableCell>{show.prevEpisode}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="small" onClick={() => refreshData(show)}>
                    Refresh Data
                  </Button>
                  <Button variant="contained" color="error" size="small" onClick={() => deleteShow(show)}>
                    Delete Show
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
