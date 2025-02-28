import { useState } from 'react';
import { Alert, Box, Button, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Announcement = ({ 
  severity = "info",
  title,
  summary,
  content,
  action,
  icon,
  expandable = true,
  defaultExpanded = false,
  sx = {}
}) => {
  const [expanded, setExpanded] = useState(!expandable || defaultExpanded);

  return (
    <Alert 
      severity={severity}
      icon={false}
      sx={{
        mb: { xs: 3, sm: 4 },
        borderRadius: '12px',
        backgroundColor: severity === 'info' ? 'rgba(245, 13, 180, 0.04)' : undefined,
        border: '1px solid',
        borderColor: severity === 'info' ? 'rgba(245, 13, 180, 0.1)' : undefined,
        boxShadow: 'none',
        '& .MuiAlert-message': {
          width: '100%'
        },
        ...sx
      }}
    >
      <Box sx={{ width: '100%' }}>
        {/* Mobile View */}
        <Box 
          sx={{ 
            display: { xs: 'flex', sm: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: expandable ? 'pointer' : 'default',
            width: '100%',
            gap: 2
          }}
          onClick={() => expandable && setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon}
            <Typography sx={{ 
              fontSize: '0.95rem',
              color: '#111',
              lineHeight: 1.5,
              flex: 1
            }}>
              {summary || title}
            </Typography>
          </Box>
          {expandable && (
            expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
          )}
        </Box>

        {/* Desktop View */}
        <Box sx={{ 
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon}
            <Typography sx={{ 
              fontSize: '0.95rem',
              color: '#111',
              lineHeight: 1.5
            }}>
              {content || summary || title}
            </Typography>
          </Box>
          {action}
        </Box>

        {/* Mobile Expanded Content */}
        <Collapse in={expanded} sx={{ display: { xs: 'block', sm: 'none' } }}>
          <Box sx={{ 
            mt: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}>
            {content && (
              <Typography sx={{ 
                fontSize: '0.9rem',
                color: '#666',
                lineHeight: 1.6
              }}>
                {content}
              </Typography>
            )}
            {action && (
              <Box sx={{ alignSelf: 'stretch' }}>
                {action}
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Alert>
  );
};

export default Announcement; 