import { Box, Typography, Card, CardContent, Stack, Chip, CircularProgress, Button, Container, IconButton, Tooltip, Alert } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import { createPublicClient, http, createWalletClient, custom, formatEther, encodeFunctionData } from 'viem';
import { unichainSepolia } from '../wallet';
import AvatarGenerator from './AvatarGenerator';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import ConnectPage from './ConnectPage';
import ClaimModal from './ClaimModal';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import frenTokenImage from '../assets/fren-token.png';
import { APP_CONFIG } from '../config';
import MaintenanceMode from './MaintenanceMode';

const publicClient = createPublicClient({
  chain: unichainSepolia,
  transport: http(),
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Queue for managing API requests with exponential backoff
const requestQueue = {
  queue: [],
  isProcessing: false,
  lastRequestTime: 0,
  baseDelay: 2000, // Base delay of 2 seconds
  maxRetries: 3,
  
  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, retries: 0 });
      if (!this.isProcessing) {
        this.process();
      }
    });
  },
  
  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const request = this.queue[0];
    
    try {
      // Ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.baseDelay) {
        await delay(this.baseDelay - timeSinceLastRequest);
      }
      
      const result = await request.fn();
      this.lastRequestTime = Date.now();
      this.queue.shift();
      request.resolve(result);
      
    } catch (error) {
      if (error.message.includes('Too Many Requests') && request.retries < this.maxRetries) {
        // Exponential backoff on rate limit
        request.retries++;
        const backoffDelay = this.baseDelay * Math.pow(2, request.retries);
        console.log(`Rate limited, retrying in ${backoffDelay}ms (attempt ${request.retries}/${this.maxRetries})`);
        await delay(backoffDelay);
        // Keep the request in queue and retry
        this.isProcessing = false;
        this.process();
        return;
      }
      
      this.queue.shift();
      request.reject(error);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        // Small delay before processing next request
        await delay(this.baseDelay);
        this.process();
      }
    }
  }
};

// Simplified retry function with shorter delays
const fetchWithRetry = async (fn, retries = 2) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.message.includes('Too Many Requests')) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay on rate limit
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const RefreshButton = ({ onClick, disabled, isRefreshing, cooldown }) => (
  <Tooltip title={cooldown ? "Please wait before refreshing again" : "Refresh data"}>
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled || cooldown}
        sx={{ 
          color: '#F50DB4',
          backgroundColor: 'white',
          border: '1px solid rgba(245, 13, 180, 0.1)',
          width: { xs: 48, sm: 40 },
          height: { xs: 48, sm: 40 },
          borderRadius: '12px',
          '&:hover': {
            backgroundColor: 'rgba(245, 13, 180, 0.04)'
          },
          '&.Mui-disabled': {
            opacity: 0.5
          }
        }}
      >
        <RefreshIcon sx={{ 
          animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }} />
      </IconButton>
    </span>
  </Tooltip>
);

const formatNumber = (num) => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

const FrensPage = () => {
  // Remove the local MAINTENANCE_MODE constant and use APP_CONFIG
  const SHOW_LEADERBOARD_ANNOUNCEMENT = APP_CONFIG.SHOW_LEADERBOARD_ANNOUNCEMENT;
  
  const [nfts, setNfts] = useState(() => {
    // Initialize state with cached data if available
    try {
      const cached = localStorage.getItem('unifrens_cache');
      if (cached) {
        const { data, timestamp, address } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < 90 * 1000) { // 90 seconds
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading initial cache:', error);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [walletData, setWalletData] = useState({
    address: '',
    isConnected: false,
    isValidNetwork: false
  });
  const [selectedToken, setSelectedToken] = useState(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackgroundRefresh, setIsBackgroundRefresh] = useState(false);
  const [contractHealth, setContractHealth] = useState({
    contractBalance: BigInt(0),
    pendingRewards: BigInt(0),
    isSolvent: true,
    loading: true
  });
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCachedData = () => {
    try {
      const cached = localStorage.getItem('unifrens_cache');
      if (!cached) return null;

      const { data, timestamp, address } = JSON.parse(cached);
      const now = Date.now();
      const age = now - timestamp;
      // Reduce cache duration to 30 seconds for better responsiveness
      const cacheTimeout = 30 * 1000;

      // Return cached data if it's fresh enough and matches current wallet
      if (age <= cacheTimeout && address === walletData.address) {
        return data.map(token => ({
          ...token,
          id: BigInt(token.id),
          weight: BigInt(token.weight),
          rewards: BigInt(token.rewards),
          claimed: BigInt(token.claimed)
        }));
      }
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const setCachedData = (data) => {
    try {
      // Convert all BigInt values to strings before caching
      const serializedData = data.map(token => ({
        ...token,
        id: token.id.toString(),
        weight: token.weight.toString(),
        rewards: token.rewards.toString(),
        claimed: token.claimed.toString()
      }));

      const cache = {
        data: serializedData,
        timestamp: Date.now(),
        address: walletData.address
      };
      localStorage.setItem('unifrens_cache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  const fetchUserNFTs = useCallback(async (skipCache = false) => {
    if (!walletData.isConnected || !walletData.address) {
      setNfts([]);
      setLoading(false);
      setInitialLoad(false);
      return;
    }

    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData && !skipCache) {
        console.log('Using cached data');
        setNfts(cachedData);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      // Only show loading if it's not a background refresh
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError('');

      // Get total balance
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'balanceOf',
        args: [walletData.address]
      });

      if (balance === 0n) {
        setNfts([]);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      // Get token IDs one by one
      const tokens = [];
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [walletData.address, BigInt(i)]
        });

        // Get token info
        const tokenInfo = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getTokenInfo',
          args: [tokenId]
        });

        // Get token name
        const name = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'unifrenNames',
          args: [tokenId]
        });

        tokens.push({
          id: tokenId,
          weight: tokenInfo[0],
          name,
          rewards: tokenInfo[2],
          claimed: tokenInfo[3],
          isActive: tokenInfo[4]
        });
      }

      setNfts(tokens);
      if (tokens.length > 0) {
        setCachedData(tokens);
      }

    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError(error.message);
      
      // Fall back to cached data on error
      const cachedData = getCachedData();
      if (cachedData) {
        console.log('Using cached data as fallback after error');
        setNfts(cachedData);
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [walletData.address, walletData.isConnected]);

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
      } catch (error) {
        console.error('Error checking wallet status:', error);
      }
    };

    checkWalletStatus();
    // Check less frequently - every 5 seconds instead of 2
    const interval = setInterval(checkWalletStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserNFTs();
  }, [walletData.address, walletData.isConnected, fetchUserNFTs]);

  // Add auto-refresh for rewards
  useEffect(() => {
    if (!walletData.isConnected || !walletData.address) return;
    
    // Refresh data every minute to update rewards
    const interval = setInterval(() => {
      setIsBackgroundRefresh(true);
      fetchUserNFTs(true).finally(() => {
        setIsBackgroundRefresh(false);
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [walletData.address, walletData.isConnected, fetchUserNFTs]);

  const getTotalPendingRewards = () => {
    return nfts.reduce((sum, token) => sum + token.rewards, BigInt(0));
  };

  const getTotalClaimedRewards = () => {
    return nfts.reduce((sum, token) => sum + token.claimed, BigInt(0));
  };

  const handleClaimClick = async (token) => {
    try {
      // Fetch latest token data before opening modal
      const tokenInfo = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getTokenInfo',
        args: [token.id]
      });

      const name = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'unifrenNames',
        args: [token.id]
      });

      // Update the token with fresh data
      const updatedToken = {
        ...token,
        weight: tokenInfo[0],
        name,
        rewards: tokenInfo[2],
        claimed: tokenInfo[3],
        isActive: tokenInfo[4]
      };

      // Update this NFT in the state
      setNfts(currentNfts => 
        currentNfts.map(nft => 
          nft.id === token.id ? updatedToken : nft
        )
      );

      // Open modal with updated token data
      setSelectedToken(updatedToken);
      setClaimModalOpen(true);
    } catch (error) {
      console.error('Error fetching latest NFT data:', error);
      // If we can't get fresh data, use existing data as fallback
      setSelectedToken(token);
      setClaimModalOpen(true);
    }
  };

  const handleClaimModalClose = () => {
    setClaimModalOpen(false);
    setSelectedToken(null);
  };

  const refreshData = async () => {
    if (isRefreshing || refreshCooldown) return;
    setIsRefreshing(true);
    setRefreshCooldown(true);
    
    try {
      await fetchUserNFTs(true); // Pass true to skip cache
    } finally {
      setIsRefreshing(false);
      // Start 45 second cooldown
      setTimeout(() => {
        setRefreshCooldown(false);
      }, 45000);
    }
  };

  const refreshSingleNFT = async (tokenId) => {
    try {
      setLoading(true);
      const tokenInfo = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getTokenInfo',
        args: [tokenId]
      });

      const name = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'unifrenNames',
        args: [tokenId]
      });

      // Update just this NFT in the state
      setNfts(currentNfts => 
        currentNfts.map(nft => 
          nft.id === tokenId
            ? {
                ...nft,
                weight: tokenInfo[0],
                name,
                rewards: tokenInfo[2],
                claimed: tokenInfo[3],
                isActive: tokenInfo[4]
              }
            : nft
        )
      );
    } catch (error) {
      console.error('Error refreshing NFT:', error);
      // If we can't refresh single NFT, fall back to full refresh
      fetchUserNFTs(true);
    } finally {
      setLoading(false);
    }
  };

  // Add contract health fetching function
  const fetchContractHealth = useCallback(async () => {
    try {
      const health = await requestQueue.add(() => 
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getContractHealth'
        })
      );

      setContractHealth({
        contractBalance: health[0],
        pendingRewards: health[2],
        isSolvent: health[4],
        loading: false
      });
    } catch (error) {
      console.error('Error fetching contract health:', error);
      setContractHealth(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Add effect for contract health
  useEffect(() => {
    fetchContractHealth();
    // Refresh contract health every 2 minutes
    const interval = setInterval(fetchContractHealth, 120000);
    return () => clearInterval(interval);
  }, [fetchContractHealth]);

  // Add mint success handler
  useEffect(() => {
    const handleMintSuccess = () => {
      // Clear cache immediately
      localStorage.removeItem('unifrens_cache');
      // Refresh NFTs with cache bypass
      fetchUserNFTs(true);
    };

    window.addEventListener('unifrens:mint:success', handleMintSuccess);
    return () => window.removeEventListener('unifrens:mint:success', handleMintSuccess);
  }, [fetchUserNFTs]);

  if (!walletData.isConnected || !walletData.address) {
    return <ConnectPage />;
  }

  if (!walletData.isValidNetwork) {
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
      
      {/* Main Content Container */}
      <Container 
        maxWidth="lg" 
        sx={{
          pt: { xs: '80px', sm: '100px' },
          px: { xs: 2, sm: 3 }
        }}
      >
        {/* Contract Redeployment Alert */}
        <Alert 
          severity="warning"
          sx={{
            mb: { xs: 3, sm: 4 },
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 152, 0, 0.04)',
            border: '1px solid rgba(255, 152, 0, 0.1)',
            '& .MuiAlert-icon': {
              color: '#FF9800',
              marginTop: '2px'
            }
          }}
        >
          <Typography sx={{ 
            fontSize: '0.95rem',
            color: '#111',
            lineHeight: 1.5
          }}>
            ⚠️ We've redeployed a new contract to fix math overflow issues. All previous Frens were reset. Please continue testing with new mints - thank you for your understanding!
          </Typography>
        </Alert>

        {/* Announcement Alert - Always show this */}
        {SHOW_LEADERBOARD_ANNOUNCEMENT && (
          <Alert 
            severity="info"
            sx={{
              mb: { xs: 3, sm: 4 },
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 13, 180, 0.04)',
              border: '1px solid rgba(245, 13, 180, 0.1)',
              '& .MuiAlert-icon': {
                color: '#F50DB4',
                marginTop: '2px'
              },
              '& .MuiAlert-message': {
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                padding: '1px 0'
              }
            }}
          >
            <Typography sx={{ 
              fontSize: '0.95rem',
              color: '#111',
              lineHeight: 1.5
            }}>
              🏆 {' '}<strong>Leaderboards are now live!</strong> Check out where your Frens rank and compete for the top spots.
            </Typography>
            <Button
              component={Link}
              to="/leaderboard"
              variant="contained"
              size="small"
              sx={{
                backgroundColor: '#F50DB4',
                color: 'white',
                fontSize: '0.85rem',
                py: 0.75,
                px: 2,
                borderRadius: '8px',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#d00a9b'
                }
              }}
            >
              View Leaderboard
            </Button>
          </Alert>
        )}

        {/* Only show the rest of the content if not in maintenance mode */}
        {!APP_CONFIG.MAINTENANCE_MODE && (
          <>
            {/* Stats Section */}
            {!error && (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 2, sm: 3 },
                mb: { xs: 3, sm: 6 }
              }}>
                {/* Stats Grid */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { 
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(4, 1fr)'
                  },
                  gap: { xs: 1, sm: 3 }
                }}>
                  {/* Your Collection */}
                  <Card sx={{ 
                    p: { xs: 1.5, sm: 2.5 },
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    {initialLoad && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                      }}>
                        <CircularProgress size={20} sx={{ color: '#F50DB4' }} />
                      </Box>
                    )}
                    <Typography sx={{ 
                      color: '#666', 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Your Collection
                    </Typography>
                    <Typography sx={{ 
                      fontSize: { xs: '1.125rem', sm: '2rem' },
                      color: '#F50DB4',
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: { xs: 0.5, sm: 1 }
                    }}>
                      {nfts?.length || 0}
                    </Typography>
                    <Typography sx={{ 
                      color: '#666',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Frens
                    </Typography>
                  </Card>

                  {/* Your Earned Rewards */}
                  <Card sx={{ 
                    p: { xs: 1.5, sm: 2.5 },
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    {initialLoad && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                      }}>
                        <CircularProgress size={20} sx={{ color: '#F50DB4' }} />
                      </Box>
                    )}
                    <Typography sx={{ 
                      color: '#666', 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Your Earned
                    </Typography>
                    <Typography sx={{ 
                      fontSize: { xs: '1.125rem', sm: '2rem' },
                      color: '#4CAF50',
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: { xs: 0.5, sm: 1 }
                    }}>
                      {formatEther(getTotalPendingRewards()).slice(0, 8)}
                    </Typography>
                    <Typography sx={{ 
                      color: '#666',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      ETH Total
                    </Typography>
                  </Card>

                  {/* Your Volume */}
                  <Card sx={{ 
                    p: { xs: 1.5, sm: 2.5 },
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    {initialLoad && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                      }}>
                        <CircularProgress size={20} sx={{ color: '#F50DB4' }} />
                      </Box>
                    )}
                    <Typography sx={{ 
                      color: '#666', 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Your Volume
                    </Typography>
                    <Typography sx={{ 
                      fontSize: { xs: '1.125rem', sm: '2rem' },
                      color: '#666',
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: { xs: 0.5, sm: 1 }
                    }}>
                      {formatEther(getTotalClaimedRewards()).slice(0, 8)}
                    </Typography>
                    <Typography sx={{ 
                      color: '#666',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      ETH Moved
                    </Typography>
                  </Card>

                  {/* Contract Balance */}
                  <Card sx={{ 
                    p: { xs: 1.5, sm: 2.5 },
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    position: 'relative',
                    gridColumn: { xs: '2 / span 1', sm: 'auto' }
                  }}>
                    {initialLoad && contractHealth.loading && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                      }}>
                        <CircularProgress size={20} sx={{ color: '#F50DB4' }} />
                      </Box>
                    )}
                    <Typography sx={{ 
                      color: '#666', 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Contract Balance
                    </Typography>
                    <Typography sx={{ 
                      fontSize: { xs: '1.125rem', sm: '2rem' },
                      color: '#111',
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: { xs: 0.5, sm: 1 }
                    }}>
                      {formatEther(contractHealth.contractBalance).slice(0, 8)}
                    </Typography>
                    <Typography sx={{ 
                      color: '#666',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5
                    }}>
                      ETH Total
                      <IconButton
                        component="a"
                        href={`https://sepolia.uniscan.xyz/address/${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{
                          padding: 0,
                          color: '#666',
                          '&:hover': {
                            color: '#F50DB4',
                            backgroundColor: 'transparent'
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </IconButton>
                    </Typography>
                  </Card>
                </Box>
              </Box>
            )}

            {/* Airdrop Panel */}
            {!APP_CONFIG.MAINTENANCE_MODE && (
              <Box sx={{
                mb: { xs: 4, sm: 6 },
                p: { xs: 2, sm: 3 },
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(245, 13, 180, 0.1)',
                boxShadow: '0 4px 16px rgba(245, 13, 180, 0.08)'
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: { xs: 2, sm: 3 }
                }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 2, sm: 3 }
                  }}>
                    <Box sx={{
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(245, 13, 180, 0.04)',
                      border: '1px solid rgba(245, 13, 180, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <img 
                        src={frenTokenImage} 
                        alt="$FREN Token"
                        style={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                    <Box>
                      <Typography sx={{
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        fontWeight: 600,
                        color: '#111',
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        Estimated $FREN Airdrop
                        <Tooltip
                          arrow
                          placement="top"
                          title="Your estimated $FREN tokens based on your collection size, earned rewards, and total volume. These calculations are for illustrative purposes only and subject to change."
                        >
                          <InfoOutlinedIcon sx={{
                            fontSize: '1rem',
                            color: '#666',
                            cursor: 'help',
                            '&:hover': { color: '#F50DB4' }
                          }} />
                        </Tooltip>
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.9rem',
                        color: '#666',
                        maxWidth: '500px',
                        lineHeight: 1.6
                      }}>
                        As an early tester, you're eligible for the upcoming $FREN token airdrop. Your reward is calculated based on your participation and activity.
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    disabled
                    sx={{
                      backgroundColor: '#F50DB4',
                      color: 'white',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      py: { xs: 1.5, sm: 1 },
                      px: { xs: 3, sm: 4 },
                      borderRadius: '12px',
                      textTransform: 'none',
                      alignSelf: { xs: 'stretch', sm: 'auto' },
                      minWidth: { sm: '160px' },
                      whiteSpace: 'nowrap',
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(245, 13, 180, 0.12)',
                        color: 'rgba(245, 13, 180, 0.5)'
                      }
                    }}
                  >
                    Claim Soon
                  </Button>
                </Box>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 2,
                  mt: 3,
                  pt: 3,
                  borderTop: '1px solid rgba(245, 13, 180, 0.05)'
                }}>
                  {[
                    {
                      label: 'Collection Bonus',
                      value: formatNumber(nfts.length * 1_000_000),
                      tooltip: 'Base reward for each Fren NFT you own. Final multiplier subject to change.'
                    },
                    {
                      label: 'Rewards Bonus',
                      value: formatNumber(Number(formatEther(getTotalPendingRewards())) * 2_000_000),
                      tooltip: 'Additional tokens based on your earned ETH rewards. Final multiplier subject to change.'
                    },
                    {
                      label: 'Volume Bonus',
                      value: formatNumber(Number(formatEther(getTotalClaimedRewards())) * 3_000_000),
                      tooltip: 'Bonus tokens based on your total ETH volume. Final multiplier subject to change.'
                    },
                    {
                      label: 'Total $FREN',
                      value: formatNumber(
                        nfts.length * 1_000_000 +
                        Number(formatEther(getTotalPendingRewards())) * 2_000_000 +
                        Number(formatEther(getTotalClaimedRewards())) * 3_000_000
                      ),
                      tooltip: 'Your total estimated $FREN tokens. Final calculation method subject to change.',
                      highlighted: true
                    }
                  ].map((item, index) => (
                    <Box key={index} sx={{
                      p: 2,
                      backgroundColor: item.highlighted ? 'rgba(245, 13, 180, 0.04)' : 'transparent',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: item.highlighted ? 'rgba(245, 13, 180, 0.1)' : 'transparent'
                    }}>
                      <Typography sx={{
                        fontSize: '0.85rem',
                        color: '#666',
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        {item.label}
                        <Tooltip
                          arrow
                          placement="top"
                          title={item.tooltip}
                        >
                          <InfoOutlinedIcon sx={{
                            fontSize: '0.9rem',
                            color: '#666',
                            cursor: 'help',
                            '&:hover': { color: '#F50DB4' }
                          }} />
                        </Tooltip>
                      </Typography>
                      <Typography sx={{
                        fontSize: item.highlighted ? { xs: '1.1rem', sm: '1.25rem' } : { xs: '1rem', sm: '1.1rem' },
                        fontWeight: item.highlighted ? 600 : 500,
                        color: item.highlighted ? '#F50DB4' : '#111',
                        fontFamily: 'Space Grotesk'
                      }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                <Typography sx={{
                  fontSize: '0.75rem',
                  color: '#666',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  mt: 2,
                  pt: 2,
                  borderTop: '1px solid rgba(245, 13, 180, 0.05)'
                }}>
                  * All calculations are for illustrative purposes only. Final distribution mechanics and token amounts may vary.
                </Typography>
              </Box>
            )}

            {/* NFT Cards Header */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              mb: 4 
            }}>
              <Typography variant="h2" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' },
                color: '#111',
                fontWeight: 700
              }}>
                Frens
              </Typography>
              <Box sx={{ 
                display: 'flex',
                gap: 1,
                alignItems: 'center'
              }}>
                <RefreshButton
                  onClick={refreshData}
                  disabled={loading || isRefreshing}
                  isRefreshing={isRefreshing}
                  cooldown={refreshCooldown}
                />
                <Button
                  component={Link}
                  to="/mint"
                  variant="contained"
                  fullWidth={false}
                  sx={{ 
                    backgroundColor: '#F50DB4',
                    color: 'white',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1.5, sm: 1 },
                    px: { xs: 3, sm: 4 },
                    borderRadius: '12px',
                    textTransform: 'none',
                    alignSelf: { xs: 'stretch', sm: 'auto' },
                    '&:hover': {
                      backgroundColor: '#d00a9b'
                    }
                  }}
                >
                  Mint New
                </Button>
              </Box>
            </Box>
          </>
        )}

        <Box>
          {APP_CONFIG.MAINTENANCE_MODE ? (
            <MaintenanceMode />
          ) : (
            initialLoad ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#F50DB4' }} />
              </Box>
            ) : error ? (
              <Typography sx={{ color: '#f44336', textAlign: 'center', py: 4 }}>
                Error: {error}
              </Typography>
            ) : !nfts || nfts.length === 0 ? (
              <Typography sx={{ color: '#666', textAlign: 'center', py: 4 }}>
                You don't have any Frens yet
              </Typography>
            ) : (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: { xs: 2, sm: 3 }
              }}>
                {nfts.map((token, index) => (
                  <Card 
                    key={index}
                    sx={{ 
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(245, 13, 180, 0.08)',
                      border: '1px solid rgba(245, 13, 180, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease-in-out',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(245, 13, 180, 0.12)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      width: '100%',
                      aspectRatio: '1',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <AvatarGenerator
                        size="100%"
                        name={token.name}
                        variant="beam"
                        colors={['#F50DB4', '#FEAFF0']}
                        square={true}
                      />
                      <Chip
                        label={`Weight: ${token.weight.toString()}`}
                        size="small"
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          fontWeight: 600,
                          height: '24px',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ 
                      p: 2,
                      borderTop: '1px solid rgba(245, 13, 180, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      <Box>
                        <Typography sx={{ 
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#111',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          mb: 0.5
                        }}>
                          {token.name}
                        </Typography>
                        <Typography sx={{ 
                          fontSize: '0.8rem',
                          color: '#666'
                        }}>
                          #{token.id.toString()}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5
                      }}>
                        <Typography sx={{ 
                          fontSize: '0.9rem',
                          color: '#4CAF50',
                          fontWeight: 600,
                          fontFamily: 'Space Grotesk'
                        }}>
                          +{formatEther(token.rewards).slice(0, 8)} ETH
                        </Typography>
                        <Typography sx={{ 
                          fontSize: '0.8rem',
                          color: '#666',
                          fontFamily: 'Space Grotesk'
                        }}>
                          {formatEther(token.claimed).slice(0, 8)} ETH claimed
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        display: 'flex',
                        gap: 1,
                        mt: 1
                      }}>
                        {token.weight === 0n ? (
                          <Typography sx={{
                            color: '#666',
                            fontSize: '0.875rem',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            width: '100%',
                            py: 1
                          }}>
                            Retired
                          </Typography>
                        ) : (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => handleClaimClick(token)}
                              sx={{ 
                                backgroundColor: '#F50DB4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                '&:hover': {
                                  backgroundColor: '#d00a9b',
                                  boxShadow: '0 4px 16px rgba(245, 13, 180, 0.2)'
                                }
                              }}
                            >
                              Claim
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                // Create a canvas element
                                const canvas = document.createElement('canvas');
                                canvas.width = 750;
                                canvas.height = 750;
                                const ctx = canvas.getContext('2d');

                                // Create a temporary div to render the avatar
                                const tempDiv = document.createElement('div');
                                tempDiv.style.width = '750px';
                                tempDiv.style.height = '750px';
                                document.body.appendChild(tempDiv);

                                // Render the avatar to the temp div
                                const avatar = new AvatarGenerator({
                                  size: '750px',
                                  name: token.name,
                                  variant: 'beam',
                                  colors: ['#F50DB4', '#FEAFF0'],
                                  square: true
                                });
                                avatar.render(tempDiv);

                                // Convert the SVG to a data URL
                                const svgElement = tempDiv.querySelector('svg');
                                const svgData = new XMLSerializer().serializeToString(svgElement);
                                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                                const url = URL.createObjectURL(svgBlob);

                                // Create an image from the SVG
                                const img = new Image();
                                img.onload = () => {
                                  // Draw the image to the canvas
                                  ctx.drawImage(img, 0, 0, 750, 750);
                                  
                                  // Convert canvas to blob and download
                                  canvas.toBlob((blob) => {
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${token.name}-fren.png`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }, 'image/png');

                                  // Clean up
                                  document.body.removeChild(tempDiv);
                                  URL.revokeObjectURL(url);
                                };
                                img.src = url;
                              }}
                              sx={{ 
                                minWidth: '40px',
                                backgroundColor: '#F50DB4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                '&:hover': {
                                  backgroundColor: '#d00a9b',
                                  boxShadow: '0 4px 16px rgba(245, 13, 180, 0.2)'
                                }
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 15L12 3M12 15L8 11M12 15L16 11M3 15V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            )
          )}
        </Box>
      </Container>

      {/* Claim Modal */}
      <ClaimModal
        open={claimModalOpen && !APP_CONFIG.MAINTENANCE_MODE}
        onClose={handleClaimModalClose}
        token={selectedToken}
        onSuccess={refreshSingleNFT}
      />
    </Box>
  );
};

export default FrensPage; 