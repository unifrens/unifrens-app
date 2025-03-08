import { Box, Typography, Button, Alert, Link as MuiLink } from '@mui/material';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme';
import LandingLayout from './components/LandingLayout';
import AvatarGenerator from './components/AvatarGenerator';
import { Link } from 'react-router-dom';
import discordIcon from '/discord-icon.svg';
import xIcon from '/x-icon.svg';
import githubIcon from './assets/github-142-svgrepo-com.svg';
import gitbookIcon from './assets/gitbook-svgrepo-com.svg';
import logo from './assets/unifrens-logo-v2.png';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// Add sound synthesis setup
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

const playWelcomeSound = () => {
  // Play an ascending arpeggio with harmonies
  const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      // Main note
      playTone(freq, 0.2, 'sine', 0.1);
      // Harmony note
      playTone(freq * 1.5, 0.15, 'triangle', 0.05);
    }, i * 120);
  });
  
  // Final chord
  setTimeout(() => {
    playTone(frequencies[0], 0.4, 'sine', 0.08);
    playTone(frequencies[2], 0.4, 'sine', 0.08);
    playTone(frequencies[3], 0.4, 'sine', 0.08);
  }, frequencies.length * 120);
};

const playCTASound = () => {
  // Play a quick ascending flourish
  const frequencies = [523.25, 783.99, 1046.50]; // C5, G5, C6
  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.15, 'sine', 0.08);
      // Add sparkle with higher harmonics
      playTone(freq * 2, 0.1, 'triangle', 0.03);
    }, i * 60);
  });
};

const celebratePageLoad = () => {
  const colors = ['#F50DB4', '#FEAFF0'];
  
  // Left corner burst
  confetti({
    particleCount: 15,
    angle: 60,
    spread: 40,
    origin: { x: 0, y: 0.2 },
    colors: colors,
    scalar: 0.9,
    gravity: 0.6,
    drift: 1
  });
  
  // Right corner burst
  confetti({
    particleCount: 15,
    angle: 120,
    spread: 40,
    origin: { x: 1, y: 0.2 },
    colors: colors,
    scalar: 0.9,
    gravity: 0.6,
    drift: -1
  });
  
  // Bottom corner bursts
  setTimeout(() => {
    confetti({
      particleCount: 10,
      angle: 135,
      spread: 30,
      origin: { x: 0, y: 0.9 },
      colors: colors,
      scalar: 0.8,
      gravity: 0.3,
      drift: 1
    });
    
    confetti({
      particleCount: 10,
      angle: 45,
      spread: 30,
      origin: { x: 1, y: 0.9 },
      colors: colors,
      scalar: 0.8,
      gravity: 0.3,
      drift: -1
    });
  }, 300);
};

// Define the pattern SVG component for reuse
export const BackgroundPattern = ({ opacity = 0.2 }) => (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity
    }}
  >
    <defs>
      {/* Base dot pattern */}
      <pattern
        id="dot-pattern"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="10" cy="10" r="1" fill="#FFF" fillOpacity="0.5" />
      </pattern>

      {/* Small geometric pattern */}
      <pattern
        id="small-geo"
        x="0"
        y="0"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        {/* Center circle */}
        <circle cx="20" cy="20" r="8" fill="none" stroke="#FFF" strokeWidth="0.75" strokeOpacity="0.4" />
        <circle cx="20" cy="20" r="2" fill="#FFF" fillOpacity="0.5" />
        {/* Diamond shape */}
        <path
          d="M20 4 L36 20 L20 36 L4 20 Z"
          fill="none"
          stroke="#FFF"
          strokeWidth="0.75"
          strokeOpacity="0.3"
        />
        {/* Cross lines */}
        <path
          d="M 0 20 H 40 M 20 0 V 40"
          stroke="#FFF"
          strokeWidth="0.5"
          strokeOpacity="0.25"
        />
      </pattern>

      {/* Medium hexagonal grid */}
      <pattern
        id="hex-grid"
        x="0"
        y="0"
        width="80"
        height="92.376"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M20,0 L60,0 L80,34.641 L60,69.282 L20,69.282 L0,34.641 Z"
          fill="none"
          stroke="#FFF"
          strokeWidth="1"
          strokeOpacity="0.15"
        />
        <path
          d="M20,23.094 L60,23.094 L80,57.735 L60,92.376 L20,92.376 L0,57.735 Z"
          fill="none"
          stroke="#FFF"
          strokeWidth="1"
          strokeOpacity="0.15"
        />
      </pattern>

      {/* Large square grid with details */}
      <pattern
        id="large-grid"
        x="0"
        y="0"
        width="160"
        height="160"
        patternUnits="userSpaceOnUse"
      >
        {/* Main square */}
        <rect
          x="0"
          y="0"
          width="160"
          height="160"
          fill="none"
          stroke="#FFF"
          strokeWidth="1.5"
          strokeOpacity="0.15"
        />
        {/* Inner square */}
        <rect
          x="20"
          y="20"
          width="120"
          height="120"
          fill="none"
          stroke="#FFF"
          strokeWidth="0.75"
          strokeOpacity="0.15"
        />
        {/* Diagonal lines */}
        <path
          d="M 0 0 L 160 160 M 160 0 L 0 160"
          stroke="#FFF"
          strokeWidth="0.75"
          strokeOpacity="0.15"
        />
        {/* Corner accents */}
        <path
          d="M 0 0 L 20 0 L 20 20 L 0 20 Z
             M 140 0 L 160 0 L 160 20 L 140 20 Z
             M 0 140 L 20 140 L 20 160 L 0 160 Z
             M 140 140 L 160 140 L 160 160 L 140 160 Z"
          fill="#FFF"
          fillOpacity="0.08"
        />
      </pattern>

      {/* Radial gradient for extra depth */}
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.12" />
        <stop offset="50%" stopColor="#FFF" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0.12" />
      </radialGradient>

      {/* Diagonal gradient for shine */}
      <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.15" />
        <stop offset="50%" stopColor="#FFF" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0.15" />
      </linearGradient>
    </defs>
    
    {/* Apply all patterns in layers */}
    <rect width="100%" height="100%" fill="url(#dot-pattern)" />
    <rect width="100%" height="100%" fill="url(#small-geo)" />
    <rect width="100%" height="100%" fill="url(#hex-grid)" />
    <rect width="100%" height="100%" fill="url(#large-grid)" />
    <rect width="100%" height="100%" fill="url(#glow)" />
    <rect width="100%" height="100%" fill="url(#shine)" />
  </svg>
);

const FRENS = [
  { name: "Satoshi", seed: "Satoshi123" },
  { name: "Degen", seed: "Degen456" },
  { name: "Bob", seed: "Bob789" }
];

function App() {
  const [values, setValues] = useState(FRENS.map(f => f.baseValue));
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  // Add page load effect
  useEffect(() => {
    if (!hasPlayedIntro) {
      celebratePageLoad();
      playWelcomeSound();
      setHasPlayedIntro(true);
    }
  }, [hasPlayedIntro]);

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev => prev.map(v => v + 0.00000001));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      // March 8th, 2025 at 04:00 PST (12:00 UTC)
      const launchDate = new Date('2025-03-08T12:00:00Z');
      const now = new Date();
      const difference = launchDate - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Section with SVG Pattern */}
        <Box sx={{ 
          position: 'relative',
          height: { xs: 104, sm: 144 },
          backgroundColor: '#F50DB4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 0,
          mb: { xs: 1.875, sm: 1 },
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(245, 13, 180, 0.1) 0%, rgba(245, 13, 180, 0) 100%)',
            opacity: 0.5,
            transition: 'opacity 0.3s ease-in-out'
          },
          '@keyframes subtleFloat': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-4px)' }
          }
        }}>
          <BackgroundPattern opacity={0.2} />
          
          <Box 
            component="img"
            src={logo}
            alt="Unifrens"
            sx={{ 
              height: { xs: 48, sm: 56 },
              position: 'relative',
              zIndex: 1,
              animation: 'subtleFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 12px rgba(245, 13, 180, 0.2))',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                filter: 'drop-shadow(0 6px 16px rgba(245, 13, 180, 0.3))',
                transform: 'scale(1.02)'
              }
            }}
          />
        </Box>

        {/* Main Content */}
        <Box sx={{ 
          maxWidth: 800, 
          mx: 'auto', 
          px: { xs: 2, sm: 3 }, 
          py: { xs: 3, sm: 2 },
          textAlign: 'center',
          '@keyframes fadeSlideUp': {
            from: { 
              opacity: 0,
              transform: 'translateY(10px)'
            },
            to: { 
              opacity: 1,
              transform: 'translateY(0)'
            }
          },
          '@keyframes pulse': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.6 }
          }
        }}>
          {/* Hero Section */}
          <Typography variant="h1" sx={{ 
            fontSize: { xs: '2rem', sm: '2.5rem' },
            fontWeight: 900,
            mb: 2,
            animation: 'fadeSlideUp 0.6s ease-out',
            background: 'linear-gradient(135deg, #111 0%, #333 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Secure Your Web3 Identity
          </Typography>
          
          <Typography sx={{ 
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            color: '#666',
            mb: 4,
            maxWidth: '600px',
            mx: 'auto',
            animation: 'fadeSlideUp 0.6s ease-out 0.1s backwards'
          }}>
            Mint your .fren name and join a community built around lasting digital identities.
          </Typography>

          {/* Whitelist CTA */}
          <Box sx={{
            mb: 6,
            animation: 'fadeSlideUp 0.6s ease-out 0.2s backwards',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Alert 
              severity="info"
              sx={{ 
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 13, 180, 0.04)',
                border: '1px solid',
                borderColor: 'rgba(245, 13, 180, 0.1)',
                boxShadow: 'none',
                maxWidth: '600px',
                width: '100%'
              }}
            >
              <Typography sx={{ color: '#111' }}>
                🎉 Minting is LIVE for whitelisted users! All early users, testnet testers and beta testers have been whitelisted and invited to mint for the next 24 hours.
              </Typography>
            </Alert>
            <Button
              component={Link}
              to="/mint"
              variant="contained"
              onClick={playCTASound}
              onMouseEnter={(e) => {
                const colors = ['#F50DB4', '#FEAFF0'];
                confetti({
                  particleCount: 35,
                  spread: 60,
                  origin: { y: 0.8 },
                  colors: colors,
                  scalar: 1.2,
                  disableForReducedMotion: true
                });
              }}
              sx={{
                py: 2,
                px: { xs: 4, sm: 6 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: '#F50DB4',
                boxShadow: '0 8px 24px rgba(245, 13, 180, 0.25)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#F50DB4',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 28px rgba(245, 13, 180, 0.35)'
                }
              }}
            >
              Mint Your .fren Name
            </Button>
          </Box>

          {/* Sample Frens */}
          <Box sx={{
            display: 'flex',
            gap: { xs: 2, sm: 3 },
            justifyContent: 'center',
            mb: 6,
            animation: 'fadeSlideUp 0.6s ease-out 0.3s backwards',
            flexWrap: 'wrap'
          }}>
            {FRENS.map((fren, index) => (
              <Box key={index} sx={{
                width: { xs: 100, sm: 120 },
                textAlign: 'center',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box sx={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 3,
                  overflow: 'hidden',
                  mb: 1,
                  backgroundColor: 'white',
                  border: '1px solid rgba(245, 13, 180, 0.1)',
                  boxShadow: '0 4px 20px rgba(245, 13, 180, 0.08)'
                }}>
                  <AvatarGenerator
                    size="100%"
                    name={fren.name}
                    variant="beam"
                    colors={['#F50DB4', '#FEAFF0']}
                    square={true}
                  />
                </Box>
                <Typography sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#F50DB4'
                }}>
                  {fren.name}.fren
                </Typography>
              </Box>
            ))}
          </Box>

          {/* CTA Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            mb: 6,
            animation: 'fadeSlideUp 0.6s ease-out 0.4s backwards'
          }}>
            <Button
              component={Link}
              to="/mint"
              variant="contained"
              sx={{
                py: 1.5,
                px: { xs: 3, sm: 4 },
                fontSize: { xs: '1rem', sm: '1.125rem' },
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Launch App
            </Button>
            <Button
              component={MuiLink}
              href="https://unifrens.gitbook.io/unifrens-docs"
              target="_blank"
              rel="noopener"
              variant="outlined"
              sx={{
                py: 1.5,
                px: { xs: 3, sm: 4 },
                fontSize: { xs: '1rem', sm: '1.125rem' },
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'rgba(245, 13, 180, 0.3)',
                '&:hover': {
                  borderColor: '#F50DB4',
                  background: 'rgba(245, 13, 180, 0.04)'
                }
              }}
            >
              Learn More
            </Button>
          </Box>

          {/* Feature Grid */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 4,
            mb: 6,
            animation: 'fadeSlideUp 0.6s ease-out 0.5s backwards'
          }}>
            <Box sx={{ textAlign: 'left', p: 3, borderRadius: 3, bgcolor: 'rgba(245, 13, 180, 0.03)', border: '1px solid rgba(245, 13, 180, 0.1)' }}>
              <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 1, color: '#111' }}>
                Unique Digital Identity
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                Your .fren name is more than just a username—it's your permanent web3 identity that grows with you over time.
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'left', p: 3, borderRadius: 3, bgcolor: 'rgba(245, 13, 180, 0.03)', border: '1px solid rgba(245, 13, 180, 0.1)' }}>
              <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 1, color: '#111' }}>
                Built for Longevity
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                Names become more established over time through active participation, making early adoption and engagement meaningful.
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'left', p: 3, borderRadius: 3, bgcolor: 'rgba(245, 13, 180, 0.03)', border: '1px solid rgba(245, 13, 180, 0.1)' }}>
              <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 1, color: '#111' }}>
                Transparent & Decentralized
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                All ownership is secured on-chain with no central control. What you own is truly yours.
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'left', p: 3, borderRadius: 3, bgcolor: 'rgba(245, 13, 180, 0.03)', border: '1px solid rgba(245, 13, 180, 0.1)' }}>
              <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 1, color: '#111' }}>
                Community First
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                Join a community of .frens building the future of digital identity and ownership.
              </Typography>
            </Box>
          </Box>

          {/* Social Links */}
          <Box sx={{ 
            display: 'flex',
            gap: 3,
            justifyContent: 'center',
            animation: 'fadeSlideUp 0.6s ease-out 0.6s backwards'
          }}>
            <MuiLink 
              href="https://discord.gg/unifrens" 
              target="_blank"
              sx={{
                opacity: 0.6,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
            >
              <img src={discordIcon} alt="Discord" style={{ width: 24, height: 24 }} />
            </MuiLink>
            <MuiLink 
              href="https://x.com/unifrens" 
              target="_blank"
              sx={{
                opacity: 0.6,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
            >
              <img src={xIcon} alt="X" style={{ width: 24, height: 24 }} />
            </MuiLink>
            <MuiLink 
              href="https://github.com/unifrens" 
              target="_blank"
              sx={{
                opacity: 0.6,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
            >
              <img src={githubIcon} alt="GitHub" style={{ width: 24, height: 24 }} />
            </MuiLink>
            <MuiLink 
              href="https://unifrens.gitbook.io/unifrens-docs" 
              target="_blank"
              sx={{
                opacity: 0.6,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
            >
              <img src={gitbookIcon} alt="GitBook" style={{ width: 24, height: 24 }} />
            </MuiLink>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
