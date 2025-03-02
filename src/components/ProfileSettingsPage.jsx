import { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, Avatar, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Navbar from './Navbar';
import { unichainSepolia } from '../wallet';
import AvatarGenerator from './AvatarGenerator';
import ConnectPage from './ConnectPage';

const formatAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ProfileSettingsPage = () => {
  const [walletData, setWalletData] = useState({
    address: '',
    isConnected: false,
    isValidNetwork: false
  });
  const [selectedFren, setSelectedFren] = useState('');
  const [userFrens, setUserFrens] = useState([]);

  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const validChainId = `0x${unichainSepolia.id.toString(16)}`;
        
        const isValidNetwork = chainId === validChainId;
        const newAddress = accounts[0] || '';
        
        setWalletData(prev => {
          if (prev.address !== newAddress || prev.isValidNetwork !== isValidNetwork) {
            return {
              address: newAddress,
              isConnected: !!newAddress,
              isValidNetwork
            };
          }
          return prev;
        });

        // Fetch user's frens when wallet is connected
        if (newAddress) {
          try {
            const response = await fetch('https://imgs.unifrens.com/leaderboard/nfts');
            const data = await response.json();
            const userNFTs = data.nfts.filter(nft => 
              nft.owner.toLowerCase() === newAddress.toLowerCase()
            );
            setUserFrens(userNFTs);
          } catch (error) {
            console.error('Error fetching NFTs:', error);
          }
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
      }
    };

    checkWalletStatus();
    const interval = setInterval(checkWalletStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load selected fren from localStorage
  useEffect(() => {
    const savedFren = localStorage.getItem('selectedFren');
    if (savedFren) {
      setSelectedFren(savedFren);
    }
  }, []);

  // Save selected fren to localStorage
  const handleFrenSelect = (event) => {
    const value = event.target.value;
    setSelectedFren(value);
    localStorage.setItem('selectedFren', value);
  };

  const handleSaveProfile = () => {
    const selectedNFT = userFrens.find(f => f.tokenId === selectedFren);
    const profileData = selectedNFT ? {
      tokenId: selectedFren,
      name: selectedNFT.name,
      address: walletData.address
    } : null;
    
    localStorage.setItem('profileData', JSON.stringify(profileData));
    
    // Dispatch custom event for immediate UI update
    window.dispatchEvent(new Event('profileUpdate'));
  };

  return (
    <>
      {(!walletData.isConnected || !walletData.isValidNetwork) ? (
        <ConnectPage />
      ) : (
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
                Profile <span>Settings</span>
              </Typography>
            </Box>

            <Box sx={{
              maxWidth: '600px',
              mx: 'auto'
            }}>
              <Card sx={{ 
                p: { xs: 3, sm: 4 },
                borderRadius: 2,
                backgroundColor: 'white',
                border: '1px solid rgba(245, 13, 180, 0.1)',
                boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)',
                mb: 3
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Box sx={{ 
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    mb: 1,
                    border: '1px solid rgba(245, 13, 180, 0.1)'
                  }}>
                    {selectedFren ? (
                      <AvatarGenerator
                        size="100%"
                        name={userFrens.find(f => f.tokenId === selectedFren)?.name || ''}
                        variant="beam"
                        colors={['#F50DB4', '#FEAFF0']}
                      />
                    ) : (
                      <Avatar 
                        sx={{ 
                          width: '100%',
                          height: '100%',
                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                          color: 'white'
                        }}
                      >
                        <PersonIcon sx={{ fontSize: '2.5rem' }} />
                      </Avatar>
                    )}
                  </Box>

                  {walletData.isConnected && (
                    <>
                      <FormControl 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          maxWidth: '320px',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: 'rgba(245, 13, 180, 0.04)',
                            '& fieldset': {
                              borderColor: 'rgba(245, 13, 180, 0.1)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(245, 13, 180, 0.2)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#F50DB4',
                            }
                          }
                        }}
                      >
                        <InputLabel 
                          id="fren-select-label"
                          sx={{
                            color: '#666',
                            '&.Mui-focused': {
                              color: '#F50DB4'
                            }
                          }}
                        >
                          Select Profile Fren
                        </InputLabel>
                        <Select
                          labelId="fren-select-label"
                          value={selectedFren}
                          onChange={handleFrenSelect}
                          label="Select Profile Fren"
                          sx={{
                            '& .MuiSelect-select': {
                              py: 1.5
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {userFrens.map((fren) => (
                            <MenuItem 
                              key={fren.tokenId} 
                              value={fren.tokenId}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <Box sx={{ 
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}>
                                <AvatarGenerator
                                  size="100%"
                                  name={fren.name}
                                  variant="beam"
                                  colors={['#F50DB4', '#FEAFF0']}
                                />
                              </Box>
                              <Typography>
                                {fren.name}.fren
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        variant="contained"
                        onClick={handleSaveProfile}
                        sx={{
                          bgcolor: '#F50DB4',
                          color: 'white',
                          px: 4,
                          py: 1.5,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          borderRadius: '12px',
                          width: '100%',
                          maxWidth: '320px',
                          '&:hover': { 
                            bgcolor: '#d00a9b'
                          }
                        }}
                      >
                        Save Profile
                      </Button>
                    </>
                  )}

                  <Typography sx={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#111',
                    fontFamily: 'Space Grotesk'
                  }}>
                    {walletData.isConnected ? (
                      selectedFren ? 
                        `${userFrens.find(f => f.tokenId === selectedFren)?.name}.fren` : 
                        'default.fren'
                    ) : 'Connect Wallet'}
                  </Typography>

                  {walletData.isConnected && (
                    <Typography sx={{
                      fontSize: '0.875rem',
                      color: '#666',
                      fontFamily: 'monospace'
                    }}>
                      {formatAddress(walletData.address)}
                    </Typography>
                  )}

                  <Box sx={{
                    width: '100%',
                    height: '1px',
                    bgcolor: 'rgba(245, 13, 180, 0.1)',
                    my: 2
                  }} />

                  <Typography sx={{
                    fontSize: '0.875rem',
                    color: '#666',
                    textAlign: 'center'
                  }}>
                    More profile settings coming soon! 🚀
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Container>
        </Box>
      )}
    </>
  );
};

export default ProfileSettingsPage; 