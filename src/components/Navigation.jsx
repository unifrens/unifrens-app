import { Box, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      justifyContent: 'center',
      mb: 3
    }}>
      <Button
        component={Link}
        to="/frens"
        variant={location.pathname.startsWith('/frens') ? 'contained' : 'outlined'}
        sx={{ 
          borderColor: '#F50DB4',
          color: location.pathname.startsWith('/frens') ? 'white' : '#F50DB4',
          backgroundColor: location.pathname.startsWith('/frens') ? '#F50DB4' : 'transparent',
          '&:hover': {
            borderColor: '#F50DB4',
            backgroundColor: location.pathname.startsWith('/frens') ? '#D00C9B' : 'rgba(245, 13, 180, 0.1)',
          }
        }}
      >
        My Frens
      </Button>
      <Button
        component={Link}
        to="/logs"
        variant={location.pathname.startsWith('/logs') ? 'contained' : 'outlined'}
        sx={{ 
          borderColor: '#F50DB4',
          color: location.pathname.startsWith('/logs') ? 'white' : '#F50DB4',
          backgroundColor: location.pathname.startsWith('/logs') ? '#F50DB4' : 'transparent',
          '&:hover': {
            borderColor: '#F50DB4',
            backgroundColor: location.pathname.startsWith('/logs') ? '#D00C9B' : 'rgba(245, 13, 180, 0.1)',
          }
        }}
      >
        Activity Logs
      </Button>
    </Box>
  );
};

export default Navigation; 