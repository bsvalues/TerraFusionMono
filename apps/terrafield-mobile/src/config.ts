/**
 * Global application configuration
 */
const Config = {
  // Application metadata
  VERSION: '1.0.0',
  BUILD_NUMBER: '001',
  
  // API configuration
  API: {
    BASE_URL: 'https://api.terrafusion.io',
    TIMEOUT: 30000, // 30 seconds
    RETRY_COUNT: 3,
    RETRY_DELAY: 2000, // 2 seconds
  },
  
  // Authentication configuration
  AUTH: {
    TOKEN_KEY: 'terrafield_auth_token',
    REFRESH_TOKEN_KEY: 'terrafield_refresh_token',
    USER_INFO_KEY: 'terrafield_user',
    TOKEN_EXPIRY_KEY: 'terrafield_token_expiry',
    MIN_PASSWORD_LENGTH: 8,
    SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // Synchronization configuration
  SYNC: {
    LAST_SYNC_TIME_KEY: 'terrafield_last_sync',
    SYNC_INTERVAL: 15 * 60 * 1000, // 15 minutes
    SYNC_QUEUE_KEY: 'terrafield_sync_queue',
    SYNC_BATCH_SIZE: 20, // Number of items to sync in a single batch
  },
  
  // Local storage configuration
  STORAGE: {
    PARCELS_KEY: 'terrafield_parcels',
    PARCEL_NOTES_KEY: 'terrafield_parcel_notes',
    SETTINGS_KEY: 'terrafield_settings',
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_OFFLINE_MODE: true,
    ENABLE_AUTO_SYNC: true,
    ENABLE_BACKGROUND_SYNC: false,
    ENABLE_DOCUMENT_SCANNING: true,
    ENABLE_GPS_TRACKING: true,
  },
};

export default Config;