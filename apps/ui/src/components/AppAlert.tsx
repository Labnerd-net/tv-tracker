import Box from '@mui/material/Box';

const VARIANTS: Record<string, { bg: string; border: string; color: string; label: string }> = {
  success: { bg: 'rgba(76, 175, 80, 0.12)', border: 'rgba(76, 175, 80, 0.35)', color: '#4caf50', label: 'OK' },
  danger:  { bg: 'rgba(230, 57, 70, 0.12)', border: 'rgba(230, 57, 70, 0.35)', color: '#e63946', label: 'ERR' },
  warning: { bg: 'rgba(242, 166, 90, 0.12)', border: 'rgba(242, 166, 90, 0.35)', color: '#f2a65a', label: 'WARN' },
  info:    { bg: 'rgba(144, 202, 249, 0.12)', border: 'rgba(144, 202, 249, 0.35)', color: '#90caf9', label: 'INFO' },
  primary: { bg: 'rgba(144, 202, 249, 0.12)', border: 'rgba(144, 202, 249, 0.35)', color: '#90caf9', label: 'INFO' },
};

export default function AppAlert({ alertVariant, alertMessage }: { alertVariant: string; alertMessage: string }) {
  const v = VARIANTS[alertVariant] ?? VARIANTS.info;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '66px',
        right: '20px',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        px: '16px',
        py: '12px',
        background: v.bg,
        border: `1px solid ${v.border}`,
        backdropFilter: 'blur(12px)',
        animation: 'slideInRight 0.3s ease both',
        maxWidth: '340px',
        minWidth: '220px',
      }}
    >
      <Box
        sx={{
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.58rem',
          letterSpacing: '0.14em',
          color: v.color,
          flexShrink: 0,
        }}
      >
        {v.label}
      </Box>
      <Box
        sx={{
          width: '1px',
          height: '16px',
          background: v.border,
          flexShrink: 0,
        }}
      />
      <Box
        sx={{
          fontFamily: '"Space Mono", monospace',
          fontSize: '0.7rem',
          color: 'var(--cream)',
          lineHeight: 1.4,
        }}
      >
        {alertMessage}
      </Box>
    </Box>
  );
}
