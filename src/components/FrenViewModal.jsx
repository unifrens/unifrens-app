import { Dialog, DialogContent, Box, Typography, Button, IconButton, useTheme, useMediaQuery, Divider } from '@mui/material';
import AvatarGenerator from './AvatarGenerator';
import { buttonStyles } from '../styles/theme';
import CloseIcon from '@mui/icons-material/Close';
import { formatEther } from 'viem';
import { useEffect, useState } from 'react';
import { getCachedNFTImage, cacheNFTImage, downloadNFTImage } from '../utils/imageCache';

const StatItem = ({ label, value, color = '#111' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Typography sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      color: '#666',
      fontFamily: 'Space Grotesk'
    }}>
      {label}
    </Typography>
    <Typography sx={{ 
      fontSize: { xs: '1rem', sm: '1.125rem' },
      fontWeight: 600,
      color: color,
      fontFamily: 'Space Grotesk'
    }}>
      {value}
    </Typography>
  </Box>
);

const FrenViewModal = ({ open, onClose, token }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [imageUrl, setImageUrl] = useState(null);

  // Load and cache image when modal opens
  useEffect(() => {
    if (!token) return;

    const loadImage = async () => {
      // Try to get cached image first
      const cached = getCachedNFTImage(token.name);
      if (cached) {
        setImageUrl(cached);
        return;
      }

      // If no cache, use original URL and cache in background
      setImageUrl(`https://imgs.unifrens.com/${encodeURIComponent(token.name)}`);
      await cacheNFTImage(token.name);
      
      // Update to cached version if available
      const newCached = getCachedNFTImage(token.name);
      if (newCached) {
        setImageUrl(newCached);
      }
    };

    loadImage();
  }, [token]);

  const handleAvatarDownload = () => {
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
        a.download = `${token.name}-avatar.png`;
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
  };

  const handleNFTDownload = () => {
    if (!token) return;
    downloadNFTImage(token.name);
  };

  if (!token) return null;

  // Format rewards and claimed amounts
  const pendingRewards = formatEther(token.rewards).slice(0, 8);
  const totalClaimed = formatEther(token.claimed).slice(0, 8);
  const positionMultiplier = Number(token.weight) > 0 
    ? formatEther(BigInt('1000000000000000000')).slice(0, 8)
    : '0';

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionProps={{
        timeout: {
          enter: 300,
          exit: 200
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(245, 13, 180, 0.1)',
          overflow: 'hidden',
          m: isMobile ? 0 : 3,
          background: '#FAFAFA',
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          maxHeight: isDesktop ? '85vh' : 'none'
        }
      }}
    >
      <Box sx={{ 
        position: 'relative',
        flex: isDesktop ? '0 0 50%' : 'none',
        display: 'flex',
        flexDirection: 'column',
        ...(isMobile && {
          width: '100%',
          aspectRatio: '1',
        })
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 1,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ 
          width: '100%',
          aspectRatio: '1',
          position: 'relative',
          backgroundColor: '#fafafa',
          overflow: 'hidden'
        }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`${token.name} NFT Card`}
              loading="eager"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{
        flex: isDesktop ? '0 0 50%' : 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(245, 13, 180, 0.03)',
        borderLeft: isDesktop ? '1px solid rgba(245, 13, 180, 0.08)' : 'none',
        borderTop: !isDesktop ? '1px solid rgba(245, 13, 180, 0.08)' : 'none',
      }}>
        <DialogContent sx={{ 
          p: { xs: 1.5, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 1 : 3,
          height: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: isMobile ? 0.5 : 1,
            pt: isMobile ? 0.5 : 0
          }}>
            <Typography sx={{ 
              fontSize: { xs: '1rem', sm: '1.75rem' },
              fontWeight: 700,
              color: '#111'
            }}>
              {token.name}
            </Typography>
            <Typography sx={{ 
              fontSize: { xs: '0.75rem', sm: '1rem' },
              color: '#666'
            }}>
              #{token.id.toString()}
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? 1 : 3
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: isMobile ? 1 : 3,
              alignItems: 'start'
            }}>
              <StatItem 
                label="Status" 
                value={token.weight === 0n ? "Retired" : "Active"}
                color={token.weight === 0n ? "#666" : "#4CAF50"}
              />
              <StatItem 
                label="Weight" 
                value={token.weight.toString()}
                color={token.weight === 0n ? "#666" : "#111"}
              />
            </Box>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: isMobile ? 1 : 3,
              alignItems: 'start'
            }}>
              <StatItem 
                label="Pending Rewards" 
                value={`${pendingRewards} ETH`}
                color="#4CAF50"
              />
              <StatItem 
                label="Total Claimed" 
                value={`${totalClaimed} ETH`}
                color="#666"
              />
            </Box>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr',
              gap: 0.5
            }}>
              <StatItem 
                label="Position Multiplier" 
                value={`${positionMultiplier}x`}
                color={token.weight === 0n ? "#666" : "#F50DB4"}
              />
              {!isMobile && (
                <Typography sx={{ 
                  fontSize: '0.75rem',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {token.weight === 0n 
                    ? "This Fren is retired and no longer earns rewards" 
                    : "Multiplier applied to rewards based on position"}
                </Typography>
              )}
            </Box>

            {isMobile ? (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                mt: 0.5,
                pb: 2
              }}>
                <Button
                  variant="contained"
                  onClick={handleNFTDownload}
                  size="small"
                  sx={{ 
                    ...buttonStyles,
                    py: 0.75,
                    fontSize: '0.75rem',
                    minHeight: 0,
                    height: 32
                  }}
                >
                  Get NFT
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleAvatarDownload}
                  size="small"
                  sx={{ 
                    ...buttonStyles,
                    py: 0.75,
                    fontSize: '0.75rem',
                    minHeight: 0,
                    height: 32,
                    backgroundColor: 'white',
                    borderColor: 'rgba(245, 13, 180, 0.5)',
                    color: '#F50DB4',
                    '&:hover': {
                      backgroundColor: 'rgba(245, 13, 180, 0.05)',
                      borderColor: '#F50DB4'
                    }
                  }}
                >
                  Get PFP
                </Button>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                mt: 'auto'
              }}>
                <Button
                  variant="contained"
                  onClick={handleNFTDownload}
                  sx={{ 
                    ...buttonStyles,
                    py: 2,
                    fontSize: '1rem'
                  }}
                >
                  Download NFT Card
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleAvatarDownload}
                  sx={{ 
                    ...buttonStyles,
                    py: 2,
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    borderColor: 'rgba(245, 13, 180, 0.5)',
                    color: '#F50DB4',
                    '&:hover': {
                      backgroundColor: 'rgba(245, 13, 180, 0.05)',
                      borderColor: '#F50DB4'
                    }
                  }}
                >
                  Download Avatar
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default FrenViewModal; 