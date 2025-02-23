// Global app configuration
export const APP_CONFIG = {
  MAINTENANCE_MODE: true, // Global maintenance mode toggle
  MAINTENANCE_MESSAGE: {
    title: "Contract Upgrade in Progress",
    description: "We're currently deploying a new version of the Frens contract. The app will be back online shortly. Thank you for your patience!"
  },
  SHOW_WITHDRAWAL_ANNOUNCEMENT: false, // Control withdrawal announcement visibility
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