import { useEffect } from 'react';
import Box from '@mui/material/Box';
import SingleShow from '../components/SingleShow.tsx';
import * as Api from '../apis/userRequests.ts';
import { useAlert } from '../contexts/alert/AlertContext.tsx';
import { useShow } from '../contexts/show/ShowContext.tsx';

export default function AllShows() {
  const { setAlertVariant, setAlertMessage, showAlert } = useAlert();
  const { tvShows, setTvShows } = useShow();

  useEffect(() => {
    const fetchShows = async () => {
      const response = await Api.getAllShows();
      if (response.success && response.data) {
        setTvShows(response.data);
      } else if (!response.success) {
        setAlertVariant('danger');
        setAlertMessage(response.error ?? 'Failed to retrieve TV Shows');
        showAlert();
      }
    };
    fetchShows();
  }, [setTvShows, setAlertVariant, setAlertMessage, showAlert]);

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, p: 2 }}>
        {tvShows.map((data, index) => (
          <SingleShow key={index} showData={data} />
        ))}
      </Box>
    </>
  );
}
