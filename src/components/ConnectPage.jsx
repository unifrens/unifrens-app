import { Box, Typography, Button, Container, Tabs, Tab, IconButton } from '@mui/material';
import AvatarGenerator from './AvatarGenerator';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import bgPattern from '../assets/Unichain-Pattern-3.png';
import { APP_CONFIG } from '../config';
import MaintenanceMode from './MaintenanceMode';
import discordIcon from '../assets/4691356_discord_icon.svg';
import xIcon from '../assets/11053970_x_logo_twitter_new_brand_icon.svg';
import githubIcon from '../assets/github-142-svgrepo-com.svg';
import gitbookIcon from '../assets/gitbook-svgrepo-com.svg';

const NetworkDetails = ({ title, chainId, chainName, rpcUrl, symbol, explorer, isHighlighted }) => (
  <Box sx={{
    backgroundColor: isHighlighted ? 'rgba(245, 13, 180, 0.04)' : 'white',
    borderRadius: '16px',
    border: '1px solid',
    borderColor: isHighlighted ? 'rgba(245, 13, 180, 0.2)' : 'rgba(245, 13, 180, 0.1)',
    p: 3,
    width: '100%'
  }}>
    <Typography sx={{ 
      fontSize: '1.1rem',
      fontWeight: 700,
      color: isHighlighted ? '#F50DB4' : '#111',
      mb: 2
    }}>
      {title}
    </Typography>
    
    <Box sx={{ 
      display: 'grid',
      gap: 2
    }}>
      <Box>
        <Typography sx={{ 
          fontSize: '0.85rem',
          color: '#666',
          mb: 0.5
        }}>
          Chain Name
        </Typography>
        <Typography sx={{ 
          fontSize: '0.95rem',
          color: '#111',
          fontWeight: 500
        }}>
          {chainName}
        </Typography>
      </Box>

      <Box>
        <Typography sx={{ 
          fontSize: '0.85rem',
          color: '#666',
          mb: 0.5
        }}>
          Chain ID
        </Typography>
        <Typography sx={{ 
          fontSize: '0.95rem',
          color: '#111',
          fontWeight: 500,
          fontFamily: 'monospace'
        }}>
          {chainId}
        </Typography>
      </Box>
      
      <Box>
        <Typography sx={{ 
          fontSize: '0.85rem',
          color: '#666',
          mb: 0.5
        }}>
          RPC URL
        </Typography>
        <Typography sx={{ 
          fontSize: '0.95rem',
          color: '#111',
          fontWeight: 500,
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          {rpcUrl}
        </Typography>
      </Box>

      <Box>
        <Typography sx={{ 
          fontSize: '0.85rem',
          color: '#666',
          mb: 0.5
        }}>
          Currency Symbol
        </Typography>
        <Typography sx={{ 
          fontSize: '0.95rem',
          color: '#111',
          fontWeight: 500
        }}>
          {symbol}
        </Typography>
      </Box>
      
      <Box>
        <Typography sx={{ 
          fontSize: '0.85rem',
          color: '#666',
          mb: 0.5
        }}>
          Block Explorer
        </Typography>
        <Typography 
          component="a"
          href={`https://${explorer}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            fontSize: '0.95rem',
            color: '#F50DB4',
            fontWeight: 500,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {explorer}
        </Typography>
      </Box>
    </Box>
  </Box>
);

const ConnectPage = ({ error }) => {
  const isWrongNetwork = error?.includes('network');
  
  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      background: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Navbar />
      
      <Box sx={{
        flex: 1,
        width: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <Container 
          maxWidth="lg" 
          sx={{
            pt: { xs: '80px', sm: '100px' },
            pb: { xs: 4, sm: 5 },
            px: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 3, sm: 4 }
          }}
        >
          {APP_CONFIG.MAINTENANCE_MODE ? (
            <MaintenanceMode />
          ) : (
            <Box sx={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 3, sm: 4 }
            }}>
              {/* Avatar */}
              <Box sx={{ 
                width: { xs: '100px', sm: '120px' },
                height: { xs: '100px', sm: '120px' },
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                flexShrink: 0,
                mx: 'auto',
                boxShadow: '0px 4px 20px rgba(245, 13, 180, 0.1)'
              }}>
                <AvatarGenerator 
                  size="100%" 
                  name={isWrongNetwork ? "wrong-network" : "disconnected"}
                  variant="beam" 
                  colors={['#F50DB4', '#FEAFF0']} 
                  square={true} 
                />
              </Box>

              {/* Title and Description Container */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: { xs: 2, sm: 2.5 },
                maxWidth: '500px',
                width: '100%'
              }}>
                <Typography 
                  variant="h1"
                  sx={{
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    fontWeight: 700,
                    color: '#F50DB4',
                    textAlign: 'center'
                  }}
                >
                  {isWrongNetwork ? 'Wrong Network' : 'Connect Your Wallet'}
                </Typography>

                <Typography sx={{
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: 1.6
                }}>
                  {isWrongNetwork ? (
                    "Looks like you're not connected to Unichain Sepolia. Switch networks to see your Frens!"
                  ) : (
                    "Connect your wallet to see your Frens and start earning rewards."
                  )}
                </Typography>
              </Box>

              {/* Connect Button */}
              <Box sx={{ 
                width: '100%',
                maxWidth: '500px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <w3m-button />
              </Box>

              {/* Network Info */}
              <Box sx={{
                backgroundColor: 'white',
                borderRadius: '16px',
                p: { xs: 3, sm: 3 },
                border: '1px solid',
                borderColor: isWrongNetwork ? 'rgba(245, 13, 180, 0.2)' : 'rgba(245, 13, 180, 0.1)',
                width: 'calc(100% - 32px)',
                maxWidth: '500px',
                backgroundColor: isWrongNetwork ? 'rgba(245, 13, 180, 0.02)' : 'white',
                mx: { xs: 2, sm: 0 }
              }}>
                <Typography sx={{ 
                  fontSize: '1rem',
                  fontWeight: 700,
                  mb: 2,
                  color: isWrongNetwork ? '#F50DB4' : '#111'
                }}>
                  {isWrongNetwork ? 'Required Network' : 'Network Information'}
                </Typography>
                
                <Box sx={{ 
                  display: 'grid',
                  gap: 2
                }}>
                  <Box>
                    <Typography sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                      Network Name
                    </Typography>
                    <Typography sx={{ fontWeight: 500 }}>
                      Unichain Sepolia
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                      Chain ID
                    </Typography>
                    <Typography sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                      1301
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                      RPC URL
                    </Typography>
                    <Typography sx={{ 
                      fontWeight: 500, 
                      wordBreak: 'break-all',
                      fontFamily: 'monospace'
                    }}>
                      https://sepolia.unichain.org
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                      Currency
                    </Typography>
                    <Typography sx={{ fontWeight: 500 }}>
                      ETH
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                      Explorer
                    </Typography>
                    <Typography 
                      component="a"
                      href="https://sepolia.uniscan.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#F50DB4',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      sepolia.uniscan.xyz
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Wallet Info (shown only when not connected) */}
              {!isWrongNetwork && (
                <Box sx={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  p: { xs: 3, sm: 3 },
                  border: '1px solid rgba(245, 13, 180, 0.1)',
                  width: 'calc(100% - 32px)',
                  maxWidth: '500px',
                  mx: { xs: 2, sm: 0 }
                }}>
                  <Typography sx={{ 
                    fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    color: '#666',
                    textAlign: 'center',
                    mb: 2,
                    lineHeight: 1.6
                  }}>
                    We recommend MetaMask for the best experience, but any EVM-compatible wallet will work. For mobile users, we recommend using your wallet's built-in browser.
                  </Typography>
                  
                  <Box sx={{
                    pt: 2,
                    borderTop: '1px solid rgba(245, 13, 180, 0.05)'
                  }}>
                    <Typography sx={{ 
                      fontSize: '0.75rem',
                      color: '#666',
                      fontStyle: 'italic',
                      textAlign: 'center'
                    }}>
                      Supported wallets include MetaMask, Trust Wallet, Coinbase Wallet, and more
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Social Links */}
              <Box sx={{
                display: 'flex',
                gap: 2,
                mt: { xs: 1, sm: 2 }
              }}>
                <IconButton
                  component="a"
                  href="https://discord.gg/unichain"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: { xs: 44, sm: 40 },
                    height: { xs: 44, sm: 40 },
                    backgroundColor: 'white',
                    border: '1px solid rgba(245, 13, 180, 0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(245, 13, 180, 0.04)'
                    }
                  }}
                >
                  <img src={discordIcon} alt="Discord" style={{ width: 20, height: 20 }} />
                </IconButton>

                <IconButton
                  component="a"
                  href="https://x.com/unichainfrens"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: { xs: 44, sm: 40 },
                    height: { xs: 44, sm: 40 },
                    backgroundColor: 'white',
                    border: '1px solid rgba(245, 13, 180, 0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(245, 13, 180, 0.04)'
                    }
                  }}
                >
                  <img src={xIcon} alt="X (Twitter)" style={{ width: 20, height: 20 }} />
                </IconButton>

                <IconButton
                  component="a"
                  href="https://github.com/unifrens"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: { xs: 44, sm: 40 },
                    height: { xs: 44, sm: 40 },
                    backgroundColor: 'white',
                    border: '1px solid rgba(245, 13, 180, 0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(245, 13, 180, 0.04)'
                    }
                  }}
                >
                  <img src={githubIcon} alt="GitHub" style={{ width: 20, height: 20 }} />
                </IconButton>

                <IconButton
                  component="a"
                  href="https://docs.unifrens.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: { xs: 44, sm: 40 },
                    height: { xs: 44, sm: 40 },
                    backgroundColor: 'white',
                    border: '1px solid rgba(245, 13, 180, 0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(245, 13, 180, 0.04)'
                    }
                  }}
                >
                  <img src={gitbookIcon} alt="Documentation" style={{ width: 20, height: 20 }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default ConnectPage; 