import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import * as Api from '../apis/userRequests.ts';
import { getPlatformName } from '@shared/utils/tvmaze';
import type { TvMazeShow } from '@shared/types/tvmaze.ts';
import { useAlert } from '../contexts/alert/AlertContext.tsx';
import { useShow } from '../contexts/show/ShowContext.tsx';

export default function OneShowSearch() {
  const { showID } = useParams();
  const alertProps = useAlert();
  const dataProps = useShow();
  const [tvShow, setTvShow] = useState<TvMazeShow>();
  const [nextEpisode, setNextEpisode] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const searchTvShow = async (showID: string) => {
      try {
        const response = await Api.returnSearchShow(showID);
        if (response.success && response.data) {
          setTvShow(response.data);
          const nextEp = await Api.fetchNextEpisodeDate(response.data);
          if (nextEp.success && nextEp.data) {
            setNextEpisode(nextEp.data.date);
          }
          const platformName = getPlatformName(response.data);
          if (platformName) setPlatform(platformName);
        } else {
          const msg = response.error ?? 'Failed to retrieve TV Show';
          alertProps.setAlertVariant('danger');
          alertProps.setAlertMessage(msg);
          alertProps.showAlert();
          setError(msg);
        }
      } catch {
        const msg = 'Failed to retrieve TV Show results';
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage(msg);
        alertProps.showAlert();
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (showID) {
      searchTvShow(showID);
    }
  }, [alertProps, showID]);

  const addTvShow = async () => {
    if (!tvShow) return;
    try {
      const response1 = await Api.addNewShowJson(tvShow);
      if (!response1.success) {
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage(`Failed to add ${tvShow.name}!`);
        alertProps.showAlert();
        return;
      }
      if (response1.data?.status === 'exists') {
        alertProps.setAlertVariant('warning');
        alertProps.setAlertMessage(`${tvShow.name} already exists!`);
      } else {
        alertProps.setAlertVariant('success');
        alertProps.setAlertMessage(`${tvShow.name} successfully added!`);
      }
      alertProps.showAlert();

      const response2 = await Api.getAllShows();
      if (response2.success && response2.data) {
        dataProps.setTvShows(response2.data);
      }
    } catch {
      alertProps.setAlertVariant('danger');
      alertProps.setAlertMessage(`Failed to add ${tvShow.name}!`);
      alertProps.showAlert();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading next episodes ...</div>;
  if (error) return <div>{error}</div>;
  if (!tvShow) return <div>No Shows</div>;

  return (
    <Container sx={{ pt: 3 }}>
      <Typography variant='h5'>{tvShow.name} — {platform}</Typography>

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
