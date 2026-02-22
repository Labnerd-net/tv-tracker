import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import * as Api from '../apis/userRequests.ts';
import { getPlatformName } from '@shared/utils/tvmaze';
import type { AlertProps } from '../types/alert.ts';
import type { TvMazeSeries, TvMazeShow } from '@shared/types/tvmaze.ts';
import { useShow } from '../contexts/show/ShowContext.tsx';

export default function Result({ showData, alertProps }: { showData: TvMazeSeries, alertProps: AlertProps }) {
  const dataProps = useShow();
  const [nextEpisode, setNextEpisode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getNextEpisode = async (show: TvMazeShow) => {
      try {
        const response = await Api.fetchNextEpisodeDate(show);
        if (response.success && response.data) {
          setNextEpisode(response.data.date);
        }
      } catch {
        setError('Failed to get next episode');
      } finally {
        setLoading(false);
      }
    };
    getNextEpisode(showData.show);
  }, [showData.show]);

  const addTvShow = async () => {
    try {
      const response1 = await Api.addNewShowJson(showData.show);
      if (!response1.success) {
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage(`Failed to add ${showData.show.name}!`);
        alertProps.showAlert();
        return;
      }
      if (response1.data?.status === 'exists') {
        alertProps.setAlertVariant('warning');
        alertProps.setAlertMessage(`${showData.show.name} already exists!`);
      } else {
        alertProps.setAlertVariant('success');
        alertProps.setAlertMessage(`${showData.show.name} successfully added!`);
      }
      alertProps.showAlert();

      const response2 = await Api.getAllShows();
      if (response2.success && response2.data) {
        dataProps.setTvShows(response2.data);
      }
    } catch {
      alertProps.setAlertVariant('danger');
      alertProps.setAlertMessage(`Failed to add ${showData.show.name}!`);
      alertProps.showAlert();
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
        secondary={`${getPlatformName(showData.show) ?? 'N/A'} — ${nextEpisode}`}
      />
    </ListItem>
  );
}
