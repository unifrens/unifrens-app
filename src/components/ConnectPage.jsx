import { Box, Typography, Button, Container, Tabs, Tab } from '@mui/material';
import AvatarGenerator from './AvatarGenerator';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import bgPattern from '../assets/Unichain-Pattern-3.png';
import { APP_CONFIG } from '../config';
import MaintenanceMode from './MaintenanceMode';

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
            px: { xs: 2, sm: 3 }
          }}
        >
          {APP_CONFIG.MAINTENANCE_MODE ? (
            <MaintenanceMode />
          ) : (
            <>
              {/* Avatar */}
              <Box sx={{ 
                width: '120px',
                height: '120px',
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                mb: 3,
                flexShrink: 0
              }}>
                <AvatarGenerator 
                  size="100%" 
                  name={isWrongNetwork ? "wrong-network" : "disconnected"}
                  variant="beam" 
                  colors={['#F50DB4', '#FEAFF0']} 
                  square={true} 
                />
              </Box>

              {/* Title */}
              <Typography 
                variant="h1"
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#F50DB4',
                  mb: 2,
                  textAlign: 'center',
                  flexShrink: 0
                }}
              >
                {isWrongNetwork ? 'Wrong Network' : 'Connect Your Wallet'}
              </Typography>

              {/* Description */}
              <Typography sx={{
                fontSize: '1rem',
                color: '#666',
                mb: 3,
                textAlign: 'center',
                maxWidth: '100%',
                flexShrink: 0
              }}>
                {isWrongNetwork ? (
                  "Looks like you're not connected to Unichain Sepolia. Switch networks to see your Frens!"
                ) : (
                  "Connect your wallet to see your Frens and start earning rewards."
                )}
              </Typography>

              {/* Network Info */}
              {isWrongNetwork && (
                <Box sx={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  p: 3,
                  border: '1px solid rgba(245, 13, 180, 0.1)',
                  width: '100%'
                }}>
                  <Typography sx={{ 
                    fontSize: '1rem',
                    fontWeight: 700,
                    mb: 2,
                    color: '#F50DB4'
                  }}>
                    Required Network
                  </Typography>
                  
                  <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
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
              )}

              {/* Connect Button */}
              <Box sx={{ width: '100%' }}>
                <w3m-button />
              </Box>

              {/* Wallet Info */}
              <Box sx={{
                backgroundColor: 'white',
                borderRadius: '16px',
                p: 3,
                border: '1px solid rgba(245, 13, 180, 0.1)',
                width: '100%'
              }}>
                <Typography sx={{ 
                  fontSize: '0.875rem',
                  color: '#666',
                  textAlign: 'center',
                  mb: 2
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
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default ConnectPage; 