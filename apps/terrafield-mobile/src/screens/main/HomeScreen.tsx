import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from '../../services/auth.service';
import apiService from '../../services/api.service';
import networkService from '../../services/network.service';

type MainStackParamList = {
  Home: undefined;
  ParcelList: undefined;
  ParcelDetail: { parcelId: string };
  Map: undefined;
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [parcelCount, setParcelCount] = useState(0);
  const [recentParcels, setRecentParcels] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<boolean>(true);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  useEffect(() => {
    // Load user info
    loadUserInfo();
    
    // Load dashboard data
    loadDashboardData();
    
    // Subscribe to network status changes
    const unsubscribe = networkService.networkState$.subscribe(status => {
      setNetworkStatus(status.isConnected && status.isInternetReachable);
    });
    
    // Initial network status
    networkService.checkNetworkStatus().then(status => {
      setNetworkStatus(status.isConnected && status.isInternetReachable);
    });
    
    // Get current network status
    setNetworkStatus(networkService.isOnline());
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadUserInfo = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get parcels count (offline-compatible)
      const parcels = await apiService.request('/api/mobile/parcels', {
        method: 'GET',
      });
      
      setParcelCount(parcels.data?.length || 0);
      
      // Get most recent parcels
      if (parcels.data && parcels.data.length > 0) {
        // Sort by last accessed/updated
        const sorted = [...parcels.data].sort((a, b) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        
        // Take only the first 5
        setRecentParcels(sorted.slice(0, 5));
      }
      
      // Get sync queue count
      const syncQueue = await apiService.getSyncQueue();
      setSyncQueueCount(syncQueue.length);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleSyncNow = async () => {
    try {
      const result = await apiService.processSyncQueue();
      if (result) {
        Alert.alert('Sync Complete', 'All data has been synchronized successfully.');
        // Reload data
        await loadDashboardData();
      } else {
        Alert.alert('Sync Warning', 'Some items may not have synced properly. Please try again later.');
      }
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to synchronize data. Please check your connection and try again.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.username || 'User'}</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
      >
        {!networkStatus && (
          <View style={styles.offlineNotice}>
            <Icon name="cloud-off" size={20} color="#F57C00" />
            <Text style={styles.offlineText}>You're working offline</Text>
            {syncQueueCount > 0 && (
              <TouchableOpacity style={styles.syncButton} onPress={handleSyncNow}>
                <Text style={styles.syncButtonText}>Sync Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {syncQueueCount > 0 && networkStatus && (
          <View style={styles.syncNotice}>
            <Icon name="sync" size={20} color="#2E7D32" />
            <Text style={styles.syncText}>{syncQueueCount} items waiting to sync</Text>
            <TouchableOpacity style={styles.syncButton} onPress={handleSyncNow}>
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="map" size={30} color="#2E7D32" />
            <Text style={styles.statValue}>{parcelCount}</Text>
            <Text style={styles.statLabel}>Parcels</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="description" size={30} color="#2E7D32" />
            <Text style={styles.statValue}>{recentParcels.filter(p => p.hasNotes).length}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name={networkStatus ? 'cloud-done' : 'cloud-off'} size={30} color={networkStatus ? '#2E7D32' : '#F57C00'} />
            <Text style={styles.statValue}>{networkStatus ? 'Online' : 'Offline'}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        <View style={styles.actionCards}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('ParcelList')}
          >
            <Icon name="view-list" size={36} color="#2E7D32" />
            <Text style={styles.actionTitle}>View Parcels</Text>
            <Text style={styles.actionDescription}>Browse all parcels</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Map')}
          >
            <Icon name="map" size={36} color="#2E7D32" />
            <Text style={styles.actionTitle}>Map View</Text>
            <Text style={styles.actionDescription}>View parcels on map</Text>
          </TouchableOpacity>
        </View>

        {recentParcels.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Parcels</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ParcelList')}>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>
          
            {recentParcels.map((parcel) => (
              <TouchableOpacity 
                key={parcel.id} 
                style={styles.parcelCard}
                onPress={() => navigation.navigate('ParcelDetail', { parcelId: parcel.id })}
              >
                <View style={styles.parcelDetails}>
                  <Text style={styles.parcelAddress}>{parcel.address}</Text>
                  <Text style={styles.parcelLocation}>
                    {parcel.city}, {parcel.state} {parcel.zipCode}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#757575" />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#555',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  offlineText: {
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
  syncNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  syncText: {
    color: '#1B5E20',
    marginLeft: 8,
    flex: 1,
  },
  syncButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    color: '#2E7D32',
    fontSize: 14,
  },
  actionCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  parcelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  parcelDetails: {
    flex: 1,
  },
  parcelAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  parcelLocation: {
    fontSize: 14,
    color: '#757575',
  },
});

export default HomeScreen;