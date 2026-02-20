import { useContext, useEffect } from 'react';
import { Link } from 'react-router';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import SingleShow from '../components/SingleShow.tsx';
import { AlertContext, TvShowContext, ViewContext } from '../contexts/Contexts.ts';
import * as Api from '../apis/userRequests.ts';

export default function AllShows() {
  const { setAlertVariant, setAlertMessage, showAlert } = useContext(AlertContext);
  const { tvShows, setTvShows, sortCol, sortOrder } = useContext(TvShowContext);
  const viewProps = useContext(ViewContext);

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

  return (
    <>
      {viewProps.viewValue === 'card' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, p: 2 }}>
          {tvShows.map((data, index) => (
            <SingleShow key={index} showData={data} />
          ))}
        </Box>
      )}

      {viewProps.viewValue === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Show Title {sortCol === 'ShowTitle' && (sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
                <TableCell>Platform {sortCol === 'ShowPlatform' && (sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
                <TableCell>Status {sortCol === 'ShowStatus' && (sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
                <TableCell>Previous Episode {sortCol === 'PrevEpisode' && (sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tvShows.map((data, idx) => (
                <TableRow key={idx}>
                  <TableCell><Link to={`/tvshow/${data.showId}/`}>{data.title}</Link></TableCell>
                  <TableCell>{data.platform}</TableCell>
                  <TableCell>{data.nextEpisode ? `Next Episode: ${data.nextEpisode}` : data.status}</TableCell>
                  <TableCell>{data.prevEpisode}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
