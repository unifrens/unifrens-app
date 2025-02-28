import { AppBar, Box, IconButton, Toolbar, Drawer, List, ListItem, ListItemText, Container, Typography, ListItemIcon, Button, Link as MuiLink } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CasinoIcon from '@mui/icons-material/Casino';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPublicClient, http, formatEther } from 'viem';
import { unichainSepolia } from '../wallet';
import logo from '../assets/unifrens-logo-v2.png';
import xIcon from '../assets/11053970_x_logo_twitter_new_brand_icon.svg';
import githubIcon from '../assets/github-142-svgrepo-com.svg';
import gitbookIcon from '../assets/gitbook-svgrepo-com.svg';
import { BackgroundPattern } from '../App';
import { buttonStyles } from '../styles/theme';

const publicClient = createPublicClient({
  chain: unichainSepolia,
  transport: http()
});

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [walletData, setWalletData] = useState({
    address: '',
    walletBalance: '',
    networkName: '',
    isValidNetwork: false
  });
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

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
          
          try {
            const balance = await publicClient.getBalance({ address: accounts[0] });
            setWalletData({ 
              address: accounts[0],
              walletBalance: formatEther(balance).slice(0, 6),
              networkName,
              isValidNetwork
            });
          } catch (error) {
            // If balance fetch fails due to rate limit, keep other data but clear balance
            setWalletData({ 
              address: accounts[0],
              walletBalance: '...',
              networkName,
              isValidNetwork
            });
          }
        } else {
          setWalletData({
            address: '',
            walletBalance: '',
            networkName: '',
            isValidNetwork: false
          });
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
        setWalletData({
          address: '',
          walletBalance: '',
          networkName: '',
          isValidNetwork: false
        });
      }
    };

    // Initial check
    checkWalletStatus();

    // Set up event listeners for wallet changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkWalletStatus);
      window.ethereum.on('chainChanged', checkWalletStatus);
    }

    // Poll less frequently (every 10 seconds instead of 2)
    const interval = setInterval(checkWalletStatus, 10000);

    return () => {
      clearInterval(interval);
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', checkWalletStatus);
        window.ethereum.removeListener('chainChanged', checkWalletStatus);
      }
    };
  }, []);

  const handleConnect = async () => {
    if (!window.ethereum) {
      setError('Please install a Web3 wallet');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });
        
        const validChainId = `0x${unichainSepolia.id.toString(16)}`;

        if (chainId !== validChainId) {
          setError('Please switch to Unichain Sepolia Testnet');
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${unichainSepolia.id.toString(16)}`,
                chainName: unichainSepolia.name,
                nativeCurrency: unichainSepolia.nativeCurrency,
                rpcUrls: unichainSepolia.rpcUrls.public.http,
                blockExplorerUrls: [unichainSepolia.blockExplorers.default.url],
              }],
            });
          } catch (switchError) {
            console.error('Failed to switch network:', switchError);
            setError('Failed to switch network');
          }
        }

        const balance = await publicClient.getBalance({ 
          address: accounts[0] 
        });

        setWalletData(prev => ({ 
          ...prev, 
          address: accounts[0],
          walletBalance: formatEther(balance).slice(0, 6)
        }));
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletData({
      address: '',
      walletBalance: '',
      networkName: '',
      isValidNetwork: false
    });
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
    setError('');
    setDrawerOpen(false);
    navigate('/');
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <AppBar 
        position="fixed"
        elevation={0}
        sx={{ 
          backgroundColor: '#F50DB4',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <BackgroundPattern opacity={0.15} />
        <Container 
          maxWidth="lg" 
          disableGutters 
          sx={{
            px: { xs: 2, sm: 3 }
          }}
        >
          <Toolbar 
            disableGutters
            sx={{ 
              minHeight: { xs: 64, sm: 72 },
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box 
              component={Link}
              to="/"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                position: 'relative',
                zIndex: 1,
                height: { xs: 40, sm: 40 }  // Fixed height container for better alignment
              }}
            >
              <Box 
                component="img"
                src={logo}
                alt="Unichain Frens"
                sx={{ 
                  height: { xs: 26, sm: 30 },
                  width: 'auto',
                  mt: '2px'
                }}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              height: { xs: 40, sm: 40 }  // Match height with logo container
            }}>
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{
                  width: 40,
                  height: 40,
                  position: 'relative',
                  zIndex: 1,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            backgroundColor: '#FAFAFA',
            borderLeft: '1px solid rgba(245, 13, 180, 0.1)',
            boxShadow: 'none'
          }
        }}
      >
        <Box sx={{ 
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(245, 13, 180, 0.1)'
        }}>
          <Box 
            component="img"
            src={logo}
            alt="Unichain Frens"
            sx={{ 
              height: 32,
              filter: 'brightness(0) saturate(100%) invert(19%) sepia(91%) saturate(4929%) hue-rotate(315deg) brightness(94%) contrast(98%)'
            }}
          />
          <IconButton
            onClick={toggleDrawer(false)}
            sx={{
              color: '#666',
              width: 40,
              height: 40,
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.04)',
                color: '#F50DB4'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ p: 2, pt: 0 }}>
          <ListItem 
            component={Link} 
            to="/mint"
            onClick={toggleDrawer(false)}
            sx={{
              borderRadius: '12px',
              mb: 1,
              backgroundColor: location.pathname === '/mint' ? 'rgba(245, 13, 180, 0.04)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: location.pathname === '/mint' ? '#F50DB4' : '#666'
            }}>
              <AddCircleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Mint Fren" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/mint' ? '#F50DB4' : '#111'
                }
              }}
            />
          </ListItem>
          
          <ListItem 
            component={Link} 
            to="/frens"
            onClick={toggleDrawer(false)}
            sx={{
              borderRadius: '12px',
              mb: 1,
              backgroundColor: location.pathname === '/frens' ? 'rgba(245, 13, 180, 0.04)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: location.pathname === '/frens' ? '#F50DB4' : '#666'
            }}>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText 
              primary="My Frens" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/frens' ? '#F50DB4' : '#111'
                }
              }}
            />
          </ListItem>

          <ListItem 
            sx={{
              borderRadius: '12px',
              mb: 1,
              opacity: 0.5,
              cursor: 'default',
              '&:hover': {
                backgroundColor: 'transparent',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: '#666'
            }}>
              <SwapHorizIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Fren Swap" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111'
                }
              }}
            />
          </ListItem>

          <ListItem 
            component={Link} 
            to="/leaderboard"
            onClick={toggleDrawer(false)}
            sx={{
              borderRadius: '12px',
              mb: 1,
              backgroundColor: location.pathname === '/leaderboard' ? 'rgba(245, 13, 180, 0.04)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: location.pathname === '/leaderboard' ? '#F50DB4' : '#666'
            }}>
              <LeaderboardIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Leaderboard" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/leaderboard' ? '#F50DB4' : '#111'
                }
              }}
            />
          </ListItem>

          <ListItem 
            component={Link} 
            to="/play"
            onClick={toggleDrawer(false)}
            sx={{
              borderRadius: '12px',
              mb: 1,
              backgroundColor: location.pathname === '/play' ? 'rgba(245, 13, 180, 0.04)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: location.pathname === '/play' ? '#F50DB4' : '#666'
            }}>
              <CasinoIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Play & Win" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/play' ? '#F50DB4' : '#111'
                }
              }}
            />
          </ListItem>

          <ListItem 
            component={Link} 
            to="/faucet"
            onClick={toggleDrawer(false)}
            sx={{
              borderRadius: '12px',
              mb: 1,
              backgroundColor: location.pathname === '/faucet' ? 'rgba(245, 13, 180, 0.04)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: location.pathname === '/faucet' ? '#F50DB4' : '#666'
            }}>
              <WaterDropIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Faucet" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/faucet' ? '#F50DB4' : '#111'
                }
              }}
            />
          </ListItem>

          <ListItem 
            sx={{
              borderRadius: '12px',
              mb: 1,
              opacity: 0.5,
              cursor: 'default',
              '&:hover': {
                backgroundColor: 'transparent',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: '#666'
            }}>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Activity" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111'
                }
              }}
            />
          </ListItem>

          {/* Documentation Link */}
          <ListItem 
            component="a"
            href="https://unifrens.gitbook.io/unifrens-docs/"
            target="_blank"
            sx={{
              borderRadius: '12px',
              mb: 1,
              textDecoration: 'none',
              '&:hover': {
                backgroundColor: 'rgba(245, 13, 180, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: '#666'
            }}>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Documentation" 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111'
                }
              }}
            />
          </ListItem>
        </List>

        {walletData.address ? (
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ 
              p: 2,
              borderTop: '1px solid rgba(245, 13, 180, 0.1)',
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75
              }}>
                <Typography sx={{ 
                  fontSize: '0.9rem',
                  color: '#111',
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}>
                  {formatAddress(walletData.address)}
                </Typography>
                <Typography sx={{ 
                  fontSize: '0.8rem',
                  color: walletData.isValidNetwork ? '#4CAF50' : '#f44336',
                  fontWeight: 500
                }}>
                  {walletData.networkName}
                </Typography>
                <Typography sx={{ 
                  fontSize: '0.8rem',
                  color: '#666',
                  fontFamily: 'monospace'
                }}>
                  {walletData.walletBalance} ETH
                </Typography>
                <Button
                  onClick={handleDisconnect}
                  variant="contained"
                  size="small"
                  sx={{ 
                    mt: 1,
                    backgroundColor: '#F50DB4',
                    color: 'white',
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#d00a9b'
                    }
                  }}
                >
                  Disconnect
                </Button>
              </Box>
            </Box>

            <Box sx={{ 
              p: 3,
              pt: 2,
              borderTop: '1px solid rgba(245, 13, 180, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {/* Social Links - Mobile */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {/* Discord link temporarily removed
                <MuiLink
                  href="https://discord.gg/nrQezVny"
                  target="_blank"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 22
                  }}
                >
                  <Box
                    component="img"
                    src={discordIcon}
                    alt="Discord"
                    sx={{
                      width: 22,
                      height: 22,
                      opacity: 0.8,
                      transition: 'all 0.2s',
                      filter: 'invert(36%) sepia(71%) saturate(6010%) hue-rotate(308deg) brightness(97%) contrast(101%)',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                </MuiLink>
                */}
              </Box>

              {/* Social Links - Desktop */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
                {/* Discord link temporarily removed
                <MuiLink
                  href="https://discord.gg/nrQezVny"
                  target="_blank"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 22
                  }}
                >
                  <Box
                    component="img"
                    src={discordIcon}
                    alt="Discord"
                    sx={{
                      width: 22,
                      height: 22,
                      opacity: 0.8,
                      transition: 'all 0.2s',
                      filter: 'invert(36%) sepia(71%) saturate(6010%) hue-rotate(308deg) brightness(97%) contrast(101%)',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                </MuiLink>
                */}
              </Box>

              {/* Powered by Unichain */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                opacity: 0.7
              }}>
                <Typography sx={{ 
                  fontSize: '0.85rem',
                  color: '#666',
                  fontWeight: 500
                }}>
                  Powered by
                </Typography>
                <Box
                  component="img"
                  src="./Unichain-Lockup-Dark.png"
                  sx={{
                    height: '16px',
                    width: 'auto'
                  }}
                  alt="Unichain"
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ 
              p: 3,
              pt: 2,
              borderTop: '1px solid rgba(245, 13, 180, 0.1)',
            }}>
              <Button
                variant="contained"
                onClick={handleConnect}
                disabled={isConnecting}
                fullWidth
                sx={{ 
                  py: 1.5,
                  fontSize: '0.875rem',
                  backgroundColor: '#F50DB4',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#d00a9b',
                  }
                }}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </Box>

            <Box sx={{ 
              p: 3,
              pt: 2,
              borderTop: '1px solid rgba(245, 13, 180, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {/* Social Links - Mobile */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {/* Discord link temporarily removed
                <MuiLink
                  href="https://discord.gg/nrQezVny"
                  target="_blank"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 22
                  }}
                >
                  <Box
                    component="img"
                    src={discordIcon}
                    alt="Discord"
                    sx={{
                      width: 22,
                      height: 22,
                      opacity: 0.8,
                      transition: 'all 0.2s',
                      filter: 'invert(36%) sepia(71%) saturate(6010%) hue-rotate(308deg) brightness(97%) contrast(101%)',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                </MuiLink>
                */}
              </Box>

              {/* Social Links - Desktop */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
                {/* Discord link temporarily removed
                <MuiLink
                  href="https://discord.gg/nrQezVny"
                  target="_blank"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 22
                  }}
                >
                  <Box
                    component="img"
                    src={discordIcon}
                    alt="Discord"
                    sx={{
                      width: 22,
                      height: 22,
                      opacity: 0.8,
                      transition: 'all 0.2s',
                      filter: 'invert(36%) sepia(71%) saturate(6010%) hue-rotate(308deg) brightness(97%) contrast(101%)',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                </MuiLink>
                */}
              </Box>

              {/* Powered by Unichain */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                opacity: 0.7
              }}>
                <Typography sx={{ 
                  fontSize: '0.85rem',
                  color: '#666',
                  fontWeight: 500
                }}>
                  Powered by
                </Typography>
                <Box
                  component="img"
                  src="./Unichain-Lockup-Dark.png"
                  sx={{
                    height: '16px',
                    width: 'auto'
                  }}
                  alt="Unichain"
                />
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  );
};

export default Navbar; 