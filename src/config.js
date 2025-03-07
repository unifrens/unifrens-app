// Global app configuration
export const APP_CONFIG = {
  MAINTENANCE_MODE: false, // Global maintenance mode toggle
  MAINTENANCE_MESSAGE: {
    title: "Emergency Maintenance",
    description: "We're currently fixing critical issues with the contract and app integration. All features are temporarily disabled for your safety. Please check back soon. Thank you for your patience!"
  },
  SHOW_LEADERBOARD_ANNOUNCEMENT: true, // Control leaderboard announcement visibility
  // Add other global configuration options here as needed
};

// Reusable maintenance mode component props/styling
export const MAINTENANCE_STYLES = {
  container: {
    textAlign: 'center',
    py: 8,
    px: 3,
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid rgba(245, 13, 180, 0.1)',
    boxShadow: '0 4px 16px rgba(245, 13, 180, 0.08)'
  },
  title: {
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    color: '#111',
    fontWeight: 600,
    mb: 2
  },
  description: {
    color: '#666',
    fontSize: '1rem',
    maxWidth: '500px',
    mx: 'auto'
  }
}; 