import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { AlertContext, TvShowContext } from '../contexts/Contexts.ts';
import * as Api from '../apis/userRequests.ts';
import type { TvMazeShow } from '@shared/types/tvmaze.ts';

export default function OneShowSearch() {
  const { showID } = useParams();
  const alertProps = useContext(AlertContext);
  const dataProps = useContext(TvShowContext);
  const [tvShow, setTvShow] = useState<TvMazeShow>();
  const [nextEpisode, setNextEpisode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const searchTvShow = async (showID: string) => {
      try {
        console.log(showID);
        const show = await Api.returnSearchShow(showID);
        setTvShow(show);
        const nextEp = await Api.returnNextEpisodeSearch(show);
        setNextEpisode(nextEp);
      } catch (err) {
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage('Failed to retreive TV Show results');
        alertProps.showAlert();
        setError('Failed to retreive TV Show results');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (showID) {
      searchTvShow(showID);
    }
  }, [alertProps, showID]);

  const addTvShow = async () => {
    if (tvShow) {
      try {
        const response1 = await Api.addNewShowJson(tvShow);
        console.log(response1);
        if (response1.status === 'exists') {
          alertProps.setAlertVariant('warning');
          alertProps.setAlertMessage(`${tvShow.name} already exists!`);
          alertProps.showAlert();
        } else {
          alertProps.setAlertVariant('success');
          alertProps.setAlertMessage(`${tvShow.name} successfully added!`);
          alertProps.showAlert();
        }
        const response2 = await Api.getAllShows();
        console.log(response2);
        dataProps.setTvShows(response2);
      } catch (err) {
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage(`Failed to add ${tvShow.name}!`);
        alertProps.showAlert();
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div>Loading next episodes ...</div>;
  if (error) return <div>{error}</div>;
  if (!tvShow) return <div>No Shows</div>;

  return (
    <Container sx={{ pt: 3 }}>
      <Typography variant='h5'>{tvShow.name} — {Api.returnPlatform(tvShow)}</Typography>

      {tvShow.image?.medium && (
        <Box
          component='img'
          src={tvShow.image.medium}
          alt={tvShow.name}
          sx={{ borderRadius: 1, my: 2, display: 'block' }}
        />
      )}

      {nextEpisode
        ? <Typography variant='h6'>Next Episode: {nextEpisode}</Typography>
        : <Typography variant='h6'>Status: {tvShow.status}</Typography>
      }

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button variant='contained' onClick={addTvShow}>Add Show</Button>
        <Button variant='outlined' onClick={() => navigate('/')}>Home</Button>
      </Box>
    </Container>
  );
}
