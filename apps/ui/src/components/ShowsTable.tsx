import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
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
  { key: 'scheduleDay', label: 'Day' },
  { key: 'scheduleTime', label: 'Time' },
  { key: 'nextEpisode', label: 'Next Ep' },
  { key: 'prevEpisode', label: 'Prev Ep' },
];

const actionBtn = (accent: boolean) => ({
  all: 'unset' as const,
  fontFamily: '"Space Mono", monospace',
  fontSize: '0.55rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  border: accent
    ? '1px solid rgba(230,57,70,0.3)'
    : '1px solid var(--border-strong)',
  color: accent ? 'rgba(230,57,70,0.7)' : 'var(--cream-dim)',
  padding: '4px 10px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap' as const,
  '&:hover': accent
    ? { background: 'rgba(230,57,70,0.1)', borderColor: '#e63946', color: '#e63946' }
    : { background: 'var(--surface-elevated)', borderColor: 'var(--cream-dim)', color: 'var(--cream)' },
});

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
      alertProps.showAlert('success', `${show.title} updated`);
    } catch (err) {
      logger.error(err);
      alertProps.showAlert('danger', `Failed to update ${show.title}`);
    }
  };

  const deleteShow = async (show: ShowData) => {
    try {
      await Api.deleteShow(String(show.showId));
      const response = await Api.getAllShows();
      setTvShows(response.data ?? []);
      alertProps.showAlert('success', `${show.title} removed`);
    } catch (err) {
      logger.error(err);
      alertProps.showAlert('danger', `Failed to delete ${show.title}`);
    }
  };

  const sortedShows = sortShows(tvShows, sortCol, sortDir);

  return (
    <TableContainer
      sx={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        animation: 'fadeIn 0.4s ease both',
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {COLUMNS.map(col => (
              <TableCell
                key={col.key}
                onClick={() => handleSort(col.key)}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  '&:hover': { color: 'var(--cream-dim) !important' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.label}
                  {sortCol === col.key && (
                    sortDir === 'asc'
                      ? <ArrowUpwardIcon sx={{ fontSize: '0.7rem', color: 'var(--accent)' }} />
                      : <ArrowDownwardIcon sx={{ fontSize: '0.7rem', color: 'var(--accent)' }} />
                  )}
                </Box>
              </TableCell>
            ))}
            <TableCell sx={{ fontFamily: '"Space Mono", monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-muted)', background: 'var(--surface-elevated)' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedShows.map((show, i) => (
            <TableRow
              key={show.showId}
              style={{ animationDelay: `${i * 30}ms` }}
              sx={{ animation: 'fadeIn 0.35s ease both' }}
            >
              <TableCell sx={{ color: 'var(--cream) !important', fontFamily: '"Cormorant Garamond", serif !important', fontSize: '1rem !important', fontWeight: 500 }}>
                {show.title}
              </TableCell>
              <TableCell>{show.platform}</TableCell>
              <TableCell>
                <Box component="span" sx={{ color: show.status === 'Running' ? 'var(--amber)' : 'inherit' }}>
                  {show.status}
                </Box>
              </TableCell>
              <TableCell>{show.scheduleDay}</TableCell>
              <TableCell>{show.scheduleTime}</TableCell>
              <TableCell sx={{ color: show.nextEpisode ? 'var(--amber) !important' : 'inherit' }}>
                {show.nextEpisode}
              </TableCell>
              <TableCell>{show.prevEpisode}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: '8px' }}>
                  <Box component="button" onClick={() => refreshData(show)} sx={actionBtn(false)}>
                    Refresh
                  </Box>
                  <Box component="button" onClick={() => deleteShow(show)} sx={actionBtn(true)}>
                    Remove
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
