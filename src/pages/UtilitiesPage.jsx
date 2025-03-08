import { Box, Container, Typography, Button } from '@mui/material';
import { BackgroundPattern } from '../App';
import TokenIcon from '@mui/icons-material/Token';
import ImageIcon from '@mui/icons-material/Image';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const UtilityButton = ({ icon: Icon, title, to }) => {
  return (
    <Button
      component={Link}
      to={to}
      sx={{
        aspectRatio: '1/1',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid rgba(245, 13, 180, 0.1)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'rgba(245, 13, 180, 0.04)',
          transform: 'translateY(-2px)',
        }
      }}
    >
      <Icon sx={{ fontSize: 48, color: '#F50DB4', mb: 2 }} />
      <Typography variant="h6" sx={{ 
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#111'
      }}>
        {title}
      </Typography>
    </Button>
  );
};

const UtilitiesPage = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100%',
      background: '#FAFAFA',
      pb: 4
    }}>
      <Navbar />
      <BackgroundPattern />
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          pt: { xs: '80px', sm: '100px' },
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{ 
          mb: 4, 
          textAlign: 'center',
          position: 'relative'
        }}>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2.25rem' },
              color: '#111',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              mb: 2,
              '& span': {
                color: '#F50DB4'
              }
            }}
          >
            Fren <span>Utilities</span>
          </Typography>
        </Box>
        
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3
        }}>
          <UtilityButton 
            icon={TokenIcon}
            title="Token Deployer"
            to="/utilities/token-deployer"
          />
          <UtilityButton 
            icon={ImageIcon}
            title="NFT Minter"
            to="/utilities/nft-minter"
          />
          <UtilityButton 
            icon={AccountTreeIcon}
            title="Deploy a Fren Chain"
            to="/utilities/chain-deployer"
          />
        </Box>
      </Container>
    </Box>
  );
};

export default UtilitiesPage; 