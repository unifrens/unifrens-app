import { Dialog, DialogContent, Box, Typography, Button, CircularProgress, IconButton, DialogTitle } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import CloseIcon from '@mui/icons-material/Close';

// Function to preload image with retries
const preloadImage = async (name) => {
  const url = `https://imgs.unifrens.com/${encodeURIComponent(name)}`;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

const MintModal = ({ open, onClose, status, error, mintData, onRetry }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      // Start image preloading
      preloadImage(mintData.name).then(success => {
        if (success) {
          setImageLoaded(true);
        } else {
          console.warn('Failed to preload image after all retries');
        }
      });

      // Immediate confetti burst
      const colors = ['#F50DB4', '#FEAFF0'];
      
      // Initial burst
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
        scalar: 1.2,
        disableForReducedMotion: true
      });

      // Side bursts after a tiny delay
      setTimeout(() => {
        confetti({
          particleCount: 15,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        
        confetti({
          particleCount: 15,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });
      }, 100);

    } else {
      setImageLoaded(false);
    }
  }, [status, mintData.name]);

  return (
    <Dialog 
      open={open} 
      maxWidth="sm"
      fullWidth
      fullScreen={window.innerWidth < 600}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          maxWidth: '600px',
          width: '100%',
          borderRadius: { xs: 0, sm: '12px' },
          background: '#FAFAFA',
          height: { xs: '100%', sm: 'auto' },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        p: { xs: 2, sm: 3 },
        position: 'sticky',
        top: 0,
        backgroundColor: '#FAFAFA',
        zIndex: 1,
        borderBottom: '1px solid rgba(245, 13, 180, 0.1)'
      }}>
        <Typography 
          component="div"
          sx={{ 
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontWeight: 600,
            color: '#111',
            fontFamily: 'Space Grotesk',
            letterSpacing: '-0.02em'
          }}
        >
          {status === 'loading' ? 'Minting Your Fren' : 
           status === 'success' ? 'Welcome to Unifrens!' :
           'Minting Failed'}
        </Typography>
        {status !== 'loading' && (
          <IconButton
            onClick={onClose}
            sx={{
              color: '#666',
              '&:hover': { color: '#F50DB4' }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: { xs: 'center', sm: 'flex-start' },
        minHeight: { xs: 'calc(100% - 72px)', sm: 'auto' },
        gap: 3
      }}>
        {status === 'loading' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: { xs: 2, sm: 4 },
            width: '100%',
            flex: { xs: 1, sm: 'none' },
            justifyContent: 'center'
          }}>
            <CircularProgress 
              size={64}
              sx={{ color: '#F50DB4' }}
            />
            <Typography sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.2rem' },
              color: '#666',
              textAlign: 'center',
              maxWidth: '300px'
            }}>
              Please wait while we mint your Fren...
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: { xs: 2, sm: 3 },
            width: '100%'
          }}>
            <Box sx={{ 
              width: { xs: '240px', sm: '180px' },
              aspectRatio: '1',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(245, 13, 180, 0.15)',
              border: '1px solid rgba(245, 13, 180, 0.1)',
              position: 'relative',
              backgroundColor: 'rgba(245, 13, 180, 0.04)'
            }}>
              {!imageLoaded && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CircularProgress size={32} sx={{ color: '#F50DB4' }} />
                </Box>
              )}
              <img
                src={`https://imgs.unifrens.com/${encodeURIComponent(mintData.name)}`}
                alt={`${mintData.name} Fren`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: imageLoaded ? 'block' : 'none'
                }}
                onLoad={() => setImageLoaded(true)}
              />
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ 
                fontSize: { xs: '1.75rem', sm: '1.5rem' },
                fontWeight: 700,
                color: '#111',
                mb: 1
              }}>
                Welcome, {mintData.name}!
              </Typography>
              <Typography sx={{ 
                fontSize: { xs: '1.1rem', sm: '1rem' },
                color: '#666',
                maxWidth: '400px',
                mx: 'auto',
                lineHeight: 1.6
              }}>
                Share this on X to earn more rewards! The bigger the community, the bigger your earnings!
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex',
              gap: 2,
              mt: { xs: 2, sm: 1 },
              width: '100%',
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/frens')}
                fullWidth
                sx={{ 
                  borderColor: '#F50DB4',
                  color: '#F50DB4',
                  px: 3,
                  py: { xs: 2, sm: 1 },
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: { xs: '1rem', sm: '0.9rem' },
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  minHeight: '48px',
                  '&:hover': {
                    borderColor: '#d00a9b',
                    backgroundColor: 'rgba(245, 13, 180, 0.04)'
                  }
                }}
              >
                View Frens
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  const imageUrl = `https://imgs.unifrens.com/${encodeURIComponent(mintData.name)}`;
                  const text = `Just minted ${mintData.name} on @unichainfrens! 🎉\n\nJoin the community and start earning rewards! 💰`;
                  const shareUrl = `https://unifrens.com`;
                  
                  // Check if user is on mobile
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                  
                  // Create X intent URL
                  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=unifrens`;
                  
                  // If on mobile, try to open X app first
                  if (isMobile) {
                    // Twitter app URL scheme
                    const twitterApp = `twitter://post?text=${encodeURIComponent(text + '\n\n' + shareUrl + '\n\n#unifrens')}`;
                    
                    // Try to open Twitter app, fall back to web intent
                    window.location.href = twitterApp;
                    // After a short delay, if app didn't open, use web intent
                    setTimeout(() => {
                      window.location.href = intentUrl;
                    }, 500);
                  } else {
                    // On desktop, just open web intent in new tab
                    window.open(intentUrl, '_blank');
                  }
                }}
                fullWidth
                sx={{ 
                  backgroundColor: '#F50DB4',
                  color: 'white',
                  px: 3,
                  py: { xs: 2, sm: 1 },
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: { xs: '1rem', sm: '0.9rem' },
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  minHeight: '48px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#d00a9b',
                    boxShadow: '0 4px 16px rgba(245, 13, 180, 0.2)'
                  }
                }}
              >
                Share on X
              </Button>
            </Box>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: { xs: 2, sm: 4 },
            width: '100%',
            flex: { xs: 1, sm: 'none' },
            justifyContent: 'center'
          }}>
            <Typography sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.1rem' },
              color: '#f44336',
              textAlign: 'center',
              fontWeight: 500,
              mb: 1
            }}>
              {error.includes('user rejected') ? 'Transaction was rejected' :
               error.includes('name already taken') ? 'This name is already taken' :
               error.includes('alphanumeric') ? 'Name must only contain letters and numbers' :
               'Failed to mint your Fren'}
            </Typography>
            
            <Typography sx={{ 
              fontSize: { xs: '1rem', sm: '0.9rem' },
              color: '#666',
              textAlign: 'center',
              maxWidth: '400px',
              mx: 'auto'
            }}>
              {error.includes('user rejected') ? "Please try again when you're ready." :
               error.includes('name already taken') ? 'Please choose a different name for your Fren.' :
               error.includes('alphanumeric') ? 'Names can only contain letters (A-Z, a-z) and numbers (0-9).' :
               'Something went wrong. Please try again.'}
            </Typography>

            <Box sx={{ 
              display: 'flex',
              gap: 2,
              mt: { xs: 2, sm: 1 },
              width: '100%'
            }}>
              <Button
                variant="outlined"
                onClick={onRetry}
                fullWidth
                sx={{ 
                  borderColor: '#F50DB4',
                  color: '#F50DB4',
                  py: { xs: 2, sm: 1.5 },
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: { xs: '1rem', sm: '0.9rem' },
                  fontWeight: 600,
                  minHeight: '48px',
                  '&:hover': {
                    borderColor: '#d00a9b',
                    backgroundColor: 'rgba(245, 13, 180, 0.04)'
                  }
                }}
              >
                Try Again
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MintModal; 