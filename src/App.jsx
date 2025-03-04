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
  { name: "Satoshi", seed: "Satoshi123", baseValue: 0.00001930 },
  { name: "Degen", seed: "Degen456", baseValue: 0.00001470 },
  { name: "Bob", seed: "Bob789", baseValue: 0.00001690 }
];

function App() {
  const [values, setValues] = useState(FRENS.map(f => f.baseValue));

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev => prev.map(v => v + 0.00000001));
    }, 100);
    return () => clearInterval(interval);
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
          '& > *': {
            animation: 'fadeSlideUp 0.5s ease-out forwards'
          }
        }}>
          {/* Title & Description */}
          <Typography variant="h1" sx={{ 
            fontSize: { xs: 32, sm: 42 }, 
            fontWeight: 900, 
            mb: { xs: 1, sm: 1 },
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            '& span': {
              position: 'relative',
              color: '#F50DB4',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -2,
                left: 0,
                width: '100%',
                height: '2px',
                background: '#F50DB4',
                opacity: 0.2,
                transition: 'opacity 0.2s ease-in-out'
              },
              '&:hover::after': {
                opacity: 0.4
              }
            }
          }}>
            Meet Your <span>Unifren</span>
          </Typography>
          <Typography sx={{ 
            color: '#666', 
            mb: { xs: 3, sm: 2.5 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            maxWidth: '540px',
            mx: 'auto',
            lineHeight: 1.6
          }}>
            Every wallet has a hidden companion waiting to be discovered. Name your Unifren and watch them thrive on blockchain activity, collecting valuable dust along the way.
          </Typography>

          {/* Sample Frens */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1.5, sm: 2 }, 
            justifyContent: 'center', 
            mb: { xs: 3, sm: 2.5 },
            flexWrap: 'nowrap',
            width: '100%',
            maxWidth: { xs: '100%', sm: '460px' },
            mx: 'auto',
            '@keyframes cardEntrance': {
              from: { 
                opacity: 0,
                transform: 'translateY(20px) scale(0.95)'
              },
              to: { 
                opacity: 1,
                transform: 'translateY(0) scale(1)'
              }
            }
          }}>
            {FRENS.map((fren, index) => (
              <Box
                key={fren.name}
                sx={{ 
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '33%',
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 4px 16px rgba(245, 13, 180, 0.08)',
                  border: '1px solid rgba(245, 13, 180, 0.1)',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: `cardEntrance 0.5s ease-out forwards ${index * 0.1 + 0.2}s`,
                  opacity: 0,
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: '0 8px 24px rgba(245, 13, 180, 0.16)'
                  }
                }}
              >
                <Box sx={{ 
                  aspectRatio: '1', 
                  display: 'flex',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}>
                  <AvatarGenerator 
                    size="100%" 
                    name={fren.seed}
                    variant="beam" 
                    colors={['#F50DB4', '#FEAFF0']} 
                    square={true} 
                  />
                </Box>
                <Box sx={{ 
                  p: { xs: 1, sm: 1.25 },
                  borderTop: '1px solid rgba(245, 13, 180, 0.1)',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,1))',
                  transform: 'translateY(0)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <Typography sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    fontWeight: 700,
                    color: '#111',
                    mb: 0.25,
                    fontFamily: 'Space Grotesk',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {fren.name}
                  </Typography>
                  <Typography sx={{ 
                    color: '#4CAF50',
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}>
                    +{values[index].toFixed(8)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* CTA */}
          <Box sx={{ mb: { xs: 3, sm: 2.5 } }}>
            <Button
              component={Link}
              to="/frens"
              sx={{
                bgcolor: '#F50DB4',
                color: 'white',
                px: { xs: 3, sm: 4 },
                py: { xs: 1.25, sm: 1.5 },
                borderRadius: 50,
                fontSize: { xs: 16, sm: 18 },
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)',
                '&:hover': { 
                  bgcolor: '#d00a9b',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(245, 13, 180, 0.25)'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 8px rgba(245, 13, 180, 0.25)'
                }
              }}
            >
              Launch App
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 1.5
          }}>
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
              {/* Discord link temporarily removed
              <MuiLink href="https://discord.gg/nrQezVny" target="_blank" sx={{ display: 'flex', alignItems: 'center', height: 22 }}>
                <Box 
                  component="img" 
                  src={discordIcon} 
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
              <MuiLink href="https://x.com/unichainfrens" target="_blank" sx={{ display: 'flex', alignItems: 'center', height: 22 }}>
                <Box 
                  component="img" 
                  src={xIcon} 
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
              <MuiLink href="https://github.com/unifrens" target="_blank" sx={{ display: 'flex', alignItems: 'center', height: 22 }}>
                <Box 
                  component="img" 
                  src={githubIcon} 
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
              <MuiLink href="https://unifrens.gitbook.io/unifrens-docs/" target="_blank" sx={{ display: 'flex', alignItems: 'center', height: 22 }}>
                <Box 
                  component="img" 
                  src={gitbookIcon} 
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
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography sx={{ 
                color: '#666',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                Powered by
              </Typography>
              <Box
                component="img"
                src="/Unichain-Lockup-Dark.png"
                sx={{ 
                  height: { xs: 12, sm: 14 },
                  filter: 'invert(40%) sepia(0%) saturate(1%) hue-rotate(231deg) brightness(95%) contrast(89%)'
                }}
                alt="Unichain"
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
