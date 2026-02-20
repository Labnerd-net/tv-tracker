import { useState, useEffect, useContext } from 'react';
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
import * as Api from '../apis/requests.ts';
import { AlertContext, TvShowContext } from '../contexts/Contexts.ts';
import type { ShowData } from '../types/data.ts';

export default function OneShow() {
  const { showID } = useParams();
  const alertProps = useContext(AlertContext);
  const dataProps = useContext(TvShowContext);
  const [tvShow, setTvShow] = useState<ShowData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const retreiveTvShow = async () => {
      try {
        if (showID) {
          const response = await Api.getOneShow(showID);
          console.log(response);
          setTvShow(response);
        }
      } catch (err) {
        setError('Failed to retreive TV Show');
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage('Failed to retrieve TV Show!');
        alertProps.showAlert();
        console.error(err);
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
        console.log(response);
        dataProps.setTvShows(response);
        alertProps.setAlertVariant('success');
        alertProps.setAlertMessage(`${tvShow.title} successfully updated!`);
        alertProps.showAlert();
      } catch (err) {
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage(`Failed to update ${tvShow.title}!`);
        alertProps.showAlert();
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteOneShow = async () => {
    if (tvShow) {
      try {
        console.log(`Deleting ${tvShow.title}`);
        await Api.deleteShow(tvShow.id);
        const response = await Api.getAllShows();
        console.log(response);
        dataProps.setTvShows(response);
        alertProps.setAlertVariant('success');
        alertProps.setAlertMessage(`${tvShow.title} successfully deleted!`);
        alertProps.showAlert();
        navigate('/');
      } catch (err) {
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage(`Failed to delete ${tvShow.title}!`);
        alertProps.showAlert();
        console.error(err);
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
      <CardMedia component='img' image={tvShow.imageLink} alt={tvShow.title} />
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
        <Button variant='outlined' onClick={() => navigate('/')}>All Shows</Button>
      </CardActions>
    </Card>
  );
}
