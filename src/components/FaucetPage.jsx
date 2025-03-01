import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Link as MuiLink } from '@mui/material';
import Navbar from './Navbar';
import { isAddress } from 'viem';

const FAUCET_ADDRESS = '0x7eB66917eA13e3f65F12D4301C9f731273E48c3c';
const ALCHEMY_RPC = import.meta.env.VITE_ALCHEMY_RPC_URL;

const FaucetPage = () => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [result, setResult] = useState('');
  const [txHash, setTxHash] = useState('');
  const [faucetBalance, setFaucetBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  const fetchFaucetBalance = async () => {
    try {
      const response = await fetch(ALCHEMY_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [FAUCET_ADDRESS, 'latest']
        })
      });
      
      const data = await response.json();
      const balanceInWei = parseInt(data.result, 16);
      const balanceInEth = balanceInWei / 1e18;
      setFaucetBalance(balanceInEth.toFixed(4));
    } catch (error) {
      console.error('Failed to fetch faucet balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchFaucetBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchFaucetBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddressChange = (event) => {
    const value = event.target.value;
    setAddress(value);
    setError('');
    setResult('');
    
    if (value && !isAddress(value)) {
      setError('Please enter a valid Ethereum address');
    }
  };

  const handleRequest = async () => {
    if (!address || error) return;
    
    setIsRequesting(true);
    setResult('');
    setTxHash('');

    try {
      // First check if the faucet has enough balance
      if (Number(faucetBalance) < 0.01) {
        setError('Faucet does not have enough balance. Please try again later.');
        return;
      }

      const response = await fetch('https://faucet.unifrens.com/drip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult('Success! Your request has been processed.');
        setTxHash(data.transaction);
        
        // Wait a bit and refresh balance
        setTimeout(fetchFaucetBalance, 3000);
      } else {
        setError(data.error || 'Failed to process request. Please try again later.');
      }
    } catch (error) {
      setError('Failed to connect to faucet server. Please try again later.');
    } finally {
      setIsRequesting(false);
    }
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
              lineHeight: 1.6,
              mb: 2
            }}>
              Get free testnet ETH for Unichain Sepolia. No gas fees required - perfect for new wallets! Each request provides 0.01 ETH.
            </Typography>
            <Typography sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: '#666',
              maxWidth: '400px',
              mx: 'auto',
              lineHeight: 1.6,
              mb: 2
            }}>
              New to Unichain? <MuiLink 
                href="https://docs.unichain.org/docs/technical-information/network-information"
                target="_blank"
                sx={{
                  color: '#F50DB4',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Click here
              </MuiLink> to learn how to add Unichain Sepolia to your MetaMask.
            </Typography>
            {/* Subtle Balance Display */}
            {!isLoadingBalance && (
              <Typography sx={{
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                color: Number(faucetBalance) < 0.01 ? '#f44336' : '#4CAF50',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1
              }}>
                Faucet Balance: <span style={{ fontFamily: 'monospace' }}>{faucetBalance} ETH</span>
                {Number(faucetBalance) < 0.01 && ' (Empty)'}
              </Typography>
            )}
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
                '&:hover': {
                  background: '#D90C9D',
                },
                '&.Mui-disabled': {
                  background: '#E0E0E0',
                  color: '#999'
                }
              }}
            >
              {isRequesting ? 'Processing...' : 'Request 0.01 ETH'}
            </Button>
            
            {/* Result Message */}
            {result && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography sx={{ 
                  color: '#4CAF50',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  mb: 1
                }}>
                  {result}
                </Typography>
                {txHash && (
                  <MuiLink 
                    href={`https://sepolia.uniscan.xyz/tx/${txHash}`}
                    target="_blank"
                    sx={{
                      fontSize: '0.8rem',
                      color: '#F50DB4',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    View Transaction →
                  </MuiLink>
                )}
              </Box>
            )}
          </Box>

          {/* Donation Note */}
          <Box sx={{ 
            textAlign: 'center', 
            mt: 3,
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            color: '#666'
          }}>
            Support the faucet:
            <Box sx={{ 
              fontFamily: 'monospace',
              mt: 1,
              color: '#111',
              wordBreak: 'break-all'
            }}>
              {FAUCET_ADDRESS}
            </Box>
            <Typography sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              color: '#888',
              mt: 1,
              fontStyle: 'italic'
            }}>
              Accepts testnet ETH and any other EVM tokens
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default FaucetPage; 