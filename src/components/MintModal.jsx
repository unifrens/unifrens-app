import { Dialog, DialogContent, Box, Typography, Button, CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarGenerator from './AvatarGenerator';
import confetti from 'canvas-confetti';

const MintModal = ({ open, onClose, status, error, mintData, onRetry }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'success') {
      // Pink confetti celebration
      const colors = ['#F50DB4', '#FEAFF0'];
      const end = Date.now() + 3000; // 3 seconds

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [status]);

  return (
    <Dialog 
      open={open} 
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: '#FAFAFA',
          p: 2
        }
      }}
    >
      <DialogContent>
        {status === 'loading' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: 4
          }}>
            <CircularProgress 
              size={56}
              sx={{ color: '#F50DB4' }}
            />
            <Typography sx={{ 
              fontSize: '1.1rem',
              color: '#666',
              textAlign: 'center'
            }}>
              Minting your Fren...
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            py: 2
          }}>
            <Box sx={{ 
              width: '180px',
              aspectRatio: '1',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(245, 13, 180, 0.15)',
              border: '1px solid rgba(245, 13, 180, 0.1)'
            }}>
              <AvatarGenerator
                size="100%"
                name={mintData.name}
                variant="beam"
                colors={['#F50DB4', '#FEAFF0']}
                square={true}
              />
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ 
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111',
                mb: 1
              }}>
                Welcome, {mintData.name}!
              </Typography>
              <Typography sx={{ 
                fontSize: '1rem',
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
              mt: 2
            }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/frens')}
                sx={{ 
                  borderColor: '#F50DB4',
                  color: '#F50DB4',
                  px: 3,
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
                  // TODO: Implement share on X
                  console.log('Share on X clicked');
                }}
                sx={{ 
                  backgroundColor: '#F50DB4',
                  color: 'white',
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#d00a9b'
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
            py: 4
          }}>
            <Typography sx={{ 
              fontSize: '1.1rem',
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
              fontSize: '0.9rem',
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
              mt: 2
            }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{ 
                  borderColor: '#666',
                  color: '#666',
                  px: 3,
                  '&:hover': {
                    borderColor: '#444',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={onRetry}
                sx={{ 
                  backgroundColor: '#F50DB4',
                  color: 'white',
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#d00a9b'
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