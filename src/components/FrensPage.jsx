import { Box, Typography, Card, CardContent, Stack, Chip, CircularProgress, Button, Container, IconButton, Tooltip, Alert, Dialog, DialogContent } from '@mui/material';
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
import { buttonStyles, cardStyles, containerStyles } from '../styles/theme';
import LeaderboardAnnouncement from './common/announcements/LeaderboardAnnouncement';
import AirdropAnnouncement from './common/announcements/AirdropAnnouncement';
import DiscordWarningAnnouncement from './common/announcements/DiscordWarningAnnouncement';
import FrenViewModal from './FrenViewModal';
import { preloadNFTImage, getCachedNFTImage } from '../utils/imageCache';

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

const RefreshButton = ({ onClick, disabled, isRefreshing, cooldown, sx = {} }) => (
  <Tooltip title={cooldown ? "Please wait before refreshing again" : "Refresh data"}>
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled || cooldown}
        sx={{ 
          ...buttonStyles,
          width: { xs: 48, sm: 48 },
          height: { xs: 48, sm: 48 },
          ...sx
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
  const [viewToken, setViewToken] = useState(null);

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

      // Sort NFTs - active first, then retired
      serializedData.sort((a, b) => {
        // If one is active and other is retired, active comes first
        if (a.weight !== '0' && b.weight === '0') return -1;
        if (a.weight === '0' && b.weight !== '0') return 1;
        // If both are active or both are retired, sort by ID
        return Number(BigInt(a.id) - BigInt(b.id));
      });

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
      // Always check and show cached data first
      const cachedData = getCachedData();
      if (cachedData) {
        console.log('Using cached data');
        const sortedNfts = [...cachedData].sort((a, b) => {
          if (a.weight !== 0n && b.weight === 0n) return -1;
          if (a.weight === 0n && b.weight !== 0n) return 1;
          return Number(a.id - b.id);
        });
        setNfts(sortedNfts);
        setLoading(false);
        setInitialLoad(false);
      }

      // If we're not skipping cache and we have cached data, we can return early
      if (!skipCache && cachedData) {
        return;
      }

      // Only show loading if it's not a background refresh AND we don't have cached data
      if (!isBackgroundRefresh && !cachedData) {
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

        // Check if we have cached data for retired NFTs
        const cachedToken = cachedData?.find(t => t.id === tokenId && t.weight === 0n);
        if (cachedToken) {
          tokens.push(cachedToken);
          continue;
        }

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

      // Sort tokens - active first, then retired
      const sortedTokens = tokens.sort((a, b) => {
        if (a.weight !== 0n && b.weight === 0n) return -1;
        if (a.weight === 0n && b.weight !== 0n) return 1;
        return Number(a.id - b.id);
      });

      setNfts(sortedTokens);
      if (sortedTokens.length > 0) {
        setCachedData(sortedTokens);
      }

    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError(error.message);
      
      // We don't need to fall back to cached data here anymore since we already show it first
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

  // Add new effect for preloading images
  useEffect(() => {
    if (!nfts || nfts.length === 0) return;

    // Preload images for all NFTs
    const preloadImages = async () => {
      const promises = nfts.map(token => preloadNFTImage(token.name));
      await Promise.allSettled(promises);
    };

    preloadImages();
  }, [nfts]);

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

      // Update just this NFT in the state and maintain sorting
      setNfts(currentNfts => {
        const updatedNfts = currentNfts.map(nft => 
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
        );
        
        // Re-sort the NFTs
        const sortedNfts = updatedNfts.sort((a, b) => {
          if (a.weight !== 0n && b.weight === 0n) return -1;
          if (a.weight === 0n && b.weight !== 0n) return 1;
          return Number(a.id - b.id);
        });

        // Update cache with new data
        const currentCache = getCachedData();
        if (currentCache) {
          setCachedData(sortedNfts);
        }

        return sortedNfts;
      });

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
        {/* Discord Warning Announcement */}
        <DiscordWarningAnnouncement />

        {/* Leaderboard Announcement */}
        {SHOW_LEADERBOARD_ANNOUNCEMENT && <LeaderboardAnnouncement />}

        {/* Airdrop Announcement */}
        {!APP_CONFIG.MAINTENANCE_MODE && (
          <AirdropAnnouncement
            estimatedReward={formatNumber(
              nfts.length * 1_000_000 +
              Number(formatEther(getTotalPendingRewards())) * 2_000_000 +
              Number(formatEther(getTotalClaimedRewards())) * 3_000_000
            )}
          />
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
                    ...cardStyles,
                    p: { xs: 1.5, sm: 2.5 },
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
                    ...cardStyles,
                    p: { xs: 1.5, sm: 2.5 },
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
                    ...cardStyles,
                    p: { xs: 1.5, sm: 2.5 },
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
                    ...cardStyles,
                    p: { xs: 1.5, sm: 2.5 },
                    textAlign: 'center',
                    position: 'relative',
                    gridColumn: { xs: '2 / span 1', sm: 'auto' },
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

            {/* NFT Cards Header */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              mb: 4,
              mx: { xs: -2, sm: -3 },
              px: { xs: 2, sm: 3 }
            }}>
              <RefreshButton
                onClick={refreshData}
                disabled={loading || isRefreshing}
                isRefreshing={isRefreshing}
                cooldown={refreshCooldown}
                sx={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '12px'
                }}
              />
              <IconButton
                component={Link}
                to="/mint"
                sx={{ 
                  ...buttonStyles,
                  flex: 1,
                  height: '48px',
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: '#d00a9b',
                    boxShadow: '0 4px 16px rgba(245, 13, 180, 0.2)'
                  }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </IconButton>
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
                gap: { xs: 1.5, sm: 2, md: 3 }
              }}>
                {nfts.map((token, index) => {
                  const cachedImage = getCachedNFTImage(token.name);
                  return (
                    <Card 
                      key={index}
                      onClick={() => setViewToken(token)}
                      sx={{ 
                        ...cardStyles,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s ease-in-out',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: '#F50DB4',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ 
                        width: '100%',
                        aspectRatio: '1',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {cachedImage ? (
                          <img
                            src={cachedImage}
                            alt={token.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        ) : (
                          <AvatarGenerator
                            size="100%"
                            name={token.name}
                            variant="beam"
                            colors={['#F50DB4', '#FEAFF0']}
                            square={true}
                          />
                        )}
                      </Box>
                      <Box sx={{ 
                        p: { xs: 1.5, sm: 2 },
                        borderTop: '1px solid rgba(245, 13, 180, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: { xs: 0.75, sm: 1 }
                      }}>
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <Typography sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            fontWeight: 700,
                            color: '#111',
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {token.name}
                          </Typography>
                          <Typography sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            color: '#666',
                            ml: 1
                          }}>
                            #{token.id.toString()}
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: { xs: 0.75, sm: 1 }
                        }}>
                          <Box>
                            <Typography sx={{ 
                              fontSize: { xs: '0.875rem', sm: '0.9rem' },
                              color: '#4CAF50',
                              fontWeight: 600,
                              fontFamily: 'Space Grotesk',
                              lineHeight: 1.2
                            }}>
                              +{formatEther(token.rewards).slice(0, 8)}
                            </Typography>
                            <Typography sx={{ 
                              fontSize: { xs: '0.675rem', sm: '0.75rem' },
                              color: '#666',
                              fontFamily: 'Space Grotesk'
                            }}>
                              ETH Earned
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ 
                              fontSize: { xs: '0.875rem', sm: '0.9rem' },
                              color: token.weight === 0n ? '#666' : '#111',
                              fontWeight: 600,
                              fontFamily: 'Space Grotesk',
                              lineHeight: 1.2,
                              textAlign: 'right'
                            }}>
                              {token.weight.toString()}
                            </Typography>
                            <Typography sx={{ 
                              fontSize: { xs: '0.675rem', sm: '0.75rem' },
                              color: '#666',
                              fontFamily: 'Space Grotesk',
                              textAlign: 'right'
                            }}>
                              Weight
                            </Typography>
                          </Box>
                        </Box>

                        {token.weight === 0n ? (
                          <Typography sx={{
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontStyle: 'italic',
                            textAlign: 'center',
                            width: '100%',
                            py: { xs: 0.75, sm: 1 }
                          }}>
                            Retired
                          </Typography>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimClick(token);
                            }}
                            sx={{ 
                              ...buttonStyles,
                              border: 'none',
                              borderRadius: '10px',
                              py: { xs: 0.75, sm: 1 },
                              minHeight: 0,
                              '&:hover': {
                                backgroundColor: '#d00a9b',
                                boxShadow: '0 4px 16px rgba(245, 13, 180, 0.2)'
                              }
                            }}
                          >
                            Claim
                          </Button>
                        )}
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )
          )}
        </Box>
      </Container>

      {/* View Modal */}
      <FrenViewModal
        open={!!viewToken}
        onClose={() => setViewToken(null)}
        token={viewToken}
      />

      {/* Claim Modal */}
      <ClaimModal
        open={claimModalOpen && !APP_CONFIG.MAINTENANCE_MODE}
        onClose={handleClaimModalClose}
        token={selectedToken}
        onSuccess={refreshSingleNFT}
        contractBalance={contractHealth.contractBalance}
      />
    </Box>
  );
};

export default FrensPage; 