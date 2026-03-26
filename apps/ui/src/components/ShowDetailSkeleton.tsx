import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function ShowDetailSkeleton() {
  return (
    <Box sx={{ minHeight: 'calc(100vh - 54px)', bgcolor: 'var(--bg)' }}>
      {/* Hero band */}
      <Skeleton
        variant="rectangular"
        sx={{
          width: '100%',
          height: { xs: '200px', md: '320px' },
          bgcolor: 'var(--surface)',
        }}
      />

      {/* Content — overlaps the hero */}
      <Box
        sx={{
          maxWidth: '900px',
          mx: 'auto',
          px: { xs: 2, md: 4 },
          mt: { xs: '-100px', md: '-160px' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Back button placeholder */}
        <Skeleton variant="text" sx={{ width: '80px', bgcolor: 'color-mix(in srgb, var(--cream) 8%, transparent)', mb: '28px' }} />

        {/* Poster + info grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '140px 1fr', md: '200px 1fr' },
            gap: { xs: '20px', md: '36px' },
            alignItems: 'start',
          }}
        >
          {/* Poster */}
          <Skeleton
            variant="rectangular"
            sx={{
              width: '100%',
              aspectRatio: '2 / 3',
              bgcolor: 'var(--surface)',
              outline: '1px solid var(--border)',
            }}
          />

          {/* Info */}
          <Box sx={{ pt: { xs: '8px', md: '16px' } }}>
            <Skeleton variant="text" sx={{ width: '75%', bgcolor: 'color-mix(in srgb, var(--cream) 10%, transparent)', fontSize: '2.5rem', mb: '8px' }} />
            <Skeleton variant="text" sx={{ width: '45%', bgcolor: 'color-mix(in srgb, var(--cream) 7%, transparent)', mb: '28px' }} />

            {/* Episode grid placeholder */}
            <Box sx={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', py: '20px', mb: '28px' }}>
              <Skeleton variant="text" sx={{ width: '30%', bgcolor: 'color-mix(in srgb, var(--cream) 7%, transparent)', mb: '10px' }} />
              <Skeleton variant="text" sx={{ width: '50%', bgcolor: 'color-mix(in srgb, var(--cream) 7%, transparent)', mb: '10px' }} />
              <Skeleton variant="text" sx={{ width: '30%', bgcolor: 'color-mix(in srgb, var(--cream) 7%, transparent)', mb: '10px' }} />
              <Skeleton variant="text" sx={{ width: '50%', bgcolor: 'color-mix(in srgb, var(--cream) 7%, transparent)' }} />
            </Box>

            {/* Action buttons placeholder */}
            <Box sx={{ display: 'flex', gap: '12px' }}>
              <Skeleton variant="rectangular" sx={{ width: '110px', height: '36px', bgcolor: 'color-mix(in srgb, var(--cream) 8%, transparent)' }} />
              <Skeleton variant="rectangular" sx={{ width: '110px', height: '36px', bgcolor: 'color-mix(in srgb, var(--cream) 8%, transparent)' }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
