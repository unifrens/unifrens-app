// Shared button styles
export const buttonStyles = {
  backgroundColor: '#F50DB4',
  color: 'white',
  fontSize: { xs: '0.875rem', sm: '1rem' },
  py: { xs: 1.5, sm: 1 },
  px: { xs: 3, sm: 4 },
  borderRadius: '12px',
  textTransform: 'none',
  border: '1px solid rgba(245, 13, 180, 0.1)',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#d00a9b',
    boxShadow: 'none'
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(245, 13, 180, 0.12)',
    color: 'rgba(255, 255, 255, 0.5)',
    opacity: 0.8
  }
};

// Card styles
export const cardStyles = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: 'none',
  border: '1px solid rgba(245, 13, 180, 0.1)'
};

// Container styles
export const containerStyles = {
  backgroundColor: 'white',
  borderRadius: '16px',
  boxShadow: 'none',
  border: '1px solid rgba(245, 13, 180, 0.1)',
  p: { xs: 2, sm: 3 }
}; 