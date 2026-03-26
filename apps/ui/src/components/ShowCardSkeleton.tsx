import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function ShowCardSkeleton() {
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '2 / 3',
        overflow: 'hidden',
        outline: '1px solid var(--border)',
      }}
    >
      <Skeleton
        variant="rectangular"
        sx={{ width: '100%', height: '100%', bgcolor: 'var(--surface)' }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: '14px',
          background: 'linear-gradient(to top, color-mix(in srgb, var(--bg) 97%, transparent) 0%, color-mix(in srgb, var(--bg) 75%, transparent) 40%, transparent 100%)',
        }}
      >
        <Skeleton variant="text" sx={{ width: '80%', bgcolor: 'color-mix(in srgb, var(--cream) 10%, transparent)', mb: '6px' }} />
        <Skeleton variant="text" sx={{ width: '55%', bgcolor: 'color-mix(in srgb, var(--cream) 7%, transparent)', mb: '10px', fontSize: '0.6rem' }} />
        <Skeleton variant="text" sx={{ width: '45%', bgcolor: 'color-mix(in srgb, var(--cream) 7%, transparent)', fontSize: '0.6rem' }} />
      </Box>
    </Box>
  );
}
