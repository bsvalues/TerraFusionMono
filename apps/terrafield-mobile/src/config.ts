import { Platform } from 'react-native';

// Base URL for API calls
// In development, use localhost for iOS and 10.0.2.2 for Android emulator
export const apiBaseUrl = __DEV__ 
  ? Platform.OS === 'ios' 
    ? 'http://localhost:3000' 
    : 'http://10.0.2.2:3000'
  : 'https://api.terrafusion.io';

// App Configuration
export const appConfig = {
  // App information
  name: 'TerraField',
  version: '1.0.0',
  build: '1',
  company: 'TerraFusion, Inc.',
  // Sync settings
  sync: {
    // Sync interval in milliseconds (default: 5 minutes)
    interval: 5 * 60 * 1000,
    // Retry interval for failed syncs in milliseconds (default: 30 seconds)
    retryInterval: 30 * 1000,
    // Maximum number of sync retries before giving up
    maxRetries: 3,
    // Minimum battery level for automatic sync (to save battery)
    minBatteryLevel: 0.2,
  },
  
  // Offline settings
  offline: {
    // Maximum storage size for offline data in bytes (default: 100MB)
    maxStorageSize: 100 * 1024 * 1024,
    // How long to keep parcel data in offline cache (default: 30 days)
    maxCacheAge: 30 * 24 * 60 * 60 * 1000,
  },
  
  // Map settings
  map: {
    // Default zoom level
    defaultZoom: 15,
    // Default map center (San Francisco)
    defaultCenter: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    // Maximum number of offline map tiles to cache
    maxOfflineTiles: 5000,
  },
  
  // UI settings
  ui: {
    // Theme setting (light, dark, system)
    theme: 'system',
    // List view items per page
    itemsPerPage: 20,
  },
  
  // Development settings
  dev: {
    // Enable detailed logging
    verboseLogging: __DEV__,
    // Log network requests
    logNetworkRequests: __DEV__,
    // Show development menu
    showDevMenu: __DEV__,
  },
};