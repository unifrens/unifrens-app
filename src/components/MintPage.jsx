import { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, TextField, Slider, Button, Alert } from '@mui/material';
import { createPublicClient, http, formatEther, createWalletClient, custom, parseEther } from 'viem';
import { unichainMainnet } from '../wallet';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import Navbar from './Navbar';
import ConnectPage from './ConnectPage';
import MintModal from './MintModal';
import { APP_CONFIG } from '../config';
import MaintenanceMode from './MaintenanceMode';
import AvatarGenerator from './AvatarGenerator';
import { isWhitelisted, WHITELIST_MESSAGE, WHITELISTED_MESSAGE } from '../config/whitelist';
import confetti from 'canvas-confetti';

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

  // Add new state for validation message
  const [validationMessage, setValidationMessage] = useState('');

  // Add new state for whitelist period
  const [isWhitelistPeriod, setIsWhitelistPeriod] = useState(true); // Set to false after 24 hours
  const [isUserWhitelisted, setIsUserWhitelisted] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0
  });

  // Set fixed end time: March 9th, 1 AM PST 2025
  const whitelistEndTime = useRef(new Date('2025-03-09T01:00:00-08:00').getTime());

  const audioContext = useRef(null);
  const lastPlayedWeight = useRef(1);

  // Initialize public client for balance checking
  const publicClient = createPublicClient({
    chain: unichainMainnet,
    transport: http()
  });

  // Initialize audio context
  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Check if wallet is connected and on correct network
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!window.ethereum) return;

      try {
        // Batch request both accounts and chainId
        const [accounts, chainId] = await Promise.all([
          window.ethereum.request({ method: 'eth_accounts' }),
          window.ethereum.request({ method: 'eth_chainId' })
        ]);
        
        const validChainId = `0x${unichainMainnet.id.toString(16)}`;
        
        if (accounts.length > 0) {
          const isValidNetwork = chainId === validChainId;
          const networkName = isValidNetwork ? 'Unichain Mainnet' : 'Wrong Network';
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
      }
    };

    // Initial check
    checkWalletStatus();
    
    // Set up event listeners instead of polling
    window.ethereum?.on('accountsChanged', checkWalletStatus);
    window.ethereum?.on('chainChanged', checkWalletStatus);
    
    return () => {
      window.ethereum?.removeListener('accountsChanged', checkWalletStatus);
      window.ethereum?.removeListener('chainChanged', checkWalletStatus);
    };
  }, []);

  // Add whitelist check when wallet connects
  useEffect(() => {
    if (mintData.walletAddress) {
      setIsUserWhitelisted(isWhitelisted(mintData.walletAddress));
    }
  }, [mintData.walletAddress]);

  // Initialize whitelist period based on current time
  useEffect(() => {
    const now = Date.now();
    const isStillWhitelistPeriod = whitelistEndTime.current > now;
    setIsWhitelistPeriod(isStillWhitelistPeriod);

    if (isStillWhitelistPeriod) {
      const distance = whitelistEndTime.current - now;
      setTimeRemaining({
        hours: Math.floor(distance / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }
  }, []);

  // Update countdown timer effect
  useEffect(() => {
    if (!isWhitelistPeriod) return; // Don't start timer if whitelist period is over

    const calculateTimeRemaining = () => {
      const now = Date.now();
      const distance = whitelistEndTime.current - now;

      if (distance <= 0) {
        setIsWhitelistPeriod(false);
        return null;
      }

      return {
        hours: Math.floor(distance / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      if (!remaining) {
        clearInterval(timer);
        return;
      }
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [isWhitelistPeriod]); // Add dependency on isWhitelistPeriod

  const playWeightSound = (weight) => {
    if (!audioContext.current) return;

    const baseFreq = 200;
    const maxFreq = 800;
    const normalizedWeight = weight / 100;
    const frequency = baseFreq + (maxFreq - baseFreq) * normalizedWeight;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = 0.1;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.1);

    // Trigger confetti at 100
    if (weight === 100 && lastPlayedWeight.current !== 100) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F50DB4', '#FEAFF0'],
      });
    }
    
    lastPlayedWeight.current = weight;
  };

  const handleWeightChange = (event, newValue) => {
    setMintData(prev => ({
      ...prev,
      weight: newValue
    }));
    playWeightSound(newValue);
  };

  const handleNameChange = (event) => {
    const value = event.target.value;
    setMintData(prev => ({ ...prev, name: value }));
    setValidationMessage(validateName(value));
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

  // Add event emitter for successful mints
  const emitMintSuccess = () => {
    const event = new CustomEvent('unifrens:mint:success', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  };

  const ensureCorrectNetwork = async () => {
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const unichainMainnetId = `0x${unichainMainnet.id.toString(16)}`; // Should be 0x82
    
    if (chainId !== unichainMainnetId) {
      throw new Error('Please switch to Unichain Mainnet before minting. This is required to ensure your funds are safe.');
    }

    // Double check the network name to be extra safe
    const networkVersion = await window.ethereum.request({ method: 'net_version' });
    if (networkVersion !== unichainMainnet.id.toString()) {
      throw new Error('Network validation failed. Please ensure you are on Unichain Mainnet.');
    }
  };

  const handleMint = async () => {
    try {
      // Strict network validation first
      await ensureCorrectNetwork();

      if (!mintData.isValidNetwork) {
        setError('Please connect to Unichain Mainnet to mint');
        setModalStatus('error');
        setModalOpen(true);
        return;
      }

      if (!mintData.name) {
        setError('Please enter a name');
        setModalStatus('error');
        setModalOpen(true);
        return;
      }

      if (validationMessage) {
        setError(validationMessage);
        setModalStatus('error');
        setModalOpen(true);
        return;
      }

      setIsMinting(true);
      setError('');
      setTxStatus('Validating network...');
      setModalStatus('loading');
      setModalOpen(true);

      // Request account access if not already connected
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No account connected');
      }

      // Create wallet client with the connected account
      const walletClient = createWalletClient({
        account: accounts[0],
        chain: unichainMainnet,
        transport: custom(window.ethereum)
      });

      setTxStatus('Calculating mint price...');

      // Get the mint price for the selected weight
      const mintPrice = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getMintPrice',
        args: [BigInt(mintData.weight)]
      });

      // Final network check before transaction
      await ensureCorrectNetwork();

      setTxStatus('Preparing transaction...');

      // Prepare the transaction
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'mint',
        args: [BigInt(mintData.weight), mintData.name],
        value: mintPrice,
        account: accounts[0]
      });

      setTxStatus('Please confirm the transaction in your wallet...');

      // Send the transaction
      const hash = await walletClient.writeContract(request);

      setTxStatus('Transaction submitted...');

      // Wait for transaction with timeout
      try {
        const receipt = await Promise.race([
          publicClient.waitForTransactionReceipt({ hash }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000)
          )
        ]);

        setModalStatus('success');
        const successData = { ...mintData };
        setMintData(prev => ({
          ...prev,
          name: '',
          weight: 1
        }));
        setMintData(successData);
        emitMintSuccess();
        return;
      } catch (receiptError) {
        if (hash && (
          receiptError.message.includes('timeout') || 
          receiptError.message.includes('Non-200') ||
          receiptError.message.includes('internal error')
        )) {
          setModalStatus('success');
          const successData = { ...mintData };
          setMintData(prev => ({
            ...prev,
            name: '',
            weight: 1
          }));
          setMintData(successData);
          emitMintSuccess();
          return;
        }
        throw receiptError;
      }
    } catch (error) {
      console.error('Mint error:', error);
      if (error.message.includes('User rejected')) {
        setError('Transaction was rejected');
      } else if (error.message.includes('insufficient funds')) {
        setError('Insufficient funds for transaction');
      } else {
        setError(error.message || 'Failed to mint');
      }
      setModalStatus('error');
    } finally {
      setIsMinting(false);
      setTxStatus('');
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
      // Refresh the page to start fresh
      window.location.reload();
    }
  };

  const nameError = validateName(mintData.name);
  const mintPrice = calculateMintPrice(mintData.weight);

  const checkNetwork = async () => {
    try {
      const network = await window.ethereum.request({ method: 'eth_chainId' });
      const validNetwork = network === '0x82'; // Mainnet chain ID (130 in hex)
      setMintData(prev => ({ ...prev, isValidNetwork: validNetwork }));
      if (!validNetwork) {
        setValidationMessage('Please connect to Unichain Mainnet');
      }
    } catch (error) {
      console.error('Error checking network:', error);
      setMintData(prev => ({ ...prev, isValidNetwork: false }));
      setValidationMessage('Error checking network');
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x82' }], // Mainnet chain ID
      });
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x82',
                chainName: unichainMainnet.name,
                nativeCurrency: unichainMainnet.nativeCurrency,
                rpcUrls: [unichainMainnet.rpcUrls.default.http[0]],
                blockExplorerUrls: [unichainMainnet.blockExplorers.default.url],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
      console.error('Error switching network:', error);
    }
  };

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
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar />
      
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        py: { xs: 3, sm: 6 },
        mt: { xs: '64px', sm: '72px' }
      }}>
        <Container maxWidth="lg">
          {APP_CONFIG.MAINTENANCE_MODE ? (
            <MaintenanceMode 
              customTitle="Minting Temporarily Paused"
              customDescription="We're currently upgrading the Frens contract. Minting will be available again shortly. Thank you for your patience!"
            />
          ) : (
            <Box sx={{ maxWidth: '720px', mx: 'auto' }}>
              {/* Header */}
              <Box sx={{ 
                textAlign: 'center',
                mb: { xs: 3, sm: 4 }
              }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    color: '#111',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    mb: { xs: 1, sm: 1.5 },
                    '& span': {
                      color: '#F50DB4'
                    }
                  }}
                >
                  Mint your web3 <span>.fren</span> Name!
                </Typography>
                <Typography sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  color: '#666',
                  lineHeight: 1.5
                }}>
                  Mint your fren and secure your unique web3 identity in the Unifrens ecosystem.
                </Typography>
              </Box>

              {/* Whitelist Notice with Countdown */}
              {isWhitelistPeriod && mintData.walletAddress && (
                <Alert 
                  severity="info"
                  icon={false}
                  sx={{
                    mb: { xs: 3, sm: 4 },
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 13, 180, 0.04)',
                    border: '1px solid rgba(245, 13, 180, 0.1)',
                    boxShadow: 'none',
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5
                    }}>
                      <Typography sx={{ 
                        fontSize: '0.95rem',
                        color: '#111',
                        lineHeight: 1.5
                      }}>
                        {isUserWhitelisted ? WHITELISTED_MESSAGE.title : WHITELIST_MESSAGE.title}
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.9rem',
                        color: '#F50DB4',
                        fontWeight: 600,
                        fontFamily: 'Space Grotesk'
                      }}>
                        {timeRemaining.hours.toString().padStart(2, '0')}:
                        {timeRemaining.minutes.toString().padStart(2, '0')}:
                        {timeRemaining.seconds.toString().padStart(2, '0')}
                      </Typography>
                    </Box>
                    <Typography sx={{ 
                      mt: 1,
                      fontSize: '0.9rem',
                      color: '#666',
                      lineHeight: 1.6
                    }}>
                      {isUserWhitelisted ? WHITELISTED_MESSAGE.message : WHITELIST_MESSAGE.message}
                    </Typography>
                  </Box>
                </Alert>
              )}

              {/* Main Content */}
              <Box sx={{ 
                backgroundColor: 'white',
                borderRadius: '16px',
                p: { xs: 3, sm: 4 },
                boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)',
                border: '1px solid rgba(245, 13, 180, 0.1)'
              }}>
                {/* Name and Preview Section */}
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 4 },
                  alignItems: { xs: 'center', sm: 'flex-start' }
                }}>
                  {/* Preview */}
                  <Box sx={{ 
                    width: { xs: '120px', sm: '160px' },
                    height: { xs: '120px', sm: '160px' },
                    backgroundColor: 'rgba(245, 13, 180, 0.03)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(245, 13, 180, 0.1)'
                  }}>
                    <AvatarGenerator 
                      size="100%" 
                      name={mintData.name || "preview"}
                      variant="beam" 
                      colors={['#F50DB4', '#FEAFF0']} 
                      square={true} 
                    />
                  </Box>

                  {/* Form Section */}
                  <Box sx={{ flex: 1, width: '100%' }}>
                    <Typography sx={{ 
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      color: '#111',
                      mb: { xs: 0.5, sm: 1 },
                      fontWeight: 700
                    }}>
                      Choose your name
                    </Typography>

                    <TextField
                      fullWidth
                      variant="standard"
                      placeholder="satoshi"
                      value={mintData.name}
                      onChange={handleNameChange}
                      InputProps={{
                        endAdornment: (
                          <Typography sx={{ 
                            color: '#666', 
                            fontWeight: 500
                          }}>.fren</Typography>
                        )
                      }}
                      inputProps={{
                        style: { 
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          fontFamily: 'Space Grotesk',
                          paddingBottom: '8px'
                        },
                        maxLength: 16
                      }}
                      sx={{
                        mb: 4,
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
                        }
                      }}
                    />

                    {/* Weight Slider */}
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      mb: 4
                    }}>
                      <Typography sx={{ 
                        fontSize: '0.875rem',
                        color: '#666',
                        mb: 1
                      }}>
                        Weight
                      </Typography>
                      <Slider
                        value={mintData.weight}
                        onChange={handleWeightChange}
                        min={1}
                        max={100}
                        step={1}
                        marks={[
                          { value: 1, label: '1' },
                          { value: 25, label: '25' },
                          { value: 50, label: '50' },
                          { value: 75, label: '75' },
                          { value: 100, label: '100' }
                        ]}
                        sx={{
                          color: '#F50DB4',
                          '& .MuiSlider-markLabel': {
                            fontSize: '0.75rem',
                            color: '#666'
                          },
                          '& .MuiSlider-thumb': {
                            width: 24,
                            height: 24,
                            backgroundColor: '#fff',
                            border: '2px solid #F50DB4',
                            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                              boxShadow: 'inherit'
                            },
                            '&:before': {
                              display: 'none'
                            }
                          },
                          '& .MuiSlider-track': {
                            height: 4,
                            borderRadius: 2
                          },
                          '& .MuiSlider-rail': {
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'rgba(245, 13, 180, 0.1)'
                          }
                        }}
                      />
                    </Box>

                    {/* Price and Mint Button */}
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      pt: 3,
                      borderTop: '1px solid rgba(245, 13, 180, 0.1)'
                    }}>
                      <Box>
                        <Typography sx={{ 
                          color: '#666',
                          fontSize: { xs: '0.875rem', sm: '0.9rem' }
                        }}>
                          Total Price
                        </Typography>
                        <Typography sx={{ 
                          color: '#111',
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' },
                          fontFamily: 'Space Grotesk'
                        }}>
                          {calculateMintPrice(mintData.weight)} ETH
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={!mintData.isValidNetwork || isMinting || error || (isWhitelistPeriod && !isUserWhitelisted)}
                        onClick={handleMint}
                        sx={{
                          py: 2,
                          fontSize: '1.1rem',
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 700,
                          backgroundColor: '#F50DB4',
                          boxShadow: '0 8px 24px rgba(245, 13, 180, 0.25)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: '#F50DB4',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 28px rgba(245, 13, 180, 0.35)'
                          },
                          '&.Mui-disabled': {
                            backgroundColor: 'rgba(245, 13, 180, 0.12)',
                            color: 'rgba(0, 0, 0, 0.26)'
                          }
                        }}
                      >
                        {isMinting ? 'Minting...' : 'Mint Now'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Container>
      </Box>

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