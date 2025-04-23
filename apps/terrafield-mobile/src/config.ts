/**
 * TerraField Mobile Configuration
 * Contains environment-specific settings and feature flags for the mobile app
 */

const Config = {
  // App version information
  VERSION: '1.0.0',
  
  // API configuration
  API_URL: process.env.API_URL || 'https://api.terrafusion.io',
  
  // Authentication settings
  AUTH: {
    TOKEN_EXPIRATION_DAYS: 7,
    MIN_PASSWORD_LENGTH: 8,
  },
  
  // Map settings
  MAP: {
    DEFAULT_CENTER: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    DEFAULT_ZOOM: 12,
    DEFAULT_MAP_TYPE: 'standard',
    PARCEL_MARKER_COLOR: '#4CAF50',
    SELECTED_PARCEL_MARKER_COLOR: '#FFA000',
  },
  
  // Sync settings
  SYNC: {
    INTERVAL: 5 * 60 * 1000, // 5 minutes
    RETRY_DELAY: 30 * 1000, // 30 seconds
    MAX_RETRY_COUNT: 3,
    CONNECTION_TIMEOUT: 10 * 1000, // 10 seconds
  },
  
  // Feature flags
  FEATURES: {
    OFFLINE_MODE: true,
    LOCATION_TRACKING: true,
    DOCUMENT_SCANNING: true,
    OFFLINE_MAPS: true,
    COLLABORATIVE_EDITING: true,
    PHOTO_UPLOAD: true,
    DARK_MODE: true,
  },
  
  // Storage configuration
  STORAGE: {
    MAX_OFFLINE_STORAGE_MB: 100, // 100 MB
    CACHE_EXPIRATION_DAYS: 30,
    ENCRYPTION_ENABLED: true,
  },
  
  // Error reporting
  ERROR_REPORTING: {
    ENABLED: true,
    INCLUDE_USER_INFO: false,
    AUTO_SEND: true,
  },
  
  // Development flags (should be false in production)
  DEV: {
    MOCK_LOCATION: false,
    VERBOSE_LOGGING: true,
    DISABLE_ENCRYPTION: false,
    FORCE_OFFLINE: false,
  }
};

export default Config;