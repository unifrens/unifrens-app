import { Box, Typography, Alert } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const DiscordWarningAnnouncement = () => {
  return (
    <Alert
      severity="info"
      icon={<InfoOutlinedIcon />}
      sx={{
        mb: { xs: 2, sm: 3 },
        backgroundColor: 'rgba(25, 118, 210, 0.05)',
        border: '1px solid rgba(25, 118, 210, 0.1)',
        borderRadius: '12px',
        '& .MuiAlert-icon': {
          color: '#1976d2'
        }
      }}
    >
      <Box>
        <Typography sx={{ 
          fontSize: { xs: '0.9rem', sm: '1rem' },
          fontWeight: 600,
          color: '#1976d2',
          mb: 0.5
        }}>
          Important Notice
        </Typography>
        <Typography sx={{ 
          fontSize: { xs: '0.85rem', sm: '0.9rem' },
          color: '#666',
          lineHeight: 1.5
        }}>
          Please be aware that Unifrens will never ask you to connect your wallet through Collab.land or any other Discord wallet verification service. For your safety, do not connect your wallet if prompted through Discord.
        </Typography>
      </Box>
    </Alert>
  );
};

export default DiscordWarningAnnouncement; 