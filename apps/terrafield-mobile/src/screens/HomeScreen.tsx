import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SyncStatus } from '../components/SyncStatus';
import { apiService } from '../services/api.service';
import { syncService } from '../services/sync.service';
import { networkService } from '../services/network.service';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Parcel {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
  lastViewed?: string;
}

export function HomeScreen() {
  const navigation = useNavigation();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check network status
  useEffect(() => {
    const unsubscribe = networkService.addListener((isOnline) => {
      setIsOffline(!isOnline);
    });
    
    return unsubscribe;
  }, []);

  // Subscribe to sync state
  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setLastSynced(state.lastSynced);
      setIsSyncing(state.isSyncing);
    });
    
    return unsubscribe;
  }, []);

  // Load parcels
  useEffect(() => {
    loadParcels();
  }, []);

  // Load parcels from API
  const loadParcels = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const data = await apiService.getParcels();
      setParcels(data);
    } catch (err: any) {
      // If offline, try to get data from local cache
      if (isOffline) {
        try {
          // This would be implemented to load from Realm DB
          // For now, just show an error
          setError('Cannot load parcels while offline');
        } catch (localErr) {
          setError('Failed to load parcels');
        }
      } else {
        setError(err.message || 'Failed to load parcels');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadParcels(true);
  };

  // Handle parcel selection
  const handleParcelPress = (parcel: Parcel) => {
    navigation.navigate('ParcelMap', { parcelId: parcel.id });
  };

  // Render item in the list
  const renderItem = ({ item }: { item: Parcel }) => {
    return (
      <TouchableOpacity
        style={styles.parcelItem}
        onPress={() => handleParcelPress(item)}
      >
        <View style={styles.parcelIconContainer}>
          <Icon name="map-marker" size={24} color="#2563EB" />
        </View>
        <View style={styles.parcelInfo}>
          <Text style={styles.parcelName}>{item.name}</Text>
          <Text style={styles.parcelAddress}>
            {[item.address, item.city, item.state].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View style={styles.parcelStatus}>
          {item.syncStatus === 'pending' && (
            <Icon name="sync-alert" size={20} color="#F59E0B" />
          )}
          {item.syncStatus === 'conflict' && (
            <Icon name="alert-circle" size={20} color="#EF4444" />
          )}
          <Icon name="chevron-right" size={20} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading parcels...</Text>
      </View>
    );
  }

  // Show error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => loadParcels()}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (parcels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="map-search" size={64} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No Parcels Found</Text>
        <Text style={styles.emptyMessage}>
          There are no parcels available for you to view.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => loadParcels()}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off-outline" size={16} color="#ffffff" />
          <Text style={styles.offlineBannerText}>
            You are offline. Some features may be limited.
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Parcels</Text>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={() => syncService.manualSync()}
          disabled={isSyncing || isOffline}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Icon name="sync" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Parcel list */}
      <FlatList
        data={parcels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      />

      {/* Sync status */}
      <View style={styles.statusContainer}>
        <SyncStatus
          lastSynced={lastSynced}
          isSyncing={isSyncing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  parcelItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  parcelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parcelInfo: {
    flex: 1,
  },
  parcelName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  parcelAddress: {
    fontSize: 14,
    color: '#64748B',
  },
  parcelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});