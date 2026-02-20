import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import * as Api from '../apis/requests.js';
import Result from '../components/Result.js';
import { AlertContext } from '../contexts/Contexts.js';

export default function SearchResults() {
  const alertProps = useContext(AlertContext);
  const { showName } = useParams();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const searchTvShows = async (showName: string) => {
      try {
        console.log(showName);
        const response = await Api.tvShowResults(showName);
        setSearchResults(response);
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
      <Button variant='outlined' onClick={() => navigate('/')}>All Shows</Button>
    </Container>
  );
}
