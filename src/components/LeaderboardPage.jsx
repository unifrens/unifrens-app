import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip, Card } from '@mui/material';
import { formatEther } from 'viem';
import UpdateIcon from '@mui/icons-material/Update';
import Navbar from './Navbar';
import AvatarGenerator from './AvatarGenerator';
import { unichainSepolia } from '../wallet';

const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getWeightTier = (weight) => {
  if (weight === 1000) return {
    label: 'Legendary',
    colors: {
      bg: 'rgba(255, 185, 15, 0.15)',
      text: '#FFB90F'
    }
  };
  if (weight >= 500) return {
    label: 'Epic',
    colors: {
      bg: 'rgba(147, 51, 234, 0.15)',
      text: '#9333EA'
    }
  };
  if (weight >= 250) return {
    label: 'Rare',
    colors: {
      bg: 'rgba(59, 130, 246, 0.15)',
      text: '#3B82F6'
    }
  };
  if (weight >= 100) return {
    label: 'Uncommon',
    colors: {
      bg: 'rgba(34, 197, 94, 0.15)',
      text: '#22C55E'
    }
  };
  return {
    label: 'Common',
    colors: {
      bg: 'rgba(107, 114, 128, 0.15)',
      text: '#6B7280'
    }
  };
};

const LeaderboardPage = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [displayTime, setDisplayTime] = useState('');
  const [animatedBalances, setAnimatedBalances] = useState({});
  const [walletData, setWalletData] = useState({
    address: '',
    isConnected: false,
    isValidNetwork: false
  });

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
    const interval = setInterval(checkWalletStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('https://imgs.unifrens.com/leaderboard/nfts', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Origin': 'https://www.unifrens.com'
          }
        });
        const data = await response.json();
        
        // First sort by weight (highest first), but put weight 0 at the end
        const sortedNfts = data.nfts.sort((a, b) => {
          if (a.weight === 0) return 1;
          if (b.weight === 0) return -1;
          return b.weight - a.weight;
        });

        setNfts(sortedNfts);
        setLastUpdate(data.lastUpdate);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every 91 seconds (90 + 1 buffer)
    const interval = setInterval(fetchLeaderboard, 91000);
    return () => clearInterval(interval);
  }, []);

  // Update the display time every second
  useEffect(() => {
    if (!lastUpdate) return;

    const updateDisplayTime = () => {
      setDisplayTime(formatTimeAgo(lastUpdate));
    };

    updateDisplayTime(); // Initial update
    const interval = setInterval(updateDisplayTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Initialize animated balances when NFTs load
  useEffect(() => {
    if (!nfts.length) return;
    
    const initialBalances = {};
    nfts.forEach(nft => {
      const actualBalance = parseFloat(nft.pendingRewards || '0');
      // Random starting point slightly below actual
      initialBalances[nft.tokenId] = Math.max(0, actualBalance - 0.000000000000001000);
    });
    setAnimatedBalances(initialBalances);
  }, [nfts]);

  // Animate balances with tiny continuous drips
  useEffect(() => {
    if (!nfts.length) return;

    const intervals = {};
    const dripRates = {};

    nfts.forEach(nft => {
      // Generate a random drip rate between 1-50 for each NFT (multiplied by 0.000000000000000001)
      dripRates[nft.tokenId] = (Math.floor(Math.random() * 50) + 1) * 0.000000000000000001;
      
      const actualBalance = parseFloat(nft.pendingRewards || '0');
      const baseInterval = 5000;
      const weight = nft.weight || 0;
      const scaledInterval = weight >= 100 ? baseInterval * 0.8 : baseInterval;
      
      intervals[nft.tokenId] = setInterval(() => {
        setAnimatedBalances(prev => {
          const current = prev[nft.tokenId] || 0;
          
          if (current >= actualBalance) return prev;

          // Use NFT's unique drip rate
          const increment = dripRates[nft.tokenId];
          const newBalance = Math.min(current + increment, actualBalance);
          
          return {
            ...prev,
            [nft.tokenId]: newBalance
          };
        });
      }, scaledInterval);
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [nfts]);

  // Add a helper function to format ETH values with fixed width
  const formatETHValue = (value, isGlobalStat = false) => {
    if (!value && value !== 0) return isGlobalStat ? '0.0000' : '0.000000000000000000 ETH';
    if (isGlobalStat) {
      return value.toFixed(4);
    }
    const fixed = value.toFixed(18);
    const [whole, decimal] = fixed.split('.');
    return `${whole}.${decimal.padEnd(18, '0')} ETH`;
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
            Unifrens <span>Leaderboard</span>
          </Typography>
          <Typography sx={{
            fontSize: '1rem',
            color: '#666',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6
          }}>
            Track the top performing Frens and their earnings.
          </Typography>

          {/* Stats Section */}
          {!error && (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { 
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 180px)'
              },
              gap: { xs: 1, sm: 3 },
              mt: { xs: 3, sm: 4 },
              mb: { xs: 3, sm: 4 },
              justifyContent: 'center'
            }}>
              <Box sx={{ 
                p: { xs: 1.5, sm: 2.5 },
                textAlign: 'center',
                position: 'relative',
                borderRadius: 2,
                backgroundColor: 'white',
                border: '1px solid rgba(245, 13, 180, 0.1)',
                boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)'
              }}>
                <Typography sx={{ 
                  color: '#666', 
                  mb: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  Total Players
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '1.125rem', sm: '2rem' },
                  color: '#F50DB4',
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: { xs: 0.5, sm: 1 }
                }}>
                  {new Set(nfts.map(nft => nft.owner.toLowerCase())).size}
                </Typography>
                <Typography sx={{ 
                  color: '#666',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  Unique Addresses
                </Typography>
              </Box>

              <Box sx={{ 
                p: { xs: 1.5, sm: 2.5 },
                textAlign: 'center',
                position: 'relative',
                borderRadius: 2,
                backgroundColor: 'white',
                border: '1px solid rgba(245, 13, 180, 0.1)',
                boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)'
              }}>
                <Typography sx={{ 
                  color: '#666', 
                  mb: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  Total NFTs
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '1.125rem', sm: '2rem' },
                  color: '#111',
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: { xs: 0.5, sm: 1 }
                }}>
                  {nfts.length}
                </Typography>
                <Typography sx={{ 
                  color: '#666',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  Frens Minted
                </Typography>
              </Box>

              <Box sx={{ 
                gridColumn: { xs: '1 / -1', sm: 'auto' },
                p: { xs: 1.5, sm: 2.5 },
                textAlign: 'center',
                position: 'relative',
                borderRadius: 2,
                backgroundColor: 'white',
                border: '1px solid rgba(245, 13, 180, 0.1)',
                boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)'
              }}>
                <Typography sx={{ 
                  color: '#666', 
                  mb: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  Total Pending
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '1.125rem', sm: '2rem' },
                  color: '#111',
                  fontWeight: 700,
                  lineHeight: 1,
                  mb: { xs: 0.5, sm: 1 },
                  fontFamily: 'monospace'
                }}>
                  {formatETHValue(Object.values(animatedBalances).reduce((sum, val) => sum + val, 0), true)}
                </Typography>
                <Typography sx={{ 
                  color: '#666',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  ETH Balance
                </Typography>
              </Box>
            </Box>
          )}

          {!loading && !error && lastUpdate && (
            <Chip
              icon={<UpdateIcon sx={{ fontSize: '0.75rem' }} />}
              label={displayTime}
              size="small"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                position: 'absolute',
                top: 0,
                right: 0,
                height: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(245, 13, 180, 0.05)',
                color: '#666',
                fontSize: '0.7rem',
                opacity: 0.8,
                '& .MuiChip-icon': {
                  color: '#F50DB4',
                  opacity: 0.7
                },
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          )}
        </Box>

        <Box sx={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          justifyContent: 'center'
        }}>
          {[
            { weight: 1, max: 99, label: 'Common' },
            { weight: 100, max: 249, label: 'Uncommon' },
            { weight: 250, max: 499, label: 'Rare' },
            { weight: 500, max: 999, label: 'Epic' },
            { weight: 1000, max: null, label: 'Legendary' }
          ].map((tier) => (
            <Chip
              key={tier.label}
              size="small"
              label={`${tier.label} ${tier.max ? `(${tier.weight}-${tier.max}×)` : `(${tier.weight}×)`}`}
              sx={{
                height: '24px',
                backgroundColor: getWeightTier(tier.weight).colors.bg,
                color: getWeightTier(tier.weight).colors.text,
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'Space Grotesk'
              }}
            />
          ))}
        </Box>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px'
          }}>
            <CircularProgress sx={{ color: '#F50DB4' }} />
          </Box>
        ) : error ? (
          <Box sx={{ 
            textAlign: 'center',
            py: 4,
            px: 2,
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(244, 67, 54, 0.1)'
          }}>
            <Typography sx={{ 
              color: '#f44336',
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              {error}
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)',
              border: '1px solid rgba(245, 13, 180, 0.1)',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            <Table sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(245, 13, 180, 0.04)' }}>
                  <TableCell sx={{ 
                    py: 2,
                    textAlign: 'center',
                    width: { xs: '32px', sm: '50px' },
                    px: { xs: 1, sm: 2 }
                  }}/>
                  <TableCell sx={{ 
                    px: { xs: 1, sm: 2 },
                    width: { sm: '40%' }
                  }}/>
                  <TableCell sx={{ 
                    textAlign: 'center',
                    px: { xs: 1, sm: 2 },
                    width: { xs: '35px', sm: '80px' }
                  }}/>
                  <TableCell sx={{ 
                    textAlign: 'center',
                    px: { xs: 1, sm: 2 },
                    width: { xs: '35px', sm: '80px' }
                  }}/>
                  <TableCell sx={{ 
                    textAlign: 'right',
                    pr: { xs: 1, sm: 3 },
                    pl: { xs: 1, sm: 2 },
                    width: { xs: '100px', sm: '20%' },
                    display: { xs: 'none', sm: 'table-cell' }
                  }}/>
                </TableRow>
              </TableHead>
              <TableBody>
                {nfts.map((nft, index) => {
                  const truePosition = nft.weight === 0 ? null : 
                    nfts.filter(n => n.weight > 0 && n.tokenId <= nft.tokenId).length;

                  return (
                    <TableRow 
                      key={nft.tokenId}
                      sx={{ 
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'rgba(245, 13, 180, 0.02)'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(245, 13, 180, 0.04)'
                        }
                      }}
                    >
                      <TableCell sx={{ 
                        py: 2,
                        textAlign: 'center',
                        width: { xs: '32px', sm: '50px' },
                        px: { xs: 1, sm: 2 }
                      }}>
                        <Typography sx={{
                          fontSize: { xs: '0.75rem', sm: '0.9rem' },
                          fontWeight: 700,
                          color: nft.weight === 0 ? '#666' : (index < 3 ? '#F50DB4' : '#666'),
                          opacity: nft.weight === 0 ? 0.5 : (index < 3 ? 1 : 0.7)
                        }}>
                          {nft.weight === 0 ? '-' : `#${index + 1}`}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ 
                        px: { xs: 1, sm: 2 },
                        width: { sm: '40%' }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 } }}>
                          <Box sx={{ 
                            width: { xs: '32px', sm: '32px' },
                            height: { xs: '32px', sm: '32px' },
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            backgroundColor: 'white',
                            border: '1px solid rgba(245, 13, 180, 0.1)'
                          }}>
                            <AvatarGenerator
                              size="100%"
                              name={nft.name}
                              variant="beam"
                              colors={['#F50DB4', '#FEAFF0']}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0, flex: 1 }}>
                            <Typography 
                              sx={{
                                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                fontWeight: 600,
                                color: '#111',
                                minWidth: 0
                              }}
                            >
                              {nft.name}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.25
                            }}>
                              <Typography 
                                sx={{ 
                                  color: '#666',
                                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                  fontFamily: 'monospace',
                                  opacity: 0.8
                                }}
                              >
                                {walletData.isConnected && walletData.address.toLowerCase() === nft.owner.toLowerCase() ? (
                                  <Box component="span" sx={{ 
                                    color: '#F50DB4',
                                    fontWeight: 600,
                                    fontFamily: 'Space Grotesk'
                                  }}>
                                    YOU
                                  </Box>
                                ) : formatAddress(nft.owner)}
                              </Typography>
                              <Typography 
                                sx={{ 
                                  display: { xs: 'block', sm: 'none' },
                                  fontFamily: 'monospace',
                                  fontSize: '0.65rem',
                                  color: '#111',
                                  opacity: 0.9,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {nft.weight === 0 ? '-' : formatETHValue(animatedBalances[nft.tokenId] || 0)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        px: { xs: 1, sm: 2 },
                        width: { xs: '35px', sm: '80px' }
                      }}>
                        {nft.weight === 0 ? (
                          <Typography sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.65rem', sm: '0.8rem' },
                            opacity: 0.7,
                            fontStyle: 'italic'
                          }}>
                            -
                          </Typography>
                        ) : (
                          <Typography sx={{ 
                            fontSize: { xs: '0.65rem', sm: '0.85rem' }
                          }}>
                            {truePosition}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        px: { xs: 1, sm: 2 },
                        width: { xs: '35px', sm: '80px' }
                      }}>
                        {nft.weight === 0 ? (
                          <Typography sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.65rem', sm: '0.8rem' },
                            opacity: 0.7,
                            fontStyle: 'italic'
                          }}>
                            -
                          </Typography>
                        ) : (
                          <Box component="span" sx={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: { xs: '16px', sm: '20px' },
                            px: { xs: 0.5, sm: 0.75 },
                            borderRadius: '8px',
                            backgroundColor: getWeightTier(nft.weight).colors.bg,
                            color: getWeightTier(nft.weight).colors.text,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            fontWeight: 600,
                            fontFamily: 'Space Grotesk',
                            whiteSpace: 'nowrap'
                          }}>
                            {nft.weight}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'right',
                        pr: { xs: 1, sm: 3 },
                        pl: { xs: 1, sm: 2 },
                        width: { xs: '100px', sm: '20%' },
                        display: { xs: 'none', sm: 'table-cell' },
                        whiteSpace: 'nowrap'
                      }}>
                        {nft.weight === 0 ? (
                          '-'
                        ) : (
                          formatETHValue(animatedBalances[nft.tokenId] || 0)
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
};

export default LeaderboardPage; 