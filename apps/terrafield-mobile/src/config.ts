import { Platform } from 'react-native';

// App configuration
const Config = {
  // App version - update this when releasing a new version
  VERSION: '1.0.0',
  
  // API URL - development vs production
  API_URL: __DEV__ 
    ? Platform.select({
        // When running in development mode
        ios: 'http://localhost:5000/api', // For iOS simulator
        android: 'http://10.0.2.2:5000/api', // For Android emulator
        default: 'http://localhost:5000/api',
      })
    : 'https://api.terrafusion.com/api', // Production API
  
  // Authentication settings
  AUTH: {
    // Token expiration time in days
    TOKEN_EXPIRATION_DAYS: 30,
    
    // Minimum password length
    MIN_PASSWORD_LENGTH: 8,
  },
  
  // Map configuration
  MAP: {
    // Default map center coordinates
    DEFAULT_CENTER: {
      latitude: 39.8283,
      longitude: -98.5795,
    },
    
    // Default zoom level
    DEFAULT_ZOOM: 4,
    
    // Map style - can be 'standard', 'satellite', 'hybrid'
    DEFAULT_MAP_TYPE: 'standard',
    
    // Parcel marker colors
    PARCEL_MARKER_COLOR: '#4CAF50', // Green for normal parcels
    SELECTED_PARCEL_MARKER_COLOR: '#2196F3', // Blue for selected parcels
  },
  
  // Sync configuration
  SYNC: {
    // How often to attempt sync in milliseconds (5 minutes)
    SYNC_INTERVAL: 5 * 60 * 1000,
    
    // Maximum number of sync retries
    MAX_SYNC_RETRIES: 3,
    
    // Delay between sync retries in milliseconds (30 seconds)
    SYNC_RETRY_DELAY: 30 * 1000,
  },
  
  // Feature flags
  FEATURES: {
    // Enable offline mode
    OFFLINE_MODE: true,
    
    // Enable debug logging
    DEBUG_LOGGING: __DEV__,
    
    // Enable crash reporting
    CRASH_REPORTING: !__DEV__,
    
    // Enable analytics
    ANALYTICS: !__DEV__,
  },
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_SETTINGS: 'user_settings',
    LAST_SYNC_TIME: 'last_sync_time',
    CACHED_PARCELS: 'cached_parcels',
  }
};

// Export the configuration
export default Config;