import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Slider, Button } from '@mui/material';
import { createPublicClient, http, formatEther, createWalletClient, custom, parseEther } from 'viem';
import { unichainSepolia } from '../wallet';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import Navbar from './Navbar';
import ConnectPage from './ConnectPage';
import MintModal from './MintModal';
import { APP_CONFIG } from '../config';
import MaintenanceMode from './MaintenanceMode';

const MintPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [modalStatus, setModalStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [modalOpen, setModalOpen] = useState(false);
  const [mintData, setMintData] = useState({
    walletAddress: '',
    weight: 1,
    name: '',
    networkName: '',
    isValidNetwork: false
  });

  // Initialize public client for balance checking
  const publicClient = createPublicClient({
    chain: unichainSepolia,
    transport: http()
  });

  // Check if wallet is connected and on correct network
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const validChainId = `0x${unichainSepolia.id.toString(16)}`;
        
        if (accounts.length > 0) {
          const isValidNetwork = chainId === validChainId;
          const networkName = isValidNetwork ? 'Unichain Sepolia' : 'Wrong Network';
          setMintData(prev => ({ 
            ...prev, 
            walletAddress: accounts[0],
            networkName,
            isValidNetwork
          }));
        } else {
          setMintData(prev => ({ 
            ...prev, 
            walletAddress: '', 
            networkName: '', 
            isValidNetwork: false 
          }));
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
        setMintData(prev => ({ 
          ...prev, 
          walletAddress: '', 
          networkName: '', 
          isValidNetwork: false 
        }));
      }
    };

    checkWalletStatus();
    const interval = setInterval(checkWalletStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleWeightChange = (event, value) => {
    setMintData(prev => ({ ...prev, weight: value }));
  };

  const handleNameChange = (event) => {
    const value = event.target.value;
    setMintData(prev => ({ ...prev, name: value }));
  };

  const validateName = (name) => {
    if (name.length === 0) return 'Name is required';
    if (name.length > 16) return 'Name must be 16 characters or less';
    if (!/^[a-zA-Z0-9]+$/.test(name)) return 'Only letters (A-Z, a-z) and numbers (0-9) are allowed';
    return '';
  };

  const calculateMintPrice = (weight) => {
    const basePrice = 0.001;
    return (basePrice * weight).toFixed(4);
  };

  const handleMint = async () => {
    if (!window.ethereum) {
      setError('Please install a Web3 wallet');
      return;
    }

    try {
      setModalOpen(true);
      setModalStatus('loading');
      setIsMinting(true);
      setError('');
      setTxStatus('');
      const [account] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const walletClient = createWalletClient({
        account,
        chain: unichainSepolia,
        transport: custom(window.ethereum)
      });

      // Validate weight and name before proceeding
      if (mintData.weight < 1 || mintData.weight > 100) {
        throw new Error('Invalid weight value');
      }

      const nameError = validateName(mintData.name);
      if (nameError) {
        throw new Error(nameError);
      }

      // Calculate and validate mint price
      const mintPrice = parseEther(calculateMintPrice(mintData.weight));
      const balance = await publicClient.getBalance({ address: account });
      if (balance < mintPrice) {
        throw new Error('Insufficient balance for minting');
      }

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'mint',
        args: [BigInt(mintData.weight), mintData.name],
        value: mintPrice
      });

      // Wait for transaction confirmation
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        // Consider the transaction successful if we got a receipt (even with RPC errors)
        setModalStatus('success');
        // Store the successful mint data before resetting the form
        const successData = { ...mintData };
        setMintData(prev => ({
          ...prev,
          name: '',
          weight: 1
        }));
        // Pass the stored data to the modal
        setModalOpen(true);
        setModalStatus('success');
        setMintData(successData); // Restore the data temporarily for the modal
        return;
      } catch (receiptError) {
        console.error('Receipt error:', receiptError);
        // If we got a Non-200 error but have a transaction hash, consider it successful
        if (receiptError.message.includes('Non-200 status code')) {
          setModalStatus('success');
          // Store the successful mint data before resetting the form
          const successData = { ...mintData };
          setMintData(prev => ({
            ...prev,
            name: '',
            weight: 1
          }));
          // Pass the stored data to the modal
          setModalOpen(true);
          setModalStatus('success');
          setMintData(successData); // Restore the data temporarily for the modal
          return;
        }
        throw receiptError;
      }

    } catch (error) {
      console.error('Minting error:', error);
      let errorMessage = 'Failed to mint';
      let additionalInfo = '';
      
      if (error.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas + value';
        } else if (error.message.toLowerCase().includes('name already taken') || error.message.toLowerCase().includes('name exists')) {
          errorMessage = 'This name is already taken';
          additionalInfo = 'Please try a different name for your Fren.';
        } else if (error.message.toLowerCase().includes('alphanumeric') || error.message.toLowerCase().includes('invalid name')) {
          errorMessage = 'Invalid name format';
          additionalInfo = 'Names can only contain letters (A-Z, a-z) and numbers (0-9).';
        } else if (error.message.includes('Non-200 status code') || error.message.includes('internal error')) {
          // Check if we have a transaction hash, which would indicate success
          if (hash) {
            setModalStatus('success');
            return;
          }
          errorMessage = 'Network communication error';
          additionalInfo = 'The network is experiencing high traffic. Please wait a moment and try again.';
        } else if (error.message.includes('transaction failed') || error.message.includes('execution reverted')) {
          errorMessage = 'Transaction failed';
          additionalInfo = 'This could be because the name is taken or there was a network issue. Please try again with a different name.';
        } else {
          errorMessage = 'Unexpected error';
          additionalInfo = 'Please try again. If the issue persists, the name might be taken or there might be network congestion.';
        }
      }
      
      setModalStatus('error');
      setError(`${errorMessage}${additionalInfo ? `\n${additionalInfo}` : ''}`);
    } finally {
      setIsMinting(false);
    }
  };

  const handleModalClose = () => {
    if (modalStatus !== 'loading') {
      setModalOpen(false);
      if (modalStatus === 'success') {
        // Reset form
        setMintData(prev => ({
          ...prev,
          name: '',
          weight: 1
        }));
      }
    }
  };

  const nameError = validateName(mintData.name);
  const mintPrice = calculateMintPrice(mintData.weight);

  if (!mintData.walletAddress) {
    return <ConnectPage />;
  }

  if (!mintData.isValidNetwork) {
    return <ConnectPage error="wrong-network" />;
  }

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
        {APP_CONFIG.MAINTENANCE_MODE ? (
          <MaintenanceMode 
            customTitle="Minting Temporarily Paused"
            customDescription="We're currently upgrading the Frens contract. Minting will be available again shortly. Thank you for your patience!"
          />
        ) : (
          <Box sx={{
            maxWidth: '440px',
            width: '100%',
            mx: 'auto',
          }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography 
                variant="h2" 
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
                Mint Your <span>Unifren</span>
              </Typography>
              <Typography sx={{
                fontSize: '1rem',
                color: '#666',
                maxWidth: '400px',
                mx: 'auto',
                lineHeight: 1.6
              }}>
                Give life to your digital companion! Choose their weight and pick a unique name—they'll be with you on this journey.
              </Typography>
            </Box>

            <Box sx={{ 
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              backgroundColor: 'white',
              border: '1px solid rgba(245, 13, 180, 0.1)',
              boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)',
            }}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ 
                  fontSize: '1.1rem',
                  color: '#111',
                  mb: 1,
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  Choose Weight
                  <Typography component="span" sx={{ 
                    fontSize: '0.9rem',
                    color: '#666',
                    fontWeight: 500
                  }}>
                    Multiplier: {mintData.weight}x
                  </Typography>
                </Typography>
                <Typography sx={{ 
                  fontSize: '0.9rem',
                  color: '#666',
                  mb: 2,
                  lineHeight: 1.4
                }}>
                  Higher weight = higher rewards multiplier but costs more to mint
                </Typography>
                <Slider
                  value={mintData.weight}
                  min={1}
                  max={100}
                  onChange={handleWeightChange}
                  marks={[
                    { value: 1, label: '1x' },
                    { value: 50, label: '50x' },
                    { value: 100, label: '100x' }
                  ]}
                  sx={{
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.8rem',
                      color: '#666',
                      fontWeight: 600
                    },
                    '& .MuiSlider-track': {
                      background: '#F50DB4',
                      height: 4,
                      border: 'none'
                    },
                    '& .MuiSlider-thumb': {
                      background: '#F50DB4',
                      width: 20,
                      height: 20,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(245, 13, 180, 0.15)'
                      },
                      '&:before': {
                        boxShadow: '0 0 0 8px rgba(245, 13, 180, 0.08)'
                      }
                    },
                    '& .MuiSlider-rail': {
                      height: 4,
                      backgroundColor: 'rgba(245, 13, 180, 0.1)'
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: 'rgba(245, 13, 180, 0.2)',
                      height: 4
                    },
                    '& .MuiSlider-markActive': {
                      backgroundColor: '#F50DB4'
                    }
                  }}
                />
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1
                }}>
                  <Typography sx={{ 
                    fontSize: '0.8rem',
                    color: '#666'
                  }}>
                    Lower cost
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.8rem',
                    color: '#666'
                  }}>
                    Higher rewards
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ 
                  fontSize: '1.1rem',
                  color: '#111',
                  mb: 1,
                  fontWeight: 700
                }}>
                  Name Your Fren
                </Typography>
                <Typography sx={{ 
                  fontSize: '0.9rem', 
                  color: '#666', 
                  mb: 2,
                  lineHeight: 1.4
                }}>
                  Names are permanent and must be unique. Use 1-16 characters, letters and numbers only.
                </Typography>
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="Enter name (e.g. Satoshi123)"
                  value={mintData.name}
                  onChange={handleNameChange}
                  error={!!nameError}
                  helperText={nameError}
                  inputProps={{
                    style: { 
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      fontFamily: 'Space Grotesk'
                    },
                    maxLength: 16
                  }}
                  sx={{
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
                      marginTop: 1,
                      fontSize: '0.85rem'
                    }
                  }}
                />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 2,
                pt: 2,
                borderTop: '1px solid rgba(245, 13, 180, 0.1)'
              }}>
                <Box>
                  <Typography sx={{ 
                    color: '#666',
                    fontSize: '0.9rem',
                    mb: 0.5
                  }}>
                    Mint Price
                  </Typography>
                  <Typography sx={{ 
                    color: '#F50DB4',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    fontFamily: 'Space Grotesk'
                  }}>
                    {mintPrice} ETH
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleMint}
                  disabled={!mintData.name || !!nameError || !mintData.isValidNetwork || isMinting}
                  sx={{ 
                    py: 1.5,
                    px: 4,
                    fontSize: '1rem',
                    background: '#F50DB4',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      background: '#F50DB4',
                      opacity: 0.9,
                      boxShadow: '0 4px 16px rgba(245, 13, 180, 0.2)'
                    },
                    '&.Mui-disabled': {
                      background: '#E0E0E0',
                      color: '#999'
                    }
                  }}
                >
                  {isMinting ? 'Minting...' : 'Mint Now'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Container>

      <MintModal
        open={modalOpen}
        onClose={handleModalClose}
        status={modalStatus}
        error={error}
        mintData={mintData}
        onRetry={handleMint}
      />
    </Box>
  );
};

export default MintPage;