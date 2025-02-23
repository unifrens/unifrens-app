import { Box, Container } from '@mui/material';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#FAFAFA',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'linear-gradient(180deg, rgba(245, 13, 180, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Box
        component="img"
        src="./frens-header.png"
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
          maxHeight: { xs: '120px', sm: '160px', md: '200px' },
          objectFit: 'cover',
          opacity: 0.95
        }}
        alt="Unifrens header"
      />
      <Container 
        maxWidth="sm" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
        }}
      >
        <Navigation />
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 