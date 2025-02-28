import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Link as MuiLink } from '@mui/material';
import Navbar from './Navbar';
import { isAddress } from 'viem';

const FAUCET_ADDRESS = '0x7eB66917eA13e3f65F12D4301C9f731273E48c3c';

const FaucetPage = () => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAddressChange = (event) => {
    const value = event.target.value;
    setAddress(value);
    setError('');
    
    if (value && !isAddress(value)) {
      setError('Please enter a valid Ethereum address');
    }
  };

  const handleRequest = async () => {
    // Currently disabled as faucet is empty
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%',
      background: '#FAFAFA',
      pb: 4
    }}>
      <Navbar />
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          pt: { xs: '80px', sm: '100px' },
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{
          maxWidth: '440px',
          width: '100%',
          mx: 'auto',
        }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2.25rem' },
                color: '#111',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                mb: { xs: 1, sm: 2 },
                '& span': {
                  color: '#F50DB4'
                }
              }}
            >
              Unichain <span>Faucet</span>
            </Typography>
            <Typography sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: '#666',
              maxWidth: '400px',
              mx: 'auto',
              lineHeight: 1.6
            }}>
              Get testnet ETH for Unichain Sepolia. Each request provides 0.01 ETH.
            </Typography>
          </Box>

          {/* Faucet Empty Notice */}
          <Box sx={{ 
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            backgroundColor: 'rgba(244, 67, 54, 0.05)',
            border: '1px solid rgba(244, 67, 54, 0.1)',
            mb: { xs: 2, sm: 2.5 },
            textAlign: 'center'
          }}>
            <Typography sx={{ 
              fontSize: { xs: '0.9rem', sm: '1rem' },
              color: '#f44336',
              fontWeight: 600,
              mb: 1
            }}>
              Faucet is Currently Empty
            </Typography>
            <Typography sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              color: '#666',
              mb: 2,
              lineHeight: 1.4
            }}>
              Please help keep the faucet running by donating testnet ETH to:
            </Typography>
            <Box sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              color: '#111',
              mb: 2
            }}>
              {FAUCET_ADDRESS}
            </Box>
            <MuiLink 
              href={`https://sepolia.unifra.io/account/${FAUCET_ADDRESS}`}
              target="_blank"
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: '#F50DB4',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              View on Explorer →
            </MuiLink>
          </Box>

          {/* Address Input Card */}
          <Box sx={{ 
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            backgroundColor: 'white',
            border: '1px solid rgba(245, 13, 180, 0.1)',
            boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)'
          }}>
            <Typography sx={{ 
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              color: '#111',
              mb: 0.5,
              fontWeight: 700
            }}>
              Enter Your Address
            </Typography>
            <Typography sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.9rem' }, 
              color: '#666', 
              mb: { xs: 1.5, sm: 2 },
              lineHeight: 1.4
            }}>
              Provide your Unichain Sepolia wallet address to receive testnet ETH.
            </Typography>
            <TextField
              fullWidth
              variant="standard"
              placeholder="0x..."
              value={address}
              onChange={handleAddressChange}
              error={!!error}
              helperText={error}
              inputProps={{
                style: { 
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk',
                  paddingBottom: '4px'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiInput-root': {
                  '&:before': {
                    borderColor: 'rgba(245, 13, 180, 0.2)'
                  },
                  '&:hover:not(.Mui-disabled, .Mui-error):before': {
                    borderColor: 'rgba(245, 13, 180, 0.4)'
                  },
                  '&.Mui-focused:after': {
                    borderColor: '#F50DB4'
                  }
                },
                '& .MuiFormHelperText-root': {
                  marginLeft: 0,
                  marginTop: 0.5,
                  fontSize: '0.75rem'
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleRequest}
              disabled={!address || !!error || isRequesting}
              fullWidth
              sx={{ 
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                background: '#F50DB4',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                minHeight: { xs: '40px', sm: '48px' },
                opacity: 0.5, // Disabled state
                '&:hover': {
                  background: '#F50DB4',
                  opacity: 0.5, // Keep disabled state
                  cursor: 'not-allowed'
                },
                '&.Mui-disabled': {
                  background: '#E0E0E0',
                  color: '#999'
                }
              }}
            >
              {isRequesting ? 'Requesting...' : 'Request 0.01 ETH'}
            </Button>
            <Typography sx={{ 
              fontSize: '0.75rem',
              color: '#666',
              textAlign: 'center',
              mt: 1
            }}>
              Faucet is temporarily unavailable. Please check back later.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default FaucetPage; 