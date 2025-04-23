import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from '../../services/auth.service';
import apiService from '../../services/api.service';
import syncService from '../../services/sync.service';
import networkService from '../../services/network.service';
import Config from '../../config';

type MainStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Settings'>;

interface StorageInfo {
  totalSize: number;
  offlineDataSize: number;
  cacheSize: number;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSize: 0,
    offlineDataSize: 0,
    cacheSize: 0
  });
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    loadUserInfo();
    loadSettings();
    loadStorageInfo();
    loadSyncInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadSettings = async () => {
    // These would typically be loaded from async storage or a similar persistence mechanism
    // For now, we're just using default values
    setOfflineEnabled(true);
    setAutoSyncEnabled(true);
    setBackgroundSyncEnabled(false);
  };

  const loadStorageInfo = async () => {
    // This would typically involve checking storage usage information
    // For now, we're just using placeholder values
    setStorageInfo({
      totalSize: 25.4, // MB
      offlineDataSize: 18.2, // MB
      cacheSize: 7.2 // MB
    });
  };

  const loadSyncInfo = async () => {
    try {
      const syncQueue = await apiService.getSyncQueue();
      setSyncQueueSize(syncQueue.length);
      
      // Get last sync time
      const lastSync = await syncService.getLastSyncTime();
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    } catch (error) {
      console.error('Error loading sync info:', error);
    }
  };

  const handleToggleOffline = (value: boolean) => {
    setOfflineEnabled(value);
    // In a real implementation, this would save the setting to async storage or similar
  };

  const handleToggleAutoSync = (value: boolean) => {
    setAutoSyncEnabled(value);
    // In a real implementation, this would save the setting to async storage or similar
  };

  const handleToggleBackgroundSync = (value: boolean) => {
    setBackgroundSyncEnabled(value);
    // In a real implementation, this would save the setting to async storage or similar
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const result = await apiService.processSyncQueue();
      if (result) {
        Alert.alert('Sync Complete', 'All data has been synchronized successfully.');
        // Update sync info
        await loadSyncInfo();
      } else {
        Alert.alert('Sync Warning', 'Some items may not have synced properly. Please try again later.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Sync Error', 'Failed to synchronize data. Please check your connection and try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files but keep your offline data. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // In a real implementation, this would clear the cache
              // await cacheService.clearCache();
              
              // For now, just simulate a delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Update storage info
              setStorageInfo({
                ...storageInfo,
                cacheSize: 0
              });
              
              Alert.alert('Success', 'Cache cleared successfully.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handlePurgeOfflineData = async () => {
    Alert.alert(
      'Purge Offline Data',
      'This will delete all offline data. You will need to download it again. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // In a real implementation, this would purge offline data
              // await offlineService.purgeData();
              
              // For now, just simulate a delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Update storage info
              setStorageInfo({
                ...storageInfo,
                offlineDataSize: 0
              });
              
              Alert.alert('Success', 'Offline data purged successfully.');
            } catch (error) {
              console.error('Error purging offline data:', error);
              Alert.alert('Error', 'Failed to purge offline data. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? Any unsynced changes will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await authService.logout();
              
              // Navigate to login screen
              // This assumes your navigation is set up to handle this redirection
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as any }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userInfoContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.username || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'Email not available'}</Text>
            </View>
          </View>
        </View>

        {/* Sync & Offline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronization</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Offline Mode</Text>
              <Text style={styles.settingDescription}>
                Store data locally for offline access
              </Text>
            </View>
            <Switch
              value={offlineEnabled}
              onValueChange={handleToggleOffline}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={offlineEnabled ? '#2E7D32' : '#f4f3f4'}
              disabled={isLoading}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto Sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync when connection available
              </Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={autoSyncEnabled ? '#2E7D32' : '#f4f3f4'}
              disabled={isLoading || !offlineEnabled}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Background Sync</Text>
              <Text style={styles.settingDescription}>
                Sync data when app is in background
              </Text>
            </View>
            <Switch
              value={backgroundSyncEnabled}
              onValueChange={handleToggleBackgroundSync}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={backgroundSyncEnabled ? '#2E7D32' : '#f4f3f4'}
              disabled={isLoading || !offlineEnabled || !autoSyncEnabled}
            />
          </View>
          
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pending Changes:</Text>
              <Text style={styles.infoValue}>{syncQueueSize} items</Text>
            </View>
            {lastSyncTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Sync:</Text>
                <Text style={styles.infoValue}>
                  {lastSyncTime.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, (isSyncing || syncQueueSize === 0) && styles.disabledButton]}
            onPress={handleSyncNow}
            disabled={isSyncing || syncQueueSize === 0}
          >
            {isSyncing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.buttonText}>Syncing...</Text>
              </>
            ) : (
              <>
                <Icon name="sync" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Usage:</Text>
              <Text style={styles.infoValue}>{storageInfo.totalSize.toFixed(1)} MB</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Offline Data:</Text>
              <Text style={styles.infoValue}>{storageInfo.offlineDataSize.toFixed(1)} MB</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cache:</Text>
              <Text style={styles.infoValue}>{storageInfo.cacheSize.toFixed(1)} MB</Text>
            </View>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.halfButton, isLoading && styles.disabledButton]}
              onPress={handleClearCache}
              disabled={isLoading || storageInfo.cacheSize === 0}
            >
              <Icon name="cleaning-services" size={18} color="#333" />
              <Text style={styles.secondaryButtonText}>Clear Cache</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.halfButton, styles.dangerButton, isLoading && styles.disabledButton]}
              onPress={handlePurgeOfflineData}
              disabled={isLoading || storageInfo.offlineDataSize === 0}
            >
              <Icon name="delete-forever" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Purge Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version:</Text>
              <Text style={styles.infoValue}>{Config.VERSION}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build Number:</Text>
              <Text style={styles.infoValue}>{Config.BUILD_NUMBER}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.button, styles.logoutButton, isLoading && styles.disabledButton]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Icon name="logout" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#757575',
  },
  infoBox: {
    backgroundColor: '#F5F8FA',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
  },
  dangerButton: {
    backgroundColor: '#D32F2F',
  },
  logoutButton: {
    backgroundColor: '#D32F2F',
    margin: 16,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    flex: 0.48,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

export default SettingsScreen;