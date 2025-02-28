import { Box, Typography, TextField, IconButton, Tooltip, ClickAwayListener, ButtonBase, Button, LinearProgress, Link as MuiLink } from '@mui/material';
import { MAINTENANCE_STYLES, APP_CONFIG } from '../config';
import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import AvatarGenerator from './AvatarGenerator';
import { HexColorPicker } from 'react-colorful';
import logo from '../assets/unifrens-logo-v2.png';
import ReactDOMServer from 'react-dom/server';
import xIcon from '/x-icon.svg';
import githubIcon from '../assets/github-142-svgrepo-com.svg';
import gitbookIcon from '../assets/gitbook-svgrepo-com.svg';

const ColorPickerPopover = ({ color, onChange, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(color);
  const [position, setPosition] = useState('bottom');

  // Update local color when prop changes
  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  // Handle window resize and scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // Handle color change with debounce
  const handleColorChange = useCallback((newColor) => {
    setLocalColor(newColor);
    const timeoutId = setTimeout(() => {
      onChange(newColor);
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [onChange]);

  // Handle button click and calculate position
  const handleClick = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Decide whether to show picker above or below
    setPosition(spaceBelow < 300 && spaceAbove > spaceBelow ? 'top' : 'bottom');
    setIsOpen(!isOpen);
  };

  return (
    <ClickAwayListener onClickAway={() => isOpen && setIsOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        <Tooltip 
          title={title} 
          placement="top"
          open={!isOpen ? undefined : false}
        >
          <ButtonBase
            onClick={handleClick}
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              backgroundColor: localColor,
              borderRadius: '12px',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease-in-out',
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
                opacity: 0,
                transition: 'opacity 0.2s',
              },
              '&:hover:after': {
                opacity: 1
              },
              '&:focus-visible': {
                outline: '2px solid #F50DB4',
                outlineOffset: 2,
              }
            }}
          />
        </Tooltip>

        {isOpen && (
          <Box
            sx={{
              position: 'absolute',
              [position === 'top' ? 'bottom' : 'top']: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              padding: '16px',
              border: '1px solid rgba(245, 13, 180, 0.1)',
              animation: 'fadeIn 0.2s ease-out',
              '@keyframes fadeIn': {
                from: {
                  opacity: 0,
                  transform: 'translateX(-50%) translateY(-8px)'
                },
                to: {
                  opacity: 1,
                  transform: 'translateX(-50%) translateY(0)'
                }
              },
              '& .react-colorful': {
                width: { xs: '240px', sm: '280px' }
              },
              '& .react-colorful__saturation': {
                borderRadius: '12px',
                height: '160px',
                marginBottom: '16px'
              },
              '& .react-colorful__hue': {
                borderRadius: '12px',
                height: '16px'
              },
              '& .react-colorful__pointer': {
                width: '24px',
                height: '24px',
                borderWidth: '3px',
                borderColor: 'white',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)'
              },
              '& .react-colorful__interactive:focus .react-colorful__pointer': {
                transform: 'translate(-50%, -50%) scale(1.1)'
              }
            }}
          >
            <HexColorPicker color={localColor} onChange={handleColorChange} />
            <Box sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid rgba(245, 13, 180, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography sx={{
                fontSize: '0.85rem',
                color: '#666',
                fontFamily: 'Space Grotesk'
              }}>
                Hex Color
              </Typography>
              <Typography sx={{
                fontSize: '0.85rem',
                color: '#111',
                fontWeight: 600,
                fontFamily: 'monospace',
                letterSpacing: '0.5px'
              }}>
                {localColor.toUpperCase()}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
};

const NameCard = ({ name, colors }) => {
  const displayName = (name || 'unifren').toLowerCase() + '.fren';
  
  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: 'white',
      borderRadius: '24px',
      overflow: 'hidden'
    }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 240 240"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {/* Background Pattern */}
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F50DB4', stopOpacity: 0.03 }} />
            <stop offset="100%" style={{ stopColor: '#FEAFF0', stopOpacity: 0.06 }} />
          </linearGradient>
          <pattern id="pattern1" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="1" fill="#F50DB4" fillOpacity="0.08" />
          </pattern>
        </defs>
        
        {/* Background */}
        <rect width="240" height="240" fill="url(#grad1)" />
        <rect width="240" height="240" fill="url(#pattern1)" />
      </svg>

      {/* Fren Token and Download Button */}
      <Box sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        gap: 1,
        alignItems: 'center'
      }}>
        <Box
          component="img"
          src={logo}
          sx={{
            width: 'auto',
            height: 24,
            filter: 'invert(36%) sepia(71%) saturate(6010%) hue-rotate(308deg) brightness(97%) contrast(101%)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
        />
      </Box>

      {/* Centered Fren Avatar */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -55%)',
        width: 120,
        height: 120,
        borderRadius: '24px',
        overflow: 'hidden',
        backgroundColor: 'white',
        border: '1px solid rgba(245, 13, 180, 0.1)',
        boxShadow: '0 8px 24px rgba(245, 13, 180, 0.15)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translate(-50%, -55%) scale(1.02)',
          boxShadow: '0 12px 32px rgba(245, 13, 180, 0.2)'
        }
      }}>
        <AvatarGenerator
          size="100%"
          name={name || 'unifren'}
          variant="beam"
          colors={colors}
          square={true}
        />
      </Box>

      {/* Name Text Container */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', // For Safari support
        borderTop: '1px solid rgba(245, 13, 180, 0.1)',
        textAlign: 'center'
      }}>
        <Typography sx={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#F50DB4',
          fontFamily: 'Space Grotesk'
        }}>
          {displayName}
        </Typography>
      </Box>
    </Box>
  );
};

const MaintenanceMode = ({ customTitle, customDescription }) => {
  const { title, description } = APP_CONFIG.MAINTENANCE_MESSAGE;
  const [avatarName, setAvatarName] = useState('');
  const [colors, setColors] = useState(['#F50DB4', '#FEAFF0', '#FF69B4']);

  return (
    <Box sx={MAINTENANCE_STYLES.container}>
      {/* Upgrade Notice Panel */}
      <Box sx={{
        backgroundColor: 'rgba(245, 13, 180, 0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(245, 13, 180, 0.1)',
        p: 3,
        mb: 6
      }}>
        <Typography sx={{
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          color: '#F50DB4',
          fontWeight: 700,
          mb: 3,
          letterSpacing: '-0.02em',
          textAlign: 'center'
        }}>
          {customTitle || title}
        </Typography>

        {/* Loading Bar */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: '280px',
          opacity: 0.9,
          mb: 3,
          mx: 'auto'
        }}>
          <LinearProgress 
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(245, 13, 180, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#F50DB4',
                borderRadius: 3
              }
            }}
          />
        </Box>

        <Typography sx={{
          color: '#666',
          fontSize: { xs: '0.95rem', sm: '1rem' },
          maxWidth: '500px',
          mx: 'auto',
          textAlign: 'center',
          lineHeight: 1.6,
          letterSpacing: '0.01em'
        }}>
          {customDescription || description}
        </Typography>
      </Box>

      {/* Social Links */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2.5, 
        alignItems: 'center',
        justifyContent: 'center',
        mb: 6
      }}>
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

      {/* Playground Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'white',
        borderRadius: '24px',
        p: { xs: 3, sm: 4 },
        boxShadow: '0 8px 32px rgba(245, 13, 180, 0.08)',
        border: '1px solid rgba(245, 13, 180, 0.1)'
      }}>
        <Typography sx={{ 
          fontSize: '1.25rem',
          color: '#111',
          fontWeight: 600,
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          Avatar Generator Playground
        </Typography>

        <Typography sx={{
          fontSize: '0.95rem',
          color: '#666',
          textAlign: 'center',
          maxWidth: '400px',
          lineHeight: 1.6,
          mb: 1
        }}>
          While we upgrade the contract, have fun experimenting with different avatar designs!
        </Typography>

        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}>
          {/* Name Input */}
          <TextField
            fullWidth
            variant="standard"
            placeholder="Try different names"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            inputProps={{
              style: { 
                fontSize: '1.25rem',
                fontWeight: 500,
                textAlign: 'center',
                fontFamily: 'Space Grotesk'
              }
            }}
            sx={{
              maxWidth: '280px',
              '& .MuiInput-root': {
                '&:before': {
                  borderColor: 'rgba(245, 13, 180, 0.2)'
                },
                '&:hover:not(.Mui-disabled):before': {
                  borderColor: 'rgba(245, 13, 180, 0.4)'
                },
                '&.Mui-focused:after': {
                  borderColor: '#F50DB4'
                }
              }
            }}
          />

          {/* Card and Metadata Container */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, sm: 4 },
            alignItems: 'center',
            width: '100%',
            maxWidth: '800px'
          }}>
            {/* Name Card */}
            <Box sx={{
              width: '240px',
              height: '240px',
              flexShrink: 0,
              backgroundColor: 'white',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(245, 13, 180, 0.15)',
              border: '1px solid rgba(245, 13, 180, 0.1)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 12px 48px rgba(245, 13, 180, 0.2)'
              }
            }}>
              <NameCard name={avatarName} colors={colors} />
            </Box>

            {/* Metadata Panel */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: { xs: '100%', sm: '240px' }
            }}>
              <Typography sx={{ 
                fontSize: '0.85rem',
                color: '#666',
                mb: 0.5
              }}>
                Preview Data
              </Typography>
              <Box sx={{
                display: 'grid',
                gap: 2
              }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                    Example ID
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.85rem',
                    color: '#111',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600
                  }}>
                    #1234
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                    Sample Weight
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.85rem',
                    color: '#111',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600
                  }}>
                    100
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                    Example Position
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.85rem',
                    color: '#111',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600
                  }}>
                    #42 of 10,000
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                    Sample Address
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.85rem',
                    color: '#F50DB4',
                    fontFamily: 'monospace',
                    fontWeight: 500
                  }}>
                    0x1234...5678
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                    Preview Time
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '0.85rem',
                    color: '#111',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 500
                  }}>
                    2 hours ago
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Download Button */}
          <Button
            onClick={() => {
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

              // Render the avatar using ReactDOMServer
              const avatarElement = React.createElement(AvatarGenerator, {
                size: '750px',
                name: avatarName || 'unifren',
                variant: 'beam',
                colors: colors,
                square: true
              });
              const avatarHtml = ReactDOMServer.renderToString(avatarElement);
              tempDiv.innerHTML = avatarHtml;

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
                  a.download = `${avatarName || 'unifren'}-fren.png`;
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
            }}
            variant="contained"
            sx={{
              backgroundColor: '#F50DB4',
              color: 'white',
              borderRadius: '100px',
              px: 4,
              py: 1.5,
              fontSize: '0.95rem',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#d00a9b'
              }
            }}
          >
            Download Preview
          </Button>

          <Typography sx={{
            fontSize: '0.85rem',
            color: '#666',
            textAlign: 'center',
            fontStyle: 'italic',
            maxWidth: '280px',
            lineHeight: 1.6
          }}>
            Contract upgrade in progress
          </Typography>
        </Box>

        {/* Hidden but preserved elements */}
        <Box sx={{ display: 'none' }}>
          <Box sx={{
            width: { xs: '200px', sm: '240px' },
            height: { xs: '200px', sm: '240px' },
          }}>
            <AvatarGenerator
              size="100%"
              name={avatarName || 'unifren'}
              variant="beam"
              colors={colors}
              square={true}
            />
          </Box>
          <Box>
            {colors.map((color, index) => (
              <ColorPickerPopover
                key={index}
                color={color}
                onChange={(newColor) => {
                  const newColors = [...colors];
                  newColors[index] = newColor;
                  setColors(newColors);
                }}
                title={`Color ${index + 1}`}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MaintenanceMode; 