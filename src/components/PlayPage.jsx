import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Card, LinearProgress, Modal, IconButton } from '@mui/material';
import Navbar from './Navbar';
import confetti from 'canvas-confetti';
import { unichainSepolia } from '../wallet';

// Emoji slots configuration
const SLOTS = ['🦄', '💎', '🌈', '⭐', '🎯'];
const POOP_CHANCE = 0.01; // 3% chance for poop on each slot

// Sound synthesis
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const playTone = (frequency, duration, type = 'sine', volume = 0.1) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  
  gainNode.gain.value = volume;
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

const playSpinSound = () => {
  // Play a repeating "tick" sound
  const interval = setInterval(() => {
    playTone(800, 0.05, 'square', 0.03);
  }, 100);
  return interval;
};

const playWinSound = (multiplier, currentStreak = 0) => {
  const baseFrequencies = [400, 600, 800, 1000, 1200];
  const streakBonus = currentStreak * 100; // Frequencies get higher with streak
  
  if (multiplier >= 10 || currentStreak === 5) {
    // Super Jackpot celebration - complex ascending arpeggio
    const frequencies = [
      ...baseFrequencies,
      1400, 1600, 1800, 2000
    ].map(f => f + streakBonus);
    
    frequencies.forEach((freq, i) => {
      // Play each note with increasing volume
      setTimeout(() => {
        playTone(freq, 0.2, 'square', 0.1 + (i * 0.02));
        // Add a harmony note
        playTone(freq * 1.5, 0.15, 'triangle', 0.05 + (i * 0.01));
      }, i * 100);
    });
    
    // Add final chord
    setTimeout(() => {
      playTone(frequencies[0], 0.4, 'square', 0.15);
      playTone(frequencies[2], 0.4, 'square', 0.15);
      playTone(frequencies[4], 0.4, 'square', 0.15);
    }, frequencies.length * 100);
  } else if (multiplier >= 3) {
    // Medium win - ascending notes with streak bonus
    const frequencies = baseFrequencies.slice(0, 3 + currentStreak)
      .map(f => f + streakBonus);
    
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.15, 'square', 0.08 + (currentStreak * 0.02));
      }, i * 100);
    });
  } else {
    // Small win - two notes with streak bonus
    const frequencies = baseFrequencies.slice(0, 2)
      .map(f => f + streakBonus);
    
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.1, 'square', 0.05 + (currentStreak * 0.01));
      }, i * 100);
    });
  }
};

const playLossSound = () => {
  // Low "buzz" sound
  playTone(200, 0.2, 'sawtooth', 0.08);
};

const playPoopSound = () => {
  // Descending "failure" sound
  const frequencies = [400, 300, 200, 100];
  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.3, 'sawtooth', 0.2);
    }, i * 200);
  });
  
  // Add some "squelch" sounds
  setTimeout(() => {
    playTone(150, 0.4, 'sine', 0.15);
    playTone(100, 0.6, 'sine', 0.1);
  }, 800);
};

const celebratePoopLoss = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ['#8B4513', '#654321', '#5C4033']; // Brown colors
  
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    // Make confetti fall faster and more chaotically
    confetti({
      particleCount: 10,
      spread: 80,
      origin: { y: 0, x: Math.random() },
      colors: colors,
      gravity: 3,
      scalar: 0.8,
      drift: 5,
      ticks: 200
    });
  }, 100);
};

const formatAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const playCheatSound = () => {
  // Play a fun "secret found" sound
  const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.15, 'square', 0.1);
      // Add a harmony note
      playTone(freq * 1.5, 0.1, 'triangle', 0.05);
    }, i * 100);
  });
};

const PlayPage = () => {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('unifrens_balance');
    return saved ? parseInt(saved) : 1000;
  });
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('unifrens_highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [bet, setBet] = useState(10);
  const [slots, setSlots] = useState(['🎯', '🎯', '🎯', '🎯', '🎯']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [streak, setStreak] = useState(0);
  const [jackpot, setJackpot] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [walletData, setWalletData] = useState({
    address: '',
    isConnected: false,
    isValidNetwork: false
  });
  const [profileData, setProfileData] = useState(null);
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [hasSharedToday, setHasSharedToday] = useState(() => {
    const lastShared = localStorage.getItem('unifrens_last_shared');
    return lastShared && new Date(lastShared).toDateString() === new Date().toDateString();
  });
  const [showCheatMessage, setShowCheatMessage] = useState(false);
  const [cheatMessage, setCheatMessage] = useState('🎮 Secret Code Initialized! 🎮');

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
    // Load profile data from localStorage
    const loadProfileData = () => {
      const savedProfile = localStorage.getItem('profileData');
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      } else {
        setProfileData(null);
      }
    };

    loadProfileData();
    window.addEventListener('storage', loadProfileData);
    window.addEventListener('profileUpdate', loadProfileData);
    return () => {
      window.removeEventListener('storage', loadProfileData);
      window.removeEventListener('profileUpdate', loadProfileData);
    };
  }, []);

  // Get display name helper
  const getDisplayName = () => {
    if (profileData?.name) return profileData.name;
    if (walletData.address) return formatAddress(walletData.address);
    return 'Anonymous Fren';
  };

  // Add bet input handler
  const handleBetInput = (value) => {
    // Allow empty string to clear input
    if (value === '') {
      setBet('');
      return;
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    // Allow any number to be typed
    setBet(numValue);
  };

  const celebrateWin = (multiplier, currentStreak = 0) => {
    const colors = ['#F50DB4', '#FEAFF0'];
    const intensity = Math.min(1, 0.3 + (currentStreak * 0.15)); // Intensity scales with streak
    
    if (multiplier >= 10 || currentStreak === 5) {
      // Super Jackpot celebration - multiple wave celebration!
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: 45, 
        spread: 360, 
        ticks: 100, 
        zIndex: 0,
        shapes: ['star', 'circle']
      };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      // Create multiple waves of confetti
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 100 * (timeLeft / duration);
        
        // Burst from multiple angles
        [-1, 1].forEach(direction => {
          confetti({
            ...defaults,
            particleCount: particleCount * 0.5,
            origin: { 
              x: direction > 0 ? randomInRange(0.7, 0.9) : randomInRange(0.1, 0.3), 
              y: Math.random() - 0.2
            },
            colors: colors,
            gravity: randomInRange(0.8, 1.2),
            scalar: randomInRange(0.9, 1.1)
          });
        });

        // Add some sparkles from the center
        confetti({
          ...defaults,
          particleCount: particleCount * 0.3,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#FFD700', '#FFF'],
          gravity: 0.6,
          scalar: 0.75,
          shapes: ['star']
        });
      }, 150);

    } else if (multiplier >= 3) {
      // Medium win celebration - scaled with streak
      confetti({
        particleCount: 50 + (currentStreak * 30),
        spread: 70 + (currentStreak * 10),
        origin: { y: 0.6 },
        colors: colors,
        gravity: 1,
        scalar: intensity,
        shapes: ['circle']
      });

      // Add a second burst for higher streaks
      if (currentStreak > 2) {
        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 90,
            origin: { y: 0.7 },
            colors: colors,
            gravity: 0.8,
            scalar: intensity * 0.8
          });
        }, 150);
      }
    } else {
      // Small win celebration - scaled with streak
      confetti({
        particleCount: 20 + (currentStreak * 10),
        spread: 50,
        origin: { y: 0.6 },
        colors: colors,
        gravity: 1,
        scalar: intensity
      });
    }
  };

  // Add jackpot contribution from bet
  const addToJackpot = (betAmount) => {
    setJackpot(prev => prev + Math.floor(betAmount * 0.2)); // Increased to 20% of bet
  };

  // Reset jackpot and streak on misses
  const handleMiss = () => {
    // Reset streak on any miss
    setStreak(0);
    
    setMissCount(prev => {
      const newCount = prev + 1;
      // Reset jackpot only after 3 misses
      if (newCount >= 3) {
        setJackpot(0);
        return 0;
      }
      return newCount;
    });
  };

  // Add cheat code tracking
  const checkCheatAvailability = () => {
    const now = Date.now();
    const lastCheatUse = parseInt(localStorage.getItem('unifrens_last_cheat') || '0');
    const cheatCount = parseInt(localStorage.getItem('unifrens_cheat_count') || '0');
    const cooldownTime = 60 * 60 * 1000; // 1 hour in milliseconds

    // Reset cheat count if cooldown has passed
    if (now - lastCheatUse > cooldownTime) {
      localStorage.setItem('unifrens_cheat_count', '0');
      return true;
    }

    return cheatCount < 3;
  };

  const updateCheatUsage = () => {
    const now = Date.now();
    const cheatCount = parseInt(localStorage.getItem('unifrens_cheat_count') || '0');
    const newCount = cheatCount + 1;
    
    localStorage.setItem('unifrens_last_cheat', now.toString());
    localStorage.setItem('unifrens_cheat_count', newCount.toString());
    
    return newCount;
  };

  const spin = () => {
    if (balance < bet) return;
    
    // Check for cheat code
    if (bet === 333) {
      if (!checkCheatAvailability()) {
        setCheatMessage('❌ Cheat code on cooldown! Try again in an hour! ❌');
        setShowCheatMessage(true);
        setTimeout(() => setShowCheatMessage(false), 2000);
        return;
      }

      const cheatCount = updateCheatUsage();
      playCheatSound();
      setBalance(prev => prev + 50000);
      setCheatMessage(cheatCount >= 3 ? '😅 Ok settle down buddy! 😅' : '🎮 Secret Code Initialized! 🎮');
      setShowCheatMessage(true);
      setTimeout(() => setShowCheatMessage(false), 2000);
      return;
    }

    setIsSpinning(true);
    setBalance(prev => prev - bet);
    setLastWin(0);
    addToJackpot(bet);

    // Start spin sound
    const spinSoundInterval = playSpinSound();

    // Simulate spinning animation
    const intervalId = setInterval(() => {
      setSlots(slots.map(() => {
        // During animation, also have a tiny chance of showing poop
        return Math.random() < 0.01 ? '💩' : SLOTS[Math.floor(Math.random() * SLOTS.length)];
      }));
    }, 50);

    // Stop after 2 seconds
    setTimeout(() => {
      clearInterval(intervalId);
      clearInterval(spinSoundInterval);
      setIsSpinning(false);
      
      // Generate final result with poop chance
      const result = Array(5).fill().map(() => {
        return Math.random() < POOP_CHANCE ? '💩' : SLOTS[Math.floor(Math.random() * SLOTS.length)];
      });
      setSlots(result);

      // Check for poop first
      if (result.includes('💩')) {
        // Oh no! Poop ruins everything!
        playPoopSound();
        celebratePoopLoss();
        setStreak(0);
        setJackpot(0);
        setMissCount(3); // Max out miss count
        return;
      }

      // Count matches (only if no poop)
      const counts = {};
      result.forEach(emoji => {
        counts[emoji] = (counts[emoji] || 0) + 1;
      });
      
      const maxCount = Math.max(...Object.values(counts));
      let multiplier = 0;

      // Updated reward system with enhanced multipliers
      if (maxCount === 5) multiplier = 15;      // Jackpot: 15x (increased from 10x)
      else if (maxCount === 4) multiplier = 7;  // Four of a kind: 7x (increased from 5x)
      else if (maxCount === 3) multiplier = 4;  // Three of a kind: 4x (increased from 3x)
      else if (maxCount === 2) multiplier = 0.5; // Two of a kind: 0.5x (increased from 0.25x)

      // Apply streak multiplier
      const streakMultiplier = 1 + (streak * 0.5); // Each streak level adds 50% to multiplier

      if (multiplier > 0) {
        let winAmount = Math.floor(bet * multiplier * streakMultiplier);
        
        // Check for streak jackpot
        if (streak === 4) { // When streak is 4, this win will make it 5
          winAmount += jackpot;
          setJackpot(0);
          setStreak(5); // Set to 5 for display purposes
          celebrateWin(20, 5); // Special celebration for jackpot
          playWinSound(20, 5);
          
          // Reset streak after a short delay (for display)
          setTimeout(() => {
            setStreak(0);
          }, 2000);
        } else {
          const newStreak = streak + 1;
          if (newStreak > 5) {
            setStreak(0); // Reset if would go above 5
          } else {
            setStreak(newStreak);
          }
          celebrateWin(multiplier, streak);
          playWinSound(multiplier, streak);
        }
        
        setLastWin(winAmount);
        setBalance(prev => prev + winAmount);
        setMissCount(0);
      } else {
        handleMiss();
        playLossSound();
      }
    }, 2000);
  };

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('unifrens_balance', balance.toString());
    // Update high score if balance is higher
    if (balance > highScore) {
      setHighScore(balance);
      localStorage.setItem('unifrens_highscore', balance.toString());
    }
  }, [balance, highScore]);

  // Check if balance is too low and show modal
  useEffect(() => {
    if (balance < 10) {
      if (!hasSharedToday) {
        setShowLowBalanceModal(true);
      } else if (balance === 0) {
        // Auto-credit 1000 coins if they've already shared today
        setBalance(1000);
      }
    }
  }, [balance, hasSharedToday]);

  const handleShare = () => {
    const shareText = encodeURIComponent("I ❤️ Unifrens!\n\nPlay now at");
    const shareUrl = encodeURIComponent("https://unifrens.com");
    window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, '_blank');
    
    // Set shared flag and reward user
    localStorage.setItem('unifrens_last_shared', new Date().toISOString());
    setHasSharedToday(true);
    setBalance(prev => prev + 50000);
    setShowLowBalanceModal(false);
  };

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100%',
      background: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative' // Add this for absolute positioning of cheat message
    }}>
      <Navbar />
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          pt: { xs: '64px', sm: '80px' },
          px: { xs: 1, sm: 2 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          justifyContent: 'center'
        }}
      >
        {/* Slot Machine */}
        <Box sx={{
          maxWidth: '450px',
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1, sm: 2 }
        }}>
          <Card sx={{ 
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            backgroundColor: 'white',
            border: '1px solid rgba(245, 13, 180, 0.1)',
            boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)',
            position: 'relative'
          }}>
            {/* Game Stats */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              mb: 1.5
            }}>
              <Box sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: 'rgba(245, 13, 180, 0.05)',
                textAlign: 'center',
                height: '84px', // Fixed height for score containers
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  Balance
                </Typography>
                <Typography sx={{ 
                  fontSize: balance >= 1000000 ? '0.8rem' : '1rem',
                  color: '#F50DB4',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  px: 1 // Add padding to prevent text from touching edges
                }}>
                  {balance.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  $FREN
                </Typography>
              </Box>
              <Box sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: 'rgba(245, 13, 180, 0.05)',
                textAlign: 'center',
                height: '84px', // Fixed height for score containers
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  High Score
                </Typography>
                <Typography sx={{ 
                  fontSize: highScore >= 1000000 ? '0.8rem' : '1rem',
                  color: '#F50DB4',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  px: 1 // Add padding to prevent text from touching edges
                }}>
                  {highScore.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  $FREN
                </Typography>
              </Box>
              <Box sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: 'rgba(245, 13, 180, 0.05)',
                textAlign: 'center',
                height: '84px', // Fixed height for score containers
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  Jackpot
                </Typography>
                <Typography sx={{ 
                  fontSize: jackpot >= 1000000 ? '0.8rem' : '1rem',
                  color: '#F50DB4',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  px: 1 // Add padding to prevent text from touching edges
                }}>
                  {jackpot.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  $FREN
                </Typography>
              </Box>
              <Box sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: lastWin > 0 ? 'rgba(76, 175, 80, 0.05)' : 'rgba(245, 13, 180, 0.05)',
                textAlign: 'center',
                height: '84px', // Fixed height for score containers
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'background-color 0.3s ease'
              }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  Last Win
                </Typography>
                <Typography sx={{ 
                  fontSize: lastWin >= 1000000 ? '0.8rem' : '1rem',
                  color: lastWin > 0 ? '#4CAF50' : '#666',
                  fontWeight: 600,
                  fontFamily: 'Space Grotesk',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  px: 1, // Add padding to prevent text from touching edges
                  transition: 'color 0.3s ease'
                }}>
                  {lastWin > 0 ? `+${lastWin.toLocaleString()}` : '0'}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  $FREN
                </Typography>
              </Box>
            </Box>

            {/* Streak Progress */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5,
                height: '24px' // Fixed height for the stats line
              }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  Win Streak: {streak}/5
                </Typography>
                {streak > 0 && (
                  <Typography 
                    sx={{ 
                      fontSize: '0.7rem',
                      color: '#F50DB4',
                      fontWeight: 600,
                      animation: 'bonusPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      '@keyframes bonusPop': {
                        '0%': { 
                          transform: 'scale(0.8)',
                          opacity: 0
                        },
                        '50%': { 
                          transform: 'scale(1.2)',
                          opacity: 0.8
                        },
                        '100%': { 
                          transform: 'scale(1)',
                          opacity: 1
                        }
                      },
                      textShadow: `0 0 ${streak * 2}px rgba(245, 13, 180, ${0.3 + (streak * 0.1)})`,
                      transition: 'text-shadow 0.3s ease'
                    }}
                  >
                    +{streak * 50}% Bonus!
                  </Typography>
                )}
                <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                  Misses: {missCount}/3
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(streak / 5) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(245, 13, 180, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#F50DB4',
                    borderRadius: 4,
                    backgroundImage: streak > 0 ? `linear-gradient(90deg, 
                      rgba(245, 13, 180, ${0.7 + (streak * 0.1)}), 
                      rgba(255, 255, 255, ${0.3 + (streak * 0.1)}), 
                      rgba(245, 13, 180, ${0.7 + (streak * 0.1)})
                    )` : 'none',
                    boxShadow: streak > 0 ? `0 0 ${streak * 4}px rgba(245, 13, 180, ${0.3 + (streak * 0.1)})` : 'none',
                    animation: streak > 0 ? 'pulse 1.5s infinite, progressPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                    '@keyframes pulse': {
                      '0%': {
                        boxShadow: `0 0 ${streak * 4}px rgba(245, 13, 180, ${0.3 + (streak * 0.1)})`
                      },
                      '50%': {
                        boxShadow: `0 0 ${streak * 8}px rgba(245, 13, 180, ${0.4 + (streak * 0.1)})`
                      },
                      '100%': {
                        boxShadow: `0 0 ${streak * 4}px rgba(245, 13, 180, ${0.3 + (streak * 0.1)})`
                      }
                    },
                    '@keyframes progressPop': {
                      '0%': { 
                        transform: 'scaleY(0.8)',
                      },
                      '50%': { 
                        transform: 'scaleY(1.2)',
                      },
                      '100%': { 
                        transform: 'scaleY(1)',
                      }
                    }
                  }
                }}
              />
            </Box>

            {/* Slot Display */}
            <Box sx={{ 
              p: { xs: 1, sm: 1.5 },
              mb: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(245, 13, 180, 0.02)',
              border: '1px solid rgba(245, 13, 180, 0.1)',
            }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
              }}>
                {slots.map((emoji, index) => (
                  <Box key={index} sx={{
                    width: { xs: '40px', sm: '48px' },
                    height: { xs: '40px', sm: '48px' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: { xs: '24px', sm: '28px' },
                    boxShadow: '0 2px 8px rgba(245, 13, 180, 0.1)',
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
            </Box>

            {/* Bet Controls */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Box sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: 'rgba(245, 13, 180, 0.02)',
                border: '1px solid rgba(245, 13, 180, 0.1)',
              }}>
                <Typography sx={{ 
                  fontSize: '0.7rem',
                  color: '#666',
                  mb: 0.5,
                  textAlign: 'center'
                }}>
                  Bet Amount
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Button
                    variant="outlined"
                    onClick={() => setBet(prev => Math.max(10, prev - 10))}
                    sx={{
                      minWidth: '32px',
                      height: '32px',
                      p: 0,
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
                  <input
                    type="number"
                    value={bet}
                    onChange={(e) => handleBetInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid rgba(245, 13, 180, 0.2)',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#111',
                      textAlign: 'center',
                      outline: 'none',
                      fontFamily: 'Space Grotesk',
                      backgroundColor: 'white'
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setBet(prev => Math.min(balance, prev + 10))}
                    sx={{
                      minWidth: '32px',
                      height: '32px',
                      p: 0,
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
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  mt: 1,
                  justifyContent: 'center'
                }}>
                  {[0.25, 0.5, 0.75, 1].map(fraction => (
                    <Button
                      key={fraction}
                      variant="outlined"
                      size="small"
                      onClick={() => setBet(Math.floor(balance * fraction))}
                      sx={{
                        minWidth: 0,
                        fontSize: '0.7rem',
                        px: 1,
                        py: 0.25,
                        color: '#F50DB4',
                        borderColor: 'rgba(245, 13, 180, 0.5)',
                        '&:hover': {
                          borderColor: '#F50DB4',
                          backgroundColor: 'rgba(245, 13, 180, 0.04)'
                        }
                      }}
                    >
                      {fraction * 100}%
                    </Button>
                  ))}
                </Box>
              </Box>

              <Button
                variant="contained"
                onClick={spin}
                disabled={isSpinning || balance < bet || bet < 10}
                sx={{
                  bgcolor: '#F50DB4',
                  color: 'white',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  width: '100%',
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

          {/* Win Multipliers Info */}
          <Card sx={{ 
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            backgroundColor: 'white',
            border: '1px solid rgba(245, 13, 180, 0.1)',
            boxShadow: '0 4px 24px rgba(245, 13, 180, 0.08)',
          }}>
            <Typography sx={{ 
              fontSize: '0.75rem',
              color: '#666',
              mb: 1,
              textAlign: 'center'
            }}>
              Win Multipliers (+ Streak Bonus)
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1
            }}>
              {[
                { match: 5, multi: '15x', desc: '5 kind' },
                { match: 4, multi: '7x', desc: '4 kind' },
                { match: 3, multi: '4x', desc: '3 kind' },
                { match: 2, multi: '0.5x', desc: '2 kind' }
              ].map((win) => (
                <Box key={win.match} sx={{
                  p: 1,
                  borderRadius: 2,
                  backgroundColor: 'rgba(245, 13, 180, 0.02)',
                  border: '1px solid rgba(245, 13, 180, 0.1)',
                  textAlign: 'center'
                }}>
                  <Typography sx={{ 
                    fontSize: '0.875rem',
                    color: '#F50DB4',
                    fontWeight: 600,
                    mb: 0.25
                  }}>
                    {win.multi}
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.6rem',
                    color: '#666'
                  }}>
                    {win.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>
      </Container>

      {/* Low Balance Modal */}
      <Modal
        open={showLowBalanceModal}
        onClose={() => setShowLowBalanceModal(false)}
        aria-labelledby="low-balance-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Card sx={{
          maxWidth: '400px',
          width: '100%',
          p: 3,
          borderRadius: 2,
          textAlign: 'center',
          position: 'relative',
          outline: 'none'
        }}>
          <IconButton
            onClick={() => setShowLowBalanceModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#666'
            }}
          >
            ✕
          </IconButton>
          
          <Typography variant="h6" sx={{ mb: 2, color: '#F50DB4' }}>
            Need more coins? 
          </Typography>
          
          <Typography sx={{ mb: 3, color: '#666' }}>
            Post "I ❤️ Unifrens!" to X, I dare you!
          </Typography>

          <Button
            variant="contained"
            onClick={handleShare}
            sx={{
              bgcolor: '#F50DB4',
              color: 'white',
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '8px',
              '&:hover': { 
                bgcolor: '#d00a9b'
              }
            }}
          >
            Share & Get 50,000 $FREN
          </Button>
          
          <Typography sx={{ 
            mt: 2,
            fontSize: '0.75rem',
            color: '#666'
          }}>
            *Reward can be claimed once per day
          </Typography>
        </Card>
      </Modal>

      {/* Cheat Message */}
      {showCheatMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: '#F50DB4',
            p: 2,
            borderRadius: 2,
            zIndex: 9999,
            animation: 'fadeInOut 2s ease',
            '@keyframes fadeInOut': {
              '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.8)' },
              '20%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1)' },
              '30%': { transform: 'translate(-50%, -50%) scale(1)' },
              '70%': { opacity: 1 },
              '100%': { opacity: 0 }
            },
            fontFamily: 'Space Grotesk',
            fontWeight: 600,
            fontSize: '1.2rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(245, 13, 180, 0.3)',
            border: '2px solid #F50DB4'
          }}
        >
          {cheatMessage}
        </Box>
      )}
    </Box>
  );
};

export default PlayPage; 