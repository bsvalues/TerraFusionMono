import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { syncService } from '../services/sync.service';
import { RealmProvider } from '../utils/realm';
import { appConfig } from '../config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Settings storage helper (simpler than using Realm for user preferences)
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for settings
const STORAGE_KEYS = {
  THEME: 'terrafield_theme',
  SYNC_INTERVAL: 'terrafield_sync_interval',
  AUTO_SYNC: 'terrafield_auto_sync',
  OFFLINE_MODE: 'terrafield_offline_mode',
  MAP_CACHE_SIZE: 'terrafield_map_cache_size',
};

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'system',
  syncInterval: 5 * 60 * 1000, // 5 minutes
  autoSync: true,
  offlineMode: false,
  mapCacheSize: 100, // MB
};

export function SettingsScreen() {
  const navigation = useNavigation();
  
  // User info
  const [user, setUser] = useState<any>(null);
  
  // Settings state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(DEFAULT_SETTINGS.theme as any);
  const [syncInterval, setSyncInterval] = useState(DEFAULT_SETTINGS.syncInterval);
  const [autoSync, setAutoSync] = useState(DEFAULT_SETTINGS.autoSync);
  const [offlineMode, setOfflineMode] = useState(DEFAULT_SETTINGS.offlineMode);
  const [mapCacheSize, setMapCacheSize] = useState(DEFAULT_SETTINGS.mapCacheSize);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 });
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Load user and settings
  useEffect(() => {
    const loadUserAndSettings = async () => {
      try {
        // Get user info
        const currentUser = authService.getUser();
        setUser(currentUser);
        
        // Load settings from storage
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        const storedSyncInterval = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_INTERVAL);
        const storedAutoSync = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
        const storedOfflineMode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
        const storedMapCacheSize = await AsyncStorage.getItem(STORAGE_KEYS.MAP_CACHE_SIZE);
        
        // Apply stored settings or use defaults
        if (storedTheme) setTheme(storedTheme as any);
        if (storedSyncInterval) setSyncInterval(parseInt(storedSyncInterval, 10));
        if (storedAutoSync) setAutoSync(storedAutoSync === 'true');
        if (storedOfflineMode) setOfflineMode(storedOfflineMode === 'true');
        if (storedMapCacheSize) setMapCacheSize(parseInt(storedMapCacheSize, 10));
        
        // Get sync state
        const syncState = syncService.getSyncState();
        setLastSynced(syncState.lastSynced);
        setIsSyncing(syncState.isSyncing);
        
        // Subscribe to sync state changes
        syncService.subscribe((state) => {
          setLastSynced(state.lastSynced);
          setIsSyncing(state.isSyncing);
        });
        
        // Calculate storage usage
        calculateStorageUsage();
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserAndSettings();
  }, []);

  // Save a setting to AsyncStorage
  const saveSetting = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
    }
  };

  // Handle theme change
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    saveSetting(STORAGE_KEYS.THEME, value);
    // In a real app, we would apply the theme immediately
  };

  // Handle sync interval change
  const handleSyncIntervalChange = (minutes: number) => {
    const intervalMs = minutes * 60 * 1000;
    setSyncInterval(intervalMs);
    saveSetting(STORAGE_KEYS.SYNC_INTERVAL, intervalMs);
    // In a real app, we would update the sync service configuration
  };

  // Handle auto sync toggle
  const handleAutoSyncToggle = (value: boolean) => {
    setAutoSync(value);
    saveSetting(STORAGE_KEYS.AUTO_SYNC, value);
    // In a real app, we would enable/disable the sync service
  };

  // Handle offline mode toggle
  const handleOfflineModeToggle = (value: boolean) => {
    setOfflineMode(value);
    saveSetting(STORAGE_KEYS.OFFLINE_MODE, value);
    // In a real app, we would enable/disable network requests
  };

  // Handle map cache size change
  const handleMapCacheSizeChange = (sizeInMB: number) => {
    setMapCacheSize(sizeInMB);
    saveSetting(STORAGE_KEYS.MAP_CACHE_SIZE, sizeInMB);
    // In a real app, we would update the map tile cache configuration
  };

  // Calculate storage usage
  const calculateStorageUsage = async () => {
    try {
      // In a real app, we would use a library to get actual storage usage
      // For now, we'll just use a placeholder
      const total = 1000; // 1GB in MB
      // Simulate getting realm database size
      const realmPath = await RealmProvider.getRealmPath();
      // This would be the actual size calculation
      const used = 42; // MB
      
      setStorageInfo({ used, total });
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  };

  // Handle manual sync
  const handleManualSync = async () => {
    try {
      if (isSyncing) {
        return;
      }
      
      const result = await syncService.manualSync();
      
      if (result.success) {
        Alert.alert('Sync Successful', `Synced ${result.totalSynced} items.`);
      } else {
        Alert.alert('Sync Failed', result.message || 'Unknown error');
      }
    } catch (error: any) {
      Alert.alert('Sync Error', error.message || 'Unknown error');
    }
  };

  // Handle clear cache
  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all cached data including offline maps. This cannot be undone. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, we would clear specific cached data
              // For this example, we'll just show a success message
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              Alert.alert('Cache Cleared', 'All cached data has been cleared.');
              calculateStorageUsage();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out? Any unsynchronized data may be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Try to sync one last time
              if (autoSync && !offlineMode) {
                await syncService.manualSync();
              }
              
              // Then logout
              await authService.logout();
              
              // Navigate to login screen
              navigation.navigate('Login');
            } catch (error) {
              console.error('Logout error:', error);
              // Still try to logout even if sync fails
              await authService.logout();
              navigation.navigate('Login');
            }
          },
        },
      ]
    );
  };

  // Format the sync interval for display
  const formatSyncInterval = (intervalMs: number) => {
    const minutes = intervalMs / (60 * 1000);
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = minutes / 60;
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  // Format the last synced time for display
  const formatLastSynced = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (60 * 1000));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Show loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* User section */}
      <View style={styles.section}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.username || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          </View>
        </View>
      </View>

      {/* Sync settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronization</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="sync" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Auto-sync</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={handleAutoSyncToggle}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={autoSync ? '#2563EB' : '#94A3B8'}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="timer-outline" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Sync interval</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // In a real app, we would show a picker
              // For this example, we'll just cycle through a few options
              const options = [5, 15, 30, 60, 120];
              const currentMinutes = syncInterval / (60 * 1000);
              const currentIndex = options.indexOf(currentMinutes);
              const nextIndex = (currentIndex + 1) % options.length;
              handleSyncIntervalChange(options[nextIndex]);
            }}
          >
            <Text style={styles.settingValue}>{formatSyncInterval(syncInterval)}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="clock-outline" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Last synced</Text>
          </View>
          <Text style={styles.settingValue}>{formatLastSynced(lastSynced)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.button, isSyncing && styles.buttonDisabled]}
          onPress={handleManualSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Network settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="airplane" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Offline mode</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleOfflineModeToggle}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={offlineMode ? '#2563EB' : '#94A3B8'}
          />
        </View>
      </View>

      {/* Appearance settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="theme-light-dark" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Theme</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // Cycle through themes
              const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
              const currentIndex = themes.indexOf(theme);
              const nextIndex = (currentIndex + 1) % themes.length;
              handleThemeChange(themes[nextIndex]);
            }}
          >
            <Text style={styles.settingValue}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Storage settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="database" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Storage used</Text>
          </View>
          <Text style={styles.settingValue}>
            {storageInfo.used} MB / {storageInfo.total} MB
          </Text>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="map" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Map cache size</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // In a real app, we would show a picker
              // For this example, we'll just cycle through a few options
              const options = [50, 100, 200, 500, 1000];
              const currentIndex = options.indexOf(mapCacheSize);
              const nextIndex = (currentIndex + 1) % options.length;
              handleMapCacheSizeChange(options[nextIndex]);
            }}
          >
            <Text style={styles.settingValue}>{mapCacheSize} MB</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearCache}
        >
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {/* About section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="information-outline" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Version</Text>
          </View>
          <Text style={styles.settingValue}>
            {appConfig.version} ({appConfig.build})
          </Text>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Icon name="office-building" size={20} color="#475569" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Company</Text>
          </View>
          <Text style={styles.settingValue}>{appConfig.company}</Text>
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      
      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  settingValue: {
    fontSize: 16,
    color: '#64748B',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 16,
    marginTop: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});