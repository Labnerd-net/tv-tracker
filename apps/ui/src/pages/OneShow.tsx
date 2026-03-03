import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import * as Api from '../apis/userRequests.ts';
import { logger } from '../utils/logger.ts';
import type { ShowData } from '@shared/types/tv-tracker.ts';
import { useAlert } from '../contexts/alert/AlertContext.tsx';
import { useShow } from '../contexts/show/ShowContext.tsx';

export default function OneShow() {
  const { showID } = useParams();
  const alertProps = useAlert();
  const dataProps = useShow();
  const [tvShow, setTvShow] = useState<ShowData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const retreiveTvShow = async () => {
      try {
        if (showID) {
          const response = await Api.getOneShow(showID);
          if (response.success && response.data) setTvShow(response.data);
        }
      } catch (err) {
        logger.error(err);
        setError('Failed to retreive TV Show');
        alertProps.showAlert('danger', 'Failed to retrieve TV Show!');
      } finally {
        setLoading(false);
      }
    };
    retreiveTvShow();
  }, [alertProps, showID]);

  const refreshData = async () => {
    if (tvShow && showID) {
      try {
        await Api.updateShow(showID);
        const response = await Api.getAllShows();
        dataProps.setTvShows(response.data ?? []);
        alertProps.showAlert('success', `${tvShow.title} successfully updated!`);
      } catch (err) {
        logger.error(err);
        alertProps.showAlert('danger', `Failed to update ${tvShow.title}!`);
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteOneShow = async () => {
    if (tvShow) {
      try {
        await Api.deleteShow(String(tvShow.showId));
        const response = await Api.getAllShows();
        dataProps.setTvShows(response.data ?? []);
        alertProps.showAlert('success', `${tvShow.title} successfully deleted!`);
        navigate('/');
      } catch (err) {
        logger.error(err);
        alertProps.showAlert('danger', `Failed to delete ${tvShow.title}!`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div>Loading TV Show ...</div>;
  if (error) return <div>{error}</div>;
  if (!tvShow) return <div>No Shows</div>;

  return (
    <Card sx={{ maxWidth: 345, m: 2 }}>
      <CardMedia component='img' image={tvShow.imageLink ?? undefined} alt={tvShow.title} />
      <CardContent>
        <Typography variant='h6'>{tvShow.title} on {tvShow.platform}</Typography>
      </CardContent>
      <List dense disablePadding>
        {tvShow.nextEpisode
          ? <ListItem><ListItemText primary={`Next Episode: ${tvShow.nextEpisode}`} /></ListItem>
          : <ListItem><ListItemText primary={`Status: ${tvShow.status}`} /></ListItem>
        }
        <ListItem><ListItemText primary={`Previous Episode: ${tvShow.prevEpisode}`} /></ListItem>
      </List>
      <CardActions>
        <Button variant='contained' onClick={refreshData}>Refresh Data</Button>
        <Button variant='contained' color='error' onClick={deleteOneShow}>Delete Show</Button>
        <Button variant='outlined' onClick={() => navigate('/dashboard')}>All Shows</Button>
      </CardActions>
    </Card>
  );
}
