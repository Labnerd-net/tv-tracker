import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import * as Api from '../apis/userRequests.js';
import Result from '../components/Result.js';
import type { TvMazeSeries } from '@shared/types/tvmaze.js';
import { useAlert } from '../contexts/alert/AlertContext.js';

export default function SearchResults() {
  const alertProps = useAlert();
  const { showName } = useParams();
  const [searchResults, setSearchResults] = useState<TvMazeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const searchTvShows = async (showName: string) => {
      try {
        const response = await Api.tvShowResults(showName);
        if (response.success && response.data) {
          setSearchResults(response.data);
        } else {
          const msg = response.error ?? 'Failed to retrieve TV Show results';
          alertProps.showAlert('danger', msg);
          setError(msg);
        }
      } catch {
        const msg = 'Failed to retrieve TV Show results';
        alertProps.showAlert('danger', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (showName) {
      searchTvShows(showName);
    }
  }, [alertProps, showName]);

  if (loading) return <div>Loading TV Show results ...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Container sx={{ pt: 3 }}>
      <Typography variant='h5' gutterBottom>Search Results for {showName}</Typography>
      <List>
        {searchResults.map((data, index) => (
          <Result key={index} showData={data} alertProps={alertProps} />
        ))}
      </List>
      <Button variant='outlined' onClick={() => navigate('/dashboard')}>All Shows</Button>
    </Container>
  );
}
