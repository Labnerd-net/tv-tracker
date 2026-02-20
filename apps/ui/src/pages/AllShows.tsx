import { useContext } from 'react';
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
import { TvShowContext, ViewContext } from '../contexts/Contexts.ts';

export default function AllShows() {
  const dataProps = useContext(TvShowContext);
  const viewProps = useContext(ViewContext);

  return (
    <>
      {viewProps.viewValue === 'card' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, p: 2 }}>
          {dataProps.tvShows.map((data, index) => (
            <SingleShow key={index} showData={data} />
          ))}
        </Box>
      )}

      {viewProps.viewValue === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Show Title {dataProps.sortCol === 'ShowTitle' && (dataProps.sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
                <TableCell>Platform {dataProps.sortCol === 'ShowPlatform' && (dataProps.sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
                <TableCell>Status {dataProps.sortCol === 'ShowStatus' && (dataProps.sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
                <TableCell>Previous Episode {dataProps.sortCol === 'PrevEpisode' && (dataProps.sortOrder === 'asc' ? '↑' : '↓')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dataProps.tvShows.map((data, idx) => (
                <TableRow key={idx}>
                  <TableCell><Link to={`/tvshow/${data.id}/`}>{data.title}</Link></TableCell>
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
