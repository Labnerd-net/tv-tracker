import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
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
import { TvShowContext } from '../contexts/Contexts.ts';
import { AlertContext } from '../contexts/Contexts.ts';
import type { ShowData } from '@shared/types/tv-tracker.ts';

export default function SingleShow({ showData }: { showData: ShowData }) {
  const dataProps = useContext(TvShowContext);
  const alertProps = useContext(AlertContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const refreshData = async () => {
    try {
      await Api.updateShow(showData.id);
      const response = await Api.getAllShows();
      console.log(response);
      dataProps.setTvShows(response);
      alertProps.setAlertVariant('success');
      alertProps.setAlertMessage(`${showData.title} successfully updated!`);
      alertProps.showAlert();
    } catch (err) {
      alertProps.setAlertVariant('danger');
      alertProps.setAlertMessage(`Failed to update ${showData.title}!`);
      alertProps.showAlert();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteOneShow = async () => {
    try {
      console.log(`Deleting ${showData.title}`);
      await Api.deleteShow(showData.id);
      const response = await Api.getAllShows();
      console.log(response);
      dataProps.setTvShows(response);
      alertProps.setAlertVariant('success');
      alertProps.setAlertMessage(`${showData.title} successfully deleted!`);
      alertProps.showAlert();
      navigate('/');
    } catch (err) {
      alertProps.setAlertVariant('danger');
      alertProps.setAlertMessage(`Failed to delete ${showData.title}!`);
      alertProps.showAlert();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading TV Show ...</div>;

  return (
    <Card>
      <CardMedia component='img' image={showData.imageLink} alt={showData.title} />
      <CardContent>
        <Typography variant='h6'>{showData.title} on {showData.platform}</Typography>
      </CardContent>
      <List dense disablePadding>
        {showData.nextEpisode
          ? <ListItem><ListItemText primary={`Next Episode: ${showData.nextEpisode}`} /></ListItem>
          : <ListItem><ListItemText primary={`Status: ${showData.status}`} /></ListItem>
        }
        <ListItem><ListItemText primary={`Previous Episode: ${showData.prevEpisode}`} /></ListItem>
      </List>
      <CardActions>
        <Button variant='contained' onClick={refreshData}>Refresh Data</Button>
        <Button variant='contained' color='error' onClick={deleteOneShow}>Delete Show</Button>
      </CardActions>
    </Card>
  );
}
