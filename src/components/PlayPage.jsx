import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Card } from '@mui/material';
import Navbar from './Navbar';
import confetti from 'canvas-confetti';

// Emoji slots configuration
const SLOTS = ['🦄', '💎', '🌈', '⭐', '🎯'];

const PlayPage = () => {
  const [balance, setBalance] = useState(1000); // Starting balance of 1000 $FREN
  const [bet, setBet] = useState(10);
  const [slots, setSlots] = useState(['🎯', '🎯', '🎯', '🎯', '🎯']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const celebrateWin = (multiplier) => {
    const colors = ['#F50DB4', '#FEAFF0'];
    
    if (multiplier >= 10) {
      // Jackpot celebration - lots of confetti!
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: colors
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: colors
        });
      }, 250);
    } else if (multiplier >= 3) {
      // Medium win celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      });
    } else {
      // Small win celebration
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: colors
      });
    }
  };

  const spin = () => {
    if (balance < bet) return;
    setIsSpinning(true);
    setBalance(prev => prev - bet);
    setLastWin(0);

    // Simulate spinning animation
    const intervalId = setInterval(() => {
      setSlots(slots.map(() => SLOTS[Math.floor(Math.random() * SLOTS.length)]));
    }, 50);

    // Stop after 2 seconds
    setTimeout(() => {
      clearInterval(intervalId);
      setIsSpinning(false);
      
      // Generate final result
      const result = Array(5).fill().map(() => SLOTS[Math.floor(Math.random() * SLOTS.length)]);
      setSlots(result);

      // Count matches
      const counts = {};
      result.forEach(emoji => {
        counts[emoji] = (counts[emoji] || 0) + 1;
      });
      
      const maxCount = Math.max(...Object.values(counts));
      let multiplier = 0;

      // Simplified reward system
      if (maxCount === 5) multiplier = 10;      // Jackpot: 10x
      else if (maxCount === 4) multiplier = 5;  // Four of a kind: 5x
      else if (maxCount === 3) multiplier = 3;  // Three of a kind: 3x
      else if (maxCount === 2) multiplier = 0.25; // Two of a kind: 0.25x

      if (multiplier > 0) {
        const winAmount = Math.floor(bet * multiplier);
        setLastWin(winAmount);
        setBalance(prev => prev + winAmount);
        celebrateWin(multiplier);
      }
    }, 2000);
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
            Unifrens <span>Slots</span>
          </Typography>
          <Typography sx={{
            fontSize: '1rem',
            color: '#666',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6
          }}>
            Test your luck with the magical Unifrens slot machine! 🎰
          </Typography>
        </Box>

        {/* Slot Machine */}
        <Box sx={{
          maxWidth: '500px',
          mx: 'auto'
        }}>
          <Card sx={{ 
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            backgroundColor: 'white',
            border: '1px solid rgba(245, 13, 180, 0.1)',
            boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)',
            mb: 3
          }}>
            {/* Balance Display */}
            <Typography sx={{ 
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#666',
              mb: 3
            }}>
              Balance: <Box component="span" sx={{ color: '#F50DB4', fontWeight: 600, fontFamily: 'Space Grotesk' }}>{balance.toLocaleString()} $FREN</Box>
            </Typography>

            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 1, sm: 2 },
              mb: 3
            }}>
              {slots.map((emoji, index) => (
                <Box key={index} sx={{
                  width: { xs: '48px', sm: '72px' },
                  height: { xs: '48px', sm: '72px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(245, 13, 180, 0.05)',
                  borderRadius: '12px',
                  fontSize: { xs: '28px', sm: '40px' },
                  transition: isSpinning ? 'transform 0.1s' : 'none',
                  animation: isSpinning ? 'bounce 0.5s infinite' : 'none',
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' }
                  }
                }}>
                  {emoji}
                </Box>
              ))}
            </Box>

            {/* Bet Controls */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center'
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Button
                  variant="outlined"
                  onClick={() => setBet(prev => Math.max(10, prev - 10))}
                  sx={{
                    minWidth: '40px',
                    color: '#F50DB4',
                    borderColor: 'rgba(245, 13, 180, 0.5)',
                    '&:hover': {
                      borderColor: '#F50DB4',
                      backgroundColor: 'rgba(245, 13, 180, 0.04)'
                    }
                  }}
                >
                  -
                </Button>
                <Typography sx={{ 
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111',
                  minWidth: '100px',
                  textAlign: 'center'
                }}>
                  {bet} $FREN
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setBet(prev => Math.min(1000, prev + 10))}
                  sx={{
                    minWidth: '40px',
                    color: '#F50DB4',
                    borderColor: 'rgba(245, 13, 180, 0.5)',
                    '&:hover': {
                      borderColor: '#F50DB4',
                      backgroundColor: 'rgba(245, 13, 180, 0.04)'
                    }
                  }}
                >
                  +
                </Button>
              </Box>

              <Button
                variant="contained"
                onClick={spin}
                disabled={isSpinning || balance < bet}
                sx={{
                  bgcolor: '#F50DB4',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '200px',
                  '&:hover': { 
                    bgcolor: '#d00a9b'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(245, 13, 180, 0.3)'
                  }
                }}
              >
                {isSpinning ? 'Spinning...' : 'Spin!'}
              </Button>
            </Box>
          </Card>

          {/* Last Win Display */}
          {lastWin > 0 && (
            <Typography sx={{
              textAlign: 'center',
              color: '#4CAF50',
              fontSize: '1.25rem',
              fontWeight: 600,
              animation: 'fadeIn 0.5s',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}>
              You won {lastWin} $FREN! 🎉
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default PlayPage; 