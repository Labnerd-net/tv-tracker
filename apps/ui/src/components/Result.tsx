import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import { TvShowContext } from '../contexts/Contexts.js';
import * as Api from '../apis/userRequests.ts';
import type { AlertProps } from '../types/alert.ts';
import type { TvMazeSeries, TvMazeShow } from '@shared/types/tvmaze.ts';

export default function Result({ showData, alertProps }: { showData: TvMazeSeries, alertProps: AlertProps }) {
  const dataProps = useContext(TvShowContext);
  const [nextEpisode, setNextEpisode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getNextEpisode = async (show: TvMazeShow) => {
      try {
        const response = await Api.returnNextEpisodeSearch(show);
        console.log(response);
        setNextEpisode(response);
      } catch (err) {
        setError('Failed to get next episode');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getNextEpisode(showData.show);
  }, [showData.show]);

  const addTvShow = async () => {
    try {
      const response1 = await Api.addNewShowJson(showData.show);
      console.log(response1);
      if (response1.status === 'exists') {
        alertProps.setAlertVariant('warning');
        alertProps.setAlertMessage(`${showData.show.name} already exists!`);
        alertProps.showAlert();
      } else {
        alertProps.setAlertVariant('success');
        alertProps.setAlertMessage(`${showData.show.name} successfully added!`);
        alertProps.showAlert();
      }
      const response2 = await Api.getAllShows();
      console.log(response2);
      dataProps.setTvShows(response2);
    } catch (err) {
      alertProps.setAlertVariant('danger');
      alertProps.setAlertMessage(`Failed to add ${showData.show.name}!`);
      alertProps.showAlert();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading next episodes ...</div>;
  if (error) return <div>{error}</div>;

  return (
    <ListItem
      secondaryAction={
        <Button variant='contained' size='small' onClick={addTvShow}>Add Show</Button>
      }
    >
      <ListItemText
        primary={<Link to={`/search/show/${showData.show.id}/`}>{showData.show.name}</Link>}
        secondary={`${Api.returnPlatform(showData.show)} — ${nextEpisode}`}
      />
    </ListItem>
  );
}
